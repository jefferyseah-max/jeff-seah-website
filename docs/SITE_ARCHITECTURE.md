# jeffseah.rocks: how the site, payments, intake and alerts are wired

Written 2026-09-27 as a cold-start briefing for the next agent. Jeff's next two projects are **adding a
CRM** and **aesthetic enhancements to the web pages**; sections 9 and 10 are written for those. Every
ID, URL and behaviour below was checked live on 2026-09-26/27 unless marked otherwise.

`CLAUDE.md` in the repo root is the short operating card (rules, pending items). This file is the map.
`docs/` is excluded from the public site by `.vercelignore`.

---

## 1. The whole system on one page

```
                         jeffseah.rocks  (static HTML on Vercel, auto-deploys from GitHub main)
                                  |
     +----------------------------+-----------------------------+-------------------------+
     |                            |                             |                         |
  /  (index.html)          /2027 (2027.html)            /power-calendar            /book (book.html)
  pricing: 4 monthly       2027 Annual Outlook          sample month + plans       Single Session USD 197
  Stripe links             Stripe link (88, 138)                                   -> CalendarHero (not Stripe)
     |                            |
     v                            v
  Stripe Payment Link  ------------------------------  Stripe Payment Link
  (subscription)                                       (one-off)
     |  redirect after payment                            | redirect after payment
     v                                                    v
  /welcome?plan=<n>&session_id=cs_...          /2027-next?paid=1&session_id=cs_...
  birth-details form                           birth-details form (+ work type, decisions, edition)
     |                                                    |
     +-------------------- POST (JSON) -------------------+
                                  v
            Google Apps Script web app "jeffseah.rocks Intake" (Intake v2)
                 |                                  |
     appends a row to the Sheet               MailApp email to jefferyseah@gmail.com
     "jeffseah.rocks Intake"                  "New intake: <product> - <name>"

  In parallel, for every NEW SUBSCRIPTION:
  Stripe --(webhook customer.subscription.created)--> /api/stripe-webhook (Vercel function)
      1. moves the subscription's billing day to the 15th (Stripe API)
      2. POSTs {type:'stripe-subscription'} to the same Apps Script
             -> row in tab "stripe-signups" + email "New subscriber: <plan> (<status>)"

  And for every SUCCESSFUL CHARGE: Stripe's own "Successful payment receipt" email to Jeff (switched on).
  Customers manage/cancel plans in the Stripe customer portal.
```

Nothing is fulfilled automatically. The emails and Sheet rows tell Jeff that someone paid and what
their birth details are; Jeff (and his agent pipeline, outside this repo) produces the calendar/report.

---

## 2. Hosting, repo and deploy

| Thing | Value |
|---|---|
| Live site | https://www.jeffseah.rocks (apex redirects to www) |
| Host | Vercel, project `jeff-seah-website`. `vercel.json` only sets `"cleanUrls": true` (so `/2027` serves `2027.html`). |
| Repo | https://github.com/jefferyseah-max/jeff-seah-website, default branch `main` |
| Local checkout | `C:\Users\jeffe\Desktop\AgentDesk\jeff-seah-website` |
| Deploy | Push to `main` auto-deploys in about 30 s. Pushing any other branch gives a protected Vercel preview. Never force-push `main`. |
| Build step | None. Plain HTML/CSS/JS plus one serverless function (`api/stripe-webhook.mjs`). No package.json, no bundler. |
| Kept off the public site | `.vercelignore`: `tests/`, `docs/`, `*.md` (so `/CLAUDE.md` returns 404; verified) |
| Tests | `node --test tests/*.test.mjs` (14 tests, all pass as of 2026-09-27) |
| Analytics | None installed (no GA, Clarity, Plausible, Vercel Analytics). |
| robots.txt | Allows all, disallows `/2027-next` and `/welcome` (post-payment pages). Sitemap lists `/`, `/2027`, `/power-calendar`, `/book`. |

### Files

