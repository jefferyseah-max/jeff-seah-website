// Moves every new Power Calendar subscription onto the 15th of the month (Jeff, 2026-09-25).
// Paid plans: first charge at signup, next on the 15th of the following month (Singapore time).
// Free trial: first charge on the first 15th on or after the trial ends.
// Stripe Payment Links cannot set a billing day, so the webhook sets trial_end to the chosen 15th
// with proration_behavior=none: no extra charge, and the 15th becomes the renewal day from then on.

const SGT_OFFSET_S = 8 * 3600;
const ANCHOR_HOUR_SGT = 9;
const SIGNATURE_TOLERANCE_S = 300;

// 15th of (year, monthIndex) at 09:00 Singapore, as unix seconds. monthIndex may overflow into the next year.
function fifteenth(year, monthIndex) {
  return Date.UTC(year, monthIndex, 15, ANCHOR_HOUR_SGT) / 1000 - SGT_OFFSET_S;
}

function sgtParts(unix) {
  const d = new Date((unix + SGT_OFFSET_S) * 1000);
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() };
}

export function anchorFor({ created, trial_end: trialEnd }) {
  if (trialEnd) {
    const { year, month } = sgtParts(trialEnd);
    const sameMonth = fifteenth(year, month);
    return sameMonth >= trialEnd ? sameMonth : fifteenth(year, month + 1);
  }
  const { year, month } = sgtParts(created);
  return fifteenth(year, month + 1);
}

const sgtDay = unix => new Date((unix + SGT_OFFSET_S) * 1000).toISOString().slice(0, 10);

function timingSafeEqualHex(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function verifyStripeSignature(rawBody, header, secret, nowS = Math.floor(Date.now() / 1000)) {
  if (!header || !secret) return false;
  let t = null;
  const v1 = [];
  for (const item of header.split(',')) {
    const [k, v] = item.split('=');
    if (k === 't') t = Number(v);
    if (k === 'v1' && v) v1.push(v);
  }
  if (!Number.isFinite(t) || !v1.length || Math.abs(nowS - t) > SIGNATURE_TOLERANCE_S) return false;
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const mac = new Uint8Array(await crypto.subtle.sign('HMAC', key, enc.encode(`${t}.${rawBody}`)));
  const expected = [...mac].map(b => b.toString(16).padStart(2, '0')).join('');
  return v1.some(sig => timingSafeEqualHex(sig, expected));
}

export async function handleStripeEvent(event, { apiKey, fetchImpl = fetch }) {
  if (event?.type !== 'customer.subscription.created') return { action: 'ignored' };
  const sub = event.data.object;
  if (sub.metadata?.billing_anchor) return { action: 'skipped', reason: 'already anchored' };
  if (!['active', 'trialing'].includes(sub.status)) return { action: 'skipped', reason: `status ${sub.status}` };

  const anchor = anchorFor(sub);
  const body = new URLSearchParams({
    trial_end: String(anchor),
    proration_behavior: 'none',
    'metadata[billing_anchor]': sgtDay(anchor),
  });
  const res = await fetchImpl(`https://api.stripe.com/v1/subscriptions/${encodeURIComponent(sub.id)}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Idempotency-Key': `billing-anchor-${sub.id}`,
    },
    body: body.toString(),
  });
  if (!res.ok) {
    let message = '';
    try { message = (await res.json()).error?.message || ''; } catch { /* non-JSON error body */ }
    throw new Error(`Stripe ${res.status} updating ${sub.id}: ${message}`);
  }
  return { action: 'anchored', subscription: sub.id, anchor: sgtDay(anchor) };
}
