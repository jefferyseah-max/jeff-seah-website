# 2027 Outlook ads: baseline and next review

Recorded 21 November 2026, Singapore time. Campaign: 2027 Outlook Launch. Landing page: https://jeffseah.rocks/2027.

## Jeff's decision

Jeff asked to keep these findings on record and revisit in a couple of days. Review around 23 November 2026. If the trend remains consistent with today's findings, revisit the proposed conversion and tracking improvements. This is a conditional plan, not approval to make changes automatically. No reminder or recurring review was scheduled.

Keep the current ads, copy, budget, country selection and popup timing unchanged for now. The engagement tracking already released in PR 47 remains active.

## Measured baseline

Ads Manager reporting covers 19 and 20 November 2026, completed Singapore-local days. Campaign totals: 3,196 impressions, 69 clicks, 2.16% CTR, S$76.06 spend, S$1.10 average CPC and zero attributed purchases. Recent spend and conversions may finalize later. Conversion reporting used 30-day click and 1-day view attribution, by ad-interaction date.

| Ad | Impressions | Clicks | CTR | CPC |
|---|---:|---:|---:|---:|
| A4: Personal relevance | 620 | 19 | 3.06% | S$0.66 |
| C4: Personal relevance | 228 | 7 | 3.07% | S$0.58 |
| A6: Accessible insight | 590 | 10 | 1.69% | S$1.11 |
| C6: Accessible insight | 504 | 11 | 2.18% | S$1.45 |

There are 18 active variants: six copy angles across three images. A4 and C4 together accounted for 26 of 69 clicks. Their shared copy: "Go beyond a general yearly forecast. Get a private report based on your birth date, time and place." No individual ad has enough evidence to declare it a winner or establish conversion quality. Uneven delivery also limits comparison; zero clicks from very few impressions is not evidence of failure.

Friday produced 40 clicks at S$0.93 CPC versus Thursday's 29 at S$1.34. This is descriptive, not an established trend. The country report showed all impressions in Singapore, despite targeting Singapore, US, Australia and New Zealand. Its click/spend totals differed slightly from the campaign aggregate, so the aggregate above is the reporting baseline.

Separately, Vercel's site-wide 14–21 November window showed 109 visitors, 131 page views, 83% mobile traffic and 91% bounce rate. These are not two-day campaign-only figures. Vercel bounce rate counts single-page sessions and excludes custom events, so it does not establish short or unengaged visits. Documentation: https://vercel.com/docs/analytics.

## Proposals to reconsider after comparison

1. Give the personal birth-chart benefit more prominence in the mobile introduction. A4/C4 provide an early clue, not proof. Proposed editorial wording, not approved copy: "Your 2027, read from your birth chart." Supporting copy: "A personal month-by-month outlook showing when to act, prepare or pause. Prepared and reviewed by Jeff. US$88, one payment."
2. Add a distinct `utm_content` label to every ad and extend the Olares collector to retain it. All 18 currently share the campaign URL without a variant label. Ads Manager distinguishes their clicks, but current engagement records cannot connect a visit to an individual variant. Existing `js/measure.js` retains content when supplied; the new engagement collector currently retains source and campaign only.
3. Prioritize a clear mobile first screen before adding more content: personal benefit, price, delivery and sample should be easy to scan together.
4. Use engagement evidence to locate the next investigation: short visits suggest opening/loading checks; engaged readers without checkout clicks suggest offer/confidence checks; checkout clicks without verified signups suggest checkout checks. These are diagnostic hypotheses, not established causes.

## Next comparison

- Preserve the original 19–20 November baseline and compare additional completed days, with matching account timezone, scope and metric definitions. Look for continued personal-relevance performance across images and meaningful engagement, not just cheap clicks.
- Read the private Olares report documented in `ENGAGEMENT_ANALYTICS.md`. It began collecting on 21 November at approximately 15:54 SGT, so there is no historical engagement evidence for the first two days. No genuine engagement records had arrived at the time of this review.
- Compare active reading, scroll, tools, popup appearances/dismissals, video progress and placement-tagged checkout clicks. Browser visit IDs are not unique people.
- Verify purchases and trial signups separately through Stripe and the existing signed signup/source records. A checkout click is not a completed signup. The historical `/2027-next` visitor is not verified proof of a sale.
- If a consistent trend supports changes, present the concrete proposal and confirm the intended scope before altering ads or content. Do not implement automatically from this note.

## Implementation references

- Engagement release: https://github.com/jefferyseah-max/jeff-seah-website/pull/47, merged as `6d1fe1ffb88470ebafd2216cd0ec0e67519b8983`.
- Collector/report: `/home/olares/jeffseah-engagement/collect.py --report --days 7`.
- Monitoring: `jeffseah-engagement.timer`; heartbeat `jeffseah-engagement`.
- Current engagement design and limitations: `docs/ENGAGEMENT_ANALYTICS.md`.
