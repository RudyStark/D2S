---
name: visual-regression
description: Screenshot routine for the D2S scroll sequence (Playwright, reference comparison, regression baselines). Use after any visual change to the scene or the UI, and before reporting progress.
---

# Visual regression

## Commands (dev server on :3217)
- `npm run shots` — real scroll to 0 / 25 / 45 / 65 / 100 %, viewport 1672×861 (= references minus 80 px chrome),
  writes `design/captures/scroll-XXX.png` and side-by-side `compare-000.png`, `compare-100.png`.
- `npm run shots -- --mobile` — iPhone 13 captures. `--forced` uses `?p=` instead of scrolling. `--stops 0,0.5,1`.
- `npm run test:visual` — Playwright `toHaveScreenshot` baselines (`tests/visual`), update with `-- --update-snapshots`.

## Reading the comparison
Check in this order: framing (door axis ≈ 62 % width, sign top ≈ 105 px, door bottom ≈ 690 px), agent size and feet line,
contrast (logo must read navy), UI metrics (H1 on 3 lines, CTA row, stats), then mood (light, reflections).
The references are illustrations: match composition and feel, not physically impossible scales.

## Notes
- Headless Chromium runs on the GPU with `--use-angle=metal` (≈ 60 fps). `?capture=1` locks the quality tier and exposes `window.__d2s`.
- Wait for `__d2s.frame.settled` + ~1.4 s (camera inertia) before capturing.
