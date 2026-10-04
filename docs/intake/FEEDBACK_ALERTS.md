# Annual Outlook feedback email alerts

New saved production report feedback emails `jefferyseah@gmail.com`, using the existing intake Apps Script endpoint. The message includes separately labelled ratings, private feedback, original testimonial, selected display name, permission and a private review Sheet link. Private-only feedback also sends an operator alert. It never emails clients, creates intake/CRM events, imports review rows or publishes testimonials.

The report gateway's `annual-feedback-alert-v1` outbox is saved atomically with feedback in private R2. Apps Script accepts `{type:'annual-feedback', sourceUrl}` and independently fetches the matching saved receipt. It accepts only the exact production report host or the configured synthetic review host, a bounded report route, a UUID and a random 256-bit capability. Redirects, caller-selected recipients and caller-supplied answers are rejected. The capability is not included in email, public exports, reader status or logs.

`annual-feedback-alerts` is a private ledger tab in the existing intake spreadsheet. A script lock protects duplicate route/submission IDs. Marking an alert sent requires `MailApp.sendEmail` to succeed and ledger read-back. The reader's saved feedback remains successful when mail delivery fails. Normal retry is deduplicated; a crash between provider acceptance and ledger update remains a possible duplicate window.

## Operations

The Apps Script project is `1kTAeB7imLYo8xsv5_98ztlu76wMejSRul_W__y7JmlVH2ab_eQMI_UIt`, bound to the existing intake Sheet. Use Manage deployments, edit its existing deployment and select New version. Keep Execute as Me and existing access settings. Its GET health receipt includes `feedbackNotificationVersion:'annual-feedback-alert-v1'`. Do not replace the endpoint with a new URL or change existing Stripe/intake behaviour.

Olares retries private production outbox entries every five minutes through `jeffseah-feedback-alerts.timer`. The source files are in `ops/olares/`; deployed paths are `/home/olares/coach/jeffseah-feedback-alerts.py` and `/etc/systemd/system/jeffseah-feedback-alerts.{service,timer}`. The service credential is `/home/olares/.feedback-alerts.env`, mode 600, never committed or printed. The service respects the gateway's 120-second lease and exponential retry delay, five minutes to one hour. A failed retry returns nonzero and reaches the existing Telegram OnFailure alarm. The canonical drop-in installer maps the unit to its one-hour heartbeat, with a 90-minute missed-run threshold and the existing Monday digest. Olares must be online for retries.

Read health with `systemctl status jeffseah-feedback-alerts.timer`, `journalctl -u jeffseah-feedback-alerts.service -n 20`, and `python3 /home/olares/coach/heartbeat.py list`. Logs contain counts and generic errors, not credentials or client answers. Never use user cron or create a duplicate Hermes job. Read the vault monitoring standard before changing these units.

Emergency pause requires both stopping/disabling the retry timer and setting the report host's `ANNUAL_FEEDBACK_ALERTS=off`. The latter prevents new notifications but does not erase already pending entries. Preserve saved feedback. Roll back the mail handler through the prior Apps Script deployment version; preserve the ledger to avoid losing deduplication history. Report gateway rollback must preserve all existing public assets, private report HTML/config and R2 bindings.

## Verification

Run `node --test tests/*.test.mjs` and `python -B ops/olares/test_feedback_alerts.py`. Local tests use fake services and send nothing. Report-side storage, capability, concurrency, failure and retry tests live in the coaching workflow. Run its required `npm run verify` too.

A live test requires Jeff's explicit test-email authorization. Use only an explicitly configured `feedback-email-test-2027-<opaque-id>` route on the designated preview host, marked test and without public consent. Ordinary preview client reports cannot mail. Reuse the same unchanged submission ID on retry, never a second test response. Independently verify the inbox message, R2 sent state and same-ID no-resend result. Fire the actual unit's OnFailure path once with a clearly labelled synthetic failure, confirm Telegram receipt, remove the temporary test override and verify a healthy normal run and timer before completion. Never submit or activate Evania or another real client for QA.

The private feedback review Sheet is agent-refreshed. After an email, Jeff can ask an agent to import the latest saved feedback, review it, and choose what to approve. Only consented original testimonials approved by Jeff can enter `/2027`; no homepage component or automatic publication is included.
