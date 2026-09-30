# Homepage rebuild: phase 0 claims ledger

Branch `design/home-rebuild`, 2026-09-30. Method: `.claude/skills/tactile-page-rebuild`.
Sources, most authoritative first: Jeff's rulings and project docs (`CLAUDE.md`,
`docs/SITE_ARCHITECTURE.md`, `docs/design/BRAND.md`, `DIRECTION.md`, `HANDOFF.md` rounds 1 to 4,
`docs/crm/ENCHARGE_CRM.md`), then the deployed homepage (`origin/main:index.html`, commit b09eae1),
then sibling pages that describe the same offers (`/power-calendar`, `/welcome`, `/book`, `/2027`).
Decisions already made on `/2027` and `/book` (nav, footer, disclaimer, no visible email, order bar,
house style) are reused, not reopened.

## What the page sells today, and what dilutes it

The homepage is a hub with six prices: the 2027 Outlook (88, then 138), four monthly plans (97 with a
30-day card trial, 197, 297, 497) and the Single Session (197). The hero CTA says "Start with your 2027
Outlook"; the pricing section says "Start free. Upgrade when you see the difference." Two front doors,
then a two-tab price table. The three Features demos (a March 2027 sample month, a Bagua prism, an
example stem ring) are illustrative rather than computed for the visitor.

## Ledger

| # | Claim | Source | Status |
|---|---|---|---|
| 1 | Title, description, canonical, OG/Twitter tags (OG image is the /2027 one) | Live page | Keep verbatim at ship; a homepage OG image is optional |
| 2 | 2027 Outlook USD 88 until 31 Dec, USD 138 from 1 Jan (00:00 SGT switch via `[data-price-home]`) | CLAUDE.md, SITE_ARCHITECTURE s.3 | Confirmed. The switch must survive the rebuild |
| 3 | Outlook comes with a sample Power Calendar month as a private web page, no card, nothing renews | CLAUDE.md (Jeff 2026-09-27) | Confirmed. Not a Google Calendar share |
| 4 | Power Calendar USD 97/month, 30-day free trial, **card required**, continues at 97 unless cancelled | SITE_ARCHITECTURE, /power-calendar | Confirmed. The pricing card says "First month complimentary" and "Start free month" without the card; the FAQ does say it. Safer wording: "30-day free trial, then USD 97 a month. Card required." |
| 5 | Calendar + Brief 197, Calendar + Premium 297, Coaching 497, with their inclusions | index.html, SITE_ARCHITECTURE | Confirmed; four Payment Links kept verbatim |
| 6 | "Most Popular" badge on Calendar + Premium | index.html | **Unverified.** CLAUDE.md records Jeff moving the highlight there, but no real checkout has happened yet (CLAUDE.md, Encharge launch gate), so "most popular" is not yet true |
| 7 | Billed on the 15th; cancel before the 15th and no charge for next month; portal link | CLAUDE.md, BILLING_ANCHOR_SETUP | Confirmed |
| 8 | "Your Power Calendar, Decoded: a personalized monthly intelligence **report**" | index.html Features | **Conflict.** The 97 plan is the calendar only; reports start at 197 |
| 9 | "Within 7 days, your personalized Power Calendar arrives" | index.html Process, /welcome | Confirmed ("first month in your Google Calendar within 7 days") |
| 10 | Calculated from date, time and place of birth | index.html, /welcome intake | Confirmed |
| 11 | Single Session USD 197, summary within 48 hours, `/book` | /book (rebuilt), index.html | Confirmed |
| 12 | "Based on 5,000 years of Chinese metaphysics" | index.html hero, Philosophy | Keep (Jeff's framing) |
| 13 | FAQ: no testimonials because clients keep the edge private | index.html | Jeff's own statement; keep unless he wants it softened |
| 14 | FAQ: Bazi, Qimen, I-Ching, Tarot, Lenormand, Moon cards | index.html | Keep |
| 15 | Disclaimer "For timing and planning. Not medical, legal or financial advice..." | /2027, /book | Homepage has none. Add |
| 16 | No visible email address | Jeff 2026-09-30 | Homepage already has none. Keep it that way |
| 17 | Upsell order for Outlook buyers: monthly plans first, Single Session last | ENCHARGE_CRM.md | Informs page order |
| 18 | October refresh set pieces: Luopan hero, Bagua unfolding, March 2027 sample month, Bagua prism, stem ring, hourglass that becomes Hexagram 49, FAQ Wu Xing trace | DIRECTION.md, HANDOFF.md rounds 1 to 4 | Jeff iterated these four rounds. Which survive is his call (question 4) |
| 19 | House style obsidian and gold, seal layers, Plus Jakarta Sans and Space Mono | BRAND.md | Applies. The navy tokens, `seal-128.png` in the nav, stars, astrolabe and aurora go |
| 20 | Day pillars run in an unbroken 60-day cycle | Checked: formula gives 甲子 for 1 Oct 1949 and 甲辰 for 10 Feb 2024 | Usable as real data for a day-level interactive |

## Proposed page (for approval before phase 1)

1. **Hero:** the Luopan (re-toned to obsidian and gold) beside the promise, with a teaser: pick your
   birth-year animal, get your next three good days and the one day to avoid in the rest of this
   month, computed from the real day pillars.
2. **Signature interaction, "Your next month, day by day":** the next full month as a calendar grid,
   every day scored from its real day pillar and the month pillar against the visitor's animal
   (clash, harm, punishment, harmony, six harmony), with a peak window and pause days. This replaces
   the invented March 2027 sample. Beside it: "Indicative: built from your birth-year animal. Your
   Power Calendar reads every day against your full chart and adds the hours." The gap sells the plan.
3. **Philosophy:** the hourglass that becomes Hexagram 49, re-toned.
4. **Offer:** one lead card and a short ladder (see question 1), the Outlook with its price switch,
   one bridge line to `/book`, 5-question FAQ, mobile order bar, `/2027` footer with the disclaimer.

## Questions for Jeff

Recorded in the session; answers go here once given.
