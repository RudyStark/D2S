---
name: webgl-performance
description: Performance budget and profiling routine for the D2S WebGL scene (DPR, quality tiers, draw calls, textures, post-processing, mobile). Use before adding heavy assets or effects, or when FPS drops.
---

# WebGL performance

## Budgets
- 60 fps on a recent desktop; ≥ 45 fps mid mobile (tier `low`).
- Initial download: ≤ 8 MB (agents WebP ≈ 450 KB total today). Plants/props GLB ≤ 1.5 MB each, Draco/Meshopt.
- Draw calls ≤ 250 (check `renderer.info.render.calls` in the debug console). Dynamic lights: 1 sun (shadows) + 3 points.

## Tiers (lib/experience/quality.ts)
high: DPR ≤ 2, shadows 2048, N8AO + bloom + SMAA, reflective floor · medium: DPR ≤ 1.5, shadows 1024, bloom, no AO/reflections ·
low: DPR ≤ 1.25, no shadows, no post, MSAA. `PerformanceMonitor` downgrades automatically (disabled by `?quality=` / `?capture=1`).

## Known traps (already hit)
- N8AO inside EffectComposer: set `configuration.gammaCorrection = false` or the frame is washed out.
- Bloom works on HDR values: sunlit plaster > 1.0. Keep `luminanceThreshold` ≈ 4 and make emissive strips bright (×5–6).
- `PCFSoftShadowMap` is gone in three r18x: use `shadows="percentage"`.

## Routine
1. `?debug3d=1` → FPS per beat. 2. `npm run shots` prints headless FPS per stop.
3. Hide zones out of view (`FacadeZone` hides the plaza after `exteriorFade`). 4. Dispose geometries/materials created in `useMemo`.