| File | Role |
|---|---|
| `index.html` (~2100 lines) | Homepage. **All CSS and JS inline.** Sections: nav, hero (with a `/2027` banner), `#calendar` (2027 Outlook + free Power Calendar month offer), `#value`, `#features`, manifesto, `#process`, `#pricing` (4 monthly plans + Single Session), `#faq`, footer. |
| `2027.html` | 2027 Annual Outlook sales page. Sections: hero, compare, `#inside` (9 teaser screenshot tiles), editions, `#how`, who, `#order`, after, `#faq`, closing. Has JSON-LD Product schema. |
| `2027-next.html` | Post-payment intake for Outlook buyers. `noindex`. |
| `welcome.html` | Post-payment intake for monthly subscribers. `noindex`. |
| `power-calendar.html` | Power Calendar explainer with a sample month and plan CTA (links to the 97 trial). |
| `book.html` | Single Session page. **Own inline `<style>`**, does not use `2027.css`. Books via CalendarHero. |
| `2027.css` | Shared stylesheet for `2027.html`, `2027-next.html`, `welcome.html`, `power-calendar.html`. |
| `2027.js` | Shared JS for those four pages: nav scroll state, mobile menu, FAQ accordion, scroll reveal, the 1 Jan 2027 price step, and Stripe link injection into `[data-stripe]` buttons. |
| `api/stripe-webhook.mjs` | Vercel function: Stripe webhook entry point. |
| `lib/billing-anchor.mjs` | Signature check + "move to the 15th" logic. |
| `lib/signup-alert.mjs` | Posts the new-subscriber alert to the Apps Script. |
| `docs/intake/Code.gs` | **Source of truth** for the Apps Script. The live script must be kept identical (see section 5). |
| `docs/intake/INTAKE_SETUP.md` | How the Apps Script was deployed and how to redeploy. |
| `BILLING_ANCHOR_SETUP.md` | How the 15th-billing webhook was switched on. |
| `img/2027/` | Hero art, OG image, 9 teaser tiles, editions shot (WebP). `img/seal-*.png` favicon/seal. |
| `script.js`, `styles.css`, `FORM_SECURITY_SETUP.md`, `GOOGLE_SHEETS_SETUP.md`, `QUICK_REFERENCE.md`, `SETUP_GUIDE.md` | **Dormant**, from the retired homepage lead form. Not referenced by current pages. Safe to delete in a cleanup, but check with Jeff first. |

---

## 3. Offers and Stripe

Stripe account `acct_1ScW2gRmcvZfydHf` (live mode), display name "Jeffseah.rocks". All checkout is via
**Stripe Payment Links** (no Checkout Sessions created by code, no Stripe.js on the site).

### Monthly plans (subscriptions, all USD, renew monthly until cancelled)

| Plan | Price | Product ID | Payment Link | Linked from |
|---|---|---|---|---|
| Power Calendar | 97/mo, **30-day free trial, card required** | `prod_VK8L1DKjxPpeGD` | https://buy.stripe.com/8x2cN72QvegSf6y1LPbwk05 | `index.html` `#pricing`, `power-calendar.html` (3 places) |
| Power Calendar + Brief Monthly Report | 197/mo | `prod_VK8NH11wU878bY` | https://buy.stripe.com/bJebJ30Inc8K4rU3TXbwk06 | `index.html` |
| Power Calendar + Premium Monthly Report | 297/mo | `prod_VK8fDT2mDGFFBt` | https://buy.stripe.com/4gMfZjcr51u6cYqduxbwk07 | `index.html` |
| Power Calendar + Premium Report + Coaching | 397/mo | `prod_VK8hEVXNT5TUxy` | https://buy.stripe.com/eVq8wR0In4Gie2u2PTbwk08 | `index.html` (primary button) |

All four links redirect after payment to
`https://www.jeffseah.rocks/welcome?plan=<97|197|297|397>&session_id={CHECKOUT_SESSION_ID}`.

### 2027 Annual Outlook (one-off)

| | Value |
|---|---|
| Product | `prod_VK7plsNL2g2ln3` "2027 Annual Outlook" (tax code Digital Books, txcd_10302000) |
| USD 88 (until 31 Dec 2026) | Price `price_1UJTZrRmcvZfydHfO2MZOBoR`, link `plink_1UJTagRmcvZfydHfw0B40mtH` = https://buy.stripe.com/3cI6oJ8aPegSgaC769bwk04 |
| USD 138 (from 1 Jan 2027) | Link `plink_1UJz1aRmcvZfydHf7Tyqf5c0` = https://buy.stripe.com/00w6oJ2Qv8Wy6A2eyBbwk09 (created 2026-09-27) |
| Both links | Redirect to `https://www.jeffseah.rocks/2027-next?paid=1&session_id={CHECKOUT_SESSION_ID}`. No name/address/phone collection, no promo codes, automatic tax off. |
| Bonus | Buyers get one free Power Calendar month (the next full month, no card). This is a promise in copy, fulfilled manually; there is no Stripe object for it. |

