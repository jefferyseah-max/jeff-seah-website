# jeff-seah-website: Project Instructions

## What this is
Jeff's static personal site, deployed on **Vercel**, live at **jeffseah.rocks**.
Repo: https://github.com/jefferyseah-max/jeff-seah-website (default branch `main`).
`main` is the live source of truth and auto-deploys to jeffseah.rocks on push (about 30 s).
**Never force-push `main`.** Do future work on a fresh branch off `main`; pushing a branch gives a
protected Vercel preview (use the Vercel MCP `get_access_to_vercel_url` for a share link).

Open website sessions with this folder as the working directory, not the coaching folder.

## Local vs cloud sessions
- **Local** (Claude Desktop, Code tab, environment chip shows Local, no cloud icon in the title bar):
  has Claude in Chrome, the olares-ssh MCP and local files. Needed for anything clicked in Stripe,
  Google Sheets edits, or Apps Script deployments.
- **Cloud** (cloud icon, environment chip "Default"): GitHub, Vercel, Drive (read), Gmail only. Fine
  for code changes and checking the Sheet, Gmail and deployments; cannot click in Stripe or edit Sheets.
If a task needs Stripe or Sheet edits and the session is cloud, say so at the start.

## How Jeff wants work done (Jeff, 2026-10-06)
Do not ask Jeff to do anything Claude can do itself. Work down this ladder and stop at the first rung that works:
1. **Claude does it directly** in this session (code, GitHub, Vercel, Gmail, Drive and any other connected tool).
2. **Claude in Chrome**, if this session has it (local sessions), for anything clicked in a browser: Stripe, Google Sheets,
   Apps Script, Ads Manager and other dashboards.
3. **A ready-to-paste Claude in Chrome prompt plus the exact link to open first**, when this session can't reach the browser
   (cloud sessions). Make the prompt self-contained: safety rules (for example test mode only, never delete without asking),
   numbered steps, exact values, and a pass/fail report at the end for Jeff to paste back.
4. **Manual steps for Jeff only as the last resort**, when none of the above can work (for example signing in, an OAuth
   Allow, a 2FA code, or a decision that is his to make). Keep them short and give direct links.

## Offers and payments (as of 2026-09-29)
- Monthly plans on Stripe Payment Links: 97 Calendar (30-day card trial), 197 Calendar + Brief,
  297 Calendar + Premium, 497 Coaching. Single Session USD 197 via `/book`, paid at booking on CalendarHero `/singlesession`.
- 2027 Annual Outlook: USD 88 until 31 Dec 2026, USD 138 from 1 Jan 2027. `/2027` holds both links in
  its own inline Alpine store (`Alpine.store('offer')` in `2027.html`), which switches link and copy at
  00:00 SGT 1 Jan; `2027.js` keeps the same constants for the other pages (the homepage has its own
  `Alpine.store('offer')` and flips at the same moment). The 88 link stays live in Stripe until Jeff deactivates it on 1 Jan (reminder set). Buyers get a sample Power Calendar month (next full month, no card) as a private HTML page beside the report,
  NOT a shared Google Calendar; Google Calendar delivery is for monthly subscribers only (Jeff, 2026-09-27).
  `/2027-next` no longer asks for a calendar Google account; it posts `calendarEmail: ''` so the Sheet columns stay put.
  `/2027` shows no report screenshots since the 2026-09-30 rebuild; Jeff decided 2026-09-27 not to publish a
  full sample report, so do not link one. The page makes no email promises (no check-in emails, no
  follow-up question; rulings D9 and D10) until Part 4 ships.
- Homepage leads with the Outlook plus the sample month (`#outlook`) until 00:00 SGT 1 Feb 2027, then
  switches itself to lead with the Power Calendar trial (`LEAD_FLIP_AT`, `Alpine.store('season')`). The old no-card free-month
  lead form is retired; its Apps Script and "Power Calendar Leads" Sheet are no longer used by the site.
- Billing on the 15th: `/api/stripe-webhook` (see `BILLING_ANCHOR_SETUP.md`), live. Vercel env
  `STRIPE_API_KEY` (restricted, Subscriptions write) and `STRIPE_WEBHOOK_SECRET`. Never type keys.
- Customer portal: https://billing.stripe.com/p/login/aFa28t3Uz6Oq6A2fCFbwk00 (linked from the pricing note).
- Stripe account acct_1ScW2gRmcvZfydHf. Webhooks live in Workbench (Developers bar, bottom left).
- After payment: the 4 monthly links redirect to
  `/welcome?plan=<97|197|297|497>&session_id={CHECKOUT_SESSION_ID}` (Coaching updated 2026-09-29).

