# Verification recipe

Run after every phase and again on the host preview and on production.

## 1. Serve without caching
`python scripts/nocache_server.py 5173` from the repo root (sends `Cache-Control: no-store`). A plain
`python -m http.server` lets the browser keep an old copy, so edits look missing.
If a browser already cached the page, load it once with `?v=2`.

## 2. Use a headless browser you control, not a hidden pane
An in-app browser pane or background tab throttles `requestAnimationFrame`: GSAP timelines crawl
(31 frames in 14 s was measured), screenshots show half-faded heroes and half-drawn paths. Do not
"fix" animations based on those screenshots. Use chrome-devtools MCP (`new_page` with an
`isolatedContext`, `resize_page`, `emulate`, `evaluate_script`, `take_screenshot`) or Playwright.

## 3. Two widths, every time
- Desktop: `resize_page` 1440 x 900.
- Phone: `emulate` viewport `390x844x2,mobile,touch`, then reload.
At both: `document.documentElement.scrollWidth === innerWidth` (no horizontal scroll), a viewport
screenshot of each section, and a full-page screenshot only for layout (fixed bars overlap in it).

## 4. Drive interactions by script, assert state
```js
async () => {
  const wait = ms => new Promise(r => setTimeout(r, ms));
  await wait(2500);                                   // entrance choreography
  document.querySelectorAll('[data-node]')[6].click();  // teaser input
  await wait(1200);
  const c = Alpine.$data(document.getElementById('when-to'));
  gsap.globalTimeline.getChildren(true, true, true).forEach(t => t.progress(1)); // fast-forward
  return { phase: c.phase, result: JSON.stringify(c.dossier),
           links: [...new Set([...document.querySelectorAll('a[href*="stripe"]')].map(a => a.href))],
           sw: document.documentElement.scrollWidth };
}
```
Check: every generated variant (each goal or option) produces a sensible result, not just the default;
payment links are the expected ones; accordions open one at a time; the mobile bar is hidden at the top,
shown mid-page, hidden over the price block.

## 5. Accessibility and failure modes
- `prefers-reduced-motion: reduce`: content visible, no entrance or ambient animation.
- Buttons expose `aria-pressed` / `aria-expanded`; results sit in an `aria-live="polite"` region.
- Content must not depend on GSAP finishing: keep a timed failsafe that removes the hidden state.
- `list_console_messages` with types error and warn: none except the Tailwind CDN warning while prototyping.

## 6. Production checks after merge
Poll until the new HTML is served (look for a string only the new page has), then curl: the page,
its CSS, new images (200), config paths the host should not publish (404), payment links present,
`noindex` absent, JSON-LD price unchanged, sibling pages still 200.