**The 1 Jan 2027 price step** (`2027.js`, constant `PRICE_STEP_AT` = 2027-01-01 00:00 SGT):
- `2027.js` swaps the `[data-price]` number, the `[data-price-copy]` sentences, the price-step highlight,
  and chooses the 138 link instead of the 88 link for every `[data-stripe]` button.
- `index.html` has its own inline snippet at the top of its `<script>` that swaps the two
  `[data-price-home]` lines (hero banner and offer bullet) at the same moment.
- **Not automatic (reminder set for 1 Jan 09:00 SGT, Calendar + Telegram):** Jeff deactivates the 88
  link in Stripe; an agent updates `2027.html` JSON-LD `price` 88 to 138 and drops/moves
  `priceValidUntil` (2026-12-31), and removes "USD 88 until 31 December 2026" from the `description`,
  `og:description` and `twitter:description` meta tags.

### Other Stripe products (legacy, deactivated links)

Old Feb 2026 products "Essential 150", "Combo 297", "Premium 397", "Single 250": links deactivated.
"2026 Trilogy Codex" SGD 147 product also exists. None are linked from the site.

### Single Session (USD 197)

`/book` sends people to CalendarHero
(`https://meeting.calendarhero.com/meeting/new/5f76b7f56d08b80020fec8d3/lifecoaching`); the page says
payment is collected at booking. **Stripe is not involved, no intake form, no Sheet row, no alert from
this site.** How CalendarHero collects payment was not reviewed.

### Customer portal

https://billing.stripe.com/p/login/aFa28t3Uz6Oq6A2fCFbwk00 (email magic-link login). Linked from the
`index.html` pricing note, `power-calendar.html` and the `/welcome` success message. Cancelling there
sets "cancel at period end", so a trial cancelled before the 15th is never charged.

---

## 4. Billing on the 15th (webhook)

Stripe Payment Links cannot set a billing day, so `/api/stripe-webhook` fixes each new subscription.

- **Stripe side:** one webhook endpoint `https://www.jeffseah.rocks/api/stripe-webhook`, event
  `customer.subscription.created` only. Managed in Stripe Workbench (Developers bar, bottom left).
- **Vercel env (Production):** `STRIPE_API_KEY` (restricted key `rk_live_...`, Subscriptions: Write only)
  and `STRIPE_WEBHOOK_SECRET` (`whsec_...`). Jeff pastes secrets; agents never type them.
- **Logic (`lib/billing-anchor.mjs`):** verifies the Stripe signature (HMAC-SHA256, 5-minute tolerance);
  ignores other events; skips subscriptions already carrying `metadata.billing_anchor` or not
  `active`/`trialing`; otherwise sets `trial_end` to the target 15th at 09:00 SGT with
  `proration_behavior=none` and stamps `metadata.billing_anchor=YYYY-MM-DD`. Idempotency key
  `billing-anchor-<sub id>`.
  - Paid plans: charged at signup, next charge on the 15th of the following month.
  - 97 trial: first charge on the first 15th on or after the 30-day trial ends (so trials run 30 to 60
    days; a 26 Sep signup was verified as trialing to 15 Nov, first invoice US$97 on 15 Nov).
- **Then** it calls the signup alert (section 6).
- **Failure policy:** any error returns HTTP 500, so Stripe retries for up to 3 days and emails the
  account owner. Retries are safe (same idempotency key). Logs: Vercel project logs, filter
  `stripe-webhook`. Manual fix for a missed subscription: Stripe, Update subscription, trial end = the
  right 15th, no proration.

---

## 5. Intake: forms, Apps Script and the Sheet

### The two forms

Both are plain HTML forms with inline JS that POSTs JSON with `fetch(..., {mode: 'no-cors'})` to the
Apps Script URL (constant `INTAKE_ENDPOINT` inside each page). Because of `no-cors` the page **cannot
read the response**: it shows "Received, thank you" whenever the network call does not throw. Server-side
failures are therefore surfaced by the script's own error email, not by the page.

