# CRM: Encharge client flows for jeffseah.rocks

Spec and runbook. Written 2026-09-27 (Claude, with Jeff). Start with the 2027 Annual Outlook; the
monthly plans reuse the same plumbing later.

## Decisions (Jeff, 2026-09-27)

- **Encharge, not CompanyHub or Skillplate.** CompanyHub is a sales-team pipeline CRM. Skillplate takes a
  5 to 10% commission and would take over checkout, site and portal (Stripe, Vercel, Fusebase). Encharge
  is a replaceable email layer: records stay in Stripe, the Sheet and the vault; swapping Encharge out
  means changing `lib/encharge.mjs` and `sendEncharge()` in the Apps Script, nothing else.
  Account: lifetime AppSumo Tier 1 (Growth features, 5,000 contacts, webhooks, API).
- Report promised **within 7 days** of intake. **Free Power Calendar month is automatic** (next full
  month, no card). Upsell order: **monthly Calendar plans first** (97, then 197), Single Session last.
- Jeff reviews every report before release. Everything before and after that gate is automatic.
- Watcher on Olares runs **hourly** (Jeff, 2026-09-27).
- Consent: soft opt-in. The intake forms state that follow-up and occasional offer emails will be sent,
  each with one-click unsubscribe. No birth details go to Encharge, ever.

## The flow

```
Stripe checkout (Payment Link)
  -> /api/stripe-webhook, checkout.session.completed  [signed by Stripe = TRUSTED]
       -> Encharge: identify + tag outlook-2027-buyer (or monthly-subscriber, monthly-<plan>)
       -> Encharge event "Outlook Purchased" / "Subscription Started"       => Flow A
Client submits /2027-next (or /welcome)                  [public form = UNTRUSTED]
  -> Apps Script: Sheet row + email to Jeff (unchanged)
       -> Encharge: identify (firstName, edition, reportDue) + tag intake-received, annual-intake
       -> Encharge event "Intake Submitted"                                  => Flow B
Olares jeffseah-intake-watch (hourly) reads the Sheet
  -> new annual row: agent job in vault agents/inbox/ + Telegram to Jeff
  -> day 5 without "Delivered": Telegram reminder; day 7: OVERDUE Telegram
Agent run -> Jeff reviews -> Codex releases to Fusebase
  -> node scripts/report-delivered.mjs <email> <share url>
       -> Apps Script: row status "Delivered <time>" (watcher stops) + Encharge event "Report Delivered"
                                                                             => Flow C (upsells)
```

**Trust rule:** every Encharge flow filters on a buyer tag set only by the signed webhook. A forged form
post or a forged report-delivered post can at worst send a buyer the email they would get anyway.

## Parts and where they live

| Part | Location |
|---|---|
| Webhook, Encharge mapping | `api/stripe-webhook.mjs`, `lib/encharge.mjs`, `tests/encharge.test.mjs` |
| Apps Script (intake, report-delivered) | `docs/intake/Code.gs`, sandbox test `tests/intake-script.test.mjs` |
| Delivery trigger | `scripts/report-delivered.mjs` (no keys; posts to the Apps Script) |
| Olares watcher | `ops/olares/` -> `/home/olares/coach/jeffseah-intake-watch.py`, `/etc/systemd/system/jeffseah-intake-watch.{service,timer}`, state `/home/olares/coach/jeffseah-intake-state.json`, heartbeat `jeffseah-intake-watch` (2h) |
| Email copy | `docs/crm/emails.md` |
| Keys | Vercel env `ENCHARGE_WRITE_KEY`; Apps Script Script Property `ENCHARGE_WRITE_KEY`. Jeff pastes both. Never in code. |

Product detection uses the Checkout Session `success_url`: `/2027-next` is the Outlook,
`/welcome?plan=<97|197|297|497>` a monthly plan. Known Payment Link IDs are a fallback when Stripe
omits `success_url`; a new link must set the redirect and be added to `lib/encharge.mjs`.

## Encharge setup

- Tags: `outlook-2027-buyer`, `monthly-subscriber`, `monthly-97/197/297/497`, `intake-received`,
  `annual-intake`, `monthly-intake`, `report-delivered`.
- Custom fields: `edition` and `reportUrl` are text; `reportDue` is Date and Time in Encharge.
- Intended sender: Jeff Seah <coaching@jeffseah.rocks>. On 2026-09-29, the only Encharge account
  available in Jeff's login was `bigstorm.tech`. `jeffseah.rocks` was added and **verified** there.
  Cloudflare now has Encharge's six CNAMEs as DNS only and its verification TXT; all seven were read
  back against Encharge's values. Encharge confirmed each required record as Verified and the domain
  as successfully set up. The optional DMARC suggestion remains Pending. The intended sender
  `coaching@jeffseah.rocks` was then added and shows Verified. The previous `mmtmc.rocks` domain
  and `jeff@mmtmc.rocks` sender remain Pending.
