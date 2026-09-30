# Design refresh brief: homepage and /2027 (October 2026)

Written 2026-09-29 for a cloud Claude Code session. Everything needed is in this repo.
Use the `jeffseah-site-designer` agent (`.claude/agents/`) and the `distinctive-frontend` skill (`.claude/skills/`).

## Goal

Refresh the look and feel of **jeffseah.rocks** so it feels premium, alive and unmistakably Jeff's:
a BaZi and Qimen coach's site, calm and authoritative, with a sense of the night sky and old almanacs.
Add tasteful motion so the pages feel crafted, not templated. This is a visual pass, not a copy or offer rewrite.

**In scope, in priority order**
1. `index.html`, the homepage. CSS and JS are inline in the file. Sections: hero, `#calendar`, `#value`,
   `#features`, manifesto, `#process`, `#pricing`, `#faq`.
2. `2027.html`, the 2027 Annual Outlook sales page. Styles in `2027.css`, behaviour in `2027.js`.
3. Only if 1 and 2 are done: carry the refreshed look to the pages that share `2027.css`
   (`2027-next.html`, `power-calendar.html`, `welcome.html`) and to `book.html`. Keep them working; restyling is optional.

## Brand (keep and extend, do not replace)

> **Superseded for colour (2026-09-30):** the house style is now obsidian and gold; see `docs/design/BRAND.md`. The navy tokens below describe pages not yet rebuilt.

Tokens live in `index.html` `:root` and at the top of `2027.css`.

- Colour: `--void #05070f`, `--deep #080c1a`, `--midnight #0d1225` backgrounds; `--gold #c9943a`,
  `--gold-light #e8bc6a` accents; `--jade`, `--crimson` sparingly. Text `--text #ede8df`,
  `--text-muted #8f887a` (AA on navy). `--text-dim` is decorative only, never for words a buyer must read.
- Type: Cormorant Garamond (display, italic for emphasis), DM Sans (body), Space Mono (small labels),
  Noto Serif TC (Chinese characters). Push weight and size contrast harder than today.
- Existing motifs worth building on: twinkling star field, the spinning compass in the hero, the seal image
  `JS_Ceremonial_Seal_Final.png`, teaser tiles in `img/2027/tile-*.webp`.
- The report's own dark green and copper palette appears only inside product screenshots, not in page chrome.

## Motion direction

- **Hero entrance:** an orchestrated, staggered reveal (eyebrow, headline, subline, CTA), under about 1.2 s total.
- **Scroll reveals:** sections and cards rise and fade in with stagger. `2027.js` already has an
  IntersectionObserver `.reveal` system; reuse the same pattern on the homepage rather than adding a library.
- **Ambient depth:** subtle layered background (stars, slow gradient drift, faint parallax on the compass or seal).
  Keep it slow and quiet; nothing should pull the eye away from the words.
- **Micro-interactions:** buttons, pricing cards, FAQ items and nav links get considered hover and focus states.
  The featured pricing card (Premium) can have a gentle gold shimmer or glow.
- **Performance:** animate only `transform` and `opacity`. No animation libraries unless clearly justified;
  if one is used, load it from a CDN with `defer`. Keep the pages fast on a mid-range phone.
- **Accessibility:** `prefers-reduced-motion: reduce` must switch off entrance, scroll and ambient animation.
  `2027.js` honours it already; **the homepage currently does not, fix that.** Content must stay visible without JS.

## Do not break (hard constraints)

- **Stripe links.** Every `buy.stripe.com` URL stays byte-identical. The four monthly plan buttons are in
  `index.html` `#pricing`; the Outlook links are in `2027.js`.
- **Price step on 1 Jan 2027.** Keep `PRICE_STEP_AT`, `PRICE_NOW`, `PRICE_LATER` and the link switch in
  `2027.js`, and the `data-price-home` attributes plus the script that swaps them in `index.html`.
  Any element carrying a price must keep its `data-price-*` hook.
- **Hooks used by JS:** keep ids and classes the scripts query (`#nav`, `.nav-toggle`, `#navMenu`, `.faq-card`,
  `.faq-q`, `.faq-a`, `.reveal`, section ids used as anchors). If you rename one, update every reference.
- **Forms and intake:** do not touch the form fields, names or POST targets in `2027-next.html` and `welcome.html`.
- **SEO and metadata:** keep titles, meta descriptions, Open Graph tags and JSON-LD as they are.
- **Copy:** no changes to prices, offer terms or sales copy. Small layout-driven tweaks (a line break, a label)
  are fine; list them in the handoff.
- **Do not link a full sample report** from `/2027`. Teaser screenshots only (Jeff's decision, 2026-09-27).
- **No em dashes** anywhere, including comments and commit messages.
- Backend files (`api/`, `lib/`, `tests/`, `scripts/`, `ops/`) are out of scope. Run `node --test tests/*.test.mjs` before the final push anyway.

## Process

1. Look at the live site first (https://jeffseah.rocks and https://jeffseah.rocks/2027) and the current code.
2. Before large edits, write a short direction note to `docs/design/DIRECTION.md`: the concept in a few lines,
   the type scale, any new tokens, and the motion list. Commit and push it, so Jeff can read it from the preview branch.
3. Build the homepage, then `/2027`. Commit in small steps with clear messages, and push the branch as you go
   so Vercel previews update.
4. QA at 390, 768 and 1200 px as the agent file describes. Save the screenshots to `docs/design/qa/` (ignored by Vercel).
5. Finish with a handoff in `docs/design/HANDOFF.md`: what changed and why, open questions, anything left undone.

Never push to `main`. Jeff reviews the Vercel preview and merges himself.
