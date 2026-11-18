// Emails Jeff about every new monthly subscription (Jeff, 2026-09-26), so a subscriber who pays but never
// submits /welcome is still noticed. The 97 trial charges US$0 at signup, so Stripe sends no receipt for it.
// Delivery goes through the intake Apps Script (docs/intake/Code.gs), which already sends mail and logs
// each alert to the "stripe-signups" tab. A failure throws, so the webhook returns 500 and Stripe retries.

export const INTAKE_ENDPOINT = 'https://script.google.com/macros/s/AKfycbwwvJbirKRXE8OzoUjgVZobM8X5XqMeUY0pjlEaIQ3E_qot_FaSt3vgm30MVUxllAUT/exec';

const PLANS = { 9700: 'Power Calendar (97)', 19700: 'Calendar + Brief (197)', 29700: 'Calendar + Premium (297)', 39700: 'Coaching (397)', 49700: 'Coaching (497)' };

// The source rides inside the plan text ("Power Calendar (97) via exit_2027"), so it shows in the email
// subject and the Sheet's plan column without a change to the deployed Apps Script.
export function signupAlert(sub, anchorDay, source = '') {
  const price = sub.items?.data?.[0]?.price || {};
  const plan = PLANS[price.unit_amount] || `${(price.unit_amount ?? 0) / 100} ${price.currency || ''}`.trim();
  return {
    type: 'stripe-subscription',
    subscription: sub.id,
    customer: typeof sub.customer === 'string' ? sub.customer : sub.customer?.id || '',
    plan: source ? `${plan} via ${source}` : plan,
    status: sub.status,
    firstCharge: anchorDay,
  };
}

// Finds the checkout that created the subscription and returns its client_reference_id ("direct" when the
// link carried none). Best effort: the alert matters more than its label, so any failure (including a
// restricted key without Checkout Sessions read) returns "unknown" instead of throwing.
export async function checkoutSource(subscriptionId, { apiKey, fetchImpl = fetch } = {}) {
  try {
    const res = await fetchImpl(`https://api.stripe.com/v1/checkout/sessions?subscription=${encodeURIComponent(subscriptionId)}&limit=1`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!res.ok) return 'unknown';
    const session = (await res.json()).data?.[0];
    if (!session) return 'unknown';
    return String(session.client_reference_id || '').replace(/[^A-Za-z0-9_-]/g, '').slice(0, 200) || 'direct';
  } catch {
    return 'unknown';
  }
}

export async function sendSignupAlert(sub, anchorDay, { fetchImpl = fetch, url = INTAKE_ENDPOINT, source = '' } = {}) {
  const res = await fetchImpl(url, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify(signupAlert(sub, anchorDay, source)),
  });
  let result = '';
  try { result = (await res.json()).result; } catch { /* non-JSON body */ }
  if (!res.ok || result !== 'success') throw new Error(`signup alert for ${sub.id} failed: HTTP ${res.status}, result ${result || 'none'}`);
  return { alerted: true };
}
