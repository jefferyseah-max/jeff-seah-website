#!/usr/bin/env python3
"""jeffseah.rocks intake watcher (Olares, hourly). Source of truth: the jeff-seah-website
repo, ops/olares/. Installed to /home/olares/coach/jeffseah-intake-watch.py; see docs/crm/ENCHARGE_CRM.md.

Reads the "jeffseah.rocks Intake" Sheet through the rclone Drive remote (it exports as .xlsx, so no
Sheets API scope is needed) and, for every NEW row:
  annual-2027      -> files an agent job in vault agents/inbox/ and sends Jeff a Telegram
  monthly-welcome  -> sends Jeff a Telegram
Then chases each Outlook report against its 7-day promise: a Telegram on day 5 if the row is not yet
"Delivered", and again once it is overdue. scripts/report-delivered.mjs marks a row Delivered.

Privacy: birth details stay in the Sheet. Telegram and the inbox note carry first name, email,
edition and dates only.

Failure policy: any error exits 1, which fires OnFailure= (Telegram) and a failed heartbeat.
State is saved only after every message for a row has been sent, so nothing is skipped silently.
"""
import datetime as dt
import hashlib
import json
import os
import re
import subprocess
import sys
import tempfile
import urllib.parse
import urllib.request

import openpyxl

SGT = dt.timezone(dt.timedelta(hours=8))
STATE = '/home/olares/coach/jeffseah-intake-state.json'
INBOX = '/home/olares/vault/agents/inbox'
ALERTS_ENV = '/home/olares/.alerts.env'
REMOTE = 'gdrive:jeffseah.rocks Intake.xlsx'
RCLONE_CONF = '/home/olares/.config/rclone/rclone.conf'
DUE_DAYS, WARN_DAYS = 7, 5
TABS = ('annual-2027', 'monthly-welcome')


def env():
    out = {}
    with open(ALERTS_ENV) as f:
        for line in f:
            if '=' in line and not line.lstrip().startswith('#'):
                k, v = line.strip().split('=', 1)
                out[k] = v.strip().strip('"').strip("'")
    return out


def telegram(text):
    e = env()
    data = urllib.parse.urlencode({'chat_id': e.get('ALERT_CHAT_ID', '644580669'), 'text': text}).encode()
    url = f"https://api.telegram.org/bot{e['ALERT_BOT_TOKEN']}/sendMessage"
    with urllib.request.urlopen(url, data=data, timeout=20) as r:
        if not json.load(r).get('ok'):
            raise RuntimeError('telegram send failed')


def read_sheet():
    old = os.umask(0o077)
    try:
        with tempfile.TemporaryDirectory() as d:
            path = os.path.join(d, 'intake.xlsx')
            subprocess.run(['rclone', 'copyto', REMOTE, path, f'--config={RCLONE_CONF}'],
                           check=True, timeout=120, capture_output=True)
            wb = openpyxl.load_workbook(path, read_only=True)
            tabs = {}
            for tab in TABS:
                if tab not in wb.sheetnames:
                    raise RuntimeError(f'tab {tab} missing from the intake Sheet')
                rows = list(wb[tab].iter_rows(values_only=True))
                header = [str(h) for h in rows[0]] if rows else []
                tabs[tab] = [dict(zip(header, r)) for r in rows[1:] if any(v not in (None, '') for v in r)]
            return tabs
    finally:
        os.umask(old)


def key_of(tab, row):
    raw = f"{tab}|{row.get('receivedAt')}|{str(row.get('email') or '').strip().lower()}"
    return hashlib.sha256(raw.encode()).hexdigest()[:16]


def first_name(row):
    return (str(row.get('name') or '').split() or ['(no name)'])[0]


def paid_note(row):
    sid = str(row.get('stripeSessionId') or '')
    return 'Stripe checkout id present' if sid.startswith('cs_') else 'NO Stripe checkout id: check Stripe before starting'


