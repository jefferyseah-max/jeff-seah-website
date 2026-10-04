# Intake endpoint setup (Apps Script)

The existing Apps Script endpoint serves both post-payment forms:

- `/2027-next` (2027 Annual Outlook buyers), sheet tab `annual-2027`
- `/welcome` (monthly plan subscribers), sheet tab `monthly-welcome`

Tabs are created with headers on the first submission. Jeff gets an email for every accepted
submission, and an error email if the script itself fails.

Annual intake schema 2 uses `/api/annual-intake` as a same-origin relay. The browser shows success only after a matching saved intake-ID receipt, which the handler returns after row read-back. Monthly intake retains its existing route. Retry the same annual details with the same ID; changed details use a new ID. Notification or CRM failures after storage alert Jeff and do not turn a saved receipt into a failed submission. Operator follow-up is required for those alerts; retries do not resend notifications.

The annual form separates declared work status from reading focus. Employee, business and self-employed declarations remain the annual working context. Between-jobs clients exploring a side gig remain exploratory. Current residence and report time zone are no longer buyer questions, including gifts. New submissions explicitly store reportTimeZoneSource=local-clock-policy with empty location/zone fields and reportTimeZoneConfirmed=false. Suggested planning times are used on the recipient's local clock; exact solar-calendar boundaries remain identified by their source zone. Birthplace is used for calculation only. Birth zone, birth-time convention and circumstance observation date are no longer buyer questions; their compatibility columns remain blank. The circumstance date is not the annual report year and is never inferred from 2027. Simplified opens by default for all deliveries; Advanced remains available in the report.

## Steps (Jeff, about 5 minutes)

1. Google Sheets, create a blank sheet named `jeffseah.rocks Intake`.
2. Extensions, Apps Script. Delete the sample code, paste all of `Code.gs`, save. Name the project
   `jeffseah.rocks Intake`.
3. Deploy, New deployment, type Web app:
   - Execute as: Me (jefferyseah@gmail.com)
   - Who has access: Anyone
4. Authorize access and allow (Sheets and send email).
5. Copy the Web app URL (`https://script.google.com/macros/s/.../exec`) and give it to Claude,
   who sets `INTAKE_ENDPOINT` in `lib/signup-alert.mjs` and `welcome.html`.

## After a code change

The same deployment also sends verified Annual Outlook report-feedback notifications to Jeff. This uses a separate private ledger and monitored report outbox, without creating intake or CRM events. See [FEEDBACK_ALERTS.md](FEEDBACK_ALERTS.md) for receipt verification, retry, monitoring and test-send rules.

Deploy, Manage deployments, edit the existing deployment, Version: New version. This keeps the same
URL. A brand new deployment gets a new URL and the site would need updating.

## Test

Open the URL: schema 2 returns `{"result":"ok","annualIntakeSchemaVersion":2}`. GET checks backend availability only, not row storage.

Before upgrading an existing Sheet, make a native Google Sheet backup. In the editor run `annualIntakeSelfTest` or the focused `annualLocalClockSelfTest`, which writes synthetic cases only to `annual-2027-qa` and sends no email or CRM events. Independently read the resulting rows. This QA tab is not watched by the Olares intake watcher. Keep failed-test rows as diagnostic evidence until explicit housekeeping approval.

Then run `migrateAnnualIntake`. It preserves the existing 16 headings and all rows, appends 17 fields after every existing column, and refuses duplicate or missing legacy headings. New rows use the actual header names. Client ISO dates and times use exact row writes with text formatting; receivedAt retains a readable date-time cell; `appendRow` coerces dates even after preformatting. Do not migrate by replacing the entire header. Verify the live header independently before updating the existing deployment.

`node --test tests/*.test.mjs` checks migration, receipts, retry conflicts, input limits, privacy, and existing Stripe/monthly behavior. Local browser tests must use fake services so they cannot send notifications. A full production browser POST would send operator emails and existing CRM events; run that only with specific test-send authorization. Website publication and client release remain separate approvals.

The saved row is converted privately using `Codex Annual Reports/scripts/read-annual-intake.mjs` in the coaching project. Export a bounded header-and-row range, select one intake ID, and explicitly supply the canonical client reference/key, report year, capture timestamp and source reference. Historical missing residence without the explicit local-clock-policy marker remains blocked; no policy is inferred for old records. The adapter does not create a client profile, update a practitioner contract, verify payment or authorize release.
