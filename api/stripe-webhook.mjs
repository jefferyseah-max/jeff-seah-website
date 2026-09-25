// Stripe webhook: https://www.jeffseah.rocks/api/stripe-webhook
// Listens for customer.subscription.created and moves the subscription's billing day to the 15th.
// Setup and switch-on steps: BILLING_ANCHOR_SETUP.md. Logic and tests: lib/billing-anchor.mjs.
//
// Failure policy: any error returns 500, so Stripe retries for up to three days and emails the
// account owner if the endpoint keeps failing. Nothing is swallowed.

import { verifyStripeSignature, handleStripeEvent } from '../lib/billing-anchor.mjs';

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
    const result = await handleStripeEvent(JSON.parse(raw), { apiKey });
    console.log('stripe-webhook:', JSON.stringify(result));
    return Response.json(result);
  } catch (err) {
    console.error('stripe-webhook: failed', err);
    return new Response('error', { status: 500 });
  }
}
