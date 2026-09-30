# /book rebuild: phase 0 claims ledger

Branch `design/book-rebuild`, 2026-09-30. Method: `.claude/skills/tactile-page-rebuild`.
Sources, most authoritative first: Jeff's rulings and project docs (`CLAUDE.md`,
`docs/SITE_ARCHITECTURE.md`, `docs/design/BRAND.md`, `docs/crm/`), then the deployed page (fetched
2026-09-30 from www.jeffseah.rocks/book through Vercel; identical to `origin/main:book.html`), then the
homepage Single Session card (`index.html`, `#pricing`, One-Time tab). There is no separate brief.

## The one offer

**Single Session, USD 197, 60 minutes one to one on Google Meet, booked and paid by card on
CalendarHero `/singlesession`.** Everything on the page points at that one link.

What dilutes it today: the line "Combo and Premium clients get ongoing monthly support" (legacy plan
names, see row 8), and nothing on the page tells a visitor when sessions actually happen in their own
time zone until they reach CalendarHero.

## Ledger

| # | Claim | Source | Status |
|---|---|---|---|
| 1 | USD 197, one session | CLAUDE.md, SITE_ARCHITECTURE s.3, live page, homepage card | Confirmed |
| 2 | Pick a time and pay by card at booking on `https://meeting.calendarhero.com/singlesession` | SITE_ARCHITECTURE s.3 (CalendarHero Collect Payments via its Stripe) | Confirmed. Link kept verbatim. Never `/lifecoaching` |
| 3 | 60 minutes, one to one, Google Meet link sent once confirmed | SITE_ARCHITECTURE (1 hr, Google Meet), live page | Confirmed |
| 4 | Session hours Mon, Tue, Thu 8:00 to 10:30 pm Singapore time, 2-day lead time, 30-min buffers | SITE_ARCHITECTURE s.3 (set 2026-09-27) | Confirmed in docs; not on the live page. CalendarHero is not reachable from a cloud session, so not rechecked there |
| 5 | "48-hour reschedule policy" | Live page (twice) | **Unverified.** No doc records a reschedule policy or how a client reschedules. The 2-day lead time is about booking, not rescheduling |
| 6 | "A PDF summary with key dates and action points delivered within 48 hours" | Live page | **Conflict** with homepage card "Session summary within 48 hours" (no PDF, no key dates). No process is documented for producing or sending it (/book has no intake, Sheet row or alert) |
| 7 | "Before the call: have date, time and place of birth ready; think about 1 to 3 decisions" | Live page | Keep. **Open:** how birth details reach Jeff (CalendarHero booking question, or asked on the call?). Decides whether the page may say "I read your chart before we meet" |
| 8 | "Combo and Premium clients get ongoing monthly support" | Live page | **Stale.** Combo 297 and Premium 397 are deactivated Feb 2026 products (SITE_ARCHITECTURE s.3). Drop |
| 9 | Covers your current 10-year luck pillar, favourable windows in the coming months, caution periods, your own questions (career, business, relationships, investments) | Live page | Keep |
| 10 | Homepage card: focused on your most pressing decision; timing analysis for your current situation; clear next steps you can act on immediately | index.html | Keep, consistent with row 9 |
| 11 | "Show you exactly when to move" (hero) | Live page | Keep the sense; paired with the site disclaimer (row 13) |
| 12 | Refunds | SITE_ARCHITECTURE: CalendarHero automatic refunds off | Page states no refund policy today. Keep it that way unless Jeff rules |
| 13 | "For timing and planning. Not medical, legal or financial advice, and not a guarantee that events will happen." | /2027 footer | /book has no disclaimer yet mentions investments. Reuse the /2027 line |
| 14 | Contact `coaching@jeffseah.rocks` | Commit bb572c2 | Confirmed |
| 15 | Title "Book a Session \| Jeff Seah", description, favicon `/img/seal-64.png` | Live page | Keep verbatim. Live has no canonical, OG, Twitter or JSON-LD tags |
| 16 | Monthly Coaching USD 497 includes 1 session a month, recording and summary | index.html pricing | Confirmed. Candidate for the one-sentence bridge |
| 17 | Upsell order for Outlook buyers: monthly Calendar plans first, Single Session last | ENCHARGE_CRM.md | Informs the bridge: /book should not push buyers back to a cheaper product |
| 18 | House style obsidian and gold, seal layers (never `seal-128.png` on the page), Plus Jakarta Sans, Space Mono | BRAND.md | Applies. /2027 nav, footer, disclaimer and order bar are reused |

## Proposed page (for approval before phase 1)

1. **Hero:** "Bring one decision" promise, USD 197, Book button, and a teaser in the fold: pick the
   kind of decision and your birth-year animal, get a month-level read of the next six months.
2. **Signature interaction, the Decision Window:** a six-month path from the current month, built from
   the real month pillars (戊戌 Oct, 己亥 Nov, 庚子 Dec, 辛丑 Jan in the 丙午 year; 壬寅 Feb, 癸卯 Mar
   and on in the 丁未 year, switching at 立春 4 Feb 2027) and scored by the same engine as the /2027
   When-To Index (clash, harmony, harm, punishment, stem contacts, element weights per goal).
   Beside it: "Indicative: built from your birth-year animal and the month pillars. In the session I use
   your full four pillars and your current luck pillar, down to the days and hours inside the window."
   The gap between the two is the sale.
3. **Your time zone:** the session hours (row 4) converted to the visitor's own time zone, with the
   earliest bookable day after the 2-day lead time. "Free slots show in the booking calendar."
4. **Conversion:** offer card (price, what is covered, before/during/after), one bridge sentence,
   5-question FAQ, mobile Book bar, /2027 footer with the disclaimer.

## Jeff's rulings at gate 1 (2026-09-30)

1. After-session deliverable: "Session summary within 48 hours" everywhere (rows 5 and 6; no PDF, no key-dates promise).
2. "48-hour reschedule policy": keep as is.
3. Birth details: Jeff emails the client for them if the question needs a BaZi reading. The page does
   not ask for them at booking and does not claim the chart is read before the call.
4. Upsell bridge: one sentence linking to the homepage pricing tiers (`/#pricing`) for now.
5. Canonical, OG, Twitter and Service JSON-LD (price 197) tags: add them.

## Jeff at gate 2 (2026-09-30)

- CalendarHero's booking confirmation carries a reschedule link; the FAQ says so instead of pointing to email.
- No visible email address or `mailto:` link on the page (scraping and spam). The footer drops it.

## Phase 1 to 3 build notes

- Prototype `book-rebuild.html` (noindex), CSS `css/book.css` compiled from
  `scripts/tailwind/book.config.js`. Screenshots: `docs/design/qa/book-*.png`.
- Decision Window data: solar-term start dates from 白露 2026 to 小寒 2029 in `#windowData`; pillars are
  generated from them. Extend the dates before mid-2028.
- Session evenings: next four Mon/Tue/Thu evenings at least two days out, shown in the visitor's zone.
