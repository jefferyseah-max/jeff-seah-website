# Website engagement measurement

`/2027` sends anonymous browser events through `ops/engagement/worker.mjs` to SQLite on Olares. Vercel Hobby page-view analytics remains available; its paid custom-event feature is not used for these records.

The Cloudflare relay temporarily buffers events until Olares commits them, then deletes acknowledged rows. Uncollected rows expire after seven days. The relay accepts only the two production site Origins, known events and bounded fields; Origin is not proof of a human visitor. A 20,000-event daily and pending-buffer cap bounds abuse. Private buffer reads require a collector-only secret. Olares retains 90 days, with expiry applied during collection. Records contain a random per-page visit ID, source/campaign labels, coarse input-device category and event properties. They contain no birth inputs, names, emails, full URLs, ad-click IDs or stored IP addresses. Preview `?exit=1`, `?noanalytics=1` and automated browser visits are excluded.

Events cover page visits, active-reading milestones (15/30/60/120/300 seconds), cumulative active time and deepest scroll, 25/50/75/100% scroll, Contact & Clash and When-To tool use, actual popup appearances with desktop/mobile trigger, dismissal reasons, sample/popup video start, sound enabled and playback-position milestones (25/50/75/95%), Outlook checkout clicks and trial checkout clicks with placement. Video progress is playback position while visible, not an attention or continuous-watch guarantee. Autoplay starts are not deliberate play actions.

Active time counts a visible page up to 60 seconds after its latest input, with a one-second clock and fifteen-second checkpoints. Hidden tabs, background pauses and long idle periods do not accrue time. Browser blocking, failed exit requests and lost connectivity can undercount. Reloads create new visit IDs; counts are page visits, not unique people. No site behavior or pricing is changed.

Trial checkout is a button click, never a completed signup. Verified signups remain in the existing signed Stripe webhook, signup alerts and `src-<placement>` CRM tags, including `exit_2027` and `2027_footer`. Reconcile those separately when reporting signups. No new browser event claims a completed payment or trial, and this feature does not alter billing/webhook processing.

## Private report

On Olares:

```sh
python3 /home/olares/jeffseah-engagement/collect.py --report --days 7
```

The collector runs every minute through `jeffseah-engagement.timer`, with `OnFailure` and heartbeat registration. Its private settings and SQLite database are under `/home/olares/jeffseah-engagement/`, mode 600 inside a mode-700 directory. The report is retrieved over SSH, not published on the website. `received_at` is server receipt time; buffered events can arrive later than the actual interaction.

## Portal and Tongshu guides

The `/portal-guide` and `/tongshu-guide` pages use `js/portal-guide-analytics.js`. They record anonymous visits, cumulative active time, scroll milestones, fixed-label link clicks, opened help, selected feature explanations and native-player video starts/playback-position milestones. The video remains hosted on Publit.io; native HTML video controls allow measurement without guessing cross-origin iframe messages. English captions use the approved V4 narration timing.

Guide tracking runs only on the two production hostnames, never localhost, Vercel previews, `?noanalytics=1` or automated browser visits. Source/campaign values are bounded labels. Fixed targets and placements identify portal buttons, feature links and screenshot links without collecting destination URLs, emails or codes. Counts are page visits and clicks, not unique people, successful sign-ins or proof that someone watched continuously.

The sanitizer accepts only the `2027`, `portal-guide` and `tongshu-guide` page keys. Missing keys remain legacy `2027`. The collector adds a `page` column to the existing SQLite database with the same default, preserving historical records. Reports filter by page; the default 2027 report never mixes in guide traffic. No new timer, service, secret or public analytics dashboard is introduced.

Retrieve guide reports privately on Olares with `python3 /home/olares/jeffseah-engagement/collect.py --report --days 7 --page portal-guide`, or use `--page tongshu-guide`. Jeff can request these reports in chat. Actual collection begins only after release; local previews have no production counts.

Release order: back up the existing Olares collector, install the additive collector update, deploy the additive relay sanitizer, verify existing 2027 ingestion, then publish the approved website pages. Keep the existing relay object name and collector settings, timer and heartbeat. All deployment is held with the guide page until Jeff approves publication. A frontend rollback leaves the existing 2027 collector working. Browser QA intercepts analytics and uses the local relay, never fixture events in production.

The Tongshu guide uses simplified illustrations and fixed explanatory copy from the maintained Tongshu layout contract. It does not calculate dates, read client data, save dates or trigger calendar refreshes. The eight feature states support direct links, manual navigation, an optional pausable 30-second-per-feature tour, hidden-tab pause, and reduced-motion preferences. All feature explanations remain readable without JavaScript.

## Verification and release

`node --test tests/*.test.mjs` checks the repository plus privacy validation, active-time exclusions, scroll deduplication and checkout separation. Start the relay locally on port 8797 with `COLLECTOR_SECRET=local-test-secret`, then run `node scripts/check-engagement-relay.mjs` for durable buffering, private reads, collector commits and replay protection. That checker deletes only its own temporary directory. Real-browser checks must intercept analytics rather than write fixture traffic to production.

The worker is deployed separately using `ops/engagement/wrangler.jsonc`. Its collector secret is supplied outside source. The website follows the normal branch/PR deployment flow. Rollback removes `/js/engagement.js` from the page and disables the collection timer; existing payment, portal and CRM services are independent.