## Intake (post-payment birth details)
`/2027-next` (Outlook buyers) and `/welcome?plan=<97|197|297|497>` (subscribers) POST to one Apps
Script web app bound to the Sheet "jeffseah.rocks Intake" (tabs `annual-2027`, `monthly-welcome`),
which emails Jeff per submission. Source and setup: `docs/intake/Code.gs`, `docs/intake/INTAKE_SETUP.md`.
Code changes: Manage deployments, New version (keeps the URL). Submissions take about 9 s.
Test rows were cleared 2026-09-26; both tabs hold headers only. `paid` is true when the URL carries a
Stripe `session_id` (or `paid=1`).
New-sale alerts (2026-09-27): every new monthly subscription (trials included) emails Jeff "New subscriber: ..."
via the webhook (`lib/signup-alert.mjs`) posting to the same Apps Script (Intake v2), logged to tab `stripe-signups`.
One-off payments (Outlook 88) email via Stripe's "Successful payment receipt" notification (switched on).
End-to-end test passed 2026-09-26 (97 trial signup, /welcome intake, Sheet row and email, first invoice
on the 15th, portal cancel, test row deleted).

## Key files
**Full map of every moving part (Stripe, webhook, Apps Script, Sheet, alerts, design hooks, CRM
integration points): `docs/SITE_ARCHITECTURE.md`. Read it before CRM or design work.**

| File | Purpose |
|------|---------|
| `index.html` | Homepage, rebuilt 2026-09-30 like `2027.html`: compiled Tailwind `css/home.css`, Alpine.js and GSAP from CDNs, JS inline. Luopan hero with a next-good-days teaser, Outlook card, a real day-by-day month map (day pillars from a 60-day cycle, month pillars from `#calData`; extend its dates before mid-2028), Bagua prism fed by the visitor's days, hourglass to Hexagram 49, pricing lead card plus ladder. CSS: `npx tailwindcss@3 -c scripts/tailwind/home.config.js -i scripts/tailwind/outlook-2027.input.css -o css/home.css --minify` |
| `2027.html` | Outlook sales page, self-contained: Tailwind (compiled to `css/outlook-2027.css`), Alpine.js and GSAP from CDNs, all JS inline. After changing its classes, rebuild the CSS: `npx tailwindcss@3 -c scripts/tailwind/outlook-2027.config.js -i scripts/tailwind/outlook-2027.input.css -o css/outlook-2027.css --minify` |
| `book.html` | Single Session sales page (USD 197, books and pays on CalendarHero `/singlesession`), self-contained like `2027.html`: Decision Dial teaser, Decision Window (six months from today, pillars generated from the solar-term dates in `#windowData`; extend those dates before mid-2028), session evenings in the visitor's time zone. CSS: `npx tailwindcss@3 -c scripts/tailwind/book.config.js -i scripts/tailwind/outlook-2027.input.css -o css/book.css --minify`. No visible email address on the page (Jeff, 2026-09-30) |
| `power-calendar.html` | Power Calendar sales page (USD 97, 30-day trial), rebuilt 2026-09-30 like `/book`: next-good-days teaser, the real month shown as calendar entries with an entry card and locked best hours (same day engine as the homepage `#month`; its own copy of `#calData`, extend both before mid-2028), one plan card, a line to `/#pricing`. CSS: `npx tailwindcss@3 -c scripts/tailwind/power-calendar.config.js -i scripts/tailwind/outlook-2027.input.css -o css/power-calendar.css --minify` |
| `2027-next.html`, `welcome.html` | The two intake pages |
| `2027.css` / `2027.js` | Shared CSS and JS for the two intake pages only. House style since 2026-09-30, hand-written, no build step. `[data-mail]` links build the contact address on click |
| `api/stripe-webhook.mjs`, `lib/billing-anchor.mjs`, `lib/signup-alert.mjs`, `tests/` | 15th-billing webhook and new-subscriber alert; `node --test tests/*.test.mjs` |
| `lib/encharge.mjs`, `scripts/report-delivered.mjs`, `ops/olares/` | CRM: Stripe and intake events to Encharge, delivery trigger, Olares intake watcher. Spec and switch-on: `docs/crm/ENCHARGE_CRM.md` |
| `js/measure.js` | Funnel measurement for `/2027` and `/2027-next`: Vercel Analytics, UTM memory, Checkout/Purchase events, Stripe `client_reference_id`, ChatGPT Ads pixel (`OPENAI_PIXEL_ID`, ad-click visitors only) |
| `.vercelignore` | Keeps `tests/`, `docs/`, `scripts/`, `ops/` and `*.md` off the public site |

