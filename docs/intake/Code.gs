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

function doGet() {
  return json({ result: 'ok' });
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

    const columns = COMMON.concat(product.extra, TAIL);
    const row = columns.map(function (key) {
      if (key === 'receivedAt') return new Date();
      if (key === 'status') return 'New';
      return clean(data[key]);
    });

    const lock = LockService.getScriptLock();
    lock.waitLock(20000);
    try {
      sheetFor(product.tab, columns).appendRow(row);
    } finally {
      lock.releaseLock();
    }

    notify(product, columns, row);
    enchargeIntake(data, row[0]);
    return json({ result: 'success' });
  } catch (err) {
    // Never fail silently: tell Jeff, and let the page show its email fallback.
    try {
      MailApp.sendEmail(NOTIFY_EMAIL, 'jeffseah.rocks intake ERROR', String(err && err.stack || err));
    } catch (_) {}
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

function sheetFor(tab, columns) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(tab);
  if (!sheet) {
    sheet = ss.insertSheet(tab);
    sheet.appendRow(columns);
    sheet.setFrozenRows(1);
  }
  return sheet;
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
  let s = String(value).trim().slice(0, MAX_FIELD);
  if (/^[=+\-@]/.test(s)) s = "'" + s;
  return s;
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
