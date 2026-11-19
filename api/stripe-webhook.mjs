// Stripe webhook: https://www.jeffseah.rocks/api/stripe-webhook
// customer.subscription.created: preserves Calendar-only billing; anchors report plans to the 15th, then emails Jeff
//   about the new subscriber (lib/signup-alert.mjs).
// customer.subscription.deleted / .updated: tags a cancelling subscriber monthly-cancelled in Encharge.
// checkout.session.completed: tells Encharge who bought what, which starts the client email flows
//   (lib/encharge.mjs, docs/crm/ENCHARGE_CRM.md).
// Setup and switch-on steps: BILLING_ANCHOR_SETUP.md. Logic and tests: lib/ and tests/.
//
// Failure policy: any error returns 500, so Stripe retries for up to three days and emails the
// account owner if the endpoint keeps failing. Nothing is swallowed. A retry re-sends the anchor
// update with the same idempotency key, so it is safe.

import { verifyStripeSignature, handleStripeEvent } from '../lib/billing-anchor.mjs';
import { checkoutSource, sendSignupAlert } from '../lib/signup-alert.mjs';
import { checkoutEvents, subscriptionEvents, sendToEncharge } from '../lib/encharge.mjs';
import {relayTrialSignup} from '../lib/trial-order.mjs';

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
    // Registration is idempotent and happens before existing CRM side effects.
    // A receipt failure returns 500, allowing Stripe to retry the same signed fact.
    const trialPreparation=process.env.TRIAL_ORDER_AUTOSTART_ENABLED==='enabled'
      ?await relayTrialSignup(event,{secret:process.env.PORTAL_TRIAL_SIGNUP_SECRET}):null;
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
    } else if (event.type === 'customer.subscription.deleted' || event.type === 'customer.subscription.updated') {
      const events = subscriptionEvents(event);
      if (!events.length) {
        result = { action: 'ignored', reason: 'no cancellation change' };
      } else {
        const writeKey = process.env.ENCHARGE_WRITE_KEY;
        if (!writeKey) throw new Error('ENCHARGE_WRITE_KEY is not set');
        result = { action: 'crm', ...(await sendToEncharge(events, { writeKey })) };
      }
    } else {
      result = await handleStripeEvent(event, { apiKey });
      if (['anchored', 'calendar-preserved'].includes(result.action)) {
        const source = await checkoutSource(event.data.object.id, { apiKey });
        Object.assign(result, { source }, await sendSignupAlert(event.data.object, result.anchor, { source }));
      }
    }
    if(trialPreparation)result.trialPreparation=trialPreparation;
    console.log('stripe-webhook:', JSON.stringify(result));
    return Response.json(result);
  } catch (err) {
    console.error('stripe-webhook: failed', err);
    return new Response('error', { status: 500 });
  }
}
