# /power-calendar rebuild: phase 0 claims ledger

Branch `design/power-calendar-rebuild`, 2026-09-30. Method: `.claude/skills/tactile-page-rebuild`.
Sources, most authoritative first: Jeff's rulings and project docs (`CLAUDE.md`,
`docs/SITE_ARCHITECTURE.md`, `docs/design/BRAND.md`, `docs/crm/ENCHARGE_CRM.md`, the Power Calendar
sample lane `F:\My Drive\COACHING\Client Monthly Workflow\docs\POWER_CALENDAR_SAMPLE_LANE.md`), then the
deployed page (`origin/main:power-calendar.html`, restyled in PR 18), then the homepage rebuild
(`HOME_REBUILD_LEDGER.md`), whose decisions are reused, not reopened: nav, footer, disclaimer, no visible
email, no question invites (D9, D10), house style, the day-reading engine, trial wording.

## What the page sells, and what dilutes it

It should sell one thing: the Power Calendar, USD 97 a month with a 30-day free trial (card required).
Today it is diluted by:
- A sample month that is invented ("Illustrative, not a real client"), with fixed entries on days 3 to 28.
- "Two ways to start free", where the second way is the Outlook, which costs USD 88.
- A full four-tier price ladder, a second price table beside the homepage's.
- Meta descriptions saying "First month complimentary" without saying a card is taken.

## Ledger

| # | Claim | Source | Status |
|---|---|---|---|
| 1 | Title, canonical, icons, OG/Twitter tags (OG image is the /2027 art) | Live page | Keep at ship, but see 2 |
| 2 | "First month complimentary" in `description`, `og:description`, `twitter:description` | Live meta | **Conflict** with row 3. Safer: "30-day free trial, card required" |
| 3 | USD 97 a month, 30-day free trial, card required, continues unless cancelled | SITE_ARCHITECTURE, homepage pricing card | Confirmed. Stripe link `8x2cN72QvegSf6y1LPbwk05` kept byte-identical |
| 4 | Billed on the 15th; cancel before the 15th, no charge for next month; portal link | CLAUDE.md, BILLING_ANCHOR_SETUP | Confirmed |
| 5 | Entries land in the subscriber's own Google Calendar; nothing to download or log in to | CLAUDE.md (Google Calendar for monthly subscribers only), `/welcome` | Confirmed |
| 6 | First month arrives within 7 days of the birth details | `/welcome` success copy | Confirmed |
| 7 | Calculated from date, time and place of birth; a two-hour window is enough | `/welcome` form | Confirmed |
| 8 | Entries name the best hours, not just days | Sample lane: 3V with hours, WAM, Femme Fatale hour entries | Confirmed. The site cannot compute these (they need the full chart and Jeff's approval), so hours show as locked |
| 9 | Day types in the real calendar: Power day, Good and Auspicious days, Caution and Go gently days, manifesting hours, moons, keep-your-guard-up (TLC) days | Sample lane, "Colours" | Confirmed. The page can name them as what the paid calendar adds |
| 10 | Sample month with fixed entries, "Illustrative, not a real client" | Live page | **Replace.** Invented; the skill requires computed values |
| 11 | "Personal to your chart" marks on sample days | Live page | **Replace.** A computed map from the birth-year animal is only partly personal; label it that way |
| 12 | "Two ways to start free" (trial, or the Outlook with its sample month) | Live page | **Conflict**: the Outlook is USD 88. The Outlook sample month itself is confirmed (CLAUDE.md, 2026-09-27) |
| 13 | Four-tier ladder 97 / 197 / 297 / 497 with inclusions | Live page, homepage `#pricing` | Confirmed prices; inclusions match the homepage. A second full table conflicts with the skill (one bridge line) |
| 14 | Disclaimer "For timing and planning. Not medical, legal or financial advice..." | /2027, /book, PR 18 | Keep |
| 15 | No visible email; nothing invites a question until Part 4 ships | Jeff 2026-09-30; D9, D10 | Keep. The FAQ must not say "ask me" |
| 16 | Day pillars from the unbroken 60-day cycle, month pillars from solar-term dates in `#calData` | `index.html` (verified in the homepage rebuild) | Reuse the same engine and data; extend the dates before mid-2028 |

## Proposed page (for approval before phase 1)

1. **Hero:** "The outlook gives you months. *This gives you days.*" kept, with a teaser in the fold: pick
   your birth-year animal (or type the year) and get your next three good days and the one to avoid,
   computed from the real day pillars. This is the homepage teaser, shared through one `Alpine.store`.
2. **Signature, "Your month as it lands":** the same computed month as the homepage `#month`, but shown
   the way it arrives. Days appear as calendar-event chips in a Google-Calendar-like month view; tapping
   one opens the entry card as a subscriber would see it: pillar, what the day is good for or what to
   avoid, why (the clash or harmony), and a locked "Best hours" row in neutral shimmer. Beside it, one
   line: "Indicative: built from your birth-year animal. Your Power Calendar reads every day against your
   full chart and adds the hours." This keeps the homepage's map from being a copy and shows the product.
3. **What the full calendar adds:** three short items from rows 8 and 9 (hours, personal power and weak
   days, the month's rare markers), no invented numbers.
4. **Offer:** one Power Calendar card (row 3, 4), one bridge line to the higher plans at `/#pricing`, one
   line for the Outlook ("Want the year first?"), 5-question FAQ (card and cancelling, the 15th, when it
   arrives, unknown birth time, which calendar), mobile order bar, footer with the disclaimer.

## Questions for Jeff (gate 1)

1. Meta and copy: replace "First month complimentary" with "30-day free trial, card required"? (Row 2)
2. Drop "Two ways to start free" and keep the Outlook as one line? (Row 12)
3. Replace the four-tier ladder with the one card plus a line to `/#pricing`? (Row 13)
4. Signature: the Google-Calendar-style view above, or the homepage's month map as it is?
5. Colours: the paid calendar uses Google colours (green power days, grey caution). Keep the site's
   house colours (gold favourable, ember pause) on this page, as the homepage does?

## Jeff's rulings at gate 1 (2026-09-30): yes to all

1. Meta and copy say "30-day free trial, card required", not "First month complimentary".
2. "Two ways to start free" goes; the Outlook is one line.
3. One Power Calendar card plus one line to `/#pricing`; no second price table.
4. Signature is the calendar-style view: days as event chips, a tapped day opens the entry card with a
   locked "Best hours" row.
5. House colours on this page (gold favourable and peak, ochre hold, ember pause), as on the homepage.

## Gate 2 (2026-09-30): approved as built

Built as `power-calendar-rebuild.html` and reviewed on the branch preview. Checks at 1440 and 390: no console
errors, no horizontal scroll, teaser and calendar agree for several animals, birth year 1988 reads as Dragon,
whole-cell taps on phones, mobile order bar hidden at the top and over the plan card. Two FAQ lines were cut
because no doc confirms them (the portal link in the Stripe receipt; months arriving before they begin).

## Ship (phase 5)

`power-calendar.html` replaced with the prototype, `noindex` removed, meta copied from the live page with the
gate 1 trial wording. Tailwind compiled to `css/power-calendar.css` from `scripts/tailwind/power-calendar.config.js`.
The page no longer loads `2027.css` or `2027.js`; their `/power-calendar` rules were removed. Its copy of
`#calData` matches the homepage's: extend both before mid-2028.
