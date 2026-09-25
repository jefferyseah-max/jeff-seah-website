import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import test from 'node:test';

import { anchorFor, verifyStripeSignature, handleStripeEvent } from '../lib/billing-anchor.mjs';

// Unix seconds for a Singapore wall-clock time.
const sgt = (y, m, d, h = 12) => Date.UTC(y, m - 1, d, h - 8) / 1000;
const sgtDate = unix => new Date((unix + 8 * 3600) * 1000).toISOString().slice(0, 16);

test('paid plan: first charge at signup, next on the 15th of the following month', () => {
  assert.equal(sgtDate(anchorFor({ created: sgt(2026, 9, 3) })), '2026-10-15T09:00');
  assert.equal(sgtDate(anchorFor({ created: sgt(2026, 9, 28) })), '2026-10-15T09:00');
  assert.equal(sgtDate(anchorFor({ created: sgt(2026, 9, 15) })), '2026-10-15T09:00');
  assert.equal(sgtDate(anchorFor({ created: sgt(2026, 12, 20) })), '2027-01-15T09:00');
});

test('signup date is read in Singapore time, not UTC', () => {
  // 1 Oct 01:00 SGT is still 30 Sep in UTC; the anchor must follow the Singapore month.
  assert.equal(sgtDate(anchorFor({ created: sgt(2026, 10, 1, 1) })), '2026-11-15T09:00');
});

test('free trial: first charge on the first 15th on or after the trial ends', () => {
  assert.equal(sgtDate(anchorFor({ created: sgt(2026, 9, 3), trial_end: sgt(2026, 10, 3) })), '2026-10-15T09:00');
  assert.equal(sgtDate(anchorFor({ created: sgt(2026, 9, 20), trial_end: sgt(2026, 10, 20) })), '2026-11-15T09:00');
  // A trial ending on the 15th before 09:00 is charged that morning, not a month later.
  assert.equal(sgtDate(anchorFor({ created: sgt(2026, 9, 15, 7), trial_end: sgt(2026, 10, 15, 7) })), '2026-10-15T09:00');
});

function sign(body, secret, t = Math.floor(Date.now() / 1000)) {
  const v1 = crypto.createHmac('sha256', secret).update(`${t}.${body}`).digest('hex');
  return `t=${t},v1=${v1}`;
}

test('signature: accepts a valid Stripe signature, rejects tampering, wrong secret and stale timestamps', async () => {
  const secret = 'whsec_test123';
  const body = '{"id":"evt_1"}';
  assert.equal(await verifyStripeSignature(body, sign(body, secret), secret), true);
  assert.equal(await verifyStripeSignature(body + ' ', sign(body, secret), secret), false);
  assert.equal(await verifyStripeSignature(body, sign(body, 'whsec_other'), secret), false);
  assert.equal(await verifyStripeSignature(body, sign(body, secret, Math.floor(Date.now() / 1000) - 3600), secret), false);
  assert.equal(await verifyStripeSignature(body, '', secret), false);
});

function fakeStripe() {
  const calls = [];
  const fetchImpl = async (url, init) => {
    calls.push({ url, init, body: new URLSearchParams(init.body) });
    return new Response('{"id":"sub_1"}', { status: 200 });
  };
  return { calls, fetchImpl };
}

const subEvent = (sub, type = 'customer.subscription.created') => ({ id: 'evt_1', type, data: { object: { id: 'sub_1', status: 'active', created: sgt(2026, 9, 3), metadata: {}, ...sub } } });

test('handler moves a new subscription to the 15th without charging extra', async () => {
  const { calls, fetchImpl } = fakeStripe();
  const result = await handleStripeEvent(subEvent({}), { apiKey: 'rk_test', fetchImpl });
  assert.equal(result.action, 'anchored');
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, 'https://api.stripe.com/v1/subscriptions/sub_1');
  assert.equal(calls[0].init.method, 'POST');
  assert.equal(calls[0].init.headers.Authorization, 'Bearer rk_test');
  assert.equal(calls[0].init.headers['Idempotency-Key'], 'billing-anchor-sub_1');
  assert.equal(sgtDate(Number(calls[0].body.get('trial_end'))), '2026-10-15T09:00');
  assert.equal(calls[0].body.get('proration_behavior'), 'none');
  assert.equal(calls[0].body.get('metadata[billing_anchor]'), '2026-10-15');
});

test('handler ignores other events, already-anchored and ended subscriptions', async () => {
  const { calls, fetchImpl } = fakeStripe();
  assert.equal((await handleStripeEvent(subEvent({}, 'invoice.paid'), { apiKey: 'k', fetchImpl })).action, 'ignored');
  assert.equal((await handleStripeEvent(subEvent({ metadata: { billing_anchor: '2026-10-15' } }), { apiKey: 'k', fetchImpl })).action, 'skipped');
  assert.equal((await handleStripeEvent(subEvent({ status: 'canceled' }), { apiKey: 'k', fetchImpl })).action, 'skipped');
  assert.equal((await handleStripeEvent(subEvent({ status: 'incomplete' }), { apiKey: 'k', fetchImpl })).action, 'skipped');
  assert.equal(calls.length, 0);
});

test('handler surfaces a Stripe API failure instead of swallowing it', async () => {
  const fetchImpl = async () => new Response('{"error":{"message":"No such subscription"}}', { status: 404 });
  await assert.rejects(handleStripeEvent(subEvent({}), { apiKey: 'k', fetchImpl }), /Stripe 404.*No such subscription/);
});
