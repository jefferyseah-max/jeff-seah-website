// Emails Jeff about every new monthly subscription (Jeff, 2026-09-26), so a subscriber who pays but never
// submits /welcome is still noticed. The 97 trial charges US$0 at signup, so Stripe sends no receipt for it.
// Delivery goes through the intake Apps Script (docs/intake/Code.gs), which already sends mail and logs
// each alert to the "stripe-signups" tab. A failure throws, so the webhook returns 500 and Stripe retries.

export const INTAKE_ENDPOINT = 'https://script.google.com/macros/s/AKfycbwwvJbirKRXE8OzoUjgVZobM8X5XqMeUY0pjlEaIQ3E_qot_FaSt3vgm30MVUxllAUT/exec';

const PLANS = { 9700: 'Power Calendar (97)', 19700: 'Calendar + Brief (197)', 29700: 'Calendar + Premium (297)', 39700: 'Coaching (397)' };

export function signupAlert(sub, anchorDay) {
  const price = sub.items?.data?.[0]?.price || {};
  return {
    type: 'stripe-subscription',
    subscription: sub.id,
    customer: typeof sub.customer === 'string' ? sub.customer : sub.customer?.id || '',
    plan: PLANS[price.unit_amount] || `${(price.unit_amount ?? 0) / 100} ${price.currency || ''}`.trim(),
    status: sub.status,
    firstCharge: anchorDay,
  };
}

export async function sendSignupAlert(sub, anchorDay, { fetchImpl = fetch, url = INTAKE_ENDPOINT } = {}) {
  const res = await fetchImpl(url, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify(signupAlert(sub, anchorDay)),
  });
  let result = '';
  try { result = (await res.json()).result; } catch { /* non-JSON body */ }
  if (!res.ok || result !== 'success') throw new Error(`signup alert for ${sub.id} failed: HTTP ${res.status}, result ${result || 'none'}`);
  return { alerted: true };
}
