// Runs docs/intake/Code.gs (the Apps Script) in a sandbox with fake Google services, so its
// Encharge wiring is tested before it is pasted into the live script.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import crypto from 'node:crypto';
import {annualIntake} from './fixtures/annual-intake.mjs';
import {ANNUAL_COLUMNS} from '../js/annual-intake.mjs';

const source = fs.readFileSync(new URL('../docs/intake/Code.gs', import.meta.url), 'utf8');
const ANNUAL = ['receivedAt', 'submittedAt', 'name', 'email', 'calendarEmail', 'birthDate', 'birthTime', 'birthTimeUnknown', 'birthCity', 'gender', 'workType', 'decisions', 'edition', 'paid', 'stripeSessionId', 'status'];

function sandbox({ key = 'wk', enchargeCode = 200, rows = {} } = {}) {
  const tabs = {};
  const fetched = [];
  const mails = [];
  const makeSheet = name => {
    const data = rows[name] ? rows[name].map(r => [...r]) : [];
    let maxColumns=26;
    return tabs[name] = {
      data,
      appendRow: r => data.push(r),
      setFrozenRows: () => {},
      getDataRange: () => ({ getValues: () => {const width=Math.max(0,...data.map(r=>r.length));return data.map(r=>Array.from({length:width},(_,i)=>r[i]??''));} }),
      getLastRow: () => data.length,
      getMaxColumns: () => maxColumns,
      insertColumnsAfter: (after,count) => { assert.equal(after,maxColumns);maxColumns+=count; },
      getRange: (r, c, height=1, width=1) => ({
        setNumberFormat: () => {},
        setValue: v => { data[r - 1][c - 1] = v; },
        setValues: values => {assert.equal(values.length,height);values.forEach((row,i)=>{assert.equal(row.length,width);data[r+i-1]||=[];row.forEach((v,j)=>data[r+i-1][c+j-1]=v);});},
        getValues: () => Array.from({length:height},(_,i)=>Array.from({length:width},(_,j)=>data[r+i-1]?.[c+j-1]??'')),
      }),
    };
  };
  Object.keys(rows).forEach(makeSheet);
  const ctx = {
    console: {log() {},error() {}},
    SpreadsheetApp: { getActiveSpreadsheet: () => ({ getSheetByName: n => tabs[n] || null, insertSheet: makeSheet }) },
    LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
    MailApp: { sendEmail: m => mails.push(m) },
    PropertiesService: { getScriptProperties: () => ({ getProperty: () => key }) },
    UrlFetchApp: { fetch: (url, opt) => { fetched.push({ url, token: opt.headers['X-Encharge-Token'], body: JSON.parse(opt.payload) }); return { getResponseCode: () => enchargeCode, getContentText: () => '' }; } },
    Utilities: { formatDate: (d, tz, fmt) => (fmt==='yyyy-MM-dd'?d.toISOString().slice(0,10):fmt.startsWith('yyyy') ? d.toISOString().slice(0, 16).replace('T', ' ') : `due:${d.toISOString().slice(0, 10)}`) },
    ContentService: { createTextOutput: s => ({ setMimeType: () => JSON.parse(s) }), MimeType: { JSON: 'json' } },
  };
  vm.createContext(ctx);
  vm.runInContext(source, ctx);
  const post = obj => ctx.doPost({ postData: { contents: JSON.stringify(obj) } });
  return { post, tabs, fetched, mails, ctx };
}

const intake = {
  product: '2027-annual-outlook', name: 'Jane Tan', email: 'jane@example.com', calendarEmail: '', birthDate: '1990-01-02',
  birthTime: '08:15', birthTimeUnknown: false, birthCity: 'Singapore', gender: 'female', workType: 'employed',
  decisions: 'Change jobs?', edition: 'advanced', consent: true, paid: true, stripeSessionId: 'cs_live_x', elapsedMs: 60000, website: '',
};

test('an Outlook intake is saved, emailed, and sent to Encharge without birth details', () => {
  const s = sandbox();
  assert.equal(s.post(intake).result, 'success');
  assert.equal(s.tabs['annual-2027'].data.length, 2);
  assert.equal(s.mails.length, 1);
  assert.deepEqual(s.fetched.map(f => f.body.name), ['identify', 'Intake Submitted']);
  const user = s.fetched[0].body.user;
  assert.equal(user.firstName, 'Jane');
  assert.equal(user.tags, 'intake-received,annual-intake');
  assert.equal(user.edition, 'advanced');
  assert.match(user.reportDue, /^due:\d{4}-\d{2}-\d{2}$/);
  assert.equal(s.fetched[0].token, 'wk');
  const text = JSON.stringify(s.fetched);
  for (const secret of ['1990-01-02', '08:15', 'Singapore', 'female', 'Change jobs']) assert.equal(text.includes(secret), false);
});

test('a monthly intake is tagged as monthly', () => {
  const s = sandbox();
  s.post({ ...intake, product: 'monthly-welcome', plan: '197' });
  assert.equal(s.fetched[0].body.user.tags, 'intake-received,monthly-intake');
  assert.equal(s.fetched[1].body.properties.plan, '197');
});

test('a missing key or an Encharge failure keeps the row and emails Jeff the error', () => {
  for (const s of [sandbox({ key: null }), sandbox({ enchargeCode: 401 })]) {
    assert.equal(s.post(intake).result, 'error');
    assert.equal(s.tabs['annual-2027'].data.length, 2);
    assert.equal(s.mails[1], 'jefferyseah@gmail.com');
  }
});