| | `/welcome` | `/2027-next` |
|---|---|---|
| `product` sent | `monthly-welcome` | `2027-annual-outlook` |
| Fields | name, email, calendarEmail (optional Google account for calendar sharing), birthDate, birthTime or "Unknown" + birthTimeUnknown, birthCity, gender (female/male), consent | same, plus `workType` (employed / business-owner / both), `decisions` (free text), `edition` (simplified / advanced) |
| From URL | `plan` (97/197/297/397; drives the greeting "Welcome to your <plan> plan"), `session_id` | `session_id`, `paid=1` |
| `paid` | true if `paid=1` **or** `session_id` starts with `cs_` | same |
| Spam guards | honeypot input `company_website` (sent as `website`), and `elapsedMs` (form open under 3 s is ignored) | same |

Neither page verifies the Stripe session with Stripe; anyone can open `/welcome` and submit. `paid` and
`stripeSessionId` are hints for Jeff, not proof. Cross-check against the `stripe-signups` tab or Stripe.

### The Apps Script web app

| | Value |
|---|---|
| Project | "jeffseah.rocks Intake", bound to the Sheet below. Script ID `1kTAeB7imLYo8xsv5_98ztlu76wMejSRul_W__y7JmlVH2ab_eQMI_UIt` |
| Web app URL | `https://script.google.com/macros/s/AKfycbwwvJbirKRXE8OzoUjgVZobM8X5XqMeUY0pjlEaIQ3E_qot_FaSt3vgm30MVUxllAUT/exec` (used by both forms and by `lib/signup-alert.mjs`) |
| Deployment | "Intake v2: Stripe signup alerts", **Version 2**, 2026-09-27. Execute as Me (jefferyseah@gmail.com), access Anyone. |
| Source | `docs/intake/Code.gs`. Live code was byte-compared with the repo before the v2 deploy; keep them identical. |
| Redeploy after a code change | Paste code, save, then Deploy, **Manage deployments**, edit (pencil), Version: **New version**, Deploy. That keeps the URL. A "New deployment" creates a new URL and breaks the site and webhook. |
| Speed | Form submissions about 9 s end to end; alert posts about 4 s. |

`doPost` routing:
1. `data.type === 'stripe-subscription'` goes to `stripeAlert()` (no honeypot/timing checks; requires
   `subscription` to match `^sub_\w+$` and `customer` to match `^cus_\w+$`, else `{"result":"error","error":"bad ids"}`).
2. Otherwise a form submission: honeypot and timing checks (silently `ignored`), `product` must be known,
   email must look valid; then a row is appended under a script lock and Jeff is emailed.
3. Any exception emails Jeff "jeffseah.rocks intake ERROR" with the stack, and returns `{"result":"error"}`.

All string values pass through `clean()`: trimmed, capped at 2000 chars, and prefixed with `'` if they
start with `= + - @` (spreadsheet formula injection guard). Tabs are auto-created with a header row on
first use.

### The Sheet: "jeffseah.rocks Intake"

ID `1fdbOETsz_hCbBHTOQcHHl0sBxvVuPZ1wM-Bbond2n4c`, owned by jefferyseah@gmail.com.
As of 2026-09-27 every tab holds headers only (all test rows deleted).

| Tab | Columns (in order) |
|---|---|
| `Sheet1` | Empty default tab, unused. |
| `annual-2027` | receivedAt, submittedAt, name, email, calendarEmail, birthDate, birthTime, birthTimeUnknown, birthCity, gender, workType, decisions, edition, paid, stripeSessionId, status |
| `monthly-welcome` | receivedAt, submittedAt, name, email, calendarEmail, birthDate, birthTime, birthTimeUnknown, birthCity, gender, plan, paid, stripeSessionId, status |
| `stripe-signups` | receivedAt, subscription, customer, plan, status, firstCharge, intakeReceived |

`status` is written as `New`; `intakeReceived` is written as `check`. Both are for Jeff to update by hand;
nothing reads them back. There is **no automatic join** between `stripe-signups` and `monthly-welcome`
(the subscription row has Stripe ids, the intake row has the Checkout Session id and email).

The old "Power Calendar Leads" Sheet and its Apps Script belong to the retired free-month lead form and
are no longer used by the site.

---

## 6. Notifications Jeff receives (all to jefferyseah@gmail.com)

