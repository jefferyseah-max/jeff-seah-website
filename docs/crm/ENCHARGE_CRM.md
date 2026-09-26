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
`/welcome?plan=<97|197|297|397>` a monthly plan. A new Payment Link must keep that redirect or it is ignored.

## Encharge setup

- Tags: `outlook-2027-buyer`, `monthly-subscriber`, `monthly-97/197/297/397`, `intake-received`,
  `annual-intake`, `monthly-intake`, `report-delivered`.
- Custom fields (text): `edition`, `reportDue`, `reportUrl`.
- Sender: Jeff Seah <coaching@jeffseah.rocks>; domain jeffseah.rocks verified (DNS on Cloudflare).
- Company mailing address: must be a real postal address (it appears in every footer); change it any
  time in Settings, Your Account.
- Flows A, B, C as in `docs/crm/emails.md`. Built switched **off**; Jeff approves copy, then on.

## Switch-on checklist

Status 2026-09-27 04:15 SGT: steps 1 to 4 done (Apps Script Version 3 "Intake v3: Encharge CRM", webhook
listening to 2 events). Tested live: intake to Encharge (tags, firstName, edition, reportDue; Encharge typed
`reportDue` as a date field), watcher job and Telegram, report-delivered (row marked, reportUrl set,
watcher stopped chasing), unknown-email refusal. Not yet proven live: webhook to Encharge (needs a real
checkout). Test contact jefferyseah@gmail.com kept in Encharge for flow tests (no buyer tag, so no flow
fires for it). Steps 5 and 6 pending Jeff's copy approval.

1. Jeff: Encharge write key into Vercel env `ENCHARGE_WRITE_KEY` (Production), redeploy.
2. Jeff: same key into Apps Script, Project Settings, Script Properties, `ENCHARGE_WRITE_KEY`.
3. Paste `docs/intake/Code.gs` into the Apps Script, Deploy, Manage deployments, New version
   (keeps the URL). Authorise the new "connect to an external service" scope.
4. Stripe Workbench: add `checkout.session.completed` to the jeffseah.rocks webhook endpoint.
5. Verify the sending domain; set the mailing address.
6. Test with Jeff's own email: 88 purchase (refund after), intake, `report-delivered`, watch each
   flow step land. Then switch flows on.

## Not built yet (next)

- Monthly subscriber onboarding flow (events and tags already arrive).
- The three dated check-in emails and the one follow-up question promised on `/2027`.
- Cancellation/failed-payment events (`customer.subscription.deleted`, `invoice.payment_failed`).
- Adding the free-month client to the Sifu roster is a step in the agent job note, not automatic.
