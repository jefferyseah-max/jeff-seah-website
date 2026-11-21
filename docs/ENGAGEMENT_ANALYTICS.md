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

## Verification and release

`node --test tests/*.test.mjs` checks the repository plus privacy validation, active-time exclusions, scroll deduplication and checkout separation. Start the relay locally on port 8797 with `COLLECTOR_SECRET=local-test-secret`, then run `node scripts/check-engagement-relay.mjs` for durable buffering, private reads, collector commits and replay protection. That checker deletes only its own temporary directory. Real-browser checks must intercept analytics rather than write fixture traffic to production.

The worker is deployed separately using `ops/engagement/wrangler.jsonc`. Its collector secret is supplied outside source. The website follows the normal branch/PR deployment flow. Rollback removes `/js/engagement.js` from the page and disables the collection timer; existing payment, portal and CRM services are independent.
