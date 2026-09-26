// Stripe webhook: https://www.jeffseah.rocks/api/stripe-webhook
// customer.subscription.created: moves the subscription's billing day to the 15th, then emails Jeff
//   about the new subscriber (lib/signup-alert.mjs).
// checkout.session.completed: tells Encharge who bought what, which starts the client email flows
//   (lib/encharge.mjs, docs/crm/ENCHARGE_CRM.md).
// Setup and switch-on steps: BILLING_ANCHOR_SETUP.md. Logic and tests: lib/ and tests/.
//
// Failure policy: any error returns 500, so Stripe retries for up to three days and emails the
// account owner if the endpoint keeps failing. Nothing is swallowed. A retry re-sends the anchor
// update with the same idempotency key, so it is safe.

import { verifyStripeSignature, handleStripeEvent } from '../lib/billing-anchor.mjs';
import { sendSignupAlert } from '../lib/signup-alert.mjs';
import { checkoutEvents, sendToEncharge } from '../lib/encharge.mjs';

export async function POST(request) {
  const apiKey = process.env.STRIPE_API_KEY;
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!apiKey || !secret) {
    console.error('stripe-webhook: STRIPE_API_KEY or STRIPE_WEBHOOK_SECRET is not set');
    return new Response('not configured', { status: 503 });
  }

  const raw = await request.text();
  if (!(await verifyStripeSignature(raw, request.headers.get('stripe-signature'), secret))) {
    return new Response('bad signature', { status: 400 });
  }

  try {
    const event = JSON.parse(raw);
    let result;
    if (event.type === 'checkout.session.completed') {
      const events = checkoutEvents(event.data.object);
      if (!events.length) {
        result = { action: 'ignored', reason: 'not a known product' };
      } else {
        const writeKey = process.env.ENCHARGE_WRITE_KEY;
        if (!writeKey) throw new Error('ENCHARGE_WRITE_KEY is not set');
        result = { action: 'crm', ...(await sendToEncharge(events, { writeKey })) };
      }
    } else {
      result = await handleStripeEvent(event, { apiKey });
      if (result.action === 'anchored') Object.assign(result, await sendSignupAlert(event.data.object, result.anchor));
    }
    console.log('stripe-webhook:', JSON.stringify(result));
    return Response.json(result);
  } catch (err) {
    console.error('stripe-webhook: failed', err);
    return new Response('error', { status: 500 });
  }
}
