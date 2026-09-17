---
name: scroll-cinematics
description: Scroll → timeline pipeline of the D2S site (Lenis, GSAP ScrollTrigger, single clock). Use when changing scroll length, beats, smoothing, overlay timing or navigation-to-progress.
---

# Scroll cinematics

## Pipeline (lib/experience/director.ts)
`gsap.ticker` → `lenis.raf` → `frame.progress = damp(progress, target)` → `advance()` (R3F, `frameloop="never"`) → DOM updaters.
One clock, one value: WebGL and DOM always render the same progress.

- `frame.target` comes from one ScrollTrigger on `#sequence-track` (start top/top, end bottom/bottom).
- `frame.forced` (URL `?p=`) overrides scroll for debug and tests.
- Never store per-frame values in React state; overlays use `useFrameUpdate` and write styles directly.

## Beats (lib/experience/timeline.ts)
heroFade 0.08–0.24 · approach 0.10–0.46 · doors 0.26–0.45 · threshold 0.45–0.66 · headerCompact 0.46–0.58 ·
lightShift 0.56–0.80 · lobbyReveal 0.70–0.90 · settle 0.88–1 · lobbyUI 0.86–0.97.
Doors must be fully open before the camera reaches z ≈ 1 (p ≈ 0.52).

## Rules
- Lenis only on desktop without reduced motion (lerp 0.11). Mobile = native scroll + damping.
- Easing: `smootherstep` for beats, exponential damping for continuous values. No back/elastic eases.
- Track length: 720svh desktop, 520svh mobile, 420svh reduced (keep CSS and `SEQUENCE_LENGTH_VH` in sync).
- Programmatic navigation: `scrollToProgress(p)` (Accueil → 0, "Découvrir nos agents" → 1).
- Debug: `?debug3d=1` shows beats, camera, FPS and stop buttons.
