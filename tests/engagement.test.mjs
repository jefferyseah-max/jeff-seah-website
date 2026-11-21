import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {cleanEvent} from '../lib/engagement.mjs';
const visit='aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
const event={id:visit+':1',visit,name:'Page visit',source:'chatgpt',campaign:'launch',device:'mobile',data:{}};
test('ingestion accepts only known events and drops private or arbitrary properties',()=>{
 const cleaned=cleanEvent({...event,email:'private@example.invalid',data:{birthYear:1988,percent:50,active_seconds:30,placement:'exit_2027',query:'private'}});
 assert.deepEqual(cleaned,{...event,data:{placement:'exit_2027',percent:50,active_seconds:30}});
 for(const input of [{...event,name:'unrecognized'},{...event,id:'not-an-id'},{...event,visit:'different'},{...event,device:'private'}]) assert.equal(cleanEvent(input),null);
 assert.equal(cleanEvent({...event,source:'email@example.invalid'}).source,'direct');
 assert.deepEqual(cleanEvent({...event,data:{percent:101,active_seconds:-1,seconds:Infinity}}).data,{});
});
function browser(search=''){
 let now=0;const listeners={},documentListeners={},intervals=[],requests=[];
 const document={hidden:false,documentElement:{scrollHeight:2000},addEventListener:(name,fn)=>documentListeners[name]=fn,querySelectorAll:()=>[]};
 const context={location:{pathname:'/2027',search},navigator:{webdriver:false},crypto:{randomUUID:()=>visit},URLSearchParams,URL,
  localStorage:{getItem:()=>null},matchMedia:()=>({matches:false}),performance:{now:()=>now},document,
  scrollY:0,innerHeight:1000,Date,Number,Math,JSON,console,fetch:async(url,options)=>{requests.push(JSON.parse(options.body));return {ok:true};},
  addEventListener:(name,fn)=>listeners[name]=fn,setInterval:(fn,ms)=>intervals.push({fn,ms})};context.window=context;
 vm.runInNewContext(readFileSync(new URL('../js/engagement.js',import.meta.url),'utf8'),context);
 return {context,document,listeners,documentListeners,requests,intervals,advance(seconds){for(let i=0;i<seconds;i++){now+=1000;intervals.find(x=>x.ms===1000)?.fn();}},events(){return requests.flatMap(r=>r.events);}};
}
test('active time excludes hidden and idle time and flushes cumulative values',()=>{
 const b=browser('?utm_source=chatgpt&utm_campaign=launch');
 b.advance(30); b.document.hidden=true;b.documentListeners.visibilitychange();
 assert.equal(b.events().find(e=>e.name==='Engagement').data.active_seconds,30);
 b.advance(120);b.document.hidden=false;b.documentListeners.visibilitychange();b.advance(10);b.listeners.pagehide();
 assert.equal(b.events().filter(e=>e.name==='Engagement').at(-1).data.active_seconds,40);
 b.advance(120);b.intervals.find(x=>x.ms===15000).fn();
 assert.ok(b.events().filter(e=>e.name==='Engagement').at(-1).data.active_seconds<100);
 assert.equal(b.events().filter(e=>e.name==='Active reading'&&e.data.seconds===30).length,1);
});
test('preview visits never enter analytics and repeated scroll milestones are deduplicated',()=>{
 assert.equal(browser('?exit=1').requests.length,0);
 const b=browser();b.context.scrollY=700;b.listeners.scroll();b.listeners.scroll();b.listeners.pagehide();
 assert.equal(b.events().filter(e=>e.name==='Scroll depth'&&e.data.percent===50).length,1);
 assert.equal(b.events().filter(e=>e.name==='Engagement').at(-1).data.max_scroll,70);
});
test('exit CTA records a trial click and never submits the checkout URL or visitor input',()=>{
 const b=browser();const button={getAttribute:key=>key==='href'?'https://buy.stripe.com/8x2cN72QvegSf6y1LPbwk05?client_reference_id=exit_2027':null};
 b.documentListeners.click({target:{closest:()=>button}});
 assert.deepEqual(JSON.parse(JSON.stringify(b.events().find(e=>e.name==='Trial checkout').data)),{placement:'exit_2027'});
 assert.doesNotMatch(JSON.stringify(b.events()),/buy.stripe|birth|email|oppref/);
});

test('guide analytics keep pages separate and accept fixed feature and link labels without URLs',()=>{
 const cleaned=cleanEvent({...event,page:'portal-guide',name:'Link clicked',data:{target:'portal',placement:'hero',url:'https://private.invalid/?code=123456',email:'private@example.invalid'}});
 assert.equal(cleaned.page,'portal-guide');
 assert.deepEqual(cleaned.data,{placement:'hero',target:'portal'});
 assert.equal(cleanEvent({...event,page:'not-allowed'}),null);
 assert.deepEqual(cleanEvent({...event,page:'tongshu-guide',name:'Feature viewed',data:{feature:'saved-dates',trigger:'next'}}).data,{trigger:'next',feature:'saved-dates'});
 assert.equal(cleanEvent(event).page,undefined);
});
