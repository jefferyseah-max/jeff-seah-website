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

const subEvent = (sub, type = 'customer.subscription.created') => ({ id: 'evt_1', type, data: { object: { id: 'sub_1', status: 'active', created: sgt(2026, 9, 3), metadata: {}, items: { data: [{ price: { id: 'price_1UJU74RmcvZfydHfXiBh79tC' } }] }, ...sub } } });

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

const calendarItems = { data: [{ price: { id: 'price_1UJU4uRmcvZfydHfKKY4QrSU' } }] };
test('calendar-only keeps original trial end and monthly cycle with no Stripe mutation', async () => {
  const { calls, fetchImpl } = fakeStripe();
  for (const status of ['trialing', 'active']) {
    const result = await handleStripeEvent(subEvent({ status, created: sgt(2026, 11, 21), trial_end: sgt(2026, 12, 21), items: calendarItems }), { apiKey: 'k', fetchImpl });
    assert.equal(result.action, 'calendar-preserved');
    assert.equal(result.anchor, status === 'trialing' ? '2026-12-21' : '2026-11-21');
  }
  assert.equal(calls.length, 0);
});

test('unknown, absent, mixed and truncated item lists never mutate billing', async () => {
  const { calls, fetchImpl } = fakeStripe();
  for (const items of [undefined, {data: []}, {data: [{price: {id: 'unknown', unit_amount: 9700}}]}, {data: [...calendarItems.data, ...calendarItems.data]}, {...calendarItems, has_more: true}]) {
    assert.equal((await handleStripeEvent(subEvent({items}), {apiKey: 'k', fetchImpl})).action, 'skipped');
  }
  assert.equal(calls.length, 0);
});

test('calendar upgrades and existing anchored subscriptions are not migrated', async () => {
  const { calls, fetchImpl } = fakeStripe();
  assert.equal((await handleStripeEvent(subEvent({items: calendarItems}, 'customer.subscription.updated'), {apiKey: 'k', fetchImpl})).action, 'ignored');
  assert.equal((await handleStripeEvent(subEvent({items: calendarItems, metadata: {billing_anchor: '2027-01-15'}}), {apiKey: 'k', fetchImpl})).action, 'skipped');
  assert.equal(calls.length, 0);
});

test('all known report prices retain existing anchoring', async () => {
  for (const id of ['price_1UJU74RmcvZfydHfXiBh79tC', 'price_1UJUOHRmcvZfydHfUqNSMerI', 'price_1UJUQERmcvZfydHfo3AOe5GD', 'price_1UKhMWRmcvZfydHfYU4KdQBj']) {
    const {calls, fetchImpl} = fakeStripe();
    assert.equal((await handleStripeEvent(subEvent({items: {data: [{price: {id}}]}}), {apiKey: 'k', fetchImpl})).action, 'anchored');
    assert.equal(calls.length, 1);
  }
});

test('calendar without trial and nonbillable statuses never alter Stripe', async () => {
  const {calls, fetchImpl} = fakeStripe();
  const result = await handleStripeEvent(subEvent({items: calendarItems}), {apiKey: 'k', fetchImpl});
  assert.equal(result.action, 'calendar-preserved');
  assert.equal(result.anchor, '2026-09-03');
  for (const status of ['canceled', 'incomplete', 'past_due']) {
    assert.equal((await handleStripeEvent(subEvent({items: calendarItems, status}), {apiKey: 'k', fetchImpl})).action, 'skipped');
  }
  await assert.rejects(handleStripeEvent(subEvent({items: calendarItems, status: 'trialing'}), {apiKey: 'k', fetchImpl}), /missing charge date/);
  assert.equal(calls.length, 0);
});
