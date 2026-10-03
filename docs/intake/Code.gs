/**
 * jeffseah.rocks intake handler.
 * Serves /2027-next (2027 Annual Outlook buyers) and /welcome (monthly plan subscribers).
 * Bound to the Google Sheet "jeffseah.rocks Intake". Each product gets its own tab,
 * created with headers on first use. Jeff is emailed on every accepted submission.
 * Setup: docs/intake/INTAKE_SETUP.md. CRM (Encharge) wiring: docs/crm/ENCHARGE_CRM.md.
 */

const NOTIFY_EMAIL = 'jefferyseah@gmail.com';
const MIN_FILL_MS = 3000;
const MAX_FIELD = 2000;

const PRODUCTS = {
  '2027-annual-outlook': {
    tab: 'annual-2027',
    label: '2027 Annual Outlook',
    extra: ['workType', 'decisions', 'edition'],
  },
  'monthly-welcome': {
    tab: 'monthly-welcome',
    label: 'Monthly plan welcome',
    extra: ['plan'],
  },
};

const COMMON = ['receivedAt', 'submittedAt', 'name', 'email', 'calendarEmail', 'birthDate', 'birthTime',
  'birthTimeUnknown', 'birthCity', 'gender'];
const TAIL = ['paid', 'stripeSessionId', 'status'];
const ANNUAL_COLUMNS = ['intakeId','subjectName','residenceCity','residenceRegion','residenceCountry','reportTimeZone','reportTimeZoneConfirmed','reportTimeZoneSource','reportTimeZoneConfirmedAt','employmentStatus','careerFocus','contextObservedAt','circumstances','focalQuestions','exclusions','birthTimeZone','birthTimeConvention'];

function doGet() {
  return json({ result: 'ok', annualIntakeSchemaVersion: 2 });
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    if (data.type === 'stripe-subscription') return stripeAlert(data);
    if (data.type === 'report-delivered') return reportDelivered(data);
    if (data.website && String(data.website).trim() !== '') return json({ result: 'ignored' });
    if (typeof data.elapsedMs === 'number' && data.elapsedMs < MIN_FILL_MS) return json({ result: 'ignored' });

    const product = PRODUCTS[data.product];
    if (!product) return json({ result: 'error', error: 'unknown product' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(data.email || ''))) return json({ result: 'error', error: 'bad email' });

    const isAnnual = data.product === '2027-annual-outlook';
    if (isAnnual && data.intakeSchemaVersion !== undefined) validateAnnual(data);
    let saved;
    const lock = LockService.getScriptLock();
    lock.waitLock(20000);
    try {
      saved = saveIntake(data, product, product.tab);
    } finally {
      lock.releaseLock();
    }

    if (!saved.duplicate) {
      if (isAnnual && data.intakeSchemaVersion === 2) {
        // The receipt describes storage. A follow-up failure must not invite duplicate client submissions.
        [function () { notify(product, saved.columns, saved.row); }, function () { enchargeIntake(data, saved.row[saved.columns.indexOf('receivedAt')]); }].forEach(function (followUp) {
          try { followUp(); } catch (followUpError) {
            console.error('Saved annual intake follow-up failed', data.intakeId, String(followUpError));
            try { MailApp.sendEmail(NOTIFY_EMAIL, 'jeffseah.rocks saved intake follow-up ERROR', 'Intake ID: '+data.intakeId+'\n'+String(followUpError)); }
            catch (alertError) { console.error('Follow-up error notification failed', String(alertError)); }
          }
        });
      } else {
        notify(product, saved.columns, saved.row);
        enchargeIntake(data, saved.row[saved.columns.indexOf('receivedAt')]);
      }
    }
    return json({ result: 'success', saved: true, intakeId: data.intakeId || '', intakeSchemaVersion: isAnnual && data.intakeSchemaVersion === 2 ? 2 : 1 });
  } catch (err) {
    // Never fail silently: tell Jeff, and let the page show its email fallback.
    try {
      MailApp.sendEmail(NOTIFY_EMAIL, 'jeffseah.rocks intake ERROR', String(err && err.stack || err));
    } catch (alertError) { console.error('Intake error notification failed', String(alertError)); }
    return json({ result: 'error', error: String(err) });
  }
}

