# Mémoire projet — D2S Studio (backup de claude-mem)

Fichier tenu à jour à la main. Chargé automatiquement via `CLAUDE.md`. Mettre à jour à la fin de chaque passe.

## Préférences de l'utilisateur
- Communication en **français**.
- Commit / push **uniquement sur demande** (remote : https://github.com/RudyStark/D2S.git, branche `main`).
- Ne jamais annoncer « terminé » tant que les critères d'acceptation ne sont pas vérifiés sur captures.
- Travailler par passes ordonnées, capture après chaque passe, peu de paramètres changés à la fois.
- Ne pas refaire layout / caméra / scroll / positions d'agents / DOM sans demande explicite.
- Agents = PNG 2.5D temporaires derrière `<AgentSlot type=… />` (GLB riggés plus tard) — **ne pas régénérer les PNG**.
- Pas d'assets douteux : CC0 uniquement (Poly Haven), pas de téléchargement massif.

## Projet
Site immersif de D2S Studio (agence IA) : un seul monde 3D continu traversé au scroll.
Façade/hero → approche → portes qui s'ouvrent → seuil → lobby (accueil). Zones suivantes plus loin sur −Z.
Stack : Next.js 16, React 19, TS, R3F 9, drei 10, three 0.186, postprocessing, GSAP ScrollTrigger, Lenis, Zustand, Playwright.
Dev : `npm run dev -- --port 3217`. Références : `design/references/01…05`.

### Casting (fixe, sans doublon)
- Façade : Création de contenu (gauche), Support client (droite).
- Lobby : Automatisation (accueil), Prospection (gauche), Analyse de données (droite).

### Caméra (résolue depuis les références, ne pas toucher)
- p=0 façade : (−0.72, 0.37, 10.26), yaw 5°, fov 38, shiftY .249.
- p=1 lobby : (0, 1.15, −4.4), fov 40, shiftY .185.
- Beats normalisés dans `lib/experience/timeline.ts` ; horloge unique gsap.ticker → Lenis → R3F `advance()`.

### Layout monde (`lib/experience/world.ts`)
Façade z=0, bassin centre (−5.55, 10.55) R 4.62, lobby desk centerZ −21, drum R 3.6 h 7.2, plafond 7.2.

## Outils QA
- `npm run shots` : captures 0/25/45/65/100 % + `qa-000` / `qa-100` (diff vs références).
- `node scripts/lobby-crops.mjs --tag X [--debug]` : crops A–F du lobby vs réf 03 + % de clipping.
- URL : `?debug3d=1`, `?p=0.45`, `?quality=…`, `?capture=1` (expose `window.__d2s` + `.three {scene, gl}`), `?debugMaterials=1` (sans agents/bloom/overlay).
- Captures dans `design/captures/` (gitignoré).

## Leçons techniques (three r186 / drei)
- `material.envMapIntensity` est **ignoré** si le matériau n'a pas sa propre `envMap` (remplacé par `scene.environmentIntensity`). → `ENV_BOUND` + `bindEnvironment()` (materials.ts / Lighting).
- Pas d'`anisotropy` sur les cadres métal fins : sous le soleil rasant, ils deviennent des néons.
- `roughnessMap` multiplie `roughness` (map brossée ≈ 0.47 → roughness 0.68 ≈ 0.32 effectif).
- Lighting `useFrame` réimpose les intensités chaque frame : pour tester une lumière, basculer `visible`.
- drei `MeshReflectorMaterial` : albedo × (1 − mirror + reflet × mixStrength). Intérieur : albedo plus bas + mirror 0.42 ; parvis (z > 0) patché plus clair et additif (`patchFloorZones`).
- N8AO dans le composer : `configuration.gammaCorrection = false`. Bloom sur valeurs HDR.
- Objets transparents exclus de la passe de transmission → agents / WallType en passe opaque (`CustomBlending`).
- Cylinder / Lathe : UV 0–1 → `withRepeat()` (clone) ou UV recalculées en mètres.
- Canvas → `alphaMap` : dessiner en niveaux de gris opaques (alphaMap lit le canal vert).
- Scripts Python d'édition : toujours `assert` + écrire le fichier (un `replace` silencieux a déjà faussé des tests).

## Historique
- d13f797 — passe de correction visuelle (fidélité références).
- Passe MATERIAL REALISM + LIGHTING lobby (non commitée à ce jour) : lumières recalibrées, fût `featurePlaster`, bureau multi-matériaux, sol marbre procédural 2.1 m + reflets, pots `planterStone`/`planterCeramic` + ombres de contact, acier satiné, AO de contact. Reste partiel : reflets du verre (il faudrait une sonde de réflexion).
- claude-mem : quota hebdomadaire du fournisseur `claude` épuisé (2026-09-17/18). Correctif possible côté utilisateur : `CLAUDE_MEM_PROVIDER` = `gemini` ou `openrouter` + clé dans `~/.claude-mem/settings.json`.

## Bassin (façade, réf 01) — fait
- `components/experience/water/WaterSurface.tsx` : `WaterSurface` = `Reflector` three (qualité high) avec shader maison
  (vaguelettes procédurales, reflet plan étiré verticalement, voile de ciel 30 %, Fresnel, alpha prémultiplié,
  scintillements directionnels + twinkle). Qualités medium/low : ciel analytique. Rendu du reflet seulement si l'eau est à l'écran
  (~25 % de coût à p=0, rien ailleurs).
- `PoolFloor` : fond bleu pâle + caustiques animées (Worley maison).
- Eau étendue dans la margelle (`innerR + 0.01`) : sinon interstice visible (caméra p=0 à ~20 cm du bord).
- Margelle : marbre `deskStone` + UV en mètres ; `receiveShadow` coupé (grille de shadow map visible de si près).

## En cours / à faire
- Zones suivantes (services, réf 05) : à démarrer quand demandé.
- Rien de commité depuis d13f797 (passe matériaux lobby + bassin + memory.md/CLAUDE.md).
