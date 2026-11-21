import {DurableObject} from 'cloudflare:workers';
import {cleanEvent} from '../../lib/engagement.mjs';
const ORIGINS=new Set(['https://jeffseah.rocks','https://www.jeffseah.rocks']);
const json=(value,status=200,headers={})=>Response.json(value,{status,headers:{'Cache-Control':'no-store',...headers}});
export default {async fetch(request,env){
 const url=new URL(request.url),origin=request.headers.get('Origin');
 if(url.pathname==='/events'){
  if(!ORIGINS.has(origin))return json({error:'Forbidden'},403);
  const cors={'Access-Control-Allow-Origin':origin,'Vary':'Origin'};
  if(request.method==='OPTIONS')return new Response(null,{status:204,headers:{...cors,'Access-Control-Allow-Methods':'POST','Access-Control-Allow-Headers':'Content-Type'}});
  if(request.method!=='POST')return json({error:'Method'},405,cors);
  if(Number(request.headers.get('Content-Length')||0)>16000)return json({error:'Too large'},413,cors);
  const raw=await request.text();if(raw.length>16000)return json({error:'Too large'},413,cors);
  let body;try{body=JSON.parse(raw);}catch{return json({error:'Invalid'},400,cors);}
  if(!Array.isArray(body.events)||body.events.length<1||body.events.length>20)return json({error:'Invalid'},400,cors);
  const events=body.events.map(cleanEvent);if(events.some(event=>!event))return json({error:'Invalid'},400,cors);
  // No IPs are written to the buffer or forwarded to Olares. Browser events are untrusted observations.
  const response=await env.BUFFER.getByName('2027').fetch(new Request('https://buffer/events',{method:'POST',body:JSON.stringify(events)}));
  return new Response(response.body,{status:response.status,headers:{...cors,'Content-Type':'application/json','Cache-Control':'no-store'}});
 }
 if(!env.COLLECTOR_SECRET||request.headers.get('Authorization')!=='Bearer '+env.COLLECTOR_SECRET)return json({error:'Not found'},404);
 if(!['/batch','/ack','/health'].includes(url.pathname))return json({error:'Not found'},404);
 return env.BUFFER.getByName('2027').fetch(request);
}};
export class EngagementBuffer extends DurableObject {
 constructor(ctx,env){
  super(ctx,env);
  ctx.storage.sql.exec('CREATE TABLE IF NOT EXISTS events (id TEXT PRIMARY KEY, received_at INTEGER, payload TEXT)');
  ctx.storage.sql.exec('CREATE TABLE IF NOT EXISTS usage (day TEXT PRIMARY KEY, count INTEGER)');
 }
 async fetch(request){
  const path=new URL(request.url).pathname,storage=this.ctx.storage;
  if(path==='/events'){
   const events=await request.json(),now=Date.now(),day=new Date(now).toISOString().slice(0,10);
   // Bound unauthenticated traffic and storage even if a caller spoofs the Origin header.
   const count=storage.sql.exec('SELECT count FROM usage WHERE day=?',day).toArray()[0]?.count||0;
   if(count+events.length>20000)return json({error:'Daily capacity'},429);
   if(storage.sql.exec('SELECT COUNT(*) AS n FROM events').one().n+events.length>20000)return json({error:'Buffer full'},503);
   storage.transactionSync(()=>{
    for(const event of events)storage.sql.exec('INSERT OR IGNORE INTO events VALUES (?,?,?)',event.id,now,JSON.stringify({...event,received_at:now}));
    storage.sql.exec('INSERT INTO usage VALUES (?,?) ON CONFLICT(day) DO UPDATE SET count=excluded.count',day,count+events.length);
   });
   if(!await storage.getAlarm())await storage.setAlarm(now+86400000);
   return json({accepted:events.length});
  }
  if(path==='/batch'&&request.method==='GET')return json({events:storage.sql.exec('SELECT payload FROM events ORDER BY received_at,id LIMIT 500').toArray().map(row=>JSON.parse(row.payload))});
  if(path==='/ack'&&request.method==='POST'){
   const raw=await request.text();if(raw.length>40000)return json({error:'Too large'},413);
   let ids;try{ids=JSON.parse(raw).ids;}catch{return json({error:'Invalid'},400);}
   if(!Array.isArray(ids)||ids.length>500||ids.some(id=>!/^event:[a-f0-9-]{36}:\d{1,5}$/.test(id)))return json({error:'Invalid'},400);
   storage.transactionSync(()=>{for(const id of ids)storage.sql.exec('DELETE FROM events WHERE id=?',id.slice(6));});return json({ok:true});
  }
  if(path==='/health')return json({ok:true,buffered:storage.sql.exec('SELECT COUNT(*) AS n FROM events').one().n});
  return json({error:'Not found'},404);
 }
 async alarm(){
  this.ctx.storage.sql.exec('DELETE FROM events WHERE received_at<?',Date.now()-7*86400000);
  this.ctx.storage.sql.exec('DELETE FROM usage WHERE day<?',new Date(Date.now()-7*86400000).toISOString().slice(0,10));
  await this.ctx.storage.setAlarm(Date.now()+86400000);
 }
}
