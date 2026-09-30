# Patterns (proven on jeffseah.rocks/2027; its `2027.html` is the full reference build)

## Page skeleton
```html
<html lang="en" class="preload">
<head>
  <script>/* hide [data-anim] only when motion is allowed; failsafe shows all after 2.5 s */
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) document.documentElement.classList.remove('preload');
    else setTimeout(() => document.documentElement.classList.remove('preload'), 2500);</script>
  <link rel="stylesheet" href="/css/<page>.css" />   <!-- compiled Tailwind at ship; Play CDN while prototyping -->
  <style>:root { /* brand tokens as CSS variables; custom classes the utilities can't express */ }
    .preload [data-anim] { opacity: 0 } [x-cloak] { display: none !important }</style>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
  <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.14.9/dist/cdn.min.js"></script>
</head>
```
Register Alpine stores and components in an inline script at the end of `<body>` on `alpine:init`.
Run the entrance timeline on `alpine:initialized` (after `x-for` has rendered).

## Offer store: one source for price, link and countdown
```js
const PRICE_STEP_AT = Date.UTC(2026, 11, 31, 16, 0, 0);  // local midnight expressed in UTC
Alpine.store('offer', {
  after: Date.now() >= PRICE_STEP_AT,
  get price() { return this.after ? 138 : 88; },
  get link() { return this.after ? LINK_LATER : LINK_NOW; },
  get daysLeft() { return Math.max(0, Math.ceil((PRICE_STEP_AT - Date.now()) / 864e5)); },
});
```
Every button: `<a :href="$store.offer.link" href="LINK_NOW">... USD <span x-text="$store.offer.price">88</span></a>`
(static `href` and text are the no-JS fallback). Scarcity badges read `daysLeft` and hide when `after`.

## Shared visitor input across sections
`Alpine.store('reader', { animal: null })`; the teaser writes it in a `$watch`, and later sections read it
through a getter and re-run their generator when it changes.

## Generator: data, then score, then stage, then sequence
1. `<script type="application/json" id="model">`: real domain rows plus per-goal weights and copy.
2. `compute(goal, input)`: pure function, returns rows with a score, a tag (flow, steady, friction, trap, vault) and reasons.
3. `render(svg, rows, vertical)`: draws the **finished** state with `createElementNS` (horizontal layout at 640 px and up, vertical below).
4. `sequence(refs, rows, hooks)`: hides, then builds one GSAP timeline from the rows. Duration and ease per row
   come from its tag (friction drags, flow runs), per-tag glyph animations, `tl.call(() => hooks.onRow(k))` to update
   an `aria-live` readout and running tally. Reduced motion or no GSAP: keep the finished render.
5. Keep the timeline in a closure variable, not in Alpine state. Kill it before re-running. Offer Skip (`tl.progress(1)`) and Replay.

## FAQ, one open at a time, animated height without JS measuring
```html
<section x-data="{ open: 0 }"> ...
  <button :aria-expanded="(open === i).toString()" @click="open = open === i ? null : i">...</button>
  <div class="grid transition-[grid-template-rows] duration-500" :class="open === i ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'">
    <div class="overflow-hidden"><p>...</p></div></div>
```

## Mobile order bar
```js
Alpine.data('orderBar', () => ({ pastHero: false, atPrice: false,
  get show() { return this.pastHero && !this.atPrice; },
  init() {
    const watch = (el, fn, o) => el && new IntersectionObserver(([e]) => fn(e), o).observe(el);
    watch(document.querySelector('[data-hero] .btn-primary'), e => { this.pastHero = !e.isIntersecting && e.boundingClientRect.top < 0; }, { threshold: 0 });
    watch(document.getElementById('order-price'), e => { this.atPrice = e.isIntersecting; }, { threshold: 0.2 });
  } }));
```
`fixed inset-x-0 bottom-0 lg:hidden`, `x-show="show"` with a translate-y transition, safe-area bottom padding,
and extra bottom padding on the footer so the bar never covers it.

## Brand mark: load sheen and hover ring
Split the logo into `ring.png` and `centre.png` (`scripts/logo_layers.py --split`). Stack both absolutely in one square.
- **Sheen:** an overlay with `mask-image: url(full-logo.png)` and a 115deg light band as a 300 % wide background.
  Add a class once after `window.load` + 900 ms that animates `background-position` from 130 % to -30 % over 1.2 s.
- **Hover (desktop only, `@media (hover:hover) and (pointer:fine)`):** rotate the ring layer, plus a conic-gradient glint
  masked by `ring.png`, 180deg over 1.1 s `cubic-bezier(0.45,0,0.2,1)`; the glint fades in while hovered.

## Watermark depth
One `<symbol>` (concentric rings, domain glyphs) in a hidden SVG, placed with `<use>` in a wrapper that is
`absolute inset-0 overflow-hidden pointer-events-none z-index:-1` inside a `relative` section. Opacity 0.03 to 0.035,
large (60rem+), centre near the page edge, static. The `overflow-hidden` wrapper prevents horizontal scroll.

## Tailwind build at ship
```js
// scripts/tailwind/<page>.config.js
module.exports = { content: ['./<page>.html'], theme: { extend: { colors: {...}, fontFamily: {...} } } };
```
`npx tailwindcss@3 -c scripts/tailwind/<page>.config.js -i scripts/tailwind/<page>.input.css -o css/<page>.css --minify`
(input file: the three `@tailwind` directives). Record the command in the project's instructions file.
