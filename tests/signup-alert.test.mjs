import assert from 'node:assert/strict';
import test from 'node:test';

import { checkoutSource, signupAlert, sendSignupAlert } from '../lib/signup-alert.mjs';

const sub = {
  id: 'sub_1', customer: 'cus_1', status: 'trialing',
  items: { data: [{ price: { unit_amount: 9700, currency: 'usd' } }] },
};

test('alert names the plan from the price and carries the first charge day', () => {
  assert.deepEqual(signupAlert(sub, '2026-11-15'), {
    type: 'stripe-subscription', subscription: 'sub_1', customer: 'cus_1',
    plan: 'Power Calendar (97)', status: 'trialing', firstCharge: '2026-11-15',
  });
  const odd = { ...sub, items: { data: [{ price: { unit_amount: 12300, currency: 'usd' } }] } };
  assert.equal(signupAlert(odd, '2026-11-15').plan, '123 usd');
  const coaching = { ...sub, items: { data: [{ price: { unit_amount: 49700, currency: 'usd' } }] } };
  assert.equal(signupAlert(coaching, '2026-11-15').plan, 'Coaching (497)');
});

test('alert adds the checkout source to the plan text', () => {
  assert.equal(signupAlert(sub, '2026-11-15', 'exit_2027').plan, 'Power Calendar (97) via exit_2027');
  assert.equal(signupAlert(sub, '2026-11-15', '').plan, 'Power Calendar (97)');
});

test('checkout source lookup reads client_reference_id and never throws', async () => {
  let asked;
  const found = async (url, init) => { asked = { url, auth: init.headers.Authorization }; return Response.json({ data: [{ client_reference_id: 'home' }] }); };
  assert.equal(await checkoutSource('sub_1', { apiKey: 'rk_x', fetchImpl: found }), 'home');
  assert.equal(asked.url, 'https://api.stripe.com/v1/checkout/sessions?subscription=sub_1&limit=1');
  assert.equal(asked.auth, 'Bearer rk_x');
  assert.equal(await checkoutSource('sub_1', { fetchImpl: async () => Response.json({ data: [{ client_reference_id: null }] }) }), 'direct');
  assert.equal(await checkoutSource('sub_1', { fetchImpl: async () => Response.json({ data: [] }) }), 'unknown');
  assert.equal(await checkoutSource('sub_1', { fetchImpl: async () => new Response('{}', { status: 403 }) }), 'unknown');
  assert.equal(await checkoutSource('sub_1', { fetchImpl: async () => { throw new Error('offline'); } }), 'unknown');
});

test('alert posts JSON to the Apps Script and throws unless it answers success', async () => {
  let sent;
  const ok = async (url, init) => { sent = { url, body: JSON.parse(init.body) }; return Response.json({ result: 'success' }); };
  assert.deepEqual(await sendSignupAlert(sub, '2026-11-15', { fetchImpl: ok, url: 'https://example.test/exec' }), { alerted: true });
  assert.equal(sent.url, 'https://example.test/exec');
  assert.equal(sent.body.subscription, 'sub_1');

  const refused = async () => Response.json({ result: 'error', error: 'unknown product' });
  await assert.rejects(sendSignupAlert(sub, 'x', { fetchImpl: refused }), /sub_1 failed: HTTP 200, result error/);
  const down = async () => new Response('<html>', { status: 502 });
  await assert.rejects(sendSignupAlert(sub, 'x', { fetchImpl: down }), /HTTP 502, result none/);
});