test('v2 saved receipts survive CRM failure and alert the operator without inviting duplicates', () => {
  const s = sandbox({enchargeCode: 401});
  assert.equal(s.post(annualIntake).saved, true);
  assert.equal(s.mails.length, 2);
  assert.match(s.mails[1], /jefferyseah/);
  assert.equal(s.post(annualIntake).saved, true);
  assert.equal(s.tabs['annual-2027'].data.length, 2);
  assert.equal(s.mails.length, 2);
});

test('report-delivered marks the latest matching row and starts the after-delivery flow', () => {
  const old = ANNUAL.map(k => (k === 'email' ? 'JANE@example.com' : k === 'status' ? 'New' : ''));
  const latest = ANNUAL.map(k => (k === 'email' ? 'jane@example.com' : k === 'status' ? 'New' : ''));
  const s = sandbox({ rows: { 'annual-2027': [ANNUAL, old, latest] } });
  const res = s.post({ type: 'report-delivered', email: ' Jane@Example.com ', reportUrl: 'https://my.jeffseah.rocks/share/1' });
  assert.equal(res.result, 'success');
  assert.equal(res.row, 3);
  assert.match(s.tabs['annual-2027'].data[2][15], /^Delivered /);
  assert.equal(s.tabs['annual-2027'].data[1][15], 'New');
  assert.deepEqual(s.fetched.map(f => f.body.name), ['identify', 'Report Delivered']);
  assert.equal(s.fetched[0].body.user.reportUrl, 'https://my.jeffseah.rocks/share/1');
});

test('report-delivered refuses an email that never submitted an intake, and drops non-https links', () => {
  const row = ANNUAL.map(k => (k === 'email' ? 'jane@example.com' : ''));
  const s = sandbox({ rows: { 'annual-2027': [ANNUAL, row] } });
  assert.equal(s.post({ type: 'report-delivered', email: 'stranger@example.com' }).result, 'error');
  assert.equal(s.fetched.length, 0);
  s.post({ type: 'report-delivered', email: 'jane@example.com', reportUrl: 'javascript:alert(1)' });
  assert.equal('reportUrl' in s.fetched[0].body.user, false);
});
test('annual migration appends by header name, preserves existing rows and operator columns, and is idempotent',()=>{
  const headers=[...ANNUAL,'operatorNote'],old=headers.map(k=>k==='operatorNote'?'Keep me':k==='email'?'historical@example.invalid':'');
  const s=sandbox({rows:{'annual-2027':[headers,old]}});
  s.ctx.migrateAnnualIntake();s.ctx.migrateAnnualIntake();
  assert.deepEqual([...s.tabs['annual-2027'].data[0]],[...headers,...ANNUAL_COLUMNS]);
  assert.deepEqual(s.tabs['annual-2027'].data[1],old);
  assert.equal(s.post(annualIntake).saved,true);
  const saved=Object.fromEntries(s.tabs['annual-2027'].data[0].map((k,i)=>[k,s.tabs['annual-2027'].data[2][i]]));
  for(const key of ANNUAL_COLUMNS)assert.equal(saved[key],Array.isArray(annualIntake[key])?annualIntake[key].join('\n'):annualIntake[key]);
  assert.equal(saved.status,'New');assert.equal(saved.operatorNote,'');
  const crm=JSON.stringify(s.fetched);for(const value of ['Synthetic place','Synthetic transport','No health','Asia/Singapore','How can I'])assert.equal(crm.includes(value),false);
});
test('retries return a saved receipt without adding another row or resending notifications; conflicting IDs fail',()=>{
  const s=sandbox();s.post(annualIntake);assert.equal(s.post({...annualIntake,elapsedMs:80000}).intakeId,annualIntake.intakeId);
  assert.equal(s.tabs['annual-2027'].data.length,2);assert.equal(s.mails.length,1);assert.equal(s.fetched.length,2);
  assert.equal(s.post({...annualIntake,residenceCity:'Changed city'}).result,'error');assert.equal(s.tabs['annual-2027'].data.length,2);
});
test('new annual intake rejects ambiguous residence, invalid zones, oversized context and invalid lists before writing',()=>{
  for(const patch of [{residenceCity:''},{reportTimeZoneConfirmed:false},{reportTimeZone:'Not/AZone'},{reportTimeZone:'EST'},{contextObservedAt:'2026-02-30'},{exclusions:['x'.repeat(2001)]},{focalQuestions:Array(6).fill('Question')},{birthTime:'08:00',birthTimeUnknown:true}]){
    const s=sandbox();assert.equal(s.post({...annualIntake,...patch}).result,'error');assert.equal(s.tabs['annual-2027'],undefined);
  }
});
test('duplicate or missing legacy headers refuse migration without replacing data',()=>{
  for(const header of [[...ANNUAL,'status'],ANNUAL.filter(k=>k!=='paid')]){
    const s=sandbox({rows:{'annual-2027':[header]}});assert.equal(s.post(annualIntake).result,'error');assert.deepEqual(s.tabs['annual-2027'].data,[header]);
  }
});
test('operator QA uses its separate tab and sends no email or CRM events',()=>{
  const s=sandbox();s.ctx.Utilities.getUuid=()=>crypto.randomUUID();s.ctx.annualIntakeSelfTest();
  assert.equal(s.tabs['annual-2027-qa'].data.length,5);assert.equal(s.tabs['annual-2027'],undefined);assert.equal(s.mails.length,0);assert.equal(s.fetched.length,0);
});