| Trigger | Email | Source | Verified |
|---|---|---|---|
| Someone submits `/welcome` | "New intake: Monthly plan welcome - <name>" (all fields + Sheet tab) | Apps Script `notify()` | Yes, 2026-09-26 real signup |
| Someone submits `/2027-next` | "New intake: 2027 Annual Outlook - <name>" | Apps Script `notify()` | Yes, 2026-09-25 |
| New monthly subscription, trials included | "New subscriber: <plan> (<status>)", with subscription, customer, first charge date, Stripe customer link, and a prompt to chase `/welcome` if no intake follows | Webhook, `lib/signup-alert.mjs`, Apps Script `stripeAlert()` | Alert path verified with a direct test post; first live-Stripe trigger still to be seen |
| Any successful charge (Outlook purchase, first charge on 197/297/397, renewals) | Stripe "Successful payment receipt" | Stripe notification setting (Settings, Communication preferences, Transactions and Balances), switched on 2026-09-27 | Setting confirmed saved; no charge since |
| Apps Script throws | "jeffseah.rocks intake ERROR" | Apps Script catch block | Code path only |
| Webhook keeps failing | Stripe's endpoint-failure email | Stripe retry policy | Not triggered |

Gap by design: the 97 trial charges USD 0 at signup, so Stripe sends no receipt; the "New subscriber"
alert covers it.

---

## 7. Adjacent systems (outside this repo, needed for the CRM picture)

- **reports.jeffseah.rocks**: Cloudflare Pages project `jeffseah-reports`, serving
  `C:\Users\jeffe\annual-outlook-pages` (built client reports under `r/<slug>/`, unguessable paths,
  `noindex`; the root and unknown paths serve a "Nothing to see here" fallback). Reports are embedded
  in the client portal. Deploy notes: vault `agents/inbox/2026-09-23-report-host-moved-to-cloudflare.md`.
  Jeff decided on 2026-09-27 **not** to publish a public sample report; `/2027` uses teaser tiles only.
- **Client portal**: Fusebase at my.jeffseah.rocks (client report pages, sessions folders).
- **Client birth data**: the Wealth Codex MCP vault on Olares (encrypted, sensitive; ask before writing).
- **Per-client context**: Obsidian vault on Olares, `wiki/people/<Name>.md` (single source of truth for agents).
- **Power Calendar delivery**: Google Calendar, shared to the client's `calendarEmail` (or `email`).
- **Mailboxes**: notifications go to jefferyseah@gmail.com; site also shows jeff@jeffseah.rocks (`/book`)
  and the forms' fallback text says jefferyseah@gmail.com.

---

## 8. Known limits and deliberate choices

- Forms cannot see server errors (`no-cors`); errors reach Jeff by email instead.
- The Apps Script URL is public. Abuse would mean junk rows/emails; mitigated by honeypot, timing and
  id-format checks. A shared secret was deliberately not added (it would have to live in page source or
  be typed into Script Properties).
