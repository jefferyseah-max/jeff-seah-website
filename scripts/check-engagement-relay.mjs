import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {execFileSync} from 'node:child_process';
const base=process.env.ENGAGEMENT_TEST_URL||'http://127.0.0.1:8797',secret='local-test-secret';
assert.ok(/^http:\/\/127\.0\.0\.1:\d+$/.test(base),'Tests must use a local relay');
const request=(path,method='GET',body,auth=false,origin='https://jeffseah.rocks')=>fetch(base+path,{method,headers:{Origin:origin,...(auth?{Authorization:'Bearer '+secret}:{})},...(body?{body:JSON.stringify(body)}:{})});
const visit=crypto.randomUUID(),event={id:visit+':1',visit,name:'Page visit',source:'qa_test',campaign:'qa',device:'desktop',data:{birthYear:1988,email:'must-not-store@example.invalid'}};
assert.equal((await request('/batch')).status,404);
assert.equal((await request('/events','POST',{events:[event]},false,'https://foreign.invalid')).status,403);
assert.equal((await request('/events','POST',{events:[{...event,name:'Fake purchase'}]})).status,400);
assert.equal((await request('/events','POST',{events:[event]})).status,200);
assert.equal((await request('/events','POST',{events:[event]})).status,200);
let events=(await(await request('/batch','GET',null,true)).json()).events;
assert.equal(events.filter(e=>e.id===event.id).length,1);
assert.doesNotMatch(JSON.stringify(events),/birthYear|must-not-store/);
const scratch=await mkdtemp(join(tmpdir(),'jeffseah-engagement-qa-'));
try{
 await writeFile(join(scratch,'settings.json'),JSON.stringify({url:base,secret}));
 const env={...process.env,ENGAGEMENT_HOME:scratch};
 const run=(args=[])=>execFileSync('python',[resolve('ops/engagement/collect.py'),...args],{env,encoding:'utf8'});
 // Seed the old eight-column schema with a historical row. Migration must retain it.
 execFileSync('python',['-c',"import sqlite3,os,sys; c=sqlite3.connect(os.path.join(os.environ['ENGAGEMENT_HOME'],'engagement.sqlite')); c.execute('CREATE TABLE events (id TEXT PRIMARY KEY, visit TEXT, name TEXT, received_at INTEGER, source TEXT, campaign TEXT, device TEXT, data TEXT)'); c.execute('INSERT INTO events VALUES (?,?,?,?,?,?,?,?)',(sys.argv[1],sys.argv[2],'Page visit',int(sys.argv[3]),'qa_test','qa','desktop','{}')); c.commit()",event.id,visit,String(Date.now())],{env});
 run();assert.equal((await(await request('/health','GET',null,true)).json()).buffered,0);
 await request('/events','POST',{events:[event]});run();
 const report=JSON.parse(run(['--report']));assert.equal(report.page_visits,1);
 assert.equal(report.events['Page visit'],1,'Historical rows survive page-column migration and duplicate replay');
 const portalVisit=crypto.randomUUID(),tourVisit=crypto.randomUUID();
 const portal={...event,id:portalVisit+':1',visit:portalVisit,page:'portal-guide'};
 const tour={...event,id:tourVisit+':1',visit:tourVisit,page:'tongshu-guide'};
 const click={...portal,id:portalVisit+':2',name:'Link clicked',data:{target:'portal',placement:'hero'}};
 await request('/events','POST',{events:[portal,tour,click]});run();
 assert.equal(JSON.parse(run(['--report'])).page_visits,1,'Existing 2027 report remains isolated');
 const portalReport=JSON.parse(run(['--report','--page','portal-guide']));
 assert.equal(portalReport.page_visits,1);assert.equal(portalReport.events['Link clicked'],1);
 assert.equal(JSON.parse(run(['--report','--page','tongshu-guide'])).page_visits,1);
 console.log('Relay verified: origin checks, private reads, sanitization, durable deduplication, Olares commit-before-ack and replay-safe reports.');
}finally{await rm(scratch,{recursive:true,force:true});}
