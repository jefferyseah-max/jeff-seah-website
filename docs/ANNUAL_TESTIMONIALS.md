# Annual Outlook testimonials

`/2027` reads `data/annual-2027-testimonials.json` through `js/annual-testimonials.mjs`. The section sits before Order and stays hidden when the approved selection is empty. It is not present on the homepage. No sample reviews or aggregate star claims are published.

The public schema contains only `id`, `year`, `name`, `quote` and `rating`. `rating` is the reader's optional overall 1 to 5 score, or null. Clarity, navigation and usefulness scores remain private. Names are chosen by readers and may be pseudonyms or Anonymous reader. Rendering uses plain text.

The authoritative feedback receipts live in the authenticated annual-report host's private R2 bucket. The review register is [2027 Annual Outlook Feedback](https://docs.google.com/spreadsheets/d/10soI-jUMwXLyKMaQCdkCRg3Z67kXzOU7EPCYJS427b0/edit), tab Responses, header row 5, data from row 6, approvalStatus in column R. It is an agent-refreshed register, not an automatic mirror. Preserve review decisions by submissionId when refreshing it.

The complete private workflow is `C:/Users/jeffe/Desktop/AgentDesk/Client Monthly Workflow/Codex Annual Reports/FEEDBACK_AND_TESTIMONIALS.md`. Its `scripts/annual-feedback-export.mjs` joins the review decision to the original saved response and requires explicit publication consent. Only approved or published 2027 entries are exported. Rewritten quotes require fresh client approval; this importer uses original wording.

1. Have Jeff approve the selected entries. Include existing published entries in the full selection; omit declined or withdrawn entries.
2. Export `approved-testimonials.json` through the private workflow. Never put raw response exports, private reviews, report routes or client birth data in this repository.
3. Run `node scripts/import-annual-testimonials.mjs --source <private-approved-testimonials.json>` to validate. Add `--apply` after reviewing the selection.
4. Run `node --test tests/*.test.mjs`, review the phone and desktop cards, then publish under Jeff's current authorisation. Publishing is separate from client consent and a successful import.

The importer validates the entire public selection and replaces the data file through a temporary file. The file starts as an empty array until real approved testimonials exist. A missing or invalid data file hides the section and reports a console error. There are no client emails, scheduled jobs or automatic publication.
