"""Verify public relay -> Olares persistence with exactly scoped disposable synthetic records."""
import json
import subprocess
import urllib.request
import uuid
SSH=['ssh','-o','ConnectTimeout=15','-o','BatchMode=yes','olares@192.168.1.3']
visit=str(uuid.uuid4())
events=[{'id':visit+':'+str(index+1),'visit':visit,'name':name,'source':'qa_test','campaign':'release-check','device':'desktop','data':data}
    for index,(name,data) in enumerate([('Page visit',{}),('Engagement',{'active_seconds':30,'max_scroll':75}),('Popup shown',{'trigger':'desktop-exit'})])]
request=urllib.request.Request('https://jeffseah-engagement.jefferyseah.workers.dev/events',data=json.dumps({'events':events}).encode(),
    headers={'Origin':'https://jeffseah.rocks','Content-Type':'text/plain','User-Agent':'JeffSeahEngagementReleaseCheck/1.0'})
with urllib.request.urlopen(request,timeout=25) as response:
    assert json.load(response)['accepted']==3
try:
    subprocess.run(SSH+['sudo -n systemctl start jeffseah-engagement.service'],check=True)
    code='''import sqlite3
c=sqlite3.connect('/home/olares/jeffseah-engagement/engagement.sqlite')
rows=c.execute('SELECT name,source,data FROM events WHERE visit=?',(%r,)).fetchall()
assert len(rows)==3, rows
assert all(row[1]=='qa_test' for row in rows)
print('Public ingestion and Olares persistence verified for three synthetic events.')
''' % visit
    subprocess.run(SSH+['python3 -'],input=code.encode(),check=True)
finally:
    code='''import sqlite3
c=sqlite3.connect('/home/olares/jeffseah-engagement/engagement.sqlite')
c.execute('DELETE FROM events WHERE visit=? AND source=?',(%r,'qa_test'))
c.commit()
assert c.execute('SELECT COUNT(*) FROM events WHERE visit=?',(%r,)).fetchone()[0]==0
print('Exact synthetic visit removed and absence independently verified.')
''' % (visit,visit)
    subprocess.run(SSH+['python3 -'],input=code.encode(),check=True)