// New monthly subscription, posted by /api/stripe-webhook (lib/signup-alert.mjs) once Stripe
// confirms it. Logged to its own tab and emailed, so a subscriber who never submits /welcome is
// still noticed. The endpoint is public, so only well-formed Stripe ids are accepted.
const STRIPE_COLUMNS = ['receivedAt', 'subscription', 'customer', 'plan', 'status', 'firstCharge', 'intakeReceived'];

function stripeAlert(data) {
  if (!/^sub_\w+$/.test(String(data.subscription)) || !/^cus_\w+$/.test(String(data.customer))) {
    return json({ result: 'error', error: 'bad ids' });
  }
  const row = STRIPE_COLUMNS.map(function (key) {
    if (key === 'receivedAt') return new Date();
    if (key === 'intakeReceived') return 'check';
    return clean(data[key]);
  });
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    sheetFor('stripe-signups', STRIPE_COLUMNS).appendRow(row);
  } finally {
    lock.releaseLock();
  }
  MailApp.sendEmail({
    to: NOTIFY_EMAIL,
    subject: 'New subscriber: ' + row[3] + ' (' + row[4] + ')',
    body: STRIPE_COLUMNS.map(function (key, i) { return key + ': ' + row[i]; }).join('\n') +
      '\n\nCustomer: https://dashboard.stripe.com/customers/' + row[2] +
      '\nIf no "New intake: Monthly plan welcome" email follows, ask them to fill in https://www.jeffseah.rocks/welcome' +
      '\n\nSheet tab: stripe-signups',
  });
  return json({ result: 'success' });
}

// ---- Encharge (client email flows) ------------------------------------------------------------
// The form is public, so these events are UNTRUSTED. Every Encharge flow also requires a buyer tag
// that only the signed Stripe webhook sets (lib/encharge.mjs), so a forged post cannot email a stranger.
// Only name, email, product and edition are sent; birth details never leave the Sheet.
// The write key lives in Script Properties as ENCHARGE_WRITE_KEY (Jeff pastes it; never in this file).
const ENCHARGE_INGEST = 'https://ingest.encharge.io/v1/';
const REPORT_DAYS = 7;

function enchargeIntake(data, receivedAt) {
  const name = String(data.name || '').trim();
  const user = { email: String(data.email).trim(), name: name, firstName: name.split(/\s+/)[0] };
  const props = { product: data.product };
  if (data.product === '2027-annual-outlook') {
    const due = new Date(receivedAt.getTime() + REPORT_DAYS * 86400000);
    user.tags = 'intake-received,annual-intake';
    user.edition = String(data.edition || '');
    user.reportDue = Utilities.formatDate(due, 'Asia/Singapore', 'EEEE d MMMM');
    props.edition = user.edition;
  } else {
    user.tags = 'intake-received,monthly-intake';
    props.plan = String(data.plan || '');
  }
  sendEncharge([{ name: 'identify', user: user }, { name: 'Intake Submitted', user: { email: user.email }, properties: props }]);
}

