# D2S Studio — site immersif

Première partie du site de D2S Studio, agence IA : une agence virtuelle que l'on traverse au scroll.
Façade → approche → ouverture des portes → traversée → accueil, dans un seul espace 3D continu.

## Stack
Next.js 16 · React 19 · TypeScript · React Three Fiber · drei · postprocessing · GSAP ScrollTrigger · Lenis · Zustand · Playwright

## Démarrer
```bash
npm install
npm run dev -- --port 3217
```

Paramètres d'URL utiles :
- `?debug3d=1` — progression, caméra, FPS, beats et sauts rapides
- `?p=0.45` — fige la séquence à une progression
- `?quality=high|medium|low` — force un niveau de qualité

## Scripts
| Commande | Rôle |
|---|---|
| `npm run shots` | Captures au scroll réel (0/25/45/65/100 %) + comparaisons avec `design/references` |
| `npm run test:visual` | Régression visuelle Playwright |
| `npm run check:a11y` | Mouvements réduits, clavier, erreurs console |
| `npm run assets:agents` | Détourage des affiches agents (macOS, Apple Vision) → WebP |
| `npm run assets:manifest` | Liste des modèles GLB présents (bascule image → 3D automatique) |

## Architecture
- `lib/experience/` — timeline (beats), trajectoire caméra, dimensions du monde, casting des agents, boucle unique (`director.ts`)
- `components/experience/` — Canvas, zones 3D (`scenes/`), portes, agents (`AgentSlot`), lumières, effets, debug
- `components/overlays/` — interface DOM pilotée par le scroll (hero, accueil)
- `public/images/brand/d2s-logo.svg` — logo unique (header + enseigne 3D + cylindre)
- `public/models/agents/<type>.glb` — modèles riggés : remplacent automatiquement les images détourées
- `.claude/skills/` — règles projet (direction artistique, cinématiques, performance, assets, tests, accessibilité)

Pour ajouter une pièce de l'agence : voir `.claude/skills/webgl-r3f-cinematics/SKILL.md`.
