---
name: d2s-frontend-design
description: D2S Studio art direction for DOM UI (header, hero, panels, cards). Use when adding or restyling any interface element of the D2S site so it stays faithful to design/references and never looks like a generic AI template. Complements the global frontend-design skill.
---

# D2S frontend design

## Priority rule
The reference screenshots win over anything written here or in code.
`design/references/01-home-final.png` (hero) and `03-lobby-final.png` (reception) control composition, UI,
typography, scale, framing and light. Values below are only valid while they still match those images:
re-measure (overlay) before trusting them.

The screenshots include 80 px of browser chrome: page coordinates = reference − 80 px (viewport 1672×861).

## Typography (validated by ink-mask IoU against the reference)
- Display: **Inter Tight 800** — H1 50.5 px / line-height 51.5 px / letter-spacing −0.012em / word-spacing 0.12em.
  Candidates were rendered at the reference size and scored by mask overlap: Inter Tight 0.64, Inter 0.56, Manrope 0.63
  but with the worst line-1/line-3 ratio. Plus Jakarta Sans is rejected.
- Body: **Inter** — lead 16.25/25.5, nav 15, CTA 13, figures 25.5 (Inter Tight 600), labels 12.25, cue 10.5 (tracking 0.26em).
- Never fix a wrong font with letter-spacing; re-run the comparison (scripts/measure.mjs + overlay) instead.

## Tokens (app/globals.css — never hardcode elsewhere)
- Ink `--ink #0b1238`, body `--text #4d5884`, wall type `#5d6688`
- Blue `--blue #1570f0`, CTA gradient `--blue-bright → --blue-deep`, accent gradient `#0b55f0 → #14a4e4`
- Radii: pills for CTAs, 16 px cards, 22 px glass panels. Shadows: `--shadow-soft`, `--shadow-float`

## Measured layout (1672×861 page px)
Everything is written as `calc(N * var(--u))`, `--u = min(100vw/1672, 100svh/861)`.

Hero (01): badge 66,150 · 254×42 — H1 top 212, left 64.5 — lead 66.5,383 w 440 — CTAs 65,486 (203×48 + 205×48, gap 10)
— figures 68,570 (columns 106/154/auto, dividers at 174 and 328, values 25.5, labels 12.25)
— motto 65,741 (navy, tracking 0.3em) — cue centred, ring 56 at top 728 — team pill 1333,772 · 304×59.
Header: logo 92,31 w 116 — nav baseline row 43, item left edges 475/578/719/869/1020/1142 (façade) → 483/582/720/867/1017/1138 (lobby)
— CTA 1320,26 · 263×48 → 1262,20 · 250×48 — FR under the CTA at 1516,123 → inline at 1552,34.
Reception (03): mission panel 1086,176 · 351×532 (padding 32, radius 24) — bubble 321 wide, anchored to the receptionist
— figures card 76,638 · 504×82 — cue centred at 716.

## Rules
- The 3D scene is the hero: UI is light, airy, few elements. Glass = white 0.84–0.94 + blur 12–18 px, 1 px inner highlight.
- The hero haze only backs the copy: it must fade out before the first agent and never wash the 3D.
- Micro-interactions: arrow +3 px, cards ≤ 3–5 px lift, no 3D tilt, no glow blobs, no gradients on text except the accent word.
- Wall/engraved typography (AUTOMATISER…, HUMAN IDEAS…) is 3D text in the scene (`WallType`), not DOM.
- Check every change with `npm run shots` and read `design/captures/qa-000/overlay-50.png` and `qa-100/` (side-by-side, overlay-50, diff) before calling it done.