## Pending
**Outstanding as of 2026-10-06 (who does it):**
- Delete the sandbox test row (`annual-2027` row 2, "TEST Buyer") in the Intake Sheet (Claude in Chrome).
- Phone check of `/2027` on mobile data: hero visible within a couple of seconds (plan step 5; Jeff, 2 min).
- Finish the sample Outlook's design and copy; it unblocks plan steps 3 and 4 and the ad creative (Jeff).
- First ChatGPT ads campaign: goal Order created, tagged ad URLs (Jeff, in Ads Manager).
- Lead capture after the Contact & Clash result (plan step 2): needs consent wording and the Encharge list (Claude builds).
- After a week of ads, if Ads Manager shows fewer sales than Stripe: server-side `order_created` from the webhook
  (needs an OpenAI Ads API key in Vercel).
- Encharge launch and the 1 Jan 2027 price step, below.

- 1 Jan 2027 (reminder set): Jeff deactivates the USD 88 Outlook link in Stripe (plink_1UJTagRmcvZfydHfw0B40mtH).
  "Price-step metadata" = in `2027.html`, JSON-LD `price` 88 to 138 and drop or move `priceValidUntil`
  (2026-12-31); `description`, `og:description`, `twitter:description` drop "USD 88 until 31 December 2026".
- **Encharge email launch still pending:** `docs/crm/ENCHARGE_CRM.md` opens with the current
  checkable launch blockers. The sending domain and `coaching@jeffseah.rocks` sender are verified;
  flows A/B/C are drafted but deactivated. C3 to C6 are disconnected. No real checkout has yet
  proved Stripe -> webhook -> Encharge -> intake/report delivery -> email. Keep the 30-day Calendar
  trial, then discount its first three *paid* invoices; use reply-to-claim private offers once the
  Stripe fulfillment method has been tested. Jeff still needs to approve copy and footer address.
