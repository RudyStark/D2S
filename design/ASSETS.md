# Assets — origin & licence

| Asset | Source | Licence / status |
|---|---|---|
| `public/images/agents/*.webp` | Cut-outs of D2S agent posters (`design/agents-source/`, provided by D2S) | Owned by D2S — temporary 2.5D fallback until rigged GLB |
| `public/images/brand/d2s-logo.svg` | V1 vector redraw from the references | Owned by D2S — replace with the official SVG when available |
| `public/fonts/montserrat-*.woff` | @fontsource/montserrat | SIL Open Font License 1.1 |
| Plus Jakarta Sans, Inter (DOM) | Google Fonts via `next/font` | SIL Open Font License 1.1 |
| Vegetation | Procedural placeholders (pass 1) | — (CC0 Poly Haven models planned) |

## Poly Haven (CC0) — added in the visual correction pass
| Asset | Use | Source |
|---|---|---|
| `searsia_lucida` → `olive_a/b/c.glb` | Exterior trees (olive-like) | polyhaven.com/a/searsia_lucida |
| `shrub_04` → `shrub.glb` | Low shrubs | polyhaven.com/a/shrub_04 |
| `potted_plant_02` → `tropical.glb` | Large-leaf interior plant (pot dropped) | polyhaven.com/a/potted_plant_02 |
| `potted_plant_01` → `ficus.glb` | Interior ficus-like plant (pot dropped) | polyhaven.com/a/potted_plant_01 |
| `pachira_aquatica_01` → `pachira_a/b.glb` | Interior trees | polyhaven.com/a/pachira_aquatica_01 |
| `marble_01` → `marble_*.webp` | Floor / stone (desaturated + lightened) | polyhaven.com/a/marble_01 |
| `white_plaster_02` → `plaster_*.webp` | Walls | polyhaven.com/a/white_plaster_02 |
| `borghese_gardens` 1k HDR | Environment (glass, steel, water reflections) | polyhaven.com/a/borghese_gardens |

All Poly Haven assets are CC0. Sources are cached in `.cache/polyhaven` (not committed);
`npm run assets:plants` re-downloads and rebuilds the optimised GLBs.