def write_job(row, key, now, due):
    name = first_name(row)
    slug = re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-') or 'client'
    fname = f"{now:%Y-%m-%d}-annual-outlook-{slug}-{key[:6]}.md"
    nxt = (now.replace(day=1) + dt.timedelta(days=32)).replace(day=1)
    body = f"""**from:** jeffseah-intake-watch (Olares)
**to:** claude
**created:** {now:%Y-%m-%d %H:%M} SGT
**priority:** high

# 2027 Annual Outlook for {name}: due {due:%A %d %B %Y}

## Handoff Snapshot
Owner: claude (report), codex (Fusebase release).
Next action: ask Jeff to approve adding this client to Wealth Codex, then run the annual lane.
Blocker: Jeff's approval for the Wealth Codex write.
Deadline: {due:%Y-%m-%d %H:%M} SGT (7 days from intake; promised to the client).

## Client
- Name: {row.get('name')}
- Email: {row.get('email')}
- Edition to open first: {row.get('edition')}
- Payment: {paid_note(row)}
- Birth details, work type and decisions: Sheet "jeffseah.rocks Intake", tab `annual-2027`, row with
  receivedAt `{row.get('receivedAt')}`. Do not copy birth details into this note or any log.

## Steps
1. Jeff approves; add the client to Wealth Codex from the Sheet row.
2. Write the report with the current annual lane (V3 unless Jeff says otherwise), audit, Jeff reviews.
3. Codex releases it to Fusebase per `ANNUAL_REPORT_RELEASE_WORKFLOW.md` and invites the client.
4. In the jeff-seah-website repo: `node scripts/report-delivered.mjs {row.get('email')} <client share url>`.
   That marks the Sheet row Delivered (this watcher stops chasing) and starts the Encharge upsell flow.
5. Free Power Calendar month: add {name} to the {nxt:%B %Y} Sifu run and share the calendar to
   {row.get('calendarEmail') or row.get('email')}. No card is taken.
6. Move this file to `inbox/done/` with a **completed:** line.
"""
    tmp = os.path.join(INBOX, f'.{fname}.tmp')
    with open(tmp, 'w') as f:
        f.write(body)
    os.chmod(tmp, 0o664)
    os.replace(tmp, os.path.join(INBOX, fname))
    return fname


def main():
    now = dt.datetime.now(SGT).replace(microsecond=0)
    state = {}
    if os.path.exists(STATE):
        with open(STATE) as f:
            state = json.load(f)
    tabs = read_sheet()

    def save():
        tmp = STATE + '.tmp'
        with open(tmp, 'w') as f:
            json.dump(state, f, indent=1, sort_keys=True)
        os.replace(tmp, STATE)

    for tab, rows in tabs.items():
        for row in rows:
            key = key_of(tab, row)
            status = str(row.get('status') or '')
            if key not in state:
                if tab == 'annual-2027':
                    due = now + dt.timedelta(days=DUE_DAYS)
                    job = write_job(row, key, now, due)
                    telegram(f"New 2027 Outlook intake: {first_name(row)} ({row.get('edition')} edition).\n"
                             f"Report due {due:%a %d %b}. {paid_note(row)}.\nJob filed: agents/inbox/{job}")
                    state[key] = {'tab': tab, 'first': first_name(row), 'seen': now.isoformat(), 'due': due.isoformat(),
                                  'warned': False, 'overdue': False, 'delivered': status.startswith('Delivered')}
                else:
                    telegram(f"New monthly intake: {first_name(row)}, plan {row.get('plan')}. {paid_note(row)}.")
                    state[key] = {'tab': tab, 'seen': now.isoformat()}
                save()
                continue

            s = state[key]
            if tab != 'annual-2027' or s.get('delivered'):
                continue
            if status.startswith('Delivered'):
                s['delivered'] = True
                save()
                continue
            due = dt.datetime.fromisoformat(s['due'])
            if now >= due and not s['overdue']:
                telegram(f"OVERDUE: {s['first']}'s 2027 Outlook was promised by {due:%a %d %b %H:%M}. Not marked Delivered.")
                s['overdue'] = s['warned'] = True
                save()
            elif now >= due - dt.timedelta(days=DUE_DAYS - WARN_DAYS) and not s['warned']:
                telegram(f"Reminder: {s['first']}'s 2027 Outlook is due {due:%a %d %b} (2 days). Not marked Delivered yet.")
                s['warned'] = True
                save()
    save()
    print(f"{now.isoformat()} ok: {sum(len(r) for r in tabs.values())} rows, {len(state)} tracked")


if __name__ == '__main__':
    try:
        main()
    except Exception as exc:  # noqa: BLE001 - any failure must reach systemd as exit 1
        print(f'jeffseah-intake-watch FAILED: {exc!r}', file=sys.stderr)
        sys.exit(1)
