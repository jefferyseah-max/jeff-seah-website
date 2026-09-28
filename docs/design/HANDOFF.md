# Handoff: October 2026 design refresh

Branch `design/refresh-2026-10`. Model: unverified. Direction note: `docs/design/DIRECTION.md`.
Screenshots: `docs/design/qa/` (390, 768, 1200, 1440; normal and reduced motion; menu open;
stem ring; Bagua mid-assembly and settled; FAQ open).

## What changed and why

### Homepage (`index.html`)

- **Hero Luopan.** The single spinning SVG is replaced by a real compass built in four plates,
  each turning at its own speed and direction: 24 Mountains with degree ticks (240 s),
  Later Heaven trigrams drawn as lines with their names (180 s, reverse), twelve Earthly
  Branches (120 s), ten Heavenly Stems (90 s, reverse). Nine hairlines draw on at load from
  the outside in, the Heaven Pool holds a Taiji and a needle that settles on north with a
  damped swing then idles, and a faint light sweep crosses the plates every 26 s. Fine
  pointers get a 7 degree tilt; scrolling parallaxes the wrapper. All of it pauses when the
  hero leaves the viewport. Characters sit radially, as on a real Luopan, so there is no
  per-glyph counter-rotation any more. The old `@import` of Noto inside the SVG is gone.
- **Hero copy entrance** tightened to finish inside 1.2 s; the display line is larger with a
  softer gold glow; the CTA arrow slides on hover.
- **Bagua unfolding** in `#calendar`: the eight trigrams start scattered on a hairline grid,
  snap inward on a spring curve to the Later Heaven octagon (north at top), the Taiji fades
  in, then the whole emblem drops to a 13 percent watermark behind the copy.
- **Personal Alignment card**: the static table is now an orbital ring of the ten stems around
  the 甲 Day Master. Each stem breathes in its element colour (jade, ember, ochre,
  champagne, indigo). Hover previews, click, tap or focus commits; arrow keys move round
  the ring; the readout is an `aria-live` region and a visually hidden paragraph explains the
  widget. Gold arcs link the chosen stem to the Day Master. The engine derives the Ten God
  from element and polarity, names the five combinations (甲己合土, 乙庚合金, 丙辛合水,
  丁壬合木, 戊癸合火), and flags 庚 as the Luck Pillar and 丙 as the Annual Qi. The four facts
  (Day Master, Luck Pillar, Annual Qi, Peak Window) are kept below the ring.
- **FAQ**: each card carries its element; on open a 1 px line traces the generating cycle
  from that element (水 木 火 土 金) and five dots light in sequence beside the tag, which
  takes the element colour. Disclosure `aria-expanded` and `aria-controls` added.
- **Ambient**: an aurora layer (gold and indigo pools drifting over 48 s) under the stars.
- **Micro**: nav link underline, featured price card gold sheen and halo, staggered card
  reveals in the features, pricing and FAQ grids, focus-visible states on buttons.
- **Reduced motion and no-JS**: `html.js` gates the hidden reveal state so content is visible
  without JS; `prefers-reduced-motion: reduce` stops stars, aurora, every Luopan plate, the
  needle and sweep, the entrance, reveals, the Bagua (rendered assembled as the watermark),
  the ember breathing, the sheen, the typewriter (shows one line) and the calendar pulse.

### `/2027` (`2027.html`, `2027.css`, `2027.js`)

- A lighter three-plate Luopan draws on and drifts behind the cover art, paused offscreen.
- Aurora layer, nav underline, tile hover lift with a slow image zoom, who-card lift, FAQ
  card stagger and lift, order card sheen, larger h2 scale, hero sequence inside 1.25 s.
- `2027.js` gains only the offscreen pause observer. Price step and Stripe injection untouched.
- Noto Serif TC 400 added to the page's font request for the Branch characters.

### Shared pages

`2027-next`, `welcome`, `power-calendar` and `book` were only smoke-tested (load, no console
errors, no overflow). They inherit the nav underline, button focus states and FAQ hover from
`2027.css`; nothing else was restyled.

## Copy tweaks (layout-driven)

- Personal Alignment card label "BIRTH CHART ANALYSIS" is now sentence case in mono, with a
  "Touch a stem" hint. The readout sentences are new microcopy for the demo, not sales copy.
- No prices, offer terms or sales copy changed. No em dashes added.

## Checks

- `node --test tests/*.test.mjs`: 27 pass.
- `git diff origin/main -- '*.html' '*.js' | grep buy.stripe`: no changes.
- Playwright (Chromium) at 390, 768, 1200 and 1440, normal and reduced motion: zero console
  errors, no horizontal scroll, mobile menu opens and closes, FAQ opens and closes, four
  Stripe links on the homepage and four on `/2027` (three on `/power-calendar`).

## Open points for Jeff

- The stem ring uses `color-mix()`; browsers older than 2023 fall back to a plain dark button.
- The Luopan adds about 31 KB of inline SVG to the homepage (compresses well). The hero LCP
  element is still the headline text.
- The hexagram texture on `/2027` reads as dark bars on very wide screens; left as is.
- Preview: Vercel builds the branch; share link via the Vercel MCP `get_access_to_vercel_url`.
