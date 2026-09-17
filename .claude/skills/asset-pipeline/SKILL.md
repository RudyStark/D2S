---
name: asset-pipeline
description: Asset organisation and conversion for D2S (agent cut-outs, logo SVG, GLB models, textures, fonts, CC0 sourcing). Use when adding, replacing or optimising any image, model, texture or font.
---

# Asset pipeline

## Layout
- `design/references/` — visual targets (not shipped). `design/agents-source/<type>.png` — agent posters (not shipped).
- `public/images/agents/<type>.webp` + `<type>-avatar.webp` — generated cut-outs.
- `public/images/brand/d2s-logo.svg` — the ONLY logo file (header + 3D sign + drum). Replace it to rebrand; keep the viewBox ratio or update `LOGO_VIEWBOX` in `lib/brand.ts`. Filled paths are extruded, stroked paths become ribbons.
- `public/models/agents/<type>.glb` — rigged agents (types: automation, support, prospection, content, data).
- `public/models/plants/*.glb`, `public/textures/*.ktx2`, `public/fonts/*.woff` (troika needs woff/ttf, not woff2).

## Commands
- `npm run assets:agents` — Apple Vision cut-out (`scripts/cutout.swift`) → trim → WebP q88 → `lib/generated/agent-images.json`.
- `npm run assets:manifest` — lists GLB files (runs before dev/build). The scene swaps billboard → GLB automatically.

## GLB rules
- Y-up, metres, feet at origin, facing +Z. Idle clip named `idle`. ≤ 25k tris per agent, 1–2k px textures.
- Compress: `npx gltf-transform optimize in.glb out.glb --compress draco --texture-compress ktx2` (or meshopt).
- Loader: `useGLTF(url, true, true)` enables Draco + Meshopt decoders.

## Sourcing
Only CC0 / owned assets (Poly Haven, own renders). Record origin and licence in `design/ASSETS.md`.
