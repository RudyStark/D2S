---
name: webgl-r3f-cinematics
description: How the D2S continuous 3D world is built with React Three Fiber — zones, camera path, doors, agents, lights. Use when adding a room/zone, moving the camera, placing objects or agents, or touching components/experience.
---

# WebGL / R3F cinematics (D2S)

## Mental model
One world, metres, +Z = street, Z = 0 = glass façade, −Z = inside. Zones are laid out along −Z
(`lib/experience/world.ts` → `WORLD`, `ZONE_ORIGINS`). Nothing is a "section".

## Add a room (e.g. services)
1. Geometry: `components/experience/scenes/<Room>Zone.tsx`, mount it in `World.tsx`.
2. Camera: extend `DESKTOP/MOBILE/REDUCED` keys in `lib/experience/cameraPath.ts` (renormalise p or grow the track).
3. Beats: add ranges in `lib/experience/timeline.ts`; lengthen `.track` in `app/page.module.css`.
4. Agents: add a placement in `lib/experience/casting.ts` — one placement per agent type, never duplicated.
5. DOM: an overlay component driven by `useFrameUpdate` + `beatEased`.

## Camera
- Channels (x, y, z, yaw, pitch, roll, fov, shiftY, veil) use monotone cubic interpolation: no overshoot, C1.
- Keep pitch ≈ 0. Frame with `shiftY` (tilt-shift via `setViewOffset`) so verticals stay vertical.
- Compositions are *solved*, not guessed: measure screen points on the reference (scripts/measure.mjs), then
  back-project them through the camera model (fov 38, principal point 836 / 645 at shift 0.249) to get world positions.
  Façade p=0 = camera (−0.72, 0.37, 10.26) yaw 5°, fov 38, shift 0.249 — the low camera and the small yaw are what make
  the entrance read as architecture. Lobby p=1 = (0, 1.15, −4.4), fov 40, shift 0.185.
- Inertia lives in `CameraRig` (damp λ 9) on top of the director smoothing (λ 4.8). Drift ≤ 12 mm, no shake.

## Materials & vegetation
- Textures are CC0 Poly Haven, recoloured to white stone / white plaster; geometry UVs are in metres
  (`boxGeometryMeters`) so texel density is constant. Floor = `MeshReflectorMaterial` + marble maps (high tier).
- Vegetation is GLB only (`npm run assets:plants`): sphere clusters are banned. Reuse 3–5 models with rotation,
  ±15 % scale and a hue shift; one shared breeze uniform drives the sway.
- Bloom works on HDR values: keep `luminanceThreshold` ≈ 4, only emissive strips reach it.
- three r186: a material without its own `envMap` gets `scene.environmentIntensity`, and its
  `envMapIntensity` is **ignored**. Metals/glass that need their own reflection strength are listed
  in `ENV_BOUND` (materials.ts) and receive the HDRI via `bindEnvironment` (Lighting).
- The HDRI is an outdoor garden: indoor metal uses `steelInterior` (env ×0.6), otherwise frames mirror the sky.
- No `anisotropy` on thin metal frames: under the low sun through the glazing it turns them into glowing bars.
- A `roughnessMap` multiplies `roughness` (brushed map ≈ 0.47 → set 0.68 for ≈ 0.32 effective).
- Curved geometries (Cylinder/Lathe) have 0–1 UVs: clone maps with `withRepeat`, or rebuild UVs in metres
  (pots: arc length along the profile, circumference snapped to whole tiles).
- Floor: drei's reflector *multiplies* albedo by (1 − mirror + reflection × mixStrength). Indoors the albedo
  is lower with `mirror` 0.42 so reflections read; the plaza (z > 0) is patched brighter and additive.
- Water (`water/WaterSurface.tsx`): three `Reflector` with a custom shader (its render only runs when the
  water is drawn). Keep the water radius inside the coping, and objects 20 cm from a camera must not receive
  the sun shadow (shadow-map texels show as a knit pattern).
- Façade QA: `node scripts/facade-qa.mjs --tag X [--debug] [--p 0]` (overlay-50, diff, 8 crops vs ref 01).
  Solve positions instead of guessing: `node scripts/camera-probe.mjs '<json>'` back-projects reference pixels
  onto world planes (the pool circle was fitted this way).
- Signage policy (client decision): the only inscriptions are the façade D2S sign and the lobby drum logo + its
  tagline. No wall type, steles or decorative mottos elsewhere.
- Agent cards cast no shadow-map shadow (edge-on to the sun it is a thin smear): three soft decals instead.
- Loading: the world (agents included) is one Suspense boundary; the site loader (`SiteLoader`) opens only after
  `ready`. Never render before `ready` (director), never add drei `<Preload all/>` (6× cubemap render in one task),
  never paint big procedural canvases at runtime — add them to `BAKED_TEXTURES` and run `scripts/bake-textures.mjs`.
- Adaptive quality (`AdaptiveQuality` in ExperienceCanvas): judged only 3 s after the reveal, declines under ~30 fps.
  Reflections are the signature: `medium` keeps them (lower resolution); only `low` drops them.
- Lobby material QA: `node scripts/lobby-crops.mjs --tag X [--debug]` (crops A–F vs ref 03 + clipping %).
  In capture mode `window.__d2s.three` exposes `{ scene, gl }` for live probes (note: Lighting's useFrame
  re-imposes light intensities every frame — toggle `visible` to test a light).

## Objects
- `Block`/`FloorBlock`/`InstancedBoxes` share one unit box. Repeated items → instancing.
- Glass: real transmission on the high tier (`setGlassQuality`), transparent + env reflections below.
  **Anything that must stay visible through transmissive glass has to render in the opaque pass**: agents and canvas
  wall type use `transparent: false` + `CustomBlending` + `renderOrder` (transparent objects are skipped by the
  transmission pass). Troika SDF text is transparent → wall type is drawn into a canvas texture instead.
- Curved signage: `WallType` with `curveRadius` expects the position of the **cylinder axis**, not the front face.
- Doors: `SlidingDoors` reads the `doors` beat 1:1 (reversible). Door leaves sit in front of the glass plane (z 0.12).
- Logo: `LogoMesh` reads `LOGO_SRC`; `bendRadius` tessellates then bends positions and normals.

## Agents
`<AgentSlot type position height follow anchor />` — GLB if `public/models/agents/<type>.glb` exists
(manifest generated by `scripts/asset-manifest.mjs`), else the 2.5D cut-out. Rigged GLB: clip named `idle`.
