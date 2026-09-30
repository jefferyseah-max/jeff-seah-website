# jeffseah.rocks house style: obsidian and gold

Decided by Jeff on 2026-09-30. Applies to every page as it is rebuilt. `/2027` is the reference build and
`/book` follows it (2026-09-30); the homepage still uses the older navy and gold until its rebuild
(planned for a cloud session with the `tactile-page-rebuild` skill). This file supersedes the colour tokens in
`REFRESH_BRIEF.md` and `DIRECTION.md`.

Jeff's direction: obsidian and gold at the core, with other complementary tones welcome when they are
tastefully done. Not restricted to two colours.

## Core

| Token | Hex | Role | Contrast on obsidian |
|---|---|---|---|
| `obsidian` | `#0B0C10` | Page background | n/a |
| `coal` | `#13151B` | Panels, cards | n/a |
| `gold` | `#D4AF37` | The primary accent: CTAs, hairlines, key numbers | 9.3:1 |
| `champagne` | `#F3D98B` | Rare highlight (a vault opening, the best result) | 14.1:1 |
| `ivory` | `#EDE6D6` | Headings and body text (body at 70 % opacity) | 15.7:1 |
| `ash` | `#8A8F98` | Labels, captions, metadata | 6.0:1 |

## Wu Xing accents

Muted, and used only where the element carries meaning (a result, a tag, a data point, a small label).
Each passes WCAG AA for text on both `obsidian` and `coal`.

| Element | Token | Hex | Natural uses | On obsidian / coal |
|---|---|---|---|---|
| Wood 木 | `jade` | `#6FB39A` | Growth, availability, "open" states | 8.0 / 7.5 |
| Fire 火 | `ember` | `#E06D53` | Urgency, friction, traps, the early-bird badge | 6.0 / 5.6 |
| Earth 土 | `ochre` | `#C99A55` | Grounding, secondary warm tone | 7.7 / 7.2 |
| Metal 金 | `pearl` | `#D9DCE1` | Clarity, cool neutral highlight | 14.2 / 13.3 |
| Water 水 | `ink` | `#7F9BD1` | Calm, rest, night, depth | 7.0 / 6.5 |

The October refresh's `--wx-*` tokens map onto these. The old `--wx-fire #c4573a` failed AA on panels
(4.1:1), so Fire is now `ember`.

## Rules

- Gold is the only colour for buy and book buttons. Accents never fill a primary button.
- One accent leads per section; together, the accents stay under about a tenth of any screen.
- Colour meaning is fixed across the site: gold is flow or the best result, ember is friction or a
  trap, champagne is a vault or a rare highlight, jade is open or available, ink is rest.
- Backgrounds stay obsidian or coal. Accents appear as text, hairlines, small fills and glows,
  never as large panels.
- Ambient glows: gold at the top left, ember at the bottom right, at 10 to 12 % strength. Watermarks at
  3 to 3.5 % opacity.
- Type: Cormorant Garamond (display, 300 with italic gold emphasis, 600 for weight), Plus Jakarta
  Sans (UI and body, 300 to 800), Space Mono (labels, uppercase, wide tracking), Noto Serif TC
  (Chinese characters).
- Logo: `img/seal-mark.png` (transparent), with `seal-ring.png` and `seal-monogram.png` for the load
  sheen and hover ring. Never the black-backed `seal-128.png` on a page (it stays as the touch icon).