// Posted by scripts/report-delivered.mjs once the report is live in Fusebase. Marks the intake row
// Delivered (the Olares watcher stops chasing it) and starts the after-delivery flow in Encharge.
function reportDelivered(data) {
  const email = String(data.email || '').trim().toLowerCase();
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('annual-2027');
  if (!email || !sheet) return json({ result: 'error', error: 'unknown client' });
  const values = sheet.getDataRange().getValues();
  const header = values[0];
  const emailCol = header.indexOf('email');
  const statusCol = header.indexOf('status');
  let rowIndex = -1;
  for (let i = values.length - 1; i >= 1; i--) {
    if (String(values[i][emailCol]).trim().toLowerCase() === email) { rowIndex = i; break; }
  }
  if (rowIndex < 0) return json({ result: 'error', error: 'unknown client' });
  const stamp = Utilities.formatDate(new Date(), 'Asia/Singapore', 'yyyy-MM-dd HH:mm');
  sheet.getRange(rowIndex + 1, statusCol + 1).setValue('Delivered ' + stamp);

  const reportUrl = /^https:\/\//.test(String(data.reportUrl || '')) ? clean(data.reportUrl) : '';
  const user = { email: String(values[rowIndex][emailCol]).trim(), tags: 'report-delivered' };
  if (reportUrl) user.reportUrl = reportUrl;
  sendEncharge([{ name: 'identify', user: user }, { name: 'Report Delivered', user: { email: user.email }, properties: { product: '2027-annual-outlook' } }]);
  return json({ result: 'success', row: rowIndex + 1 });
}

function sendEncharge(events) {
  const key = PropertiesService.getScriptProperties().getProperty('ENCHARGE_WRITE_KEY');
  if (!key) throw new Error('ENCHARGE_WRITE_KEY is not set in Script Properties; intake saved, Encharge not told');
  events.forEach(function (event) {
    const res = UrlFetchApp.fetch(ENCHARGE_INGEST, {
      method: 'post',
      contentType: 'application/json',
      headers: { 'X-Encharge-Token': key },
      payload: JSON.stringify(event),
      muteHttpExceptions: true,
    });
    const code = res.getResponseCode();
    if (code < 200 || code >= 300) throw new Error('Encharge ' + code + ' for event "' + event.name + '": ' + res.getContentText().slice(0, 300));
  });
}

function sheetFor(tab, columns, added) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(tab);
  if (!sheet) {
    sheet = ss.insertSheet(tab);
    sheet.appendRow(columns);
    sheet.setFrozenRows(1);
  }
  if (added) {
    const header = sheet.getDataRange().getValues()[0];
    if (!header || header.some(function (key) { return !key; }) || new Set(header).size !== header.length) throw new Error('Invalid or duplicate intake headers');
    columns.forEach(function (key) { if (header.indexOf(key) < 0) throw new Error('Missing legacy intake column: ' + key); });
    const missing = added.filter(function (key) { return header.indexOf(key) < 0; });
    if (missing.length) {
      const needed = header.length + missing.length;
      if (needed > sheet.getMaxColumns()) sheet.insertColumnsAfter(sheet.getMaxColumns(), needed - sheet.getMaxColumns());
      sheet.getRange(1, header.length + 1, 1, missing.length).setValues([missing]);
    }
  }
  return sheet;
}

function saveIntake(data, product, tab) {
  const base = COMMON.concat(product.extra, TAIL);
  const sheet = sheetFor(tab, base, data.product === '2027-annual-outlook' ? ANNUAL_COLUMNS : null);
  const values = sheet.getDataRange().getValues();
  const columns = values[0];
  const idColumn = columns.indexOf('intakeId');
  const compareKeys = base.filter(function (key) { return ['receivedAt','submittedAt','status'].indexOf(key) < 0; }).concat(ANNUAL_COLUMNS);
  if (data.intakeId && idColumn >= 0) {
    for (let i = 1; i < values.length; i++) {
      if (String(values[i][idColumn]) !== data.intakeId) continue;
      compareKeys.forEach(function (key) { const stored = values[i][columns.indexOf(key)]; if (String(stored == null ? '' : stored) !== String(clean(data[key]))) throw new Error('Intake ID already belongs to different details'); });
      return { columns: columns, row: values[i], duplicate: true };
    }
  }
  const row = columns.map(function (key) { return key === 'receivedAt' ? new Date() : key === 'status' ? 'New' : base.indexOf(key) >= 0 || ANNUAL_COLUMNS.indexOf(key) >= 0 ? clean(data[key]) : ''; });
  // Sheets otherwise coerces ISO dates and clock strings. Format only the new row.
  const nextRow = sheet.getLastRow() + 1;
  sheet.getRange(nextRow, 1, 1, columns.length).setNumberFormat('@');
  sheet.getRange(nextRow, 1, 1, columns.length).setValues([row]);
  sheet.getRange(nextRow, columns.indexOf('receivedAt') + 1).setNumberFormat('yyyy-mm-dd hh:mm:ss');
  const stored = sheet.getRange(nextRow, 1, 1, columns.length).getValues()[0];
  columns.forEach(function (key, i) { if (key !== 'receivedAt' && String(stored[i]) !== String(row[i])) throw new Error('Saved intake read-back mismatch: ' + key); });
  return { columns: columns, row: row, duplicate: false };
}

function annualDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value || '') && !Number.isNaN(Date.parse(value+'T00:00:00Z')) && new Date(value+'T00:00:00Z').toISOString().startsWith(value);
}
function annualZone(value) {
  if (!/^[A-Za-z_]+\/[A-Za-z_]+(?:\/[A-Za-z_]+)?$/.test(value || '')) return false;
  try { new Intl.DateTimeFormat('en-GB', { timeZone: value }).format(0); return true; } catch (_) { return false; }
}
function validateAnnual(data) {
  if (data.intakeSchemaVersion !== 2) throw new Error('Unsupported annual intake schema');
  Object.keys(data).forEach(function (key) { const v = data[key]; if ((typeof v === 'string' && v.length > MAX_FIELD) || (Array.isArray(v) && (!v.every(function (item) { return typeof item === 'string'; }) || v.join('\n').length > MAX_FIELD))) throw new Error('Invalid or oversized annual field: ' + key); });
  ['name','subjectName','email','birthCity','residenceCity','residenceCountry'].forEach(function (key) { if (typeof data[key] !== 'string' || !data[key].trim()) throw new Error('Missing ' + key); });
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(data.intakeId || '')) throw new Error('Invalid intake ID');
  if (!annualDate(data.birthDate) || new Date(data.birthDate+'T00:00:00Z') > new Date()) throw new Error('Invalid birth date');
  if (typeof data.birthTimeUnknown !== 'boolean' || (!data.birthTimeUnknown && !/^([01]\d|2[0-3]):[0-5]\d$/.test(data.birthTime || '')) || (data.birthTimeUnknown && data.birthTime !== '')) throw new Error('Invalid birth time');
  if (['female','male'].indexOf(data.gender) < 0 || ['simplified','advanced'].indexOf(data.edition) < 0 || data.consent !== true) throw new Error('Missing required choices');
  if (!annualZone(data.reportTimeZone) || data.reportTimeZoneConfirmed !== true || ['subject-confirmed','gift-buyer-confirmed'].indexOf(data.reportTimeZoneSource) < 0 || !annualDate(data.reportTimeZoneConfirmedAt)) throw new Error('Report location confirmation required');
  if (data.birthTimeZone && !annualZone(data.birthTimeZone)) throw new Error('Invalid birth time zone');
  if (['employed','self-employed','employed-and-self-employed','between-jobs','student','retired','prefer-not-to-say'].indexOf(data.employmentStatus) < 0 || ['career','business','both','general'].indexOf(data.careerFocus) < 0) throw new Error('Invalid work status or focus');
  if (data.contextObservedAt && !annualDate(data.contextObservedAt)) throw new Error('Invalid observation date');
  if (!Array.isArray(data.focalQuestions) || data.focalQuestions.length < 1 || data.focalQuestions.length > 5 || data.focalQuestions.some(function (q) { return q.trim().length < 3; }) || !Array.isArray(data.exclusions)) throw new Error('Invalid questions or exclusions');
}

