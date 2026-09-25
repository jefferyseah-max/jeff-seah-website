# Billing on the 15th: switch-on steps

Built 2026-09-25 on branch `feature/billing-anchor`. Not live until the steps below are done.

## What it does

Every new monthly subscription (Calendar 97, Brief 197, Premium 297, Coaching 397) is moved onto the 15th:

- Paid plans: first charge at signup, next charge on the 15th of the following month (Singapore time), then every 15th.
  Signs up 3 Sep: pays 3 Sep, next 15 Oct. Signs up 28 Sep: pays 28 Sep, next 15 Oct.
- Calendar plan with the 30-day free trial: first charge on the first 15th on or after the trial ends.
  Signs up 3 Sep: trial ends 3 Oct, first charge 15 Oct. Signs up 20 Sep: trial ends 20 Oct, first charge 15 Nov.
- Charges run at 09:00 Singapore time. Nobody is charged extra: the gap to the 15th is free.

Anyone who cancels in the customer portal before the 15th is not charged again, so reports are only prepared for plans still active on the 15th.

How: Stripe Payment Links cannot set a billing day. When Stripe reports a new subscription, `/api/stripe-webhook` sets its `trial_end` to the chosen 15th with `proration_behavior=none`, and stamps `metadata.billing_anchor` so it is never moved twice. In Stripe the subscription shows as "trialing" until that 15th; that is expected.

## Switch-on steps (Jeff, about 10 minutes)

1. **Restricted key.** Stripe, Developers, API keys, Create restricted key. Name it `billing-anchor`. Give it **Subscriptions: Write** and nothing else. Copy the `rk_live_...` value.
2. **Webhook.** Stripe, Developers, Webhooks, Add endpoint:
   - URL: `https://www.jeffseah.rocks/api/stripe-webhook`
   - Event: `customer.subscription.created` only.
   - Save, then reveal and copy the signing secret (`whsec_...`).
3. **Vercel.** Project `jeff-seah-website`, Settings, Environment Variables, Production:
   - `STRIPE_API_KEY` = the `rk_live_...` value
   - `STRIPE_WEBHOOK_SECRET` = the `whsec_...` value
4. **Merge** `feature/billing-anchor` into `main` (Claude can do this once 1 to 3 are done).
5. **Test** with one real signup on the 97 plan (free trial, nothing charged), check the subscription in Stripe shows the next invoice on the expected 15th, then cancel it.

Claude must never type the key or secret; Jeff pastes them.

## When it goes wrong

Any failure returns HTTP 500, so Stripe retries for up to three days and emails the account owner if the endpoint keeps failing. Details are in Vercel, project logs, filter `stripe-webhook`. A subscription the webhook missed can be fixed by hand in Stripe: Update subscription, set trial end to the right 15th, no proration.

## After it is live

Update the site copy: the pricing note on `index.html` and the offer note on `power-calendar.html` can then say "Billed on the 15th of each month. Cancel before the 15th and you will not be charged for the next month."

## Tests

`node --test tests/*.test.mjs` (10 tests: date rule in Singapore time, trial rule, signature check, idempotent skip, failure surfaced as 500).
