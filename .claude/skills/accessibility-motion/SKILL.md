---
name: accessibility-motion
description: Accessibility rules for the D2S immersive site — reduced motion, keyboard, focus, inert overlays, semantics, responsive. Use when adding interactive UI, new beats or camera moves.
---

# Accessibility & motion

- `prefers-reduced-motion`: camera profile `reduced` (short push, white veil cut through the doors, short settle),
  no Lenis, no drift/idle, damping λ 16, track 420svh. Any new move needs a reduced equivalent in `CAMERA_KEYS.reduced`.
- All text and CTAs are real DOM (`h1`, `h2`, `a`, `button`, `form`). Canvas is `aria-hidden`.
- Faded overlays must be non-interactive: `setInteractive(el, visible)` toggles `inert` + `aria-hidden`.
- Keyboard order: skip link → logo → nav → CTA → language → hero CTAs → (lobby UI once visible).
  The skip link scrolls to the reception and focuses `#mission-title`.
- Header never disappears; ≤ 1024 px uses the menu button (`aria-expanded`, Escape closes).
- Focus ring: 2 px `--blue`, offset 3 px. Hit targets ≥ 40 px.
- Test: `npm run check:a11y` (reducedMotion context, Tab through, no console errors).