// Operator-only editor functions. Neither is exposed by doGet/doPost.
function migrateAnnualIntake() {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const product = PRODUCTS['2027-annual-outlook'];
    const sheet = sheetFor(product.tab, COMMON.concat(product.extra, TAIL), ANNUAL_COLUMNS);
    console.log(JSON.stringify({ status: 'migration-verified', tab: product.tab, columns: sheet.getDataRange().getValues()[0] }));
  } finally { lock.releaseLock(); }
}

function annualIntakeSelfTest() {
  if (annualZone('Not/AZone') || annualZone('EST')) throw new Error('Invalid zone accepted');
  const cases = [
    ['Singapore','Singapore','Asia/Singapore','self-employed','business'],
    ['Mumbai','India','Asia/Kolkata','employed','career'],
    ['New York','United States','America/New_York','between-jobs','business'],
    ['Phoenix','United States','America/Phoenix','employed-and-self-employed','both']
  ];
  const results = [];
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    cases.forEach(function (item, i) {
      const data = { product: '2027-annual-outlook', intakeSchemaVersion: 2, intakeId: Utilities.getUuid(), name: 'Annual Intake Test '+(i+1), subjectName: 'Annual Intake Test '+(i+1), email: 'annual-intake-'+(i+1)+'@example.invalid', calendarEmail: '', birthDate: '1990-01-02', birthTime: '', birthTimeUnknown: true, birthCity: 'Synthetic birth place', gender: 'female', workType: item[3], decisions: 'How should I plan my work?', edition: i===2?'advanced':'simplified', paid: false, stripeSessionId: '', submittedAt: new Date().toISOString(), consent: true, elapsedMs: 60000, website: '', residenceCity: item[0], residenceRegion: i>1?'Test state':'', residenceCountry: item[1], reportTimeZone: item[2], reportTimeZoneConfirmed: true, reportTimeZoneSource: i===2?'gift-buyer-confirmed':'subject-confirmed', reportTimeZoneConfirmedAt: Utilities.formatDate(new Date(), item[2], 'yyyy-MM-dd'), employmentStatus: item[3], careerFocus: item[4], contextObservedAt: '', circumstances: 'Synthetic transport QA only', focalQuestions: ['How should I plan my work?'], exclusions: ['No health discussion'], birthTimeZone: '', birthTimeConvention: '' };
      validateAnnual(data);
      const saved = saveIntake(data, PRODUCTS[data.product], 'annual-2027-qa');
      const retry = saveIntake(data, PRODUCTS[data.product], 'annual-2027-qa');
      if (!retry.duplicate || saved.columns.length !== 33) throw new Error('Transport QA failed');
      results.push({ intakeId: data.intakeId, timeZone: item[2], employmentStatus: item[3], questionCount: data.focalQuestions.length, duplicateRetry: true });
    });
    console.log(JSON.stringify({ status: 'pass', tab: 'annual-2027-qa', cases: results, notificationsSent: 0, crmCalls: 0 }));
  } finally { lock.releaseLock(); }
}

function notify(product, columns, row) {
  const name = row[columns.indexOf('name')];
  const lines = columns.map(function (key, i) { return key + ': ' + row[i]; });
  MailApp.sendEmail({
    to: NOTIFY_EMAIL,
    subject: 'New intake: ' + product.label + ' - ' + name,
    body: lines.join('\n') + '\n\nSheet tab: ' + product.tab,
  });
}

// Strings are trimmed, capped, and prefixed when they would start a spreadsheet formula.
function clean(value) {
  if (value === undefined || value === null) return '';
  if (typeof value === 'boolean' || typeof value === 'number') return value;
  let s = (Array.isArray(value) ? value.join('\n') : String(value)).trim();
  if (s.length > MAX_FIELD) throw new Error('Intake field exceeds 2,000 characters');
  if (/^[=+\-@]/.test(s)) s = "'" + s;
  return s;
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
