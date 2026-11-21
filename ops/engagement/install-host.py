"""Install only the engagement collector and its monitored timer on the existing Olares host."""
import argparse
import hashlib
import subprocess
from pathlib import Path

ROOT=Path(__file__).resolve().parents[2]
SSH=['ssh','-o','ConnectTimeout=15','-o','BatchMode=yes','olares@192.168.1.3']
BASE='/home/olares/jeffseah-engagement'
def remote(command,data=None):
    return subprocess.run(SSH+['set -eu; '+command],input=data,check=True,stdout=subprocess.PIPE).stdout

parser=argparse.ArgumentParser()
parser.add_argument('--prepare',action='store_true')
parser.add_argument('--enable',action='store_true')
args=parser.parse_args()
if args.prepare:
    remote('mkdir -p '+BASE+'; chmod 700 '+BASE)
    for name in ['collect.py','jeffseah-engagement.service','jeffseah-engagement.timer']:
        content=(ROOT/'ops'/'engagement'/name).read_bytes()
        target=BASE+'/'+name
        remote('umask 077; cat > '+target,content)
        actual=remote('sha256sum '+target).decode().split()[0]
        if actual!=hashlib.sha256(content).hexdigest():raise RuntimeError('Host file hash mismatch: '+name)
    remote('python3 -',b'''import json,secrets,os
from pathlib import Path
p=Path('/home/olares/jeffseah-engagement/settings.json')
if not p.exists():
 p.write_text(json.dumps({'url':'https://jeffseah-engagement.jefferyseah.workers.dev','secret':secrets.token_hex(32)}))
os.chmod(p,0o600)
''')
    print('Collector files independently hash-verified; private settings prepared.')
if args.enable:
    remote('sudo -n install -m 644 '+BASE+'/jeffseah-engagement.service /etc/systemd/system/jeffseah-engagement.service; sudo -n install -m 644 '+BASE+'/jeffseah-engagement.timer /etc/systemd/system/jeffseah-engagement.timer')
    remote('python3 -',b'''from pathlib import Path
p=Path('/home/olares/cron-scripts/install-dropins.sh')
old=p.read_bytes()
if b'[jeffseah-engagement]=' not in old:
 backup=p.with_name('install-dropins.sh.bak-20261121-engagement')
 if not backup.exists():backup.write_bytes(old)
 p.write_bytes(old.replace(b'declare -A JOBS=(',b'declare -A JOBS=(\\n  [jeffseah-engagement]=jeffseah-engagement'))
''')
    remote('python3 /home/olares/coach/heartbeat.py register jeffseah-engagement 0.1 \'Anonymous website engagement collection\'')
    remote('sudo -n bash /home/olares/cron-scripts/install-dropins.sh')
    remote('sudo -n systemctl daemon-reload; sudo -n systemctl start jeffseah-engagement.service; sudo -n systemctl enable --now jeffseah-engagement.timer')
    print(remote('systemctl is-active jeffseah-engagement.timer; systemctl show jeffseah-engagement.service -p Result -p OnFailure; python3 /home/olares/jeffseah-engagement/collect.py --report --days 1').decode())
