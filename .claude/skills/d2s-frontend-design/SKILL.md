---
name: d2s-frontend-design
description: D2S Studio art direction for DOM UI (header, hero, panels, cards). Use when adding or restyling any interface element of the D2S site so it stays faithful to design/references and never looks like a generic AI template. Complements the global frontend-design skill.
---

# D2S frontend design

Source of truth: `design/references/01-home-final.png` (hero) and `03-lobby-final.png` (reception).
The screenshots include 80 px of browser chrome: page coordinates = reference − 80 px (viewport 1672×861).

## Tokens (app/globals.css — never hardcode elsewhere)
- Ink `--ink #0b1238`, body `--text #4d5884`, wall type `#6b7391`
- Blue `--blue #1570f0`, CTA gradient `--blue-bright → --blue-deep`, accent gradient `#0b55f0 → #14a4e4`
- Display font Plus Jakarta Sans 800, tracking −0.035em, line-height ≈ 1.0; body Inter
- Radii: pills for CTAs, 16 px cards, 22 px glass panels. Shadows: `--shadow-soft`, `--shadow-float`

## Measured hero layout (1672 wide)
- H1 3 lines at 3.08vw (≈51 px); badge 40 px tall; CTAs 46 px, ≈200 px wide; stats 26 px values
- Left gutter `--gutter` (4vw). Copy column ≤ 560 px. White haze on the left only.

## Rules
- The 3D scene is the hero: UI is light, airy, few elements. Glass = white 0.84–0.94 + blur 12–18 px, 1 px inner highlight.
- Micro-interactions: arrow +3 px, cards ≤ 3–5 px lift, no 3D tilt, no glow blobs, no gradients on text except the accent word.
- Wall/engraved typography (AUTOMATISER…, HUMAN IDEAS…) is 3D text in the scene (`WallType`), not DOM.
- Check every change with `npm run shots` and compare side by side before calling it done.
