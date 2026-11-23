# Optional website insights

Clarity project: `zi9oun1lgi`, **Jeff Seah**, owned through Jeff's main Google account.
Dashboard: https://clarity.microsoft.com/projects/view/zi9oun1lgi/dashboard

`js/clarity.js` is included only on the eight public marketing, guide and legal
pages. Its production host and route allowlists exclude previews, intake pages,
private reports and the separate members host. Unknown query parameters,
sensitive referrers, automated visits, Do Not Track and Global Privacy Control
prevent loading. Do not add this tag to intake, payment or private pages.

The optional website insights notice asks permission before requesting any
Clarity script. Allow grants analytics storage through Consent V2 and always
denies advertising storage. No thanks loads no recorder. The decision lasts up
to 180 days in a dedicated browser storage key, `optional-clarity-v1`. The footer
control reopens the choice. Withdrawal denies consent, stops the recorder and
reloads; other tabs receive storage changes. Existing measurement is independent.

The Clarity project uses Balanced masking, explicit URL parameter masks and
Cookies Off (Consent Mode). The loader also masks forms and personalised tool
panels before requesting the recorder. The public privacy page explains it.

Run `node --test tests/*.test.mjs`. On loopback or a branch preview, append
`?claritypreview=1` to review the notice; this mode never requests Clarity.
For production verification, check no Clarity request before permission, one
correct project tag after Allow, and no recorder after withdrawal/reload.
Confirm arrival in Clarity separately; reports can take up to two hours.

Rollback: remove the eight `/js/clarity.js` tags. Do not remove `measure.js`,
`engagement.js`, guide analytics, payment verification or the Olares collector.
