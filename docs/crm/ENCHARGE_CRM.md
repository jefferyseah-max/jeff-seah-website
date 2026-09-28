# CRM: Encharge client flows for jeffseah.rocks

Spec and runbook. Written 2026-09-27 (Claude, with Jeff). Start with the 2027 Annual Outlook; the
monthly plans reuse the same plumbing later.

## Launch status and blockers (2026-09-29)

The pricing page and its Stripe links are live. The Encharge sending domain and sender are verified,
but **all three email flows remain deactivated**. The Outlook email sequence and 50% Calendar offer
must not be presented as live until these items are checked off:

- [ ] Create and verify each buyer's private HTML sample Power Calendar page, with its link beside
  the report in that buyer's Fusebase folder. Check the actual C3 link path from a released report.
- [ ] Set up and test a private Stripe offer for each reply that keeps Calendar's 30-day trial, discounts
  its **first three paid invoices** to USD 48.50, then charges USD 97. For Calendar + Brief, charge
  USD 98.50 for three paid invoices, then USD 197. Confirm invoice dates and totals after the
  billing-anchor move to the 15th. Do not assume a three-month repeating coupon achieves this.
- [ ] Finish Flow C's C3/C4/C5/C6 connections and Day 7/14/24/40 timing, with `monthly-subscriber`
  exit checks. Verify that replies to `coaching@jeffseah.rocks` arrive for Jeff, that reply tracking
  works, and that accepted buyers stop receiving offer reminders.
- [ ] Jeff approves the final copy in `docs/crm/emails.md` and confirms the postal address shown in
  Encharge's unsubscribe footer. Check the Stripe public support email and receipts use a working
  `jeffseah.rocks` mailbox.
- [ ] Run a controlled checkout with Jeff's own email through Stripe, the Vercel webhook, Encharge
  buyer tag/event, intake, report release, and each connected email step. Verify rendered merge fields,
  links, trial and discounted invoices, reply handling, and suppression before activating flows.

**Offer handling until these gates pass:** Day 14/24 drafts say reply `CALENDAR` or `BRIEF`; Jeff will
arrange a private discount. There is no public discounted checkout link. C3 to C6 are disconnected
and A/B/C are deactivated. A new agent should start with this checklist, then use the detail below.

### Change log

- 2026-09-29: Added explicit launch blockers and preserved the reply-to-claim decision so the staged
  flows cannot be mistaken for a live email sequence.

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
- Flows A, B, C are drafted in `docs/crm/emails.md`. All three Encharge flows are **deactivated**.
  Flow A (`2027 Outlook - Payment to Intake`, ID `405798`) connects `Outlook Purchased` ->
  `outlook-2027-buyer` Yes -> A1 -> 48-hour wait on A1 delivery -> `intake-received` No -> A2.
  The buyer-to-A1 link was missing on initial inspection and was added on 2026-09-29.
- Flow B (`2027 Outlook - Intake to Delivery`, ID `405806`) connects `Intake Submitted` ->
  `outlook-2027-buyer` Yes -> `annual-intake` Yes -> B1 -> 3-day wait on B1 delivery ->
  `report-delivered` No -> B2 -> 3-day wait on B2 delivery -> `report-delivered` No -> B3.
  The delivered-tag checks prevent the later pre-delivery emails after release. Sender, subject,
  body, and footer were saved and read back for the new drafts.
- Flow C (`2027 Outlook - After Delivery and Calendar Offer`, ID `405802`) connects
  `Report Delivered` -> `outlook-2027-buyer` Yes -> C1 -> 3-day wait on C1 delivery -> C2.
  C3, C4, C5, and C6 are saved as **disconnected** email drafts, so they cannot send even if the flow
  were activated. C4 and C5 ask buyers to reply and have reply tracking enabled. Later delays
  and subscriber exit gates are not built yet. Do not activate Flow C until those gates and the
  buyer-facing content are verified.

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

Status 2026-09-29: Vercel shows `ENCHARGE_WRITE_KEY`, `STRIPE_API_KEY`, and
`STRIPE_WEBHOOK_SECRET` as Production variables. Stripe Workbench shows an active endpoint at
`https://www.jeffseah.rocks/api/stripe-webhook` listening to `checkout.session.completed` and
`customer.subscription.created`. Its current-week overview showed two deliveries and zero failures;
that does not prove a real buyer checkout. Apps Script Version 3 "Intake v3: Encharge CRM" was
previously deployed. Tested live: intake to Encharge (tags, firstName, edition, reportDue; Encharge typed
`reportDue` as a date field), watcher job and Telegram, report-delivered (row marked, reportUrl set,
watcher stopped chasing), unknown-email refusal. Not yet proven live: webhook to Encharge (needs a real
checkout). Test contact jefferyseah@gmail.com kept in Encharge for flow tests (no buyer tag, so no flow
fires for it). Three flows are deactivated. The `jeffseah.rocks` domain and coaching sender are
verified, but no flow is active. No test email or buyer email was sent during this review.
A real checkout has not yet proven the webhook-to-Encharge path.

1. Vercel Production `ENCHARGE_WRITE_KEY` is present, and the site was redeployed on 2026-09-29.
2. Apps Script `ENCHARGE_WRITE_KEY` was previously exercised by the live intake and delivery tests;
   the secret value was not opened during this review.
3. Apps Script Version 3 was previously deployed and exercised; keep its URL when updating it.
4. Stripe Workbench endpoint and both required event subscriptions were verified on 2026-09-29.
5. Sending domain and sender are verified; confirm the existing mailing address.
6. Flows A and B are staged; finish Flow C delays and subscriber gates. Read back the
   rendered merge fields and links with a controlled test before activation.
7. Verify the private sample page and three paid invoice discount path before enabling C3 to C5.
8. Test with Jeff's own email: 88 purchase (refund after), intake, `report-delivered`, watch each
   flow step land. Then switch flows on after Jeff approves the final email copy.

## Not built yet (next)

- Monthly subscriber onboarding flow (events and tags already arrive).
- The three dated check-in emails and the one follow-up question promised on `/2027`.
- Cancellation/failed-payment events (`customer.subscription.deleted`, `invoice.payment_failed`).
- Adding the free-month client to the Sifu roster is a step in the agent job note, not automatic.
