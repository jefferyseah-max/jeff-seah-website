// Tells Encharge (email automation) about every completed Stripe checkout (Jeff, 2026-09-27).
// Encharge runs the client email flows; see docs/crm/ENCHARGE_CRM.md.
//
// These events come from the signed Stripe webhook, so they are the TRUSTED source of "this person
// paid". The buyer tags set here (outlook-2027-buyer, monthly-subscriber) are what every Encharge
// flow filters on, so a forged intake form post can never start emails to a stranger.
//
// The product is read from the Checkout Session's success_url, which each Payment Link sets:
// /2027-next for the Outlook, /welcome?plan=<n> for the monthly plans. Known Payment Link IDs
// provide a fallback if Stripe omits success_url. Unknown products are ignored.
// No birth details or other sensitive data are ever sent to Encharge.

export const ENCHARGE_INGEST = 'https://ingest.encharge.io/v1/';
const PLANS = new Set(['97', '197', '297', '397', '497']);
const PAYMENT_LINKS = new Map([
  ['plink_1UJTagRmcvZfydHfw0B40mtH', { kind: 'outlook' }],
  ['plink_1UJz1aRmcvZfydHf7Tyqf5c0', { kind: 'outlook' }],
  ['plink_1UJU5nRmcvZfydHfycEdDsgE', { kind: 'monthly', plan: '97' }],
  ['plink_1UJU7cRmcvZfydHfoHlxSUSB', { kind: 'monthly', plan: '197' }],
  ['plink_1UJUOrRmcvZfydHf5GGxMeLb', { kind: 'monthly', plan: '297' }],
  ['plink_1UJUQqRmcvZfydHf3B6J2lsW', { kind: 'monthly', plan: '497' }],
]);

function productOf(session) {
  let url;
  try { url = new URL(session.success_url || ''); } catch { /* Payment Link ID fallback below */ }
  if (url?.pathname.replace(/\.html$/, '') === '/2027-next') return { kind: 'outlook' };
  if (url?.pathname.replace(/\.html$/, '') === '/welcome') {
    const plan = url.searchParams.get('plan');
    if (PLANS.has(plan)) return { kind: 'monthly', plan };
  }
  return PAYMENT_LINKS.get(session.payment_link) || null;
}

export function checkoutEvents(session) {
  if (session?.status !== 'complete') return [];
  if (!['paid', 'no_payment_required'].includes(session.payment_status)) return [];
  const product = productOf(session);
  const email = session.customer_details?.email || session.customer_email || '';
  if (!product || !email) return [];

  const name = (session.customer_details?.name || '').trim();
  const user = { email, ...(name && { name, firstName: name.split(/\s+/)[0] }) };
  const amount = (session.amount_total ?? 0) / 100;
  const currency = (session.currency || '').toUpperCase();

  if (product.kind === 'outlook') {
    return [
      { name: 'identify', user: { ...user, tags: 'outlook-2027-buyer' } },
      { name: 'Outlook Purchased', user: { email }, properties: { product: '2027-annual-outlook', amount, currency, sessionId: session.id } },
    ];
  }
  return [
    { name: 'identify', user: { ...user, tags: `monthly-subscriber,monthly-${product.plan}` } },
    { name: 'Subscription Started', user: { email }, properties: { plan: product.plan, amount, currency, sessionId: session.id, subscription: session.subscription || '' } },
  ];
}

// Sends each event in order (identify first, so the tag exists before the flow trigger fires).
// Any non-2xx throws, so the webhook returns 500 and Stripe retries.
export async function sendToEncharge(events, { writeKey, fetchImpl = fetch, url = ENCHARGE_INGEST } = {}) {
  for (const event of events) {
    const res = await fetchImpl(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Encharge-Token': writeKey },
      body: JSON.stringify(event),
    });
    if (!res.ok) throw new Error(`Encharge ${res.status} for event "${event.name}"`);
  }
  return { encharge: events.map(e => e.name) };
}
