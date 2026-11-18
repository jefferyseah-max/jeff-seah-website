import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import test from 'node:test';

import { POST } from '../api/stripe-webhook.mjs';

const secret = 'whsec_route_test';
const event = { id: 'evt_1', type: 'customer.subscription.created', data: { object: { id: 'sub_9', status: 'active', created: 1790300000, metadata: {}, items: { data: [{ price: { id: 'price_1UJU74RmcvZfydHfXiBh79tC' } }] } } } };

function request(body, sig) {
  return new Request('https://www.jeffseah.rocks/api/stripe-webhook', { method: 'POST', body, headers: { 'stripe-signature': sig } });
}
function sign(body) {
  const t = Math.floor(Date.now() / 1000);
  return `t=${t},v1=${crypto.createHmac('sha256', secret).update(`${t}.${body}`).digest('hex')}`;
}
function withEnv(env, fn) {
  const saved = { ...process.env };
  Object.assign(process.env, env);
  return fn().finally(() => { process.env = saved; });
}

test('route refuses to run without both secrets', async () => {
  await withEnv({ STRIPE_API_KEY: '', STRIPE_WEBHOOK_SECRET: '' }, async () => {
    assert.equal((await POST(request('{}', ''))).status, 503);
  });
});

test('route rejects a bad signature and never calls Stripe', async () => {
  const realFetch = globalThis.fetch;
  let called = false;
  globalThis.fetch = async () => { called = true; return new Response('{}'); };
  try {
    await withEnv({ STRIPE_API_KEY: 'rk_test', STRIPE_WEBHOOK_SECRET: secret }, async () => {
      const body = JSON.stringify(event);
      assert.equal((await POST(request(body, 't=1,v1=deadbeef'))).status, 400);
    });
  } finally { globalThis.fetch = realFetch; }
  assert.equal(called, false);
});

// Answers Stripe with the subscription and the Apps Script with `alertResult`; records every URL called.
function fakeBackends(alertResult = 'success') {
  const urls = [];
  globalThis.fetch = async url => {
    urls.push(url);
    return url.startsWith('https://api.stripe.com/')
      ? new Response('{"id":"sub_9"}', { status: 200 })
      : Response.json({ result: alertResult });
  };
  return urls;
}

test('route anchors a signed event and returns 500 when Stripe fails, so Stripe retries', async () => {
  const realFetch = globalThis.fetch;
  try {
    await withEnv({ STRIPE_API_KEY: 'rk_test', STRIPE_WEBHOOK_SECRET: secret }, async () => {
      const body = JSON.stringify(event);
      fakeBackends();
      const ok = await POST(request(body, sign(body)));
      assert.equal(ok.status, 200);
      assert.equal((await ok.json()).action, 'anchored');
      globalThis.fetch = async () => new Response('{"error":{"message":"boom"}}', { status: 500 });
      const origError = console.error; console.error = () => {};
      try { assert.equal((await POST(request(body, sign(body)))).status, 500); } finally { console.error = origError; }
    });
  } finally { globalThis.fetch = realFetch; }
});

test('route emails Jeff after anchoring, and returns 500 when the alert fails, so Stripe retries', async () => {
  const realFetch = globalThis.fetch;
  try {
    await withEnv({ STRIPE_API_KEY: 'rk_test', STRIPE_WEBHOOK_SECRET: secret }, async () => {
      const body = JSON.stringify(event);
      const urls = fakeBackends();
      const ok = await POST(request(body, sign(body)));
      assert.equal(ok.status, 200);
      assert.equal((await ok.json()).alerted, true);
      assert.equal(urls.length, 3); // anchor update, checkout source lookup, alert
      assert.match(urls[1], /^https:\/\/api\.stripe\.com\/v1\/checkout\/sessions\?subscription=/);
      assert.match(urls[2], /^https:\/\/script\.google\.com\/macros\//);

      fakeBackends('error');
      const origError = console.error; console.error = () => {};
      try { assert.equal((await POST(request(body, sign(body)))).status, 500); } finally { console.error = origError; }
    });
  } finally { globalThis.fetch = realFetch; }
});

test('route sends no alert for events it ignores', async () => {
  const realFetch = globalThis.fetch;
  try {
    await withEnv({ STRIPE_API_KEY: 'rk_test', STRIPE_WEBHOOK_SECRET: secret }, async () => {
      const body = JSON.stringify({ ...event, type: 'invoice.paid' });
      const urls = fakeBackends();
      assert.equal((await POST(request(body, sign(body)))).status, 200);
      assert.equal(urls.length, 0);
    });
  } finally { globalThis.fetch = realFetch; }
});

test('calendar route preserves billing, emails original trial end, and retries failed alerts', async () => {
  const realFetch = globalThis.fetch;
  try {
    await withEnv({ STRIPE_API_KEY: 'rk_test', STRIPE_WEBHOOK_SECRET: secret }, async () => {
      const trial = structuredClone(event);
      Object.assign(trial.data.object, {status: 'trialing', trial_end: Date.UTC(2026, 11, 21, 4) / 1000,
        items: {data: [{price: {id: 'price_1UJU4uRmcvZfydHfKKY4QrSU', unit_amount: 9700, currency: 'usd'}}]}});
      const body = JSON.stringify(trial);
      const calls = [];
      let fail = true;
      globalThis.fetch = async (url, init) => {
        if (url.startsWith('https://api.stripe.com/v1/checkout/sessions')) {
          return Response.json({data: [{id: 'cs_1', client_reference_id: 'exit_2027'}]});
        }
        calls.push({url, payload: JSON.parse(init.body)});
        assert.match(url, /^https:\/\/script\.google\.com\/macros\//);
        return Response.json({result: fail ? 'error' : 'success'});
      };
      const origError = console.error; console.error = () => {};
      try { assert.equal((await POST(request(body, sign(body)))).status, 500); }
      finally { console.error = origError; }
      fail = false;
      const response = await POST(request(body, sign(body)));
      assert.equal(response.status, 200);
      assert.equal((await response.json()).alerted, true);
      assert.equal(calls.length, 2);
      assert.equal(calls[1].payload.firstCharge, '2026-12-21');
      assert.equal(calls[1].payload.plan, 'Power Calendar (97) via exit_2027');
    });
  } finally { globalThis.fetch = realFetch; }
});
