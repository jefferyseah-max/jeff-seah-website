import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import test from 'node:test';

import { checkoutEvents, sendToEncharge } from '../lib/encharge.mjs';
import { POST } from '../api/stripe-webhook.mjs';

const outlook = {
  id: 'cs_live_a1', status: 'complete', payment_status: 'paid', mode: 'payment',
  success_url: 'https://www.jeffseah.rocks/2027-next?paid=1&session_id=cs_live_a1',
  customer_details: { email: 'jane@example.com', name: 'Jane Tan' }, amount_total: 8800, currency: 'usd',
};
const trial = {
  id: 'cs_live_b2', status: 'complete', payment_status: 'no_payment_required', mode: 'subscription',
  success_url: 'https://www.jeffseah.rocks/welcome?plan=97&session_id=cs_live_b2', subscription: 'sub_7',
  customer_details: { email: 'lee@example.com', name: 'Lee' }, amount_total: 0, currency: 'usd',
};

test('an Outlook checkout tags the buyer, then fires Outlook Purchased', () => {
  assert.deepEqual(checkoutEvents(outlook), [
    { name: 'identify', user: { email: 'jane@example.com', name: 'Jane Tan', firstName: 'Jane', tags: 'outlook-2027-buyer' } },
    { name: 'Outlook Purchased', user: { email: 'jane@example.com' }, properties: { product: '2027-annual-outlook', amount: 88, currency: 'USD', sessionId: 'cs_live_a1' } },
  ]);
});

test('a monthly checkout (trial included) tags the plan and fires Subscription Started', () => {
  const [identify, started] = checkoutEvents(trial);
  assert.equal(identify.user.tags, 'monthly-subscriber,monthly-97');
  assert.deepEqual(started.properties, { plan: '97', amount: 0, currency: 'USD', sessionId: 'cs_live_b2', subscription: 'sub_7' });
});

test('unknown products, unpaid or incomplete sessions and missing emails send nothing', () => {
  assert.deepEqual(checkoutEvents({ ...outlook, success_url: 'https://www.jeffseah.rocks/book' }), []);
  assert.deepEqual(checkoutEvents({ ...trial, success_url: 'https://www.jeffseah.rocks/welcome?plan=5' }), []);
  assert.deepEqual(checkoutEvents({ ...outlook, payment_status: 'unpaid' }), []);
  assert.deepEqual(checkoutEvents({ ...outlook, status: 'open' }), []);
  assert.deepEqual(checkoutEvents({ ...outlook, customer_details: {} }), []);
  assert.deepEqual(checkoutEvents(undefined), []);
});

test('no birth details or other intake fields ever reach Encharge', () => {
  const text = JSON.stringify(checkoutEvents(outlook));
  for (const field of ['birth', 'gender', 'decisions', 'calendarEmail']) assert.equal(text.includes(field), false);
});

test('sendToEncharge posts in order with the write key and throws on a non-2xx', async () => {
  const sent = [];
  const ok = async (url, init) => { sent.push({ url, token: init.headers['X-Encharge-Token'], name: JSON.parse(init.body).name }); return new Response('', { status: 200 }); };
  assert.deepEqual(await sendToEncharge(checkoutEvents(outlook), { writeKey: 'wk', fetchImpl: ok }), { encharge: ['identify', 'Outlook Purchased'] });
  assert.deepEqual(sent.map(s => s.name), ['identify', 'Outlook Purchased']);
  assert.equal(sent[0].url, 'https://ingest.encharge.io/v1/');
  assert.equal(sent[0].token, 'wk');
  await assert.rejects(sendToEncharge(checkoutEvents(outlook), { writeKey: 'wk', fetchImpl: async () => new Response('', { status: 401 }) }), /Encharge 401 for event "identify"/);
});

// Route-level: a signed checkout event reaches Encharge; a missing key or an Encharge failure returns 500.
const secret = 'whsec_route_test';
function signed(obj) {
  const body = JSON.stringify(obj);
  const t = Math.floor(Date.now() / 1000);
  const sig = `t=${t},v1=${crypto.createHmac('sha256', secret).update(`${t}.${body}`).digest('hex')}`;
  return new Request('https://www.jeffseah.rocks/api/stripe-webhook', { method: 'POST', body, headers: { 'stripe-signature': sig } });
}
async function run(env, fetchImpl, obj) {
  const saved = { ...process.env }; const realFetch = globalThis.fetch; const origError = console.error; const origLog = console.log;
  Object.assign(process.env, { STRIPE_API_KEY: 'rk_test', STRIPE_WEBHOOK_SECRET: secret }, env);
  globalThis.fetch = fetchImpl; console.error = () => {}; console.log = () => {};
  try { return await POST(signed(obj)); } finally { process.env = saved; globalThis.fetch = realFetch; console.error = origError; console.log = origLog; }
}
const checkout = obj => ({ id: 'evt_c', type: 'checkout.session.completed', data: { object: obj } });

test('route forwards a paid checkout to Encharge, and returns 500 when it cannot', async () => {
  const urls = [];
  const ok = await run({ ENCHARGE_WRITE_KEY: 'wk' }, async url => { urls.push(url); return new Response('', { status: 200 }); }, checkout(outlook));
  assert.equal(ok.status, 200);
  assert.equal((await ok.json()).action, 'crm');
  assert.deepEqual(urls, ['https://ingest.encharge.io/v1/', 'https://ingest.encharge.io/v1/']);

  assert.equal((await run({ ENCHARGE_WRITE_KEY: '' }, async () => new Response(''), checkout(outlook))).status, 500);
  assert.equal((await run({ ENCHARGE_WRITE_KEY: 'wk' }, async () => new Response('', { status: 503 }), checkout(outlook))).status, 500);
});

test('route ignores a checkout for an unknown product without needing the Encharge key', async () => {
  let called = false;
  const res = await run({ ENCHARGE_WRITE_KEY: '' }, async () => { called = true; return new Response(''); }, checkout({ ...outlook, success_url: 'https://x.test/book' }));
  assert.equal(res.status, 200);
  assert.equal(called, false);
});
