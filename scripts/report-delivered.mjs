#!/usr/bin/env node
// Run once a client's Annual Outlook is live in Fusebase:
//   node scripts/report-delivered.mjs <client email> [report url]
// Marks their intake row "Delivered" in the Sheet (the Olares watcher stops chasing it) and fires
// "Report Delivered" in Encharge, which starts the after-delivery email flow.
// See docs/crm/ENCHARGE_CRM.md. Needs no keys: it posts to the intake Apps Script.

import { INTAKE_ENDPOINT } from '../lib/signup-alert.mjs';

const [email, reportUrl = ''] = process.argv.slice(2);
if (!email || !email.includes('@')) {
  console.error('usage: node scripts/report-delivered.mjs <client email> [report url]');
  process.exit(2);
}

const res = await fetch(INTAKE_ENDPOINT, {
  method: 'POST',
  headers: { 'Content-Type': 'text/plain' },
  body: JSON.stringify({ type: 'report-delivered', email, reportUrl }),
});
let body = {};
try { body = await res.json(); } catch { /* non-JSON body */ }
if (!res.ok || body.result !== 'success') {
  console.error(`failed: HTTP ${res.status}, ${JSON.stringify(body)}`);
  process.exit(1);
}
console.log(`delivered: Sheet row ${body.row} marked, Encharge "Report Delivered" sent`);
