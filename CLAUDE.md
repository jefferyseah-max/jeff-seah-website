# jeff-seah-website: Project Instructions

## What this is
Jeff's static personal site, deployed on **Vercel**, live at **jeffseah.rocks**.
Repo: https://github.com/jefferyseah-max/jeff-seah-website (default branch `main`).
`main` is the live source of truth and auto-deploys to jeffseah.rocks on push (about 30 s).
**Never force-push `main`.** Do future work on a fresh branch off `main`; pushing a branch gives a
protected Vercel preview (use the Vercel MCP `get_access_to_vercel_url` for a share link).

Open website sessions with this folder as the working directory, not the coaching folder.

## Local vs cloud sessions
- **Local** (Claude Desktop, Code tab, environment chip shows Local, no cloud icon in the title bar):
  has Claude in Chrome, the olares-ssh MCP and local files. Needed for anything clicked in Stripe,
  Google Sheets edits, or Apps Script deployments.
- **Cloud** (cloud icon, environment chip "Default"): GitHub, Vercel, Drive (read), Gmail only. Fine
  for code changes and checking the Sheet, Gmail and deployments; cannot click in Stripe or edit Sheets.
If a task needs Stripe or Sheet edits and the session is cloud, say so at the start.

## Offers and payments (as of 2026-09-26)
- Monthly plans on Stripe Payment Links: 97 Calendar (30-day card trial), 197 Calendar + Brief,
  297 Calendar + Premium, 397 Coaching. Single Session 197 via `/book`.
- 2027 Annual Outlook: USD 88 until 31 Dec 2026, USD 138 from 1 Jan 2027 (the 138 link is still to
  be created). Link in `2027.js`; buyers get one free Power Calendar month (next full month, no card).
- Homepage `#calendar` section sells the Outlook plus the free month. The old no-card free-month
  lead form is retired; its Apps Script and "Power Calendar Leads" Sheet are no longer used by the site.
- Billing on the 15th: `/api/stripe-webhook` (see `BILLING_ANCHOR_SETUP.md`), live. Vercel env
  `STRIPE_API_KEY` (restricted, Subscriptions write) and `STRIPE_WEBHOOK_SECRET`. Never type keys.
- Customer portal: https://billing.stripe.com/p/login/aFa28t3Uz6Oq6A2fCFbwk00 (linked from the pricing note).
- Stripe account acct_1ScW2gRmcvZfydHf. Webhooks live in Workbench (Developers bar, bottom left).
- After payment: the 4 monthly links redirect to
  `/welcome?plan=<97|197|297|397>&session_id={CHECKOUT_SESSION_ID}` (set 2026-09-26).

## Intake (post-payment birth details)
`/2027-next` (Outlook buyers) and `/welcome?plan=<97|197|297|397>` (subscribers) POST to one Apps
Script web app bound to the Sheet "jeffseah.rocks Intake" (tabs `annual-2027`, `monthly-welcome`),
which emails Jeff per submission. Source and setup: `docs/intake/Code.gs`, `docs/intake/INTAKE_SETUP.md`.
Code changes: Manage deployments, New version (keeps the URL). Submissions take about 9 s.
Test rows were cleared 2026-09-26; both tabs hold headers only. `paid` is true when the URL carries a
Stripe `session_id` (or `paid=1`).
End-to-end test passed 2026-09-26 (97 trial signup, /welcome intake, Sheet row and email, first invoice
on the 15th, portal cancel, test row deleted).

## Key files
| File | Purpose |
|------|---------|
| `index.html` | Homepage; CSS and JS inline |
| `2027.html`, `2027-next.html`, `welcome.html`, `power-calendar.html` | Outlook sales page, the two intake pages, Power Calendar sample page |
| `2027.css` / `2027.js` | Shared CSS and JS for the pages above |
| `api/stripe-webhook.mjs`, `lib/billing-anchor.mjs`, `tests/` | 15th-billing webhook; `node --test tests/*.test.mjs` |
| `.vercelignore` | Keeps `tests/`, `docs/` and `*.md` off the public site |
| `script.js` / `styles.css`, `FORM_SECURITY_SETUP.md`, `GOOGLE_SHEETS_SETUP.md`, `QUICK_REFERENCE.md` | Dormant, from the retired lead form |

## Pending
- Publish the 2027 sample at reports.jeffseah.rocks/sample-2027/, then remove `hidden` from `.sample-section` in `2027.html`.
- Create the USD 138 Outlook link before 1 Jan 2027.

## Tooling (local sessions)
- GitHub: local pushes use this machine's git creds (`gh auth` as `jefferyseah-max`).
- olares-ssh MCP (`mcp__olares-ssh__exec`, host 192.168.1.3) reaches the shared vault
  at `/home/olares/vault/` and the Drive mount at `/home/olares/gdrive/`.
- Stripe and Google changes go through Jeff's Chrome (Claude in Chrome); Jeff signs in and clicks any OAuth Allow.
- Git Bash strips backslashes in inline `node -e` and heredoc edits (a CSS `"\2726"` became garbage); use the Edit tool.

## Style
- No em dashes in any output.
- Verify your own work (read the Sheet / Gmail / live site) rather than assuming success.
