# Intake endpoint setup (Apps Script)

One endpoint serves both post-payment forms:

- `/2027-next` (2027 Annual Outlook buyers), sheet tab `annual-2027`
- `/welcome` (monthly plan subscribers), sheet tab `monthly-welcome`

Tabs are created with headers on the first submission. Jeff gets an email for every accepted
submission, and an error email if the script itself fails.

## Steps (Jeff, about 5 minutes)

1. Google Sheets, create a blank sheet named `jeffseah.rocks Intake`.
2. Extensions, Apps Script. Delete the sample code, paste all of `Code.gs`, save. Name the project
   `jeffseah.rocks Intake`.
3. Deploy, New deployment, type Web app:
   - Execute as: Me (jefferyseah@gmail.com)
   - Who has access: Anyone
4. Authorize access and allow (Sheets and send email).
5. Copy the Web app URL (`https://script.google.com/macros/s/.../exec`) and give it to Claude,
   who sets `INTAKE_ENDPOINT` in `2027-next.html` and `welcome.html`.

## After a code change

Deploy, Manage deployments, edit the existing deployment, Version: New version. This keeps the same
URL. A brand new deployment gets a new URL and the site would need updating.

## Test

Open the URL in a browser: it returns `{"result":"ok"}`. Then submit each form once with test
details, check the row and the email, and delete the test rows.
