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

Copier `.env.example` vers `.env.local`, puis renseigner les clés serveur nécessaires. Elles ne doivent jamais être préfixées par `NEXT_PUBLIC_` ni être commitées.

## May, Calendly et Resend

May, l’agente d’accueil du site, répond via `POST /api/may/chat` (réponse diffusée au fil de l’eau, NDJSON) avec Claude Sonnet 5 (`lib/server/may-agent.ts`). Ses connaissances sont générées à partir des contenus réels du site (`lib/services.ts`, `lib/team.ts`, FAQ, méthode), sans seconde source éditoriale. Ses outils sont exécutés par le serveur : `recommend_agent` (le calcul du diagnostic du site), `prepare_contact_request` (pré-remplit le formulaire, que le visiteur relit et envoie lui-même), `list_meeting_types` et `get_available_times` (Calendly : de vrais créneaux, affichés comme boutons).

Le formulaire `POST /api/contact` utilise Resend comme canal principal :

- notification interne à `CONTACT_TO_EMAIL`, avec l’adresse du prospect en `Reply-To` ;
- confirmation automatique au prospect depuis May ;
- transfert facultatif vers `CONTACT_WEBHOOK_URL` pour un CRM ou une automatisation.

Configuration de production sur le Worker Cloudflare `d2s` :

1. vérifier `d2saigency.com` dans Resend et créer une clé API ;
2. créer un Personal Access Token Calendly pour le compte qui porte les types de rendez-vous ;
3. créer une clé API Anthropic (console.anthropic.com) ;
4. dans **Cloudflare → Workers & Pages → d2s → Settings → Variables and Secrets**, ajouter comme secrets `ANTHROPIC_API_KEY`, `CALENDLY_API_TOKEN` et `RESEND_API_KEY` ;
5. ajouter les variables non secrètes de `.env.example`, notamment `CALENDLY_FALLBACK_URL`, `RESEND_FROM_EMAIL`, `RESEND_REPLY_TO_EMAIL`, `CONTACT_TO_EMAIL` et `NEXT_PUBLIC_SITE_URL` ;
6. redéployer le Worker après l’enregistrement des variables.

Le code refuse silencieusement d’inventer des créneaux : si Calendly est indisponible, May affiche uniquement `CALENDLY_FALLBACK_URL` ou propose le formulaire. En production, le formulaire renvoie une erreur si Resend n’est pas configuré, afin qu’aucune demande ne soit perdue sans avertir le visiteur.

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
