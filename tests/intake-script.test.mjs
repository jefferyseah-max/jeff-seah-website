// Runs docs/intake/Code.gs (the Apps Script) in a sandbox with fake Google services, so its
// Encharge wiring is tested before it is pasted into the live script.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../docs/intake/Code.gs', import.meta.url), 'utf8');
const ANNUAL = ['receivedAt', 'submittedAt', 'name', 'email', 'calendarEmail', 'birthDate', 'birthTime', 'birthTimeUnknown', 'birthCity', 'gender', 'workType', 'decisions', 'edition', 'paid', 'stripeSessionId', 'status'];

function sandbox({ key = 'wk', enchargeCode = 200, rows = {} } = {}) {
  const tabs = {};
  const fetched = [];
  const mails = [];
  const makeSheet = name => {
    const data = rows[name] ? rows[name].map(r => [...r]) : [];
    return tabs[name] = {
      data,
      appendRow: r => data.push(r),
      setFrozenRows: () => {},
      getDataRange: () => ({ getValues: () => data.map(r => [...r]) }),
      getRange: (r, c) => ({ setValue: v => { data[r - 1][c - 1] = v; } }),
    };
  };
  Object.keys(rows).forEach(makeSheet);
  const ctx = {
    SpreadsheetApp: { getActiveSpreadsheet: () => ({ getSheetByName: n => tabs[n] || null, insertSheet: makeSheet }) },
    LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
    MailApp: { sendEmail: m => mails.push(m) },
    PropertiesService: { getScriptProperties: () => ({ getProperty: () => key }) },
    UrlFetchApp: { fetch: (url, opt) => { fetched.push({ url, token: opt.headers['X-Encharge-Token'], body: JSON.parse(opt.payload) }); return { getResponseCode: () => enchargeCode, getContentText: () => '' }; } },
    Utilities: { formatDate: (d, tz, fmt) => (fmt.startsWith('yyyy') ? d.toISOString().slice(0, 16).replace('T', ' ') : `due:${d.toISOString().slice(0, 10)}`) },
    ContentService: { createTextOutput: s => ({ setMimeType: () => JSON.parse(s) }), MimeType: { JSON: 'json' } },
  };
  vm.createContext(ctx);
  vm.runInContext(source, ctx);
  const post = obj => ctx.doPost({ postData: { contents: JSON.stringify(obj) } });
  return { post, tabs, fetched, mails };
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
