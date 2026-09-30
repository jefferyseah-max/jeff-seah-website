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

## Offers and payments (as of 2026-09-29)
- Monthly plans on Stripe Payment Links: 97 Calendar (30-day card trial), 197 Calendar + Brief,
  297 Calendar + Premium, 497 Coaching. Single Session USD 197 via `/book`, paid at booking on CalendarHero `/singlesession`.
- 2027 Annual Outlook: USD 88 until 31 Dec 2026, USD 138 from 1 Jan 2027. `/2027` holds both links in
  its own inline Alpine store (`Alpine.store('offer')` in `2027.html`), which switches link and copy at
  00:00 SGT 1 Jan; `2027.js` keeps the same constants for the other pages (homepage flips its own two lines
  at the same moment). The 88 link stays live in Stripe until Jeff deactivates it on 1 Jan (reminder set). Buyers get a sample Power Calendar month (next full month, no card) as a private HTML page beside the report,
  NOT a shared Google Calendar; Google Calendar delivery is for monthly subscribers only (Jeff, 2026-09-27).
  `/2027-next` no longer asks for a calendar Google account; it posts `calendarEmail: ''` so the Sheet columns stay put.
  `/2027` shows no report screenshots since the 2026-09-30 rebuild; Jeff decided 2026-09-27 not to publish a
  full sample report, so do not link one. The page makes no email promises (no check-in emails, no
  follow-up question; rulings D9 and D10) until Part 4 ships.
- Homepage `#calendar` section sells the Outlook plus the sample month. The old no-card free-month
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
| `index.html` | Homepage; CSS and JS inline |
| `2027.html` | Outlook sales page, self-contained: Tailwind (compiled to `css/outlook-2027.css`), Alpine.js and GSAP from CDNs, all JS inline. After changing its classes, rebuild the CSS: `npx tailwindcss@3 -c scripts/tailwind/outlook-2027.config.js -i scripts/tailwind/outlook-2027.input.css -o css/outlook-2027.css --minify` |
| `book.html` | Single Session sales page (USD 197, books and pays on CalendarHero `/singlesession`), self-contained like `2027.html`: Decision Dial teaser, Decision Window (six months from today, pillars generated from the solar-term dates in `#windowData`; extend those dates before mid-2028), session evenings in the visitor's time zone. CSS: `npx tailwindcss@3 -c scripts/tailwind/book.config.js -i scripts/tailwind/outlook-2027.input.css -o css/book.css --minify`. No visible email address on the page (Jeff, 2026-09-30) |
| `2027-next.html`, `welcome.html`, `power-calendar.html` | The two intake pages, Power Calendar sample page |
| `2027.css` / `2027.js` | Shared CSS and JS for the three pages above (no longer used by `2027.html`) |
| `api/stripe-webhook.mjs`, `lib/billing-anchor.mjs`, `lib/signup-alert.mjs`, `tests/` | 15th-billing webhook and new-subscriber alert; `node --test tests/*.test.mjs` |
| `lib/encharge.mjs`, `scripts/report-delivered.mjs`, `ops/olares/` | CRM: Stripe and intake events to Encharge, delivery trigger, Olares intake watcher. Spec and switch-on: `docs/crm/ENCHARGE_CRM.md` |
| `.vercelignore` | Keeps `tests/`, `docs/`, `scripts/`, `ops/` and `*.md` off the public site |

## Pending
- 1 Jan 2027 (reminder set): Jeff deactivates the USD 88 Outlook link in Stripe (plink_1UJTagRmcvZfydHfw0B40mtH).
  "Price-step metadata" = in `2027.html`, JSON-LD `price` 88 to 138 and drop or move `priceValidUntil`
  (2026-12-31); `description`, `og:description`, `twitter:description` drop "USD 88 until 31 December 2026".
- **Encharge email launch still pending:** `docs/crm/ENCHARGE_CRM.md` opens with the current
  checkable launch blockers. The sending domain and `coaching@jeffseah.rocks` sender are verified;
  flows A/B/C are drafted but deactivated. C3 to C6 are disconnected. No real checkout has yet
  proved Stripe -> webhook -> Encharge -> intake/report delivery -> email. Keep the 30-day Calendar
  trial, then discount its first three *paid* invoices; use reply-to-claim private offers once the
  Stripe fulfillment method has been tested. Jeff still needs to approve copy and footer address.

### Change log
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
  `/2027` and `/book` use it; the homepage adopts it in its rebuild.

## Style
- No em dashes in any output.
- Verify your own work (read the Sheet / Gmail / live site) rather than assuming success.
