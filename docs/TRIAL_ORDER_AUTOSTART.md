# Automatic USD97 trial preparation start

Jeff requested this on 19 November 2026. A completed live Calendar checkout, its live 30-day trial subscription and the matching submitted birth details create one private preparation order without Jeff adding it manually.

## Authority and flow

`api/stripe-webhook.mjs` verifies the existing Stripe signature before `lib/trial-order.mjs` selects any facts. The relay sends only checkout/subscription identities, the checkout email, known plan ID, status and exact trial timestamps. It sends no birth inputs, card information or payment-method details. The existing USD97 price is `price_1UJU4uRmcvZfydHfKKY4QrSU`; its Payment Link is `plink_1UJU5nRmcvZfydHfycEdDsgE`. Amount alone never identifies the plan.

The purpose-scoped receiver is `https://reports.jeffseah.rocks/members/__trial_signup`. It retains two signed-source facts in private R2, handles either arrival order, and rejects conflicting identities, non-live events and unrelated checkout links. Subscription changes keep the latest eligible status; old retries cannot reactivate a cancelled signup. This registry gates preparation start, not ongoing billing entitlements.

The Olares `trial-profile-worker.timer`, owned by the Client Monthly Workflow project, reads the original `monthly-welcome` intake Sheet every five minutes when a verified signup is waiting. It matches the exact checkout-session ID and normalized email, accepts plan `97-portal-trial` or the historical `97`, and submits the private birth details to the portal's verified-match action. It never treats the form's `paid` flag or the public Apps Script `stripe-signups` alerts as proof. No form or Apps Script deployment changes are needed.

The preparation ID is derived from the Stripe subscription, with a separate atomic email claim. Identical webhook/intake retries resume the same order. Conflicting birth inputs need review. Unknown birth hours create an attention record, without guessing an hour or starting profile creation. The existing profile worker then creates/resolves Wealth Codex, Typing Astro and ChineseMetasoft mappings and records their IDs.

The authoritative Sheet time zone was read from Google Sheets metadata on 19 November 2026: `Asia/Singapore`. Receipt timestamps are normalized to RFC3339 milliseconds. The internal delivery target is five Monday-Friday days from the original receipt time on Jeff's Singapore work calendar. It excludes weekends; public holidays can make the contractual deadline later, not this internal target later.

Calendar guidance follows Jeff's local-clock policy. No residence time zone is requested or invented. Birth-time/chart verification remains separate. Preparation does not publish apps or send the portal invitation. Existing Encharge flows, billing amounts and renewal dates are unchanged. Stripe subscription-state synchronization for released app entitlements remains separate.

## Configuration and verification

Vercel production: `TRIAL_ORDER_AUTOSTART_ENABLED=enabled` and sensitive `PORTAL_TRIAL_SIGNUP_SECRET`. The report host holds the same purpose-scoped secret. Its encrypted local recovery is `%LOCALAPPDATA%/JeffSeahBonusPilot/trial-signup-relay.dpapi`. Never put it in source, arguments, logs or an intake record. The existing source publisher cannot forge Stripe signup facts.

The relay runs before existing CRM side effects. A failed receipt returns HTTP 500 so Stripe retries; a successful replay is idempotent. `GET /api/trial-order-health`, authenticated with the same relay secret, probes the report receiver without creating any record, sending email or exposing the secret. Anonymous probes return 404. Tests use fictional signed events and mocked services; they are not proof a real buyer has completed the journey.

Run `node --test tests/*.test.mjs`. The cross-project fixture is `client-portal/trial-order-autostart.integration.mjs --website <this checkout>` in Client Monthly Workflow. It covers signed checkout, signed subscription, the actual Python intake matcher, one queued order and retry deduplication with zero external requests or production orders. Portal tests cover wrong identities/plans, expired/cancelled trials, unknown hours, owner isolation and local-clock rendering in US, NZ and Australia contexts.

On this machine the native Vercel CLI 66.2.0 failed to collect a browser-approved device login. Installed CLI 59.5.0 completed it. Do not repeatedly ask Jeff to approve the failing native flow. Keep credential files ignored and remove automatically generated temporary `.env.local` files that are not needed.