- Company mailing address: a postal address is already set in Encharge's Your Account page. Confirm
  its suitability before activation; it appears in every footer.
- Flows A, B, C are drafted in `docs/crm/emails.md`. In Encharge, Flow A
  (`2027 Outlook - Payment to Intake`, ID `405798`) is **deactivated** with the `Outlook Purchased`
  trigger, `outlook-2027-buyer` gate and the first email saved and connected. Flow C
  (`2027 Outlook - After Delivery and Calendar Offer`, ID `405802`) is **deactivated** with the
  `Report Delivered` trigger, a connected `outlook-2027-buyer` yes-path, and C1 -> 3-day wait -> C2
  connected. C4 and C5 are saved as **disconnected** reply-tracked email drafts, so they cannot send
  even if the flow were activated. C3, C6, the remaining delays, and subscriber exit gates still need
  to be built and verified. Flow B is not in Encharge yet.

## Calendar promotion, 2026-09-29

- Jeff chose **reply to claim** for the first run. The Day 14 and Day 24 emails in `emails.md` ask
  the buyer to reply `CALENDAR` or `BRIEF`; they do not send buyers to a public full-price checkout
  link as though it were discounted.
- The Outlook's free sample month is a temporary private HTML page beside the report in the
  client's Fusebase report folder. It needs no card and is separate from the Power Calendar plan's
  card-based trial. Ongoing Google Calendar sharing begins only on a monthly plan.
- The Power Calendar offer preserves its 30-day free trial, then promises **three discounted paid
  months** at USD 48.50, followed by USD 97 monthly. The existing billing-anchor webhook moves
  the first charge to the first 15th on or after the trial expires, so the trial can be 30 to 60
  days. Calendar + Brief has no trial; its first three months are USD 98.50, then USD 197.
- **Fulfillment gate:** before activating either offer email, establish and verify a Stripe billing
  method that discounts exactly the first three *paid invoices* and then reverts to full price.
  A three-month repeating coupon applied at trial checkout is not proven suitable: Stripe measures
  that duration from application time, so the trial and billing-anchor extension can consume it.
  For each reply, confirm the plan, first charge date and subsequent invoice amounts with the buyer
  before sending a private checkout. Record the reply and manually suppress later offer emails for
  buyers who accepted until the subscriber exit gate is tested.
- Do not activate C3 until the report delivery page actually links to that buyer's private sample
  HTML page. Do not activate C4/C5 until the discount fulfillment and reply handling are ready.

## Switch-on checklist

Status 2026-09-29: steps 1 to 4 were previously reported done (Apps Script Version 3 "Intake v3: Encharge CRM", webhook
listening to 2 events). Tested live: intake to Encharge (tags, firstName, edition, reportDue; Encharge typed
`reportDue` as a date field), watcher job and Telegram, report-delivered (row marked, reportUrl set,
watcher stopped chasing), unknown-email refusal. Not yet proven live: webhook to Encharge (needs a real
checkout). Test contact jefferyseah@gmail.com kept in Encharge for flow tests (no buyer tag, so no flow
fires for it). Two incomplete flows are deactivated. The `jeffseah.rocks` domain and coaching sender
are verified, but no flow is active.
A real checkout has not yet proven the webhook-to-Encharge path.

1. Jeff: Encharge write key into Vercel env `ENCHARGE_WRITE_KEY` (Production), redeploy.
2. Jeff: same key into Apps Script, Project Settings, Script Properties, `ENCHARGE_WRITE_KEY`.
3. Paste `docs/intake/Code.gs` into the Apps Script, Deploy, Manage deployments, New version
   (keeps the URL). Authorise the new "connect to an external service" scope.
4. Stripe Workbench: add `checkout.session.completed` to the jeffseah.rocks webhook endpoint.
5. Sending domain and sender are verified; confirm the existing mailing address.
6. Finish the three flows, including delays, buyer and subscriber gates, and the reply offer steps.
7. Verify the private sample page and three paid invoice discount path before enabling C3 to C5.
8. Test with Jeff's own email: 88 purchase (refund after), intake, `report-delivered`, watch each
   flow step land. Then switch flows on after Jeff approves the final email copy.

## Not built yet (next)

- Monthly subscriber onboarding flow (events and tags already arrive).
- The three dated check-in emails and the one follow-up question promised on `/2027`.
- Cancellation/failed-payment events (`customer.subscription.deleted`, `invoice.payment_failed`).
- Adding the free-month client to the Sifu roster is a step in the agent job note, not automatic.