- **`/2027` conversion plan (2026-10-06), parked until the sample Outlook's design and copy are final**
  (dashboard TODO 56). Jeff had Gemini review `/2027` for cold ad traffic. Verdict, Jeff agreed to park:
  do NOT adopt Gemini's rewrite (it critiqued an older draft; its fear and money framing, "timing
  investments", "protect your assets", contradicts the footer's not-financial-advice line and the calm
  tone that sells the monthly plans; its "capacity strictly capped" scarcity is untrue) and do NOT run a
  50/50 page split yet (about 7,700 visitors per page to read a 1% to 1.5% purchase lift, and the
  Dec 31 price step would skew it mid-test). Worth keeping from Gemini: one short "not a PDF you forget"
  section in Jeff's voice, and an About Jeff section built on proof, not a self-given title.
  Jeff's decisions: ads run on **ChatGPT ads, not Meta**; email capture goes to **Encharge, a new list**;
  social proof is still being collected. When revisited, in this order:
  1. Measurement before any spend: **built 2026-10-06** as `js/measure.js` (loaded by `/2027` and
     `/2027-next` only): Vercel Web Analytics (page views, UTM breakdown), UTM tags remembered 30 days,
     `Checkout` and `Purchase` events (one per Stripe `session_id`), Stripe links get
     `client_reference_id=<source>_<campaign>`, and the ChatGPT Ads pixel (`oaiq`), which stays off until
     `OPENAI_PIXEL_ID` is filled in and loads only for ad-click visitors (`oppref`). ChatGPT Ads (checked
     2026-10-06): self-serve Ads Manager live in Singapore and SEA since 2026-09-23; pixel plus server-side
     Conversions API (`bzr.openai.com/v1/events`), 30-day click window, aggregate reporting only. Web
     Analytics enabled and recording (2026-10-06; custom events need Pro, on Hobby `/2027-next` visitors =
     buyers). Pixel `WszgasoEPAiE21zUpcFH6N` set 2026-10-06; Ads Manager conversion events: Order created
     (primary), Checkout started. **End-to-end sandbox test passed 2026-10-06** (Stripe Sandbox link
     `buy.stripe.com/test_aFa28t3Uz6Oq6A2fCFbwk00`, product "2027 Outlook TEST"): redirect to `/2027-next`,
     intake row + "New intake" email, Stripe `client_reference_id=chatgpt_test`, Ads Manager `order_created`
     USD 88.00. The pixel's `__oppref` cookie carried from `/2027` to `/2027-next`, so the landing pixel ran
     even though the stream only listed the later events. The Sheet's `paid` cell is a real boolean (`clean()`
     keeps booleans); `workType` maps self-employed to `business-owner` on purpose (`annual-intake-form.mjs`).
     When creating the campaign: goal = Order created; ad URLs `utm_source=chatgpt&utm_medium=cpc&utm_campaign=...`.
     Later: send `order_created` server-side from the Stripe webhook (needs an OpenAI Ads API key).
  2. Lead capture after the Contact & Clash result (offer: the visitor's 2027 notes plus a reminder before
     the price goes to 138), with an explicit consent tickbox (non-buyers have no soft opt-in). Post via a
     new API route to Encharge with its own tag and segment (Encharge's "list"), for example
     `lead-2027-check`. Public form = untrusted, so it must never set a buyer tag (Trust rule in
     `docs/crm/ENCHARGE_CRM.md`); buying (`outlook-2027-buyer`) exits the lead sequence.
  3. Testimonials: section is wired but hidden and `data/annual-2027-testimonials.json` is empty. Fill
     from approved annual feedback (`docs/ANNUAL_TESTIMONIALS.md`); never use Jeffery (he is Jeff).
  4. Sample: unhide "Read Jeff's 2027 Outlook" once the sample is published (a 60 s screen recording of
     a report is the fallback).
  5. Phone check: the hero only appears after GSAP loads from a CDN (could not confirm on a real phone;
     overlaps dashboard TODO 36).
  6. Test angles at the ad level, one landing page. A/B the hero only at about 500 clicks a week,
     measured on click-to-checkout, not purchases.
  The monthly upsell stays post-purchase (Flow C and the sample Power Calendar month), not on `/2027`.

### Change log
- 2026-10-06: Sandbox end-to-end Outlook checkout test passed; Pending now opens with an outstanding list.
- 2026-10-06: Added "How Jeff wants work done" (Claude does it, then Claude in Chrome, then a Chrome prompt plus link, manual steps last).
- 2026-10-06: ChatGPT Ads pixel ID set in `js/measure.js`.
- 2026-10-06: `/2027` step 1 (measurement) built: `js/measure.js` on `/2027` and `/2027-next`.
- 2026-10-06: Added the parked `/2027` conversion plan to Pending (Gemini review verdict, ChatGPT ads,
  Encharge lead list).
- 2026-10-01: Homepage trial copy now matches `/power-calendar`: meta and og descriptions say "30-day free trial,
  card required"; the $97 card bullet is "30 days free, then USD 97 a month"; FAQ 1 says "Your 30-day free trial";
  FAQ 4 asks "What happens after my free month?". "Complimentary" stays only on `/2027` for the Outlook's sample month.
- 2026-10-01: Homepage kinetic pass, same system as `/2027`: scroll reveals on every section below the hero
  (`data-reveal`), teaser chip ripple (outline) and best days lighting in turn, month-map peak days flare after the
  scan then breathe (`.is-breathing`), `.btn-ember` lift/sheen/press/magnetic with scroll-in sheen on the two price
  buttons, looping sweeps on the hero eyebrow (`ebLoop`), Most Popular badge (`.badge-sheen`) and footer, 丁未 on the
  Outlook card breathes ember (`.brush-breathe`). Reduced motion skips all of it. No new Tailwind classes.
- 2026-10-01 (branch `claude/hopeful-faraday-l3jxme`): `/2027` kinetic pass. Below-the-fold blocks reveal on scroll
  (`data-reveal`, `data-reveal="stagger"` for children, `data-reveal-delay`); the Contact & Clash panel and its wheel
  cascade (gold clock hand, `cascadeWheel()`) now wait until on screen, so phones see them. Picking an animal sends a
  resonance pulse (`pulse()`); the locked month grid lights Feb to Jan 0.1 s apart; When-To month labels flare as the
  comet arrives; the Power Calendar bridge days fill in. `.btn-ember`: 3px lift with a warmer shadow, light sweep on
  hover and once on scroll-in for price buttons (`.is-charged`), press state, magnetic pull on fine pointers. All of it
  is skipped under reduced motion. No new Tailwind classes, so no CSS rebuild.
  Loops (Jeff, same day): hero eyebrow sweep every 10 s (`ebLoop`), footer seal and line every 9 s; wheel cascade
  slowed to 0.11 s per branch, then an idle clock sweep every ~8 s with a soft glow per branch, paused once an
  animal is picked or off screen (`idleSweep()`); Power Calendar days are quieter (`.pc-day`) and one lit day
  drifts to a neighbouring day every 2.6 s while on screen.
- 2026-10-01: Readability pass on `/`, `/2027`, `/book` (Jeff's audience is 35 to 55, mostly on phones): paragraphs 17px,
  fine print 15 to 16px, labels 12 to 13px, nothing under 12px, grey token `ash` now `#A8ADB6`, no dimmed grey text.
  Keep these floors when adding copy. Applied the same day to `/welcome`, `/2027-next` (shared `2027.css`) and `/power-calendar`.
  Also: `/2027` FAQ rewritten (Q3 now "How is my outlook prepared?"), "Dossier" label is "Summary", month stage has a
  "Tap or click any month" hint, tier renamed "Calendar + Coaching". Hero 丁未 warms gold to ember; footer seal and line get a
  one-time slow light sweep (`.foot-sweep`); `/2027` eyebrow gets a matching sweep. Compiled CSS must be rebuilt after class changes.
- 2026-09-30: `/power-calendar` rebuilt in the house style (ledger and rulings:
  `docs/design/POWER_CALENDAR_REBUILD_LEDGER.md`). The invented sample month is replaced by the real month
  as calendar entries; "30-day free trial, card required" replaces "First month complimentary"; one plan
  card plus a line to `/#pricing` replaces the four-tier ladder; no question invite (D9, D10).
- 2026-09-30: `/power-calendar`, `/welcome` and `/2027-next` restyled to the house style through
  `2027.css` (dead rules for the old `/2027` dropped), seal layers in the nav, disclaimer in the footers.
  No email address is printed on any page: the power-calendar "Ask Jeff a question" button and footer
  "Email Jeff" link are gone (D9, D10), and the intake fallbacks assemble the address in JS on click.
- 2026-09-30: Homepage rebuilt in the obsidian and gold house style (ledger and rulings:
  `docs/design/HOME_REBUILD_LEDGER.md`). Kept from the October refresh: Luopan hero, Bagua prism (own
  section), hourglass to Hexagram 49 (solid gold frame now); dropped: stem ring, invented March 2027
  sample, Bagua unfolding, stars, astrolabe, aurora. 丁未 on the Outlook card is Ma Shan Zheng brush script.
- 2026-09-30: `/book` rebuilt in the obsidian and gold house style (ledger and rulings:
  `docs/design/BOOK_REBUILD_LEDGER.md`). After-session promise is "Session summary within 48 hours";
  rescheduling is via the link in the CalendarHero confirmation; upsell is one line to `/#pricing`.
- 2026-09-30: `/2027` rebuilt (dark editorial): hero with the Contact & Clash wheel, the When-To Index
  (a month path generated from the 2027 month pillars per goal, tuned by the visitor's animal), order card,
  Power Calendar line, 5-question FAQ, mobile order bar. Transparent seal layers `img/seal-mark.png`,
  `seal-ring.png`, `seal-monogram.png` (from `JS_Ceremonial_Seal_Final.png`). Old page is in git history.
- 2026-09-29: October design refresh live (PR #6): Luopan hero, autoplaying Favorable Days / Bagua
  prism / 10-stem panels, Bagua unfolding in `#calendar`, hourglass that becomes Hexagram 49 in
  Philosophy, FAQ Wu Xing trace, lighter Luopan on `/2027`. All inline in `index.html` (hourglass
  grain counts are constants in `hourglass()`). Notes: `docs/design/DIRECTION.md`, `HANDOFF.md`.
- 2026-09-29: Replaced the stale Encharge setup steps with the current launch-gate pointer after
  domain verification and flow drafting; the pricing highlight moved to Calendar + Premium.

## Tooling (local sessions)
- GitHub: local pushes use this machine's git creds (`gh auth` as `jefferyseah-max`).
- olares-ssh MCP (`mcp__olares-ssh__exec`, host 192.168.1.3) reaches the shared vault
  at `/home/olares/vault/` and the Drive mount at `/home/olares/gdrive/`.
- Stripe and Google changes go through Jeff's Chrome (Claude in Chrome); Jeff signs in and clicks any OAuth Allow.
- Git Bash strips backslashes in inline `node -e` and heredoc edits (a CSS `"\2726"` became garbage); use the Edit tool.
- Page rebuilds (homepage, `/book`, any sales page): use the `tactile-page-rebuild` skill in
  `.claude/skills/` (the method behind the 2026-09-30 `/2027` rebuild). Works in cloud sessions.
- House style (Jeff, 2026-09-30): obsidian and gold with muted Wu Xing accents, in `docs/design/BRAND.md`.
  `/2027`, `/book` and the homepage use it.

## Style
- No em dashes in any output.
- Verify your own work (read the Sheet / Gmail / live site) rather than assuming success.
