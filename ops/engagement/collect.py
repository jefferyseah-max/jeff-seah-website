"""Drain the authenticated relay to SQLite; report each anonymous page separately."""
import argparse
import datetime as dt
import json
import os
import sqlite3
import urllib.request
from pathlib import Path

BASE = Path(os.environ.get('ENGAGEMENT_HOME', '/home/olares/jeffseah-engagement'))

def database():
    connection = sqlite3.connect(BASE / 'engagement.sqlite')
    os.chmod(BASE / 'engagement.sqlite', 0o600)
    connection.execute('PRAGMA journal_mode=WAL')
    connection.execute('CREATE TABLE IF NOT EXISTS events (id TEXT PRIMARY KEY, visit TEXT, name TEXT, received_at INTEGER, source TEXT, campaign TEXT, device TEXT, data TEXT)')
    connection.execute('CREATE INDEX IF NOT EXISTS events_time ON events(received_at)')
    if 'page' not in {row[1] for row in connection.execute('PRAGMA table_info(events)')}:
        connection.execute("ALTER TABLE events ADD COLUMN page TEXT NOT NULL DEFAULT '2027'")
    return connection

def collect():
    config = json.loads((BASE / 'settings.json').read_text())
    def request(path, body=None):
        req = urllib.request.Request(config['url'] + path, data=None if body is None else json.dumps(body).encode(),
            headers={'Authorization':'Bearer '+config['secret'], 'Content-Type':'application/json', 'User-Agent':'JeffSeahEngagementCollector/1.0'})
        with urllib.request.urlopen(req, timeout=25) as response:
            return json.load(response)
    total = 0
    with database() as connection:
        for _ in range(45):
            events = request('/batch')['events']
            if not events:
                break
            for event in events:
                connection.execute('INSERT OR IGNORE INTO events (id,visit,name,received_at,source,campaign,device,data,page) VALUES (?,?,?,?,?,?,?,?,?)',
                    (event['id'],event['visit'],event['name'],event['received_at'],event['source'],event['campaign'],event['device'],json.dumps(event['data']),event.get('page','2027')))
            # Commit before ack. Replays after a lost acknowledgement cannot duplicate local records.
            connection.commit()
            if not request('/ack', {'ids':['event:'+event['id'] for event in events]}).get('ok'):
                raise RuntimeError('Relay did not acknowledge collection')
            total += len(events)
        else:
            raise RuntimeError('Collection capacity reached; buffer not fully drained')
        cutoff = int((dt.datetime.now(dt.timezone.utc)-dt.timedelta(days=90)).timestamp()*1000)
        connection.execute('DELETE FROM events WHERE received_at < ?', (cutoff,))
    print(json.dumps({'ok':True,'received':total}))

def report(days, page='2027'):
    cutoff = int((dt.datetime.now(dt.timezone.utc)-dt.timedelta(days=days)).timestamp()*1000)
    with database() as connection:
        rows = connection.execute('SELECT visit,name,received_at,source,campaign,device,data FROM events WHERE received_at>=? AND page=? ORDER BY received_at', (cutoff,page)).fetchall()
    visits, counts, breakdown, sources, devices = {}, {}, {}, {}, {}
    for visit,name,received,source,campaign,device,raw in rows:
        data=json.loads(raw)
        item=visits.setdefault(visit, {'active_seconds':0,'max_scroll':0})
        counts[name]=counts.get(name,0)+1
        if name=='Page visit':
            sources[source]=sources.get(source,0)+1
            devices[device]=devices.get(device,0)+1
        if name=='Engagement':
            item['active_seconds']=max(item['active_seconds'],data.get('active_seconds',0))
            item['max_scroll']=max(item['max_scroll'],data.get('max_scroll',0))
        label=' / '.join(str(data[key]) for key in ['trigger','reason','placement','tool','target','feature','video','percent'] if key in data)
        if label:breakdown[name+': '+label]=breakdown.get(name+': '+label,0)+1
    times=sorted(value['active_seconds'] for value in visits.values())
    median=0 if not times else (times[len(times)//2]+times[(len(times)-1)//2])/2
    print(json.dumps({'page':page,'window_days':days,'generated_at':dt.datetime.now(dt.timezone.utc).isoformat(),
        'page_visits':counts.get('Page visit',0),'observed_visit_ids':len(visits),'events':counts,'breakdown':breakdown,
        'sources':sources,'devices':devices,'median_active_seconds':median,
        'average_active_seconds':round(sum(times)/len(times),1) if times else 0,
        'visits_30_seconds':sum(value>=30 for value in times),
        'visits_50_percent_scroll':sum(value['max_scroll']>=50 for value in visits.values()),
        'limits':['Browser observations, not unique people or verified purchases. Ad blockers, offline exits and the 60-second inactivity cutoff can undercount.',
                  'Trial checkout means a button click. Confirm completed signups separately against signed Stripe records and existing signup-source tags.']},indent=2))

if __name__=='__main__':
    parser=argparse.ArgumentParser()
    parser.add_argument('--report',action='store_true')
    parser.add_argument('--days',type=int,default=7,choices=range(1,91))
    parser.add_argument('--page',choices=['2027','portal-guide','tongshu-guide'],default='2027')
    args=parser.parse_args()
    report(args.days,args.page) if args.report else collect()
