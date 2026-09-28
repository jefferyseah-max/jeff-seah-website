# Design direction: October 2026 refresh

Branch `design/refresh-2026-10`. Written before the large edits, as the brief asks.

## Concept in a few lines

A night sky over an old almanac. The navy stays deep and quiet, gold is used as hairline and
ink, never as a flood. The one loud object on the site is the Luopan in the hero: a real
geomancer's compass built from layered rings (24 Mountains, Later Heaven trigrams, twelve
Earthly Branches, ten Heavenly Stems) that turn at different speeds and directions, draw
themselves on with a gold hairline on load, and carry a needle that settles with a damped
swing. Everything else moves less than that: sections rise once, cards lift a few pixels,
the featured price card breathes a little gold.

Chinese Metaphysics on the page is accurate or it is not there: Later Heaven Bagua (後天八卦)
everywhere, the five stem combinations, the Ten Gods for a 甲 Day Master, the generating
cycle 水 木 火 土 金 in the FAQ.

## Type scale

Cormorant Garamond for display, DM Sans for body, Space Mono for labels, Noto Serif TC for
characters. Weights pushed further apart: display lines go to 300 italic at larger sizes,
labels stay tiny and tracked wide.

| Role | Size | Face |
|---|---|---|
| Hero statement | clamp(2.25rem, 4.6vw, 4.2rem) | DM Sans 300 |
| Hero display line | clamp(3.6rem, 9.2vw, 8rem) | Cormorant 300 italic |
| Section h2 | clamp(2.4rem, 4.4vw, 4rem) | Cormorant 300 |
| Body | 1rem / 1.7 | DM Sans 300, colour `--text-muted` or `--text` |
| Labels | 0.62 to 0.7rem, 0.25em tracking | Space Mono |

## New tokens (both `index.html` and `2027.css`)

- Wu Xing accents for the stem ring and the FAQ trace, muted so they sit inside navy and gold:
  `--wx-wood #5f9a86`, `--wx-fire #c4573a`, `--wx-earth #b8863f`, `--wx-metal #e6d3a3`,
  `--wx-water #6f86c2`.
- `--ease-spring: cubic-bezier(0.22, 1.35, 0.36, 1)` for the Bagua snap, `--ease-out` shared.

## Motion list

Homepage
1. Hero entrance: banner, eyebrow, statement, display line, subline, CTA, in 0.1 s steps,
   under 1.2 s total. Luopan rings draw on over 1.6 s while the copy lands.
2. Luopan: four rings rotate at 240 s, 180 s (reverse), 120 s, 90 s (reverse); needle settles
   with a damped swing then idles; a faint light sweep every 26 s; pointer tilt on fine
   pointers only; scroll parallax on the wrapper. All paused when the hero leaves the viewport.
3. Bagua unfolding in `#calendar`: eight trigrams snap inward from a hairline grid to the Later
   Heaven octagon, the Taiji fades in, then the whole emblem drops to a watermark.
4. Scroll reveals reuse `.reveal` with stagger delays on cards and steps.
5. Personal Alignment card: orbital ring of ten stems; hover, focus or tap draws a gold arc
   from the 甲 Day Master and labels the relationship (Ten God, combination or control).
6. FAQ: on open, a 1 px line traces the generating cycle from the card's element, and the tag
   lights in its element colour. About 1.6 s, then rests.
7. Micro: nav link underline, button lift, pricing card lift, featured card gold shimmer.

/2027
1. Existing hero sequence kept; a hairline Luopan drifts behind the cover art.
2. Tiles stagger in and lift on hover; the order card gets the shimmer; FAQ items lift.

Reduced motion: every entrance, ambient and hover animation is switched off; the Luopan and
Bagua render as static drawings; content is fully legible without JS.
