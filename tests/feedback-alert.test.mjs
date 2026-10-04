import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('../docs/intake/Code.gs',import.meta.url),'utf8');
const route='sample-2027-abcdef1234',id='12345678-1234-4234-8234-123456789abc';
const url='https://reports.jeffseah.rocks/r/'+route+'/__feedback-alert/'+id+'/'+'a'.repeat(64);
const receipt={result:'verified',notificationVersion:'annual-feedback-alert-v1',saved:true,route,submissionId:id,test:false,title:'Sample report',edition:'newcomer',overall:4,clarity:5,publishConsent:false,displayName:'Reader A',improvements:'Make the navigation clearer.'};
function sandbox({code=200,data=receipt,mailFails=false}={}){
 const mails=[],rows=[],requests=[];const sheet={appendRow:r=>rows.push(r),setFrozenRows(){},getLastRow:()=>rows.length,getDataRange:()=>({getValues:()=>rows}),getRange:(r,c,h=1,w=1)=>({setValues:v=>v.forEach((row,i)=>row.forEach((value,j)=>rows[r+i-1][c+j-1]=value)),getValues:()=>[rows[r-1].slice(c-1,c-1+w)]})};
 const ctx={console:{error(){}},LockService:{getScriptLock:()=>({waitLock(){},releaseLock(){}})},SpreadsheetApp:{getActiveSpreadsheet:()=>({getSheetByName:()=>rows.length?sheet:null,insertSheet:()=>sheet})},MailApp:{sendEmail:m=>{if(mailFails)throw Error('Mail unavailable');mails.push(m);}},UrlFetchApp:{fetch:(u,o)=>{requests.push({url:u,options:o});return {getResponseCode:()=>code,getContentText:()=>JSON.stringify(data)};}},ContentService:{MimeType:{JSON:'json'},createTextOutput:s=>({setMimeType:()=>JSON.parse(s)})}};
 vm.createContext(ctx);vm.runInContext(source,ctx);return {mails,rows,requests,post:v=>ctx.doPost({postData:{contents:JSON.stringify(v)}})};
}
test('confirmed feedback sends fixed operator recipient only, with separate ratings and private consent',()=>{
 const s=sandbox(),result=s.post({type:'annual-feedback',sourceUrl:url,to:'stranger@example.com',overall:1});
 assert.equal(result.emailed,true);assert.equal(s.mails.length,1);assert.equal(s.mails[0].to,'jefferyseah@gmail.com');assert.match(s.mails[0].body,/Overall experience: 4\/5/);assert.match(s.mails[0].body,/No, private feedback only/);assert.equal(s.requests.length,1);assert.equal(s.requests[0].options.followRedirects,false);assert.equal(s.rows[1][3],'sent');
 assert.equal(s.post({type:'annual-feedback',sourceUrl:url}).duplicate,true);assert.equal(s.mails.length,1);
});
test('unverified, malformed, redirected and forged receipt sources cannot send email or create intake/CRM',()=>{
 for(const bad of [url.replace('reports.jeffseah.rocks','evil.example'),url+'?next=evil',url.replace('/__feedback-alert/','/__feedback/status/')]){const s=sandbox();assert.equal(s.post({type:'annual-feedback',sourceUrl:bad}).result,'error');assert.equal(s.mails.length,0);assert.equal(s.requests.length,0);}
 for(const options of [{code:302},{code:404},{data:{...receipt,submissionId:'other'}},{data:{...receipt,saved:false}},{data:{...receipt,test:true}}]){const s=sandbox(options);assert.equal(s.post({type:'annual-feedback',sourceUrl:url}).result,'error');assert.equal(s.mails.length,0);assert.equal(s.rows.length,0);}
});
test('email outage retains pending ledger and returns no false success',()=>{const s=sandbox({mailFails:true});assert.equal(s.post({type:'annual-feedback',sourceUrl:url}).result,'error');assert.equal(s.rows[1][3],'pending');assert.equal(s.mails.length,0);});
test('synthetic preview alert is clearly labelled TEST and ordinary client preview is refused',()=>{
 const testRoute='feedback-email-test-2027-abcdef1234',testUrl=url.replace('reports.jeffseah.rocks','annual-v12-review-20261004.pages.dev').replace(route,testRoute);
 const s=sandbox({data:{...receipt,route:testRoute,test:true}});assert.equal(s.post({type:'annual-feedback',sourceUrl:testUrl}).emailed,true);assert.match(s.mails[0].subject,/^\[TEST\]/);assert.match(s.mails[0].body,/No client submitted/);
 const denied=sandbox({data:{...receipt,test:true}});assert.equal(denied.post({type:'annual-feedback',sourceUrl:url.replace('reports.jeffseah.rocks','annual-v12-review-20261004.pages.dev')}).result,'error');assert.equal(denied.mails.length,0);
});
