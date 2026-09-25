/**
 * jeffseah.rocks intake handler.
 * Serves /2027-next (2027 Annual Outlook buyers) and /welcome (monthly plan subscribers).
 * Bound to the Google Sheet "jeffseah.rocks Intake". Each product gets its own tab,
 * created with headers on first use. Jeff is emailed on every accepted submission.
 * Setup: docs/intake/INTAKE_SETUP.md.
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
    return json({ result: 'success' });
  } catch (err) {
    // Never fail silently: tell Jeff, and let the page show its email fallback.
    try {
      MailApp.sendEmail(NOTIFY_EMAIL, 'jeffseah.rocks intake ERROR', String(err && err.stack || err));
    } catch (_) {}
    return json({ result: 'error', error: String(err) });
  }
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
