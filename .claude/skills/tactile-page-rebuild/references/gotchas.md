# Gotchas already hit, with fixes

| Symptom | Cause | Fix |
|---|---|---|
| You tell the owner the live page says X; it doesn't | Read a stale local `main` | `git fetch` and read `origin/main`, or curl the deployed page |
| Value stack promises emails, calendar sync or follow-ups the owner withdrew | Copied the brief | Claims ledger; the owner's rulings outrank the brief |
| Edits don't appear in the preview | Browser cached the page | `scripts/nocache_server.py`, or `?v=N` once |
| Hero looks blank or half-faded in screenshots | Hidden pane throttles rAF | Headless browser; fast-forward timelines before judging |
| A dashed SVG path is visible before its draw-on animation | `gsap.set(el, {strokeDasharray: L})` merges with the element's own `3 4` into `L, 4` | Set `` `${L} ${L}` `` with offset `L + 1`; restore the dash pattern `onComplete` with `clearProps` |
| `<template x-for>` inside `<svg>` renders nothing or breaks | Alpine templates in the SVG namespace | Build SVG in JS with `document.createElementNS` |
| Mobile order bar hides for a whole screenful of the value stack | Observer watches the whole `#order` section | Observe the price block (the element holding its own buy button) |
| Mobile order bar covers a sticky readout | Both pinned to the bottom | Offset the readout `bottom-[5.5rem]` below the `lg` breakpoint |
| Rotating a logo ring on hover shows nothing | A plain circle looks identical when rotated | Split the ring layer out; add a conic-gradient glint masked to it that rotates with it |
| Logo shows a dark square on the page | PNG has an opaque black background | `scripts/logo_layers.py` derives alpha from brightness |
| Watermark pulls the eye behind the headline | Solid shapes (trigram bars, Taiji fill) at 4.5 % | 3 to 3.5 % opacity, centre pushed toward the page edge |
| `cdn.tailwindcss.com should not be used in production` | Play CDN left in | Compile with the Tailwind v3 CLI; classes written only inside JS strings are still picked up when they are literals in the same file |
| Classes from the prototype missing after compiling | Class names built by concatenation (`'bg-' + c`) | Write full literal class names, or style those states with custom CSS variables (`.tone-gold { --tone: ... }`) |
| Best-window style summaries pick a month the path itself marks as a trap | Summary ranks by score only | Exclude flagged items (trap, vault) before ranking |
| Git Bash mangles backslashes in inline edits | Shell escaping | Use the Edit tool or a Python script with asserts |
