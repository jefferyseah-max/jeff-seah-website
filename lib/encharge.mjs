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

// Where the checkout started, from the link's client_reference_id: a placement (home, power_calendar,
// exit_2027), an ad source (chatgpt_launch, set by js/measure.js), or both (exit_2027__chatgpt_launch).
// The tag names the first part only, so Encharge segments stay few: src-exit_2027, src-chatgpt_launch.
// Untagged checkouts get source "direct" and no tag.
export function sourceOf(session) {
  const source = String(session?.client_reference_id || '').replace(/[^A-Za-z0-9_-]/g, '').slice(0, 200);
  if (!source) return { source: 'direct', tag: '' };
  return { source, tag: `src-${source.split('__')[0].toLowerCase()}` };
}

export function checkoutEvents(session) {
  if (session?.status !== 'complete') return [];
  if (!['paid', 'no_payment_required'].includes(session.payment_status)) return [];
  const product = productOf(session);
  const email = session.customer_details?.email || session.customer_email || '';
  if (!product || !email) return [];

  const name = (session.customer_details?.name || '').trim();
  // userId = the Stripe customer, so later subscription events (which carry no email) find this contact.
  const customer = typeof session.customer === 'string' ? session.customer : session.customer?.id || '';
  const user = { email, ...(customer && { userId: customer }), ...(name && { name, firstName: name.split(/\s+/)[0] }) };
  const amount = (session.amount_total ?? 0) / 100;
  const currency = (session.currency || '').toUpperCase();
  const { source, tag } = sourceOf(session);
  const withSource = tags => tag ? `${tags},${tag}` : tags;

  if (product.kind === 'outlook') {
    return [
      { name: 'identify', user: { ...user, tags: withSource('outlook-2027-buyer') } },
      { name: 'Outlook Purchased', user: { email }, properties: { product: '2027-annual-outlook', amount, currency, sessionId: session.id, source } },
    ];
  }
  return [
    { name: 'identify', user: { ...user, tags: withSource(`monthly-subscriber,monthly-${product.plan}`) } },
    { name: 'Subscription Started', user: { email }, properties: { plan: product.plan, amount, currency, sessionId: session.id, subscription: session.subscription || '', source } },
  ];
}

// A subscriber cancels: tag monthly-cancelled so no flow sends them trial-ending or upsell emails.
// Fires once per cancellation: when the subscription ends (customer.subscription.deleted) or when it is
// first set to cancel later (customer.subscription.updated with cancel_at_period_end or cancel_at newly set;
// Stripe's previous_attributes shows the change). The contact is found by userId (the Stripe customer,
// stored at checkout), because subscription events carry no email. Encharge cannot remove a tag, so a
// cancellation that is later undone keeps the tag; "Subscription Resumed" records it for a flow to use.
export function subscriptionEvents(event) {
  const sub = event?.data?.object;
  if (!sub || sub.object !== 'subscription') return [];
  const customer = typeof sub.customer === 'string' ? sub.customer : sub.customer?.id || '';
  if (!customer) return [];
  const before = event.data.previous_attributes || {};
  const props = { subscription: sub.id, status: sub.status };

  let cancelled = false;
  let resumed = false;
  if (event.type === 'customer.subscription.deleted') cancelled = true;
  if (event.type === 'customer.subscription.updated') {
    const now = Boolean(sub.cancel_at_period_end || sub.cancel_at);
    const changed = 'cancel_at_period_end' in before || 'cancel_at' in before;
    const was = Boolean(before.cancel_at_period_end || before.cancel_at);
    if (changed && now && !was) cancelled = true;
    if (changed && !now && was) resumed = true;
  }
  if (cancelled) {
    const ends = sub.ended_at || sub.cancel_at || sub.current_period_end || null;
    return [
      { name: 'identify', user: { userId: customer, tags: 'monthly-cancelled' } },
      { name: 'Subscription Cancelled', user: { userId: customer }, properties: { ...props, endsAt: ends ? new Date(ends * 1000).toISOString() : '' } },
    ];
  }
  if (resumed) return [{ name: 'Subscription Resumed', user: { userId: customer }, properties: props }];
  return [];
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
