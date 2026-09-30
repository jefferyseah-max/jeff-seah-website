---
name: tactile-page-rebuild
description: Use when rebuilding or redesigning a sales, landing, home, booking or offer page to convert better, in any industry, especially a static HTML site whose page reads like a brochure (long essays, stacked screenshots, static tables, several competing offers) and the owner wants it interactive, premium and high-converting.
---

# Tactile Page Rebuild

## Overview
Turn a page people read into a page people use. One computed interaction gives the visitor a real but partial answer; the offer card sells the full answer. The gap between the two is the sale, so the interaction must be honest about what it cannot know.

## Phases, in a prototype file
| # | Phase | Output |
|---|---|---|
| 0 | Audit | Claims ledger (below), the one offer this page sells, what dilutes it |
| 1 | Shell, hero, teaser | Tokens, fonts, ambient layer, hero, real-deadline scarcity, a teaser in the fold that returns a partial result from 1 or 2 inputs |
| 2 | Signature interaction | A generator: JSON data model, scoring function, visuals assembled from the result |
| 3 | Conversion engine | Offer card, upsell bridge as one sentence (never a second price table), 5-question FAQ, mobile order bar, footer |
| 4 | Polish | Brand-mark micro-interactions, background watermark depth |
| 5 | Ship | Production hardening and deploy (checklist below) |

Prototype as `<page>-rebuild.html` with `<meta name="robots" content="noindex">` on a branch. Replace the live file only in phase 5.

**Owner review gates (three, each a stop and wait):**
1. After phase 0: the ledger's conflicts and open questions.
2. After phase 3: the working prototype (local preview or branch preview link) with screenshots at both widths.
3. Before merging in phase 5: the production preview.

When the owner is driving phase by phase, stop after every phase instead. An urgent deadline shortens the time between gates; the three gates still happen.

## Phase 0: claims ledger
Before writing any copy, build a table: claim, source, status. Sources, in order of authority: the owner's recorded rulings and project docs, then the **deployed** page (fetch it; also `git fetch` and read `origin/main`, never a stale local checkout), then the owner's brief. The brief is the least reliable source: briefs recycle old promises. Every value-stack item, FAQ answer and price must trace to a ledger row. Send conflicts to the owner as a short list; pick the safer live wording meanwhile.

If another page on the site was already rebuilt this way, read it first: its footer, nav, links, tone and anything the owner removed from it are decisions to reuse, not redo.

## Honest interactivity
- Inputs drive a real computation over real domain data: calendar pillars, actual package inclusions, real slots, real specs. Never random, placeholder or "illustrative" values.
- Beside the result, state its basis and what the paid product adds ("Indicative: built from X; your report uses Y").
- Locked or teaser visuals are neutral shimmer, never invented scores.

## Stack
One self-contained HTML file: Tailwind (Play CDN while prototyping, compiled for ship), Alpine.js (stores for state shared across sections: offer price, visitor inputs), GSAP (timelines built from data), inline SVG built with `createElementNS`. Skip Three.js/WebGL unless 3D is the product.

## Ship checklist
- Copy from the live page verbatim: title, description, canonical, icons, OG/Twitter tags, JSON-LD. Remove `noindex`.
- Payment and booking links and any date-based price switch: identical to live.
- Compile Tailwind; keep config under a path the host does not publish. No CDN script in production.
- Keep any scope or disclaimer line the old page had. Update project docs that describe the page.
- Branch, PR, host preview, verify, merge, poll production until the new HTML is served, then check assets, links and `noindex` with curl.

## Verification, every phase
**REQUIRED:** follow `references/verification.md` (headless Chrome at 1440 and 390 px, interactions driven by script, animations fast-forwarded).

## Reference
- `references/patterns.md`: offer store with price step, generative SVG and GSAP sequencer, FAQ accordion, mobile order bar, logo sheen and hover ring, Luopan-style watermark.
- `references/gotchas.md`: failures already hit, with fixes. Read before phase 2 and before shipping.
- `scripts/logo_layers.py`: logo on black to transparent PNG, optionally split into ring and centre layers. `scripts/nocache_server.py`: local preview server that defeats browser caching.

## Cloud or local
Cloud sessions see only GitHub, so this skill must be committed in the repo at `.claude/skills/tactile-page-rebuild/` (use `git add -f` if `.claude/` is git-excluded; keep `.claude/` in the host's ignore file). Cloud can do phases 0 to 5 for code: build, headless checks, branch previews through the host's MCP. Local only: payment dashboards, Google Sheets and Apps Script, anything behind the owner's logins, the in-app browser pane.