- `paid` on intake rows is a client-side hint, not a Stripe verification.
- Webhook listens to `customer.subscription.created` only. Cancellations, failed payments and renewals
  are not mirrored anywhere except Stripe (and Stripe's own emails).
- No analytics or conversion tracking.
- JSON-LD and meta descriptions on `/2027` are static; see the 1 Jan task in section 3.
- Only `main` exists on the remote (the merged `claude/eloquent-cerf-5uju65` was deleted 2026-09-27).

---

## 9. For the CRM project: what exists to integrate with

Today the "CRM" is the intake Sheet plus Stripe plus Jeff's inbox. Entities and where their data lives:

| Entity | Created by | Stored in | Key |
|---|---|---|---|
| Stripe customer | Payment Link checkout | Stripe | `cus_...`, email |
| Subscription (monthly plan) | Payment Link checkout | Stripe; mirrored as a row in `stripe-signups` | `sub_...` |
| Checkout Session | Payment Link checkout | Stripe; its id lands in intake rows | `cs_live_...` |
| Outlook purchase | Payment Link checkout (payment, no subscription) | Stripe only (no webhook event is subscribed for it) | `cs_live_...`, PaymentIntent |
| Intake (birth details) | `/welcome`, `/2027-next` | Sheet tabs `monthly-welcome`, `annual-2027` | email, `stripeSessionId` |
| Client (fulfilment) | Jeff, manually | Wealth Codex vault, Obsidian people note, Fusebase portal, Google Calendar share | name, email |

Integration points a CRM can hook without redesign:
1. **Apps Script `doPost`** already receives every intake and every new subscription. Adding a
   `UrlFetchApp.fetch()` to a CRM API inside `notify()` / `stripeAlert()` is the least invasive path
   (then redeploy as a New version; see section 5).
2. **The webhook** can subscribe to more Stripe events (`checkout.session.completed` for Outlook
   purchases, `customer.subscription.updated/deleted` for cancels, `invoice.paid`/`invoice.payment_failed`)
   and forward them. Adding events is a Stripe Workbench change plus code in `api/stripe-webhook.mjs`;
   keep the "any failure returns 500" rule and add tests beside the existing ones.
3. **Joining records**: intake rows carry `stripeSessionId` (`cs_...`); the webhook sees `sub_...` and
   `cus_...`. To join them reliably, look up the Checkout Session (it holds both `customer` and
   `subscription`). That needs a Stripe key with Checkout Sessions read, which the current restricted
   key does not have (Subscriptions: Write only). Ask Jeff to create or extend a key; never type it.
4. Client data is sensitive (birth details). Keep it out of URLs, logs and public repos; the vault
   rules in Jeff's global instructions apply.

---

## 10. For the design project: what to know before touching the pages

- **Brand tokens** (identical in `index.html` inline `:root` and `2027.css`): `--void #05070f`,
  `--deep #080c1a`, `--midnight #0d1225`, `--gold #c9943a`, `--gold-light #e8bc6a`, `--gold-dim`,
  `--jade #4a7c6f`, `--crimson #8b1a1a`, `--text #ede8df`, `--text-muted #8f887a` (AA on navy),
  `--text-dim #3a3830` (decorative only). `2027.css` adds `--text-muted-accessible #a39c8e`,
  `--ember #b8401c` (hero glow only), `--ease-out`, `--ease-site`.
- **Fonts** (Google Fonts): Cormorant Garamond (`--serif`, headings), DM Sans (`--sans`, body),
  Space Mono (`--mono`, labels), Noto Serif TC (`--noto`, Chinese characters).
- **Three separate style systems**: `index.html` (inline CSS), `2027.css` (four pages), `book.html`
  (inline CSS). A token change must be made in all three, or extracted into a shared stylesheet first.
- **Hooks that JavaScript depends on; do not rename or remove without updating the JS:**
  `[data-stripe]` (order buttons; `2027.js` injects the Stripe URL), `[data-price]`,
  `[data-price-copy]`, `.price-step div` / `.is-now`, `[data-price-home]` (homepage),
  `#nav`, `.nav-toggle`, `#navMenu`, `.faq-card` / `.faq-q` / `.faq-a`, `.reveal` / `.visible`
  (scroll reveal; content is visible without JS, `html.js` enables the hidden state),
  and on the intake pages the form ids (`fullName`, `email`, `birthDate`, `birthTime`, `unknownTime`,
  `birthCity`, `calendarEmail`, `consent`, `submitBtn`, `company_website` honeypot) and the success /
  error state elements.
- **Hard-coded Stripe links** live in `index.html` (4 plan buttons) and `power-calendar.html` (3 trial
  buttons); the Outlook links live only in `2027.js`. A redesign must keep them pointing at the same URLs.
- **Accessibility work already done**: muted text colours were raised to WCAG AA; FAQ has disclosure
  semantics; reduced-motion users get content without animation. Keep these.
- **Copy rules**: no em dashes anywhere (Jeff's global rule). The `/2027` tile caption intentionally
  says the screenshots are from "a real outlook, with the client's name cropped out"; Jeff chose to keep it.
- **Imagery**: WebP in `img/2027/`; OG image `og-2027.jpg` (1200x630) is used by the homepage and `/2027`.
- **Workflow**: branch off `main`, push for a Vercel preview (Vercel MCP `get_access_to_vercel_url`
  for a share link), check on mobile width, then merge. The `jeffseah-site-designer` agent and the
  `distinctive-frontend` skill exist for this site's design work.

---

## 11. How to verify everything still works (about 10 minutes)

1. `node --test tests/*.test.mjs`: 14 pass.
2. `curl -s https://www.jeffseah.rocks/2027.js | grep 00w6oJ2Qv8Wy6A2eyBbwk09`: the 138 link is present.
3. Open `/2027` and confirm the `[data-stripe]` buttons point at the correct link for today's date.
4. Apps Script health: open the web app URL in a browser; it returns `{"result":"ok"}`.
5. Full path (costs nothing on the 97 trial): subscribe on the 97 link, land on `/welcome?plan=97`,
   submit test details, expect two emails ("New subscriber" and "New intake"), rows in
   `stripe-signups` and `monthly-welcome`, Stripe showing the first invoice on a 15th; then cancel in
   the portal and delete the test rows. Stripe checkout and portal login are done by Jeff or with his
   go-ahead; agents never enter card details.
