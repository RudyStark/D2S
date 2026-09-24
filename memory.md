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
- **Version mobile (21/09) : faite par ChatGPT, NE PAS LA MODIFIER** (`components/mobile/`, `AdaptiveHome`,
  `tests/mobile/`, `design/MOBILE.md`). Claude travaille sur le desktop uniquement, sans QA mobile, sauf
  demande explicite. Voir la section « Version mobile 2D ».

## Projet
Site immersif de D2S Studio (agence IA) : un seul monde 3D continu traversé au scroll.
Façade/hero → approche → portes qui s'ouvrent → seuil → lobby (accueil). Zones suivantes plus loin sur −Z.
Stack : Next.js 16, React 19, TS, R3F 9, drei 10, three 0.186, postprocessing, GSAP ScrollTrigger, Lenis, Zustand, Playwright.
Dev : `npm run dev -- --port 3217`. Références : `design/references/01…05`.

### Casting (fixe, sans doublon)
- Façade : Création de contenu (gauche), Support client (droite).
- Lobby : Prospection = May (ACCUEIL, derrière le comptoir, ancre « reception »), Automatisation = Diva
  (gauche), Analyse de données = Morgan (droite). Échange May ↔ Diva décidé le 19/09 : l'accueil d'un site
  d'agence reçoit des prospects → May (qualifie, oriente, réserve le RDV) = démo en direct de son métier.

### Caméra (résolue depuis les références, ne pas toucher)
- p=0 façade : (−0.72, 0.37, 10.26), yaw 5°, fov 38, shiftY .249.
- p=1 lobby : (0, 1.15, −4.4), fov 40, shiftY .185.
- Beats normalisés dans `lib/experience/timeline.ts` ; horloge unique gsap.ticker → Lenis → R3F `advance()`.

### Layout monde (`lib/experience/world.ts`)
Façade z=0, bassin centre (−5.55, 10.55) R 4.62, lobby desk centerZ −21, drum R 3.6 h 7.2, plafond 7.2.

## Skills du projet (.claude/skills)
- `webgl-r3f-cinematics` (monde 3D), `find-skills` (vercel-labs, recherche de skills : `npx skills find …`),
  `ui-ux-pro-max` (nextlevelbuilder, 362 k installs, vérifié : scripts 100 % locaux). Demande utilisateur :
  l'UTILISER pour toute décision UI/UX → `python3 .claude/skills/ui-ux-pro-max/scripts/search.py "<requête>"
  --domain <ux|landing|style|typography|color|gsap…>` (ou `--design-system`, `--stack`).

## Marque : D2S Studio → D2S AIgency (20/09)
- LOGO VECTORIEL officiel fourni par le client (20/09) → `design/brand/logo-vector.svg` = SOURCE DE VÉRITÉ.
  `node scripts/build-logo.mjs` en tire `public/images/brand/d2s-aigency.svg` (masque du loader + 3D) et
  `lib/generated/logo.ts` (tracés + dégradés + boîte du sigle AI pour le logo inline). viewBox 60 318 1336 502,
  3 tracés : D2S, sigle AI, GENCY, chacun avec son dégradé et un fin liseré bleu. Le décalque potrace du
  début et le redessin à la main sont abandonnés (potrace désinstallé).
- 3D (21/09) : le SVG généré porte `id="mark|ai|wordmark"` ; `<LogoMesh accent />` sépare le « AI » en maillage
  à part (dégradé bleu de marque, halo qui respire 4,5 s, reflet qui balaie 5,5 s — même rythme que l'en-tête),
  sur l'enseigne de la façade ET le logo du fût. Les liserés fins des tracés remplis ne sont plus extrudés.
- Halo mal placé (lueur blanche au-dessus du nom) : SignHalo supposait une viewBox en 0,0 ; celle du logo
  commence à (60, 318). `LOGO_VIEWBOX` porte maintenant x/y et le centre les inclut.
- `components/ui/Logo.tsx` = SVG inline (mêmes tracés, à garder en phase avec le fichier) : seul « AI » est
  animé (halo qui respire + reflet qui balaie le glyphe), coupé en mouvement réduit.
- Tous les textes « D2S Studio » renommés « D2S AIgency » (métadonnées, loader, bulle du lobby, contact,
  pages, consentement, pied de page).
- À FAIRE si demandé : appliquer la typo du logo (géométrique carrée, type Michroma) aux kickers/titres ;
  allumer « AI » en bleu dans le loader (calque masqué séparé).

## ⚠️ PIÈGE R3F : useFrame avec priorité > 0 = plus aucun rendu automatique
- Cause RÉELLE de l'écran 3D blanc (20/09) : le hook du focus pull (PostEffects) s'était abonné en
  `useFrame(cb, 0.5)`. Une priorité > 0 dit à R3F « l'app rend elle-même » ; en qualité `high`/`medium` le
  composer (priorité 1) rendait, mais en `low` (pas de post-process) plus RIEN n'était dessiné → canvas vide.
  Corrigé : priorité 0 (la caméra tourne aussi à 0, donc pas de retard). Vérifier les 3 tiers après toute
  modif du rendu : `?capture=1&quality=high|medium|low` + `__d2s.three.gl.info.render.calls` > 0.
- Ce piège explique aussi pourquoi le bug empirait : une perte de contexte poussait la qualité en `low`
  (sessionStorage `d2s:gpu-trouble`), donc dans le tier cassé. Incident 1 → `medium`, incident 2 → `low`.

## Rendu 3D blanc au scroll (signalé le 20/09, Chrome)
- Non reproduit en automatisé (Chromium + WebKit, 1280→1920, scroll lent/rapide, redimensionnement, onglet).
  Symptôme décrit : le décor 3D devient blanc dès le scroll, le DOM reste → perte du contexte WebGL.
- Protections ajoutées : `cappedDpr()` (buffer ≤ 4,2 Mpx), MSAA ≤ 2 au-delà de 2,5 Mpx, `requestRender` au
  resize / retour d'onglet / pageshow (le frame figé pouvait être vidé), écoute `webglcontextlost/restored`
  → `store.glLost` (JAMAIS de setState qui re-rend `<Canvas>` avec un contexte mort : R3F lève « Cannot read
  properties of null (reading 'alpha') »), bandeau DOM « Le décor 3D s'est interrompu · Relancer »
  (ExperienceRoot), et `sessionStorage d2s:gpu-trouble` → qualité « low » au rechargement suivant.
- INCIDENT : un script Python d'édition a vidé `PostEffects.tsx` (write d'un tuple après un replace) ;
  reconstruit à la main. Règle : ne jamais écrire le résultat d'un `replace` sans vérifier son type.

## RGPD & sécurité (21/09)
- Constat : AUCUN cookie, aucune mesure d'audience, aucun appel tiers (polices via next/font auto-hébergées,
  modèles/textures locaux). Seul stockage : sessionStorage `d2s:gpu-trouble` (technique, exempté). → PAS de
  bandeau cookies. Si un outil d'audience/pub est ajouté un jour : bandeau de consentement obligatoire.
- Agents 3D : `useGLTF(url, false, true)` (meshopt seul) — `true` en 1er argument pointait le décodeur Draco
  de drei vers un CDN Google.
- Société (fournie le 21/09) : raison sociale D2S Studio (marque D2S AIgency), SIRET 539 068 098 00026,
  25 avenue Georges Pompidou, 93320 Les Pavillons-sous-Bois → lib/legal.ts (OFFICE, SIRET) + JSON-LD
  Organization (legalName, PostalAddress, identifier SIRET) + résumé citable. Restent : forme juridique,
  capital, TVA, e-mail, téléphone, directeur de publication, hébergeur, outil de réception, transferts hors UE.
- Pages : `/mentions-legales`, `/confidentialite` (`components/pages/LegalPage.tsx`) ; données société dans
  `lib/legal.ts` (null = marqueur orange « à compléter », rien d'inventé). Liens dans le pied de page, mention
  d'information + lien sous le formulaire, consentement « pour répondre à ma demande ». Base légale décrite :
  mesures précontractuelles (6.1.b) ; conservation 3 ans après le dernier échange.
- `/api/contact` : même origine (403), JSON seul (415), corps ≤ 16 Ko (413), 5 envois / 10 min / IP en mémoire
  (429), pot de miel + délai, validation bornée, caractères de contrôle retirés, timeout 8 s du webhook, aucune
  donnée perso dans les logs de prod. `.env.example` documente `CONTACT_WEBHOOK_URL`.
- En-têtes (next.config.ts) : CSP en PRODUCTION seulement (le dev a besoin d'eval) — `'wasm-unsafe-eval'` pour
  le décodeur meshopt, `blob:` pour les textures des GLB ; HSTS, nosniff, X-Frame DENY, Referrer-Policy,
  Permissions-Policy, COOP ; `poweredByHeader: false`. Vérifié sur `next start` : 3D OK, 0 violation CSP,
  0 requête tierce ; `npm audit --omit=dev` : 0 vulnérabilité.

## SEO & référencement IA (21/09)
- `lib/site.ts` : SITE_URL (= NEXT_PUBLIC_SITE_URL, repli localhost → À RENSEIGNER avant la mise en ligne),
  titre, description, résumé citable (SITE_SUMMARY), FAQ (8 Q/R, reformulent le contenu existant).
- Métadonnées complètes (layout) : metadataBase, canonical, Open Graph + Twitter (image 1200×630
  `app/opengraph-image.jpg`, capturée depuis le build de prod, 111 Ko), robots max-image-preview, icônes
  `app/icon.svg` (sigle AI) + `apple-icon.png`, `manifest.ts`.
- `robots.ts` (tout autorisé, robots IA nommés : GPTBot, ClaudeBot, PerplexityBot, Google-Extended…, /api/
  exclu), `sitemap.ts` (accueil + pages légales), pièces « en aménagement » en noindex, redirections 308
  vers les ancres (nos-services, nos-agents-ia, comment-choisir, contact).
- JSON-LD (`components/seo/StructuredData.tsx`) : Organization + WebSite + WebPage + 7 Services (Plug & Play,
  sur mesure, 5 agents avec missions) + FAQPage. FAQ VISIBLE (`FaqSection`, <details> natifs, 2 colonnes
  indépendantes) avant le contact : les données structurées doivent refléter du contenu visible.
- `/llms.txt` et `/llms-full.txt` (standard llmstxt.org) générés depuis les mêmes contenus (lib/llms.ts).
- Titres : vrais espaces entre les lignes visuelles (sinon « IAqui », « choisirvotre » pour les robots) ;
  alt descriptifs sur les portraits d'agents.
- PIÈGE : un composant serveur ne doit jamais importer lib/contact.ts (il tire le director / R3F →
  « createContext only works in Client Components ») → contenu pur dans `lib/contact-content.ts`.

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
- faf2edb — passe MATERIAL REALISM + LIGHTING lobby : lumières recalibrées, fût `featurePlaster`, bureau multi-matériaux, sol marbre procédural 2.1 m + reflets, pots `planterStone`/`planterCeramic` + ombres de contact, acier satiné, AO de contact. Reste partiel : reflets du verre (il faudrait une sonde de réflexion).
- claude-mem : quota hebdomadaire du fournisseur `claude` épuisé (2026-09-17/18). Correctif possible côté utilisateur : `CLAUDE_MEM_PROVIDER` = `gemini` ou `openrouter` + clé dans `~/.claude-mem/settings.json`.

## Bassin (façade, réf 01) — fait
- `components/experience/water/WaterSurface.tsx` : `WaterSurface` = `Reflector` three (qualité high) avec shader maison
  (vaguelettes procédurales, reflet plan étiré verticalement, voile de ciel 30 %, Fresnel, alpha prémultiplié,
  scintillements directionnels + twinkle). Qualités medium/low : ciel analytique. Rendu du reflet seulement si l'eau est à l'écran
  (~25 % de coût à p=0, rien ailleurs).
- `PoolFloor` : fond bleu pâle + caustiques animées (Worley maison).
- Eau étendue dans la margelle (`innerR + 0.01`) : sinon interstice visible (caméra p=0 à ~20 cm du bord).
- Margelle : marbre `deskStone` + UV en mètres ; `receiveShadow` coupé (grille de shadow map visible de si près).

## Passe façade (p=0, réf 01/02) — non commitée
- Mesure d'abord : `node scripts/facade-qa.mjs --tag X [--debug] [--p 0]` (facade-reference/current/side-by-side/
  overlay-50/diff + 8 crops) et `node scripts/camera-probe.mjs '<json>'` (rétro-projection page → monde).
- Bassin résolu depuis la réf : centre (−4.28, 9.84), innerR 3.17, margelle 16 cm avec ressaut + chanfreins.
- Panneau 3.24 × 1.2, logo 1.92 (scaleY 1), lettres décollées 1.5 cm, biseau, STUDIO épaissi (`strokeDepth`),
  ombre de contact par copies aplaties ; face `signFace` satinée, ligne LED `signBacklight`, halo discret.
- Montants 0.10 × 0.20 (RoundedBox), traverse 9 cm, vantaux 3.5 cm ; inox clair `steel` (#d3d7dd).
- Travée gauche de la porte vitrée (les deux réfs) ; `facadeGlass` (F0 ≈ 0.1) ; `doorGlass` plus clair ; env liés.
- `facadePlaster` neutre (piliers, volume haut) ; stèle + bloc d'accueil en `deskStone` (veiné, sans joints).
- Signalétique navy `#28314f` 600, tailles rétro-projetées ; `WallType overGlass` pour le texte sur verre.
- Végétation : ficus, pachira, bac carré, arbuste et une tropicale retirés ; oliviers en cadrage des bords.
- Agents : ombres = contact + occlusion + petite directionnelle (plus de disque dur, plus de traînée de carte).
- Lumière : soleil `#fff8ef` dehors → `#fff2e0` dedans, env 1.1 → 0.95, lobby plus lumineux vu de dehors ;
  valeurs à p=1 inchangées (lobby vérifié identique).
- Écart moyen à 01 : 49.0 → 43.0. Limites : portes fermées à p=0 (réf entrouverte, scroll interdit),
  lecture du logo encore un peu sombre, contraste du parvis < réf (sd 11 vs 16).

## Inscriptions (décision utilisateur)
- Seules inscriptions conservées : le panneau D2S STUDIO de la façade, et dans le lobby le logo du fût +
  le slogan « VOTRE ÉQUIPE, / AUGMENTÉE / PAR L'IA. » (choisi le 19/09, lignes courtes pour éviter la bulle). Tout le reste est supprimé (textes sur vitrine, piliers,
  pilastres, bloc d'accueil, motto « Ideas / Agents / Real impact » du Hero) ; stèles supprimées (composant retiré).
  Ne pas en réintroduire sans demande.
- Exception demandée le 19/09 : « INFORMATIONS » sur la façade du comptoir d'accueil (`WallType` courbé, même
  style que le slogan : navy #4f5878, 600, tracking 0.34, taille 0.17, centré à ~0.72 m). Le corps du comptoir a
  un biseau de 12 mm qui avance sa face avant : le texte est à outerR + 0.016 (sinon il est caché dedans).
- Lobby : bloc de chiffres (+250 projets livrés / 98 % / −70 %) retiré du LobbyOverlay (demande 19/09) ;
  `StatStrip` reste utilisé par le Hero de la façade.

## Contenu façade / menu (réf 01 et 03)
- Voile blanc du Hero mesuré sur 01 : blanc neutre ~0.95 de x 0 à 470, fondu jusqu'à 620, pleine hauteur
  jusqu'à y 640 puis atténué sur le bassin (`.haze` = gradient horizontal + mask vertical ; masque retiré sur mobile).
- Menu : item actif 600 + 15.6u (55 px comme la réf), survol = aperçu du soulignement, focus visible,
  sélecteur FR plus grand et gras (globe 22u), chevron qui pivote ; menu compact du lobby = fondu givré sans
  bord dur (mask), comme 03.
- Avatars de la carte équipe : portraits buste sur disque pâle (`node scripts/build-avatars.mjs`, à partir des
  découpes existantes, sans les régénérer) ; anciens avatars sauvegardés dans `.cache/avatars-before/`.
- Écart moyen p=0 vs 01 : 43.2 → 37.0.

## Loader du site (SiteLoader)
- `components/overlays/SiteLoader.tsx` : rendu serveur (couvre dès la 1re image), logo D2S Studio en masque CSS
  qui se remplit avec la vraie progression + liseré bleu, « Chargement de l'agence » + %, étapes, puis
  « Bienvenue chez D2S Studio » et ouverture en portes coulissantes (1.1 s) ; Hero en cascade ensuite
  (`html[data-site-loading]`). Scroll bloqué pendant (`setScrollLocked`). Réduit : fondu. `?capture=1` : ouverture
  immédiate (QA). noscript : loader masqué.
- Progression réelle : drei `useProgress` → store `assets` (LoadingBridge), `ready` (Suspense du monde, agents
  inclus), polices. Rampe lente (≥ 1 %/s, max 94 %) pour ne jamais paraître figé.
- Perf de chargement (prod, Chromium) : prêt en ~2.0 s au lieu de 3.9 s ; plus de gel de 15 s en dev.
  · textures procédurales PRÉCALCULÉES : `node scripts/bake-textures.mjs` → `public/textures/baked/*.webp`
    (151 Ko ; générées à l'exécution elles bloquaient 2.8 s et différaient sous Safari, sans canvas filter).
  · aucun rendu WebGL avant `ready` (director) ; ReadyMarker : envoi GPU des textures par tranches,
    `compileAsync`, 2 images de chauffe ; `checkShaderErrors` coupé en prod ; drei `<Preload all/>` retiré
    (rendu cubemap ×6 = gel 0.8 s). Reste ~0.4 s à la 1re image (post-process/ombres/reflets), sous le loader.

## Eau du bassin — choix utilisateur : « Référence 01 »
- Ambiance par défaut calée sur 01 (mesures dans la zone d'eau : rgb 189,203,218 vs réf 190,205,220 ;
  bleu − rouge 29 vs 30) : vaguelettes serrées (`freq` 2.6, houle 0.35), reflets étirés en traînées
  verticales (`streak` 0.22/1.9), ciel reflété azur, scintillements, voile du Hero allégé sur le bassin.
- Niveau d'eau abaissé à 0.175 (face intérieure de la margelle visible, comme sur 01).
- Variantes de comparaison conservées derrière `?water=1|2|3` (miroir calme, clair lagon, vivante).
- Bug « beau reflet puis eau bleue plate » : le PerformanceMonitor passait high → medium (qui coupait les
  reflets) après ~2,5 s sous 40 fps, échauffement compris. Corrigé : moniteur démarré 3 s après l'ouverture,
  baisse seulement sous ~30 fps, et `medium` garde les reflets (résolution réduite : sol 512, eau 0.42) ;
  seuls AO / dpr / ombres baissent d'abord. Le secours sans reflet (`low`) imite le rendu réfléchi.

## Margelle bois + pots noirs (choix utilisateur)
- Margelle du bassin en bois massif huilé type teck (`MATERIALS.wood`, CC0 Poly Haven `oak_veneer_01` teinté,
  `public/textures/wood_*.webp`) : 18 lames cintrées avec joints de 2 mm, fil du bois le long de la courbe,
  ton légèrement différent par lame, arêtes arrondies 8 mm, débord de 2,5 cm au-dessus de l'eau.
  Finition huilée : spéculaire et reflet d'environnement réduits (sinon le ciel délave le teck en rose saumon).
- Pots (lobby + façade) en noir : `planterStone` basalte mat, `planterCeramic` céramique noire satinée.
  Le bloc-jardinière à gauche de l'entrée vitrée est noir aussi. Pour qu'il ne paraisse pas gris sous le
  voile du Hero : la 3D publie son rectangle écran (`frame.rects.heroPlanter`) et le masque du voile
  (`.haze`) est découpé sur sa silhouette, sauf derrière les chiffres (rects d'encre mesurés, bords doux)
  pour qu'ils restent lisibles si le bloc passe dessous (autres formats d'écran, début du scroll).

## Enseigne halo + netteté des textes
- Enseigne façade : lettres « halo-lit » (`architecture/SignHalo.tsx`) — masque du logo flouté (2 falloffs) en
  additif sur la face, juste sous les lettres décollées ; face `signFace` un peu plus grise (#eceef1) pour que
  le halo ressorte. Les 6 copies d'ombre aplaties et l'ombre soleil sur la face sont supprimées (crénelées).
- Piège : THREE.Cache garde LOGO_SRC en texte (SVGLoader) → charger l'image sous une autre URL (`?raster`).
- Anticrénelage : MSAA dans le composer (`quality.msaa` : high 4, medium 2, low 0 ; ×2 max si DPR ≥ 1.75) + SMAA.
- Liseré clair autour du texte mural du lobby : blending custom appliqué à l'alpha (tampon < 1 sur les bords)
  → `blendSrcAlpha: One, blendDstAlpha: OneMinusSrcAlpha` dans WallType. Règle : tout CustomBlending doit
  garder l'alpha du tampon à 1.

## Logo du fût (lobby)
- Lettres décollées de 2 cm (bendRadius R+0.07) + `SignHalo` courbé (bendRadius) intensité 1.15 sur l'enduit,
  et reflet lumineux qui balaie le logo (`useLogoSweep` : bande oblique émissive, 1.5 s toutes les 7 s,
  désactivé en mouvement réduit). Pas d'effet sur le slogan (demande utilisateur).
- `WallType align="center"` centre optiquement : la ponctuation finale (, .) déborde hors du bloc.

## Contenus nettoyés (19/09, demande utilisateur)
- AUCUN chiffre inventé sur le site : StatStrip supprimé (Hero façade + lobby), chiffres et témoignage fictif
  retirés du bloc Méthode (SERVICE_STATS / SERVICE_QUOTE supprimés, masque du voile du Hero simplifié : plus
  de « rects d'encre »). Ne pas en réintroduire sans données réelles.
- Engagements de la méthode : « Un interlocuteur dédié, du premier échange au suivi » · « Rien n'est mis en
  service sans votre feu vert » · « Vos résultats mesurés et partagés chaque mois ».
- Diagnostic, temps récupéré = fourchette : temps hebdo (1,5 / 6 / 14 h) × 4,33 × part prise en charge selon
  la tâche (contenu 45–65 %, support 55–75 %, prospection 40–60 %, RH 40–60 %, données 50–70 %, autre 30–50 %)
  × facteur processus (classique 1, spécificités 0,85, unique 0,7) ; arrondi (5 h au-delà de 10 h) + jours de
  travail (7 h) ; note de bas expliquant le calcul ; aussi affiché pour « sur mesure » et joint au contact.

## Panneau « Notre mission » (lobby, 19/09)
- Décision utilisateur : la mission se lit SANS clic, reste À DROITE, en « joli bloc décoratif ». Pas de scroll
  en plus (le manifeste plein écran a été refusé : trop de scroll), pas de carte repliable, pas de fusion dans
  la bulle de May. Réalisé (≥1025 px) : bloc verre dense (4,5:1 malgré le lobby net derrière), aurore bleue +
  deux orbites fines avec un nœud qui tourne en haut à droite, liseré lumineux + éclat (Glass.module), icône
  dégradée au kicker, filet d'accent dessiné et titre révélé ligne par ligne à chaque arrivée de la caméra,
  bénéfices en bandeau teinté (3 colonnes) au pied. Mobile : panneau simple inchangé.

## Sections sous l'accueil (sans 3D) : Services puis Agents
- Ordre : piste 3D → `ServicesSection` → `AgentsSection` (`components/home/DesktopHome.tsx` depuis le 21/09). Le lobby reste derrière, flouté par le
  voile fixe `.backdrop` de Services (opacité = `frame.services`, 0 → 1 à l'arrivée de la section).
- Contenu dans `lib/services.ts` (textes réécrits à partir du brief client, décision du 19/09) :
  · Services = l'offre. Intro « L'IA qui s'adapte à vous, pas l'inverse. » ; service 01 « Agents IA Plug & Play »
    (fonctions Contenu/Vente/RH/Support, 5 bénéfices) avec `PlugDiagram` animé (interrupteur « Connecté », outils
    génériques reliés à l'agent, tâches d'exemple qui allument les outils utilisés — pas de marques tierces).
  · Méthode `MethodProcess` (21/09, desktop ≥ 1025 px) : PILOTÉE PAR LE SCROLL — bloc épinglé (sticky sous
    l'en-tête) pendant 4 × 0,42 écran (`SCROLL_PER_STEP`), chaque étape tient 45 % de sa part (`HOLD`) puis la
    ligne voyage vers la suivante (tête lumineuse, disque qui « arrive » + onde, carte de détail qui glisse
    dans le sens du scroll, barre de temps sous l'étape active, indice « Continuez à scroller ») ; clic /
    flèches = scroll jusqu'à l'étape. Pièges : un sticky ne descend pas dans le padding de son parent →
    espaceur `.pinSpace` ; `.glass[data-glass]` imposait `position: relative` → sélecteur plus lourd.
    QA : `node scripts/method-qa.mjs --tag X`. Sous 1025 px : ancien comportement (lecture auto).
  · (ancien, < 1025 px) 4 étapes en onglets accessibles (flèches clavier), lecture auto 5,2 s par étape
    quand visible (pause survol/focus, arrêt au clic), détail « Ce que vous obtenez / Votre rôle », 3 engagements
    (à confirmer par D2S), chiffres + témoignage (PLACEHOLDER à remplacer par un vrai avis).
  · Agents = titre « Des agents IA pour chaque défi… », note manuscrite, 5 cartes (`lib/team.ts`).
- ÉQUIPE (brief client du 19/09) — type 3D → agent : content = Déa (Créatrice de contenu), support = Loic
  (Support client IA), prospection = May (Commerciale IA, accueil du lobby), automation = Diva (Coordinatrice
  RH IA, lobby gauche), data = Morgan (Analyste de données IA — le brief donnait par erreur le texte de Loic ; rédigé en
  analyste, à confirmer). Missions = brief ; canaux, garde-fou humain (« Vous gardez la main ») et démo
  complétés dans la même logique. `lib/team.ts` : blurb, pitch, missions, channels, control, demo, tint.
- 1re version (étiquette de prénom + fiche dense + faux chat) REJETÉE par l'utilisateur (« les exemples c'est
  très mal fait »). Version actuelle :
  · Cartes : portrait plein cadre sur dégradé teinté (tint), légende en verre (rôle + blurb), prénom en grand
    qui se déploie au survol/focus (grid 0fr→1fr), voisines atténuées (opacité .72, saturation .75), flèche ↗ ;
    pastille d'aide lisible ; mobile = carrousel scroll-snap, prénom toujours visible.
  · `AgentDialog` : <dialog> natif, ouvert depuis la carte (--from-x/--from-y), hauteur FIXE
    min(800px, 100dvh−32px) pour que parcourir l'équipe ne redimensionne pas la fenêtre. Grille : intro
    (portrait, « En ligne », prénom, rôle, pitch, canaux) + missions numérotées + garde-fou à gauche (410 px) ;
    démo pleine hauteur à droite ; footer sticky (‹ avatars › + « Recruter {prénom} »). Mobile ≤900 px : panneau
    bas, ordre intro → démo → missions ; ≤560 px footer sur une ligne (‹ › + CTA), avatars masqués.
  · `AgentDemos.tsx` : 5 mini-interfaces produit jouées en séquence (`useSequence(beats, {run, reduced, play})`),
    démarrage seulement quand la scène est visible (IntersectionObserver dans `DemoStage`), « Rejouer »,
    réduit = état final. Barre agent en bas (avatar + ce que fait l'agent → « Terminé »). Déa : brief → post
    LinkedIn → accroches → programmé ; Loic : WhatsApp 21 h 47 → suivi commande → avis 5/5 ; May : lead
    86 → message perso → objection → RDV → CRM ; Diva : 48 CV → classement → présélection → invitations ;
    Morgan : question → KPI → courbe (révélée par clip-path, pas de dasharray avec non-scaling-stroke) →
    synthèse. « Démonstration illustrative, données fictives. »
- TRANSITION lobby → Services (choix utilisateur du 19/09, desktop uniquement) = « mise au point » :
  `lib/experience/focusPull.ts` (réglages + courbes move/soften/rack sur `frame.services`).
  · Caméra (CameraRig) : continue vers le comptoir (dolly 1,3 m, +8 cm, fov −1,6°).
  · Profondeur de champ 3D (PostEffects, `<EffectGroup>` + `<DepthOfField>`) : d'abord la salle se floute
    autour de Diva et du comptoir (restent nets), puis la mise au point part vers l'objectif → tout en bokeh.
    La passe ne tourne QUE pendant la transition (`pass.enabled`), et 4 images au démarrage (chauffe sous le
    loader) pour compiler ses shaders. bokeh max 6 (au-delà : motif d'échantillonnage visible).
  · Voile DOM : flou CSS limité à `--veil-blur` (0 → 8 px avec le rack) quand `store.focusPull` ; sinon
    (mobile, qualité low sans post-process) l'ancien voile flou 12 px.
  · Blocs Services (panneau 01 + méthode) en verre dépoli : `Glass.module.css` (≥1025 px), liseré lumineux
    (anneau `::before` masqué + filet sombre extérieur pour qu'il se lise) et un éclat bleu qui fait le tour du
    liseré à l'arrivée (`@property --glint`). Un reflet balayé À L'INTÉRIEUR du panneau ne se voit pas
    (blanc sur blanc) — abandonné.
  · QA : `node scripts/transition-qa.mjs --tag X [--k 0,0.2,…] [--delay ms]` (captures à plusieurs k).
- DIAGNOSTIC « Comment choisir votre agent IA ? » (demande du 19/09), après les agents :
  `DiagnosticSection` + `lib/diagnostic.ts`. Panneau verre : 4 questions à gauche (tâche prioritaire, temps
  par semaine, outils [multi], processus classique / quelques spécificités / unique) en radios/cases natives
  (clic souris = question suivante après 420 ms ; clavier : flèches sans avancer, Entrée = Continuer) ;
  à droite « Compatibilité en direct » : les 5 agents + « Sur mesure » se reclassent à chaque réponse
  (lignes empilées par rang, barres + % = même échelle score/104). Résultat : `ready` (agent tel quel),
  `adapted` (custom ≥ 30 : l'agent entraîné aux règles de l'entreprise) ou `custom` (custom ≥ meilleur agent :
  plan de l'agent sur mesure + 3 étapes). Pourquoi (tâche, outils communs, heures récupérées ≈ 70 % du temps
  × 4,3 — indicatif, astérisque), « Idéal en duo avec… », « Découvrir {prénom} » ouvre `AgentDialog`, CTA contact.
  QA : `node scripts/diagnostic-qa.mjs --tag X` (3 scénarios). Rien n'est envoyé : tout reste dans la page.
- CONTACT « Parlons de votre projet » (demande du 19/09), fin de la page d'accueil après le diagnostic :
  `ContactSection` + `lib/contact.ts` + `app/api/contact/route.ts`. `CONTACT_HREF` = `/#contact` (`/contact`
  redirige). Tous les CTA passent par `contactClick(intent)` / `goToContact(intent)` : ils emportent le
  contexte (`useContactIntent` : source, besoin pré-sélectionné, résumé du diagnostic joint et retirable).
  Depuis la façade/lobby (frame.services < 0.5) : voile blanc + saut instantané ; en dessous : scroll doux.
  « Recruter {prénom} » (AgentDialog) : ferme la fenêtre puis va au formulaire (agent pré-sélectionné).
  Formulaire : besoin (5 agents + sur mesure + je ne sais pas), nom, e-mail pro, entreprise, téléphone
  facultatif, message (exemple adapté au besoin), préférence visio/appel/e-mail, consentement ; labels
  flottants, erreurs au blur et à l'envoi (focus sur la 1re), pot de miel + délai mini ; confirmation animée
  (timeline « ce qui se passe ensuite » cochée, carte « May, à l'accueil » → « C'est noté dans notre CRM »).
  Bulle d'accueil du lobby (May) : la question tapée part au formulaire comme message (`intent.message`). Pied de page © minimal.
  ENVOI : POST JSON vers `CONTACT_WEBHOOK_URL` (Make/Zapier/n8n/CRM…). Sans variable : log en dev, 503 en
  prod (aucune demande perdue en silence). → À CONFIGURER avant la mise en ligne (+ e-mail de l'agence).
  QA : `node scripts/contact-qa.mjs --tag X`.
- Director : `scrollToElement` vise une position absolue (Lenis résout un élément contre sa valeur animée,
  décalée si la page a défilé autrement) ; saut instantané = `frame.snap` (caméra sans inertie) +
  `requestRender()` (le fond figé est re-rendu au lobby, sinon il restait sur la façade). `html` en
  `overflow-anchor: none` (l'ancrage du navigateur décalait les scrolls doux quand un contenu grandissait).
- En-tête commun `SectionHead.module.css`. MENU (19/09) = Accueil · Nos services · Nos agents IA ·
  Comment choisir. Études de cas / À propos / Blog retirés du menu tant que les pages n'existent pas (URL
  conservées). Les 3 entrées de sections suivent le scroll (la plus profonde visible gagne ; rien d'actif sur
  Contact) et défilent sur l'accueil ; `/nos-services`, `/comment-choisir`, `/contact` redirigent vers l'ancre.
  Le menu n'est plus positionné aux x mesurés de la référence (6 items) : rangée centrée, écart qui se resserre
  légèrement avec `--c`.
- `frame.services` : fondu de l'UI du lobby, et GEL du rendu 3D quand la section couvre tout.
- QA : `node scripts/sections-qa.mjs --tag X [--mobile]` (services, méthode, agents).
- Pièges : pas de `-webkit-backdrop-filter` à côté de `backdrop-filter` (Lightning CSS garde la version préfixée,
  ignorée par Chrome) ; sur mobile, jamais de `min-height` avec `aspect-ratio` (impose une largeur minimale →
  débordement → dézoom) ; défilement vers une section = `window.scrollTo` absolu (pas `scrollIntoView`).

## Agents 3D (remplacement progressif des PNG)
- Ordre : #1 Création de contenu (`content`), #2 Support client (`support`), #3 Automatisation (`automation`),
  #4 Prospection (`prospection`), #5 Analyse de données (`data`).
- Pipeline : `node scripts/build-agent-model.mjs <source.glb> <type> [--tris 80000] [--yaw 0] [--keep-maps]`
  → source copiée dans `.cache/agents/`, GLB web dans `public/models/agents/<type>.glb`, manifeste régénéré ;
  `AgentSlot` bascule automatiquement sur le GLB.
- Sources IA (Tripo/Meshy) : milliers d'îlots UV sur fond uni + normal map d'arêtes → nettoyage par défaut
  (remplissage du fond depuis les îlots, normal/roughness remplacées par un satiné 0.62).
- `AgentModel` : pas de réception d'ombre (acné), ombre portée au sol + `AgentGroundShadow`, respiration
  procédurale si pas d'animation, anisotropie 8.
- #1 fait : Dea-Agent.glb (2,5 M tris, 81 Mo, sans rig).
- #2 fait : Loic-Agent.glb (978 k tris, 36 Mo, sans rig).
- #3 fait : Diva-Agent.glb (1,26 M tris, 43 Mo, sans rig). Placée sur l'estrade derrière
  le comptoir (0, 0.45, −16.45). Hauteur de l'agent d'accueil (May depuis le 19/09) ramenée de 3.09 à 1.94 m,
  comme les autres agents du lobby (demande utilisateur : à 3.09 m, à côté du comptoir de 1.26 m, elle paraissait
  géante). Règle : même taille pour tous les agents d'une même zone, pas de triche d'échelle pour le cadrage.
  Bulle d'accueil recalée sur cette taille (LobbyOverlay.module.css) : bord droit à 60 u à gauche de la tête,
  bas à +72 u, pointe à 58 u du bas → elle vise la tête, passe sous le slogan du fût et au-dessus du comptoir.
- #4 fait : May-Agent.glb (1,99 M tris, 65 Mo, sans rig). Position inchangée.
- #5 fait : Morgan-Agent.glb (1,03 M tris, 37 Mo, sans rig). Position inchangée. → les 5 agents sont en 3D.
- Perf : les 5 reconstruits à 40 k tris (défaut du script ; identique à 80 k même à p=0.25), 0,87–1,07 Mo chacun
  (4,7 Mo au total) ; matériaux FrontSide ; seuls les agents de la façade projettent l'ombre du soleil
  (`castShadow={zone === "facade"}` dans World). Coût mesuré : ~4 % FPS à p=1, ~7 % à p=0.
- Sources originales gardées dans `.cache/agents/<type>.source.glb` (gitignoré) pour reconstruire.

## Version mobile 2D (21/09) — faite par ChatGPT, ne pas modifier
- Arrivée sur `main` par ccc448b (« feat: ajouter l'expérience mobile 2D ») + merge f398893, tirés le 21/09.
  Développée sur une branche `mobile` partie de 581dd1c. Doc complète : `design/MOBILE.md`.
- Aiguillage : `app/page.tsx` = `<StructuredData />` + `<AdaptiveHome />` (`components/home/`).
  `AdaptiveHome` teste `(max-width: 1024px)` : ≤ 1024 px → `MobileHome` ; > 1024 px → `DesktopHome` en import
  dynamique `ssr: false` (écran « Chargement de l'agence » neutre en attendant). Le HTML pré-rendu (celui que
  lisent les robots et le noscript) est donc le MOBILE.
- ⚠️ Conséquences pour le travail desktop :
  · La composition de l'accueil desktop (Header, ExperienceRoot, overlays, sections Services → Contact) est
    maintenant dans `components/home/DesktopHome.tsx`, plus dans `app/page.tsx`.
  · Les règles `@media (max-width: 1024px)` des composants desktop ne s'affichent plus sur l'accueil.
  · Modules PARTAGÉS avec le mobile (toute modif s'y répercute, garder leurs formes/exports) :
    `lib/team`, `lib/services`, `lib/diagnostic`, `lib/site` (FAQ), `lib/contact-content`, `lib/legal`,
    `components/ui/Logo`, `components/ui/Icons`, `hooks/useInView`, `components/overlays/AgentDemos`
    (chargé à la demande dans `MobileAgentDialog`), et l'API `/api/contact`.
  · Le mobile n'importe ni le director, ni le store 3D, ni R3F : ne jamais y ajouter de dépendance 3D.
- Contenu mobile : scroll natif, accueil → mission / May → services / méthode → 5 agents → diagnostic → FAQ →
  contact ; menu et fiches en `<dialog>` ; portraits WebP 2D d'origine ; même formulaire et même API.
- Tests mobiles : `npx playwright test -c playwright.mobile.config.ts` (`tests/mobile/home.spec.ts`,
  11 scénarios, 320 → 1024 px ; annoncés au vert par ChatGPT, pas relancés par Claude).

## Déploiement Cloudflare Workers (21/09)
- Hébergement choisi par l'utilisateur : Cloudflare Workers Builds, relié au dépôt GitHub (branche `main`), Worker
  nommé **`d2s`**. Réglages du tableau de bord : build `npm run build`, deploy `npx wrangler deploy` (inchangés).
- 1er échec : sans config dans le dépôt, wrangler lançait `@opennextjs/cloudflare migrate` à la volée, qui ajoutait
  un binding `WORKER_SELF_REFERENCE` vers « d2s-studio-site » (nom du package.json) → Worker introuvable (10143).
- Config versionnée : `wrangler.jsonc` (name `d2s`, main `.open-next/worker.js`, assets `.open-next/assets`,
  `nodejs_compat`, SANS self-reference ni IMAGES : pas d'ISR ni de next/image), `open-next.config.ts` (cache
  incrémental = static assets, lecture seule : toutes les pages sont prérendues), `public/_headers` (cache
  immuable de `/_next/static`). `@opennextjs/cloudflare` 1.20.6 + `wrangler` 4.136.1 en devDependencies exactes.
- Scripts : `build` = `opennextjs-cloudflare build` (qui appelle `build:next` = `next build`, précédé du
  manifeste d'assets via `prebuild:next`) ; `preview` (workerd local, port 8787, config `d2s-cloudflare` du
  launch.json) ; `deploy`. `wrangler deploy` détecte `open-next.config.ts` et délègue à `opennextjs-cloudflare
  deploy` (qui remplit le cache dans les assets) — il ne construit rien : le build doit avoir produit `.open-next`.
- ⚠️ PIÈGE : `enableCacheInterception: true` casse Next 16 — les préchargements par segment
  (`next-router-segment-prefetch: /_tree`) recevaient la page entière → le client re-préchargeait en boucle
  (des dizaines de milliers de requêtes `/?_rsc=`). Laisser l'option désactivée.
- API contact : IP lue d'abord dans `cf-connecting-ip` (x-forwarded-for est falsifiable derrière Cloudflare).
- Vérifié en local (workerd) : pages, 308, 404, en-têtes/CSP, cache HIT, `/api/contact` (415, 422, 503 sans
  webhook), 3D façade + lobby en desktop, plus de boucle ; `wrangler deploy --dry-run` OK (1,39 Mo gzip, sous la
  limite de 3 Mo du plan gratuit). En local, les curl avec en-tête Origin prennent un 400 du proxy wrangler dev
  (normal) ; le préchargement de `/nos-services` échoue en http local (redirection upgradée en https par la CSP).
- Variables Cloudflare à renseigner : `NEXT_PUBLIC_SITE_URL` = variable de BUILD (lue au build : canonical, OG,
  sitemap) ; `CONTACT_WEBHOOK_URL` = variable/secret du Worker (runtime).

## ⚠️ PIÈGE : lien vers une page qui redirige = rechargement de la 3D
- « Rencontrer nos agents » (lobby) et le lien équipe du Hero pointaient vers `/nos-agents-ia` → redirection 308
  vers `/#…` → Next re-rendait l'accueil, le monde 3D était démonté/remonté et le bandeau « Le décor 3D s'est
  interrompu » apparaissait (21/09). Corrigé : `href="/#nos-agents-ia"` + `onClick` → `preventDefault()` +
  `scrollToElement()`, comme le menu. Règle : sur l'accueil, tout lien vers une section se fait au scroll,
  jamais par navigation. Vérifié en Playwright : 0 navigation, même canvas, section atteinte (façade et lobby).
- Test navigateur : le panneau intégré masqué met la page en `visibilityState: hidden` (rAF gelé, Lenis ne
  défile plus) → tester les scrolls en Playwright headless.

## May, agente IA de l'accueil — branche `feature/may-agent` (22-23/09)
- Décisions utilisateur : May du SITE = agente dédiée (≠ la « vraie » May vendue aux clients), vrai agent
  (pas de réponses en dur), modèle **Claude Sonnet 5** (choix du 23/09). Elle qualifie le besoin, recommande
  un agent, PRÉPARE le formulaire de contact (le visiteur relit et envoie lui-même) et peut proposer le type et
  la date de rendez-vous via Calendly (jamais de réservation ni d'envoi à sa place).
- Historique : base OpenAI + Calendly + Resend poussée le 22/09 hors session (c8a97f0 → c5b4c48) ; le 23/09
  Claude a remplacé OpenAI par Claude et restructuré l'agent (non commité à la fin de la passe).
- Architecture :
  · `lib/server/may-agent.ts` : SDK `@anthropic-ai/sdk` 0.128.0 (exact), `claude-sonnet-5` (`MAY_MODEL`),
    `output_config.effort` = low (`MAY_EFFORT` medium|high), max_tokens 4000, boucle manuelle en streaming
    (`messages.stream` + `finalMessage`, 5 tours max), outils `strict: true` exécutés côté serveur :
    `recommend_agent` (= `buildResult` + `hoursSentence` du diagnostic du site, jamais d'estimation inventée),
    `prepare_contact_request` (need, message, name|null, company|null, channel|null → événement `draft`),
    `list_meeting_types` / `get_available_times` (Calendly, 3 créneaux max, liens *.calendly.com uniquement,
    repli `CALENDLY_FALLBACK_URL` ou formulaire). Consignes = rôle + règles + `llmsText({full:true})` + bloc
    contact/société, EN CACHE (`cache_control`, ~14 000 car.) ; la date du jour est dans un 2e bloc non caché.
  · `app/api/may/chat/route.ts` : POST → flux NDJSON (`MayEvent` : text, status, actions, draft, done, error).
    Même origine, JSON ≤ 24 Ko, historique texte ≤ 16 messages × 1 000 car. (fusion des rôles consécutifs,
    doit commencer et finir par le visiteur), 30 req / 10 min / IP, rien n'est stocké. Sans clé : 503.
  · `lib/may.ts` : types partagés (MayMessage, MayAction, MayDraft, MayEvent, MAY_STARTERS, MAY_LIMITS).
  · `components/may/MayChat.tsx` : lit le flux, texte au fil de l'eau, ligne d'état pendant les outils
    (« May consulte l'agenda… »), boutons de créneaux, carte « Votre demande est prête » → `onDraft(draft)`
    (repli `onContact(message)` : le mobile n'a PAS été modifié et garde `onContact`). « Être recontacté »
    reprend la demande préparée s'il y en a une, sinon la transcription.
  · `ContactIntent` (lib/contact.ts) + `ContactSection` : name, company, channel en plus (sans écraser une
    saisie). `LobbyOverlay` passe `onDraft` → `goToContact({ source: "may-chat-desktop", ...draft })`.
  · Légal : sous-traitant IA = Anthropic ; texte confidentialité mis à jour (demande préparée recopiée, rien
    conservé). `PROCESSORS.transfers` ENCORE null (Anthropic, Calendly, Resend = États-Unis) → à compléter.
  · `.env.example` / README : `ANTHROPIC_API_KEY` (secret du Worker), `MAY_MODEL`, `MAY_EFFORT` ; plus de MAY_AI_*.
- Tests (23/09) SANS vraie clé : faux serveur Anthropic local (SSE scripté, scratchpad `mock-anthropic.mjs`,
  via `ANTHROPIC_BASE_URL` dans un `.env.local` temporaire, supprimé ensuite). Vérifié : requêtes (modèle,
  effort, 4 outils, cache), boucle outil → texte, recommandation réelle (Loic 92 %), carte de demande, formulaire
  pré-rempli (besoin, nom, entreprise, message, visio), 0 erreur console ; build Cloudflare OK (1,48 Mo gzip).
  Tests RÉELS (23/09, vraie clé dans `.env.local`, Sonnet 5, effort low) : script scratchpad `may-eval.mjs`
  (6 scénarios : besoin flou multi-tours → Loic 92 % + demande Sophie Lemaire ; prix → pas de tarif ;
  hors sujet → recadre ; injection → refuse ; RDV → Calendly non configuré, propose la demande ; pressé →
  demande préparée d'emblée) + chat réel dans le lobby (Playwright), 0 erreur. Réponses 3 à 11 s.
  Corrections issues des tests : (1) l'API REFUSE `type: ["string","null"]` + `enum` avec null en strict →
  `channel` = enum string avec "unknown" ; (2) rappel demandé → prepare_contact_request immédiat ; (3) synthèse
  sans détail inventé. Clé d'ORGANISATION refusée (« not scoped to a workspace ») → utiliser une clé créée
  DANS un workspace, ou `ANTHROPIC_WORKSPACE_ID` (header `anthropic-workspace-id`, supporté).
  ⚠️ L'utilisateur a collé une clé dans le chat le 23/09 : je ne l'ai pas utilisée, il l'a remplacée dans
  `.env.local` (nouvelle clé). Règle : ne jamais écrire/saisir de clé soi-même ; l'utilisateur la colle.
  Reste : Calendly et Resend réels, secret `ANTHROPIC_API_KEY` sur Cloudflare (par l'utilisateur), limite de
  dépense du workspace, transferts hors UE dans la politique de confidentialité.

### May hybride (23/09, demande utilisateur : trop de crédit consommé)
- Constat utilisateur : 0,16 € partis (surtout mes ~22 appels de test). Décision : niveau « brut » gratuit +
  Claude en relais, SANS mur de boutons (chat en texte libre ; seuls boutons : 3 suggestions au départ, carte
  « Relire et envoyer ma demande », créneaux Calendly).
- `lib/may-local.ts` (navigateur, 0 €) : lit le texte libre (normalisation sans accents, négations « pas de X »
  ignorées) → tâche, temps (h/jours/mois), outils, processus, canal ; intentions prix / méthode / agents /
  contrôle / sur mesure / gratuit / c'est quoi ; rappel → demande préparée ; rendez-vous → `/api/may/meetings`
  (Calendly sans IA, sinon « je prépare votre demande ? »). Recommandation = `buildResult` du diagnostic.
  Demande = les phrases du visiteur (hors salutations et suggestions) + la ligne de recommandation.
  Règle : dans le doute (message long, plusieurs questions, réponse attendue illisible) → Claude, qui garde
  ensuite la conversation (`claude` ref dans MayChat) et reçoit `known` = `memorySummary()`.
- Côté Claude : consignes condensées (KNOWLEDGE au lieu de llmsText ; ~4 600 tokens en cache avec les outils),
  `thinking: {type: "disabled"}`, max_tokens 1200, historique 12 messages, pas de 2e appel après
  prepare_contact_request (texte fixe), journal `[may] usage … cost=$…` par appel et par tour (aucun contenu).
  Mesure : conversation 100 % Claude en 4 tours = 0,032 $ (1er appel 0,013 $ = écriture du cache, puis
  0,003–0,009 $). Parcours compris localement = 0 appel (vérifié en Playwright sur 3 tailles).
- Plafond : 14 messages visiteur par conversation, puis la demande préparée (MAY_LIMITS.visitorMessages).
- Placement du chat (lobby, desktop) : aligné en haut sur le panneau mission (`--chat-top: 176u`), bord droit
  à 150u à gauche de la tête de May (dégage le logo du fût), hauteur = jusqu'au-dessus du comptoir
  (`--ay + 92u − top`, min 360 px) quand la conversation est active, log qui défile ; au repos hauteur
  naturelle. Pointe calée sur la tête. Indice de scroll du lobby déplacé en bas (`bottom: 26u`) : il
  chevauchait « INFORMATIONS ». Vérifié 1280×720, 1280×800, 1440×900, 1920×1080.
- Reste : Resend (compte + domaine vérifié dans Cloudflare DNS + `RESEND_API_KEY` par l'utilisateur ; le
  code envoie déjà à may@d2saigency.com par défaut ; la boîte may@ doit exister chez IONOS), Calendly (token
  par l'utilisateur), règle de limitation de débit Cloudflare sur /api/may/*, plafond de dépense Anthropic.
  Claude in Chrome déconnecté pendant cette passe.

### Resend + réservation Calendly dans le formulaire (23/09)
- Resend : domaine d2saigency.com ajouté par API (région eu-west-1, id 11e802b2-…), 4 enregistrements DNS
  créés dans Cloudflare (TXT resend._domainkey, MX send → feedback-smtp.eu-west-1.amazonses.com prio 10,
  TXT send SPF amazonses, CNAME rsend → send.forge.rmta.net, tous DNS only) → VÉRIFIÉ. Test réel : notification
  + confirmation délivrées à may@d2saigency.com. `sendEmail` journalise le motif de refus Resend (ex. domaine
  non vérifié). ⚠️ Les clés Resend et Calendly du `.env.local` ont été collées dans le chat par l'utilisateur
  → à remplacer ; secrets Cloudflare `RESEND_API_KEY`, `CALENDLY_API_TOKEN`, `ANTHROPIC_API_KEY` à ajouter
  par l'utilisateur.
- Calendly : compte Rudy Saksik, offre GRATUITE, 1 type « 30 Minute Meeting » (Google Meet, semaine 9 h–17 h,
  fuseau du profil Europe/Berlin). Jeton `d2s-site` créé dans Chrome (droits : availability:read,
  event_types:read, scheduled_events:read/write, users:read) ; code de vérification et copie du jeton faits
  par l'utilisateur.
- Choix utilisateur « propre et pro » → réservation DANS le formulaire, sans script ni cookie Calendly :
  `SlotPicker` (components/overlays, desktop ContactSection, visible quand « Visio » est choisi) : 10 jours
  ouvrés en cartes + horaires en pastilles depuis `/api/booking/slots` (1er type actif ou
  `CALENDLY_EVENT_TYPE_ID`, 14 jours en fenêtres de 7 j, cache 60 s). À l'envoi, `/api/contact` valide le
  créneau (futur, lien *.calendly.com), appelle `bookSlot` (POST /invitees avec le `location.kind` du type,
  ici google_conference — sans lui : 400) ; si refus → `confirmUrl` = page Calendly du créneau avec
  name/email pré-remplis (bouton « Confirmer mon créneau »). L'e-mail à D2S indique le créneau et son état.
  ⚠️ La doc Calendly annonce un 403 sur l'offre gratuite, mais la réservation a RÉUSSI en test (rdv du
  7/10 16:30 créé puis ANNULÉ par API). Confidentialité mise à jour (nom, e-mail, créneau transmis à Calendly).
  Mobile (MobileContact) non modifié : pas de sélecteur.

- Destinataires (décision 23/09) : demandes + réservations → **rudy.saksik@d2saigency.com** (défaut de
  `recipients()`, `CONTACT_TO_EMAIL` pour changer) ; tout e-mail au client part de **may@d2saigency.com**
  (signé May). Confirmation client (`visitorConfirmation`) : rdv réservé → « Votre visio … est confirmée ·
  date » + bouton lien de visio + déplacer / annuler (cancel_url / reschedule_url de l'invité Calendly) ;
  créneau à confirmer → bouton « Confirmer ma visio » ; sinon « demande reçue ». Le `join_url` Calendly
  n'existe que quelques secondes APRÈS la réservation (lien calendly.com/events/…, redirige vers Meet) →
  `bookSlot` relit l'événement jusqu'à 4 fois (1,2 s). Testé réel 23/09 : 2 e-mails délivrés (rudy@ existe
  chez IONOS), lien présent ; rendez-vous de test annulés par API.
- Reste côté Calendly (réglages du compte, par l'utilisateur) : ses propres notifications à l'hôte vont à l'e-mail
  du compte Calendly, et Calendly envoie aussi SA confirmation à l'invité (doublon avec celle de May) — voir les
  réglages de notification du type de rendez-vous.

- MOBILE (23/09, sur demande explicite de l'utilisateur « tu ne l'as pas fait pour le mobile ? ») :
  `MobileContact` reçoit le même `SlotPicker` (`variant="mobile"` : tailles en px, horaires de 44 px, jours
  défilables au doigt ; vérifié 390/320 px sans débordement) et les mêmes écrans réservé / à confirmer.
  Test `reception preserves…` de `tests/mobile/home.spec.ts` PÉRIMÉ depuis c8a97f0 (l'ancien champ d'accueil
  a été remplacé par le chat de May) → réécrit sur le chat. Il a révélé un vrai défaut, corrigé : « Être
  recontacté » oubliait le message tapé mais pas envoyé. Suite mobile : 11/11. PIÈGE : la suite teste
  127.0.0.1:3217 et réutilise un serveur déjà lancé ; si c'est le serveur `localhost` du panneau, Next bloque
  le JS de dev (autre origine) → la page ne s'hydrate pas et 10 tests échouent. Arrêter le serveur avant.

## Contact direct du menu (23/09, branche `feature/may-agent`)
- Entrée « Contact » dans le menu desktop (bouton après les 4 sections, `Header.tsx`) et « 07 Contact » dans le
  menu mobile (`MobileHome.tsx`, ajout demandé). Ouvre `components/ui/ContactDialog.tsx` : <dialog> natif, panneau
  verre blanc du site, « Contact direct / Écrivez-nous. », 5 sujets en pastilles (`DIRECT_TOPICS` dans
  `lib/contact-content.ts` : projet, devis, partenariat, presse, autre — « déjà client » et « candidature » retirés
  à la demande de l'utilisateur), nom, e-mail,
  entreprise et téléphone facultatifs, message ≥ 10, consentement + lien Confidentialité, pot de miel.
  Sous 640 px : panneau depuis le bas. Desktop : `onLock={setScrollLocked}` (Lenis) ; mobile : overflow du html.
- Envoi : `POST /api/message` (même origine, JSON ≤ 12 Ko, 5 / 10 min / IP, pot de miel + délai ≥ 2,5 s) →
  `sendDirectMessage` (resend.ts) : e-mail à l'équipe (rudy.saksik@d2saigency.com, reply_to = visiteur, objet
  « Contact · {sujet} · {nom} ») + accusé de réception de May (may@) au visiteur. Vérifié : 200, deux e-mails
  délivrés, focus sur la 1re erreur, menu à 5 entrées OK à 1280 px, mobile 390 px OK.
- Calendly : un 403 (réservation directe refusée) est maintenant journalisé `[booking] Calendly 403` (il était
  silencieux → impossible de savoir pourquoi un test finissait en « Confirmez votre visio »).

## Indice « Scrollez pour entrer dans notre univers » (façade, 23/09)
- Il était au centre de l'écran à 728u et chevauchait les jambes de Déa et le bas des portes. Placé maintenant
  dans l'axe de l'entrée (les portes sont à ~63,5 % de la largeur quel que soit le format desktop) et en bas de
  l'écran (`bottom: max(16px, 24u)`), sur le sol. Vérifié 1280×720, 1280×1024, 1440×900, 1536×864, 1920×1080.

## Audit RGPD (23/09)
- Vérifié : aucun cookie (y compris sur le site en ligne, Cloudflare n'en pose pas), seul stockage =
  sessionStorage `d2s:gpu-trouble` ; mention « Assistante IA » dans le chat (transparence, AI Act art. 50) ;
  liens Confidentialité sous chaque formulaire ; logs serveur sans contenu ni donnée perso.
- Complété : hébergeur des mentions légales = Cloudflare, Inc. (adresse et téléphone relevés sur
  cloudflare.com/website-terms) ; transferts hors UE (Cloudflare, Anthropic, Calendly, Resend → clauses
  contractuelles types + Data Privacy Framework pour les sociétés certifiées — À CONFIRMER par l'utilisateur :
  accepter le DPA de chacun) ; messagerie IONOS ; fenêtre Contact et usage de l'IP anti-abus décrits.
  Les limiteurs de débit (4 routes API) purgent maintenant les IP expirées à chaque appel (avant : seulement
  au-delà de 5 000 entrées) → l'IP n'est gardée que pendant sa fenêtre, comme l'annonce la politique.
- Mentions légales complétées (23/09, infos de l'utilisateur) : EI — entrepreneur individuel (pas de capital, ligne
  masquée), TVA non applicable art. 293 B du CGI, contact rudy.saksik@d2saigency.com (aussi JSON-LD et May),
  téléphone NON publié (ligne masquée), directeur de la publication Rudy Saksik. Plus aucun « à compléter ».
  Contact RGPD (`PRIVACY_CONTACT`) = rudy.saksik@d2saigency.com aussi (demande du 23/09).
- Reste (côté utilisateur) : accepter les DPA ; tenir le registre des traitements (art. 30) ; faire relire les pages.

## Étiquette au survol des agents 3D (desktop, 23/09)
- Au survol d'un agent du monde 3D (Déa, Loic sur la façade ; May, Diva, Morgan dans le lobby) : pastille verre
  blanc au-dessus de la tête, point vert + prénom + rôle (`lib/team.ts`), petite pointe vers la tête.
  `components/overlays/AgentHoverLabel.tsx` (+ CSS), monté dans `DesktopHome` ; mobile non touché.
- Sans raycasting WebGL : `AgentSlot` publie chaque image la silhouette à l'écran (`frame.agents[type]` : x,
  haut, pieds, largeur ≈ 0,42 × hauteur). Étiquette seulement si la souris est sur le fond 3D
  (`elementFromPoint` = canvas / main / body / piste / `[data-experience-stage]` — donc jamais sur un panneau,
  le chat, un bouton ou les sections), souris uniquement (hover: hover), agent ≥ 17 % de la hauteur d'écran
  (les agents du lobby vus à travers les portes n'en ont pas), `frame.services` < 0.05. Maintenue dans
  l'écran (pointe décalée vers la tête) et sous l'en-tête. Décorative (aria-hidden) : l'info est dans
  « Nos agents IA ». Vérifié 1280×720, 1440×900, 1920×1080, façade et lobby, 0 erreur.

## ⚠️ 2 flashs blancs après l'ouverture du loader (24/09, branche `fix/flash-blanc`)
- Diagnostic sur la vidéo de l'utilisateur (MacBook, 120 Hz) : zone 3D blanche à ~6 s puis ~10 s après
  l'ouverture (140 ms puis 550 ms), le DOM reste. Cause : le PerformanceMonitor baissait la qualité
  high → medium → low APRÈS l'ouverture ; chaque changement redimensionne le canvas (dpr → buffer effacé) et
  recompile les shaders (ombres, post-process) → fond blanc de la scène visible pendant la compilation.
- Correctif :
  · CALIBRATION sous le loader (`AdaptiveQuality`, ExperienceCanvas) : fréquence d'écran mesurée (médiane rAF),
    puis une fois `ready`, fps réel du palier mesuré (300 ms d'attente + 700 ms), baisse tant que < plancher
    + 5 (plancher = 45 si écran > 100 Hz, sinon 30, comme le moniteur), 4 tours max, onglet masqué ignoré.
    `store.calibrated` ; le SiteLoader reste à 96 % tant qu'il n'est pas posé (ajoute ~1 s au chargement).
  · Après l'ouverture, le moniteur passe par `swapQuality()` (`lib/experience/qualitySwap.ts`) : copie de la
    dernière image dans un canvas 2D posé sur la scène (juste après un rendu : `onAfterRender` du director,
    le buffer est encore lisible), changement de palier dessous, fondu 450 ms après 3 images du nouveau palier.
  · QA : `?capture=1` expose `__d2s.swapQuality("low")`. Mesuré en local : tous les changements avant
    l'ouverture (4,2 s / 5,6 s), 0 après, 61 fps ; fondu = saut max 1,4 niveau de gris/image (22,5 sans).
- Écran d'attente (logo couleur « Chargement de l'agence ») puis SiteLoader (logo gris, 0 %) : changement
  d'écran visible à ~1 s, non traité (AdaptiveHome = zone mobile), à harmoniser si demandé.

## Cran d'arrêt au lobby (24/09, branche `fix/flash-blanc`)
- Demande : un scroll trop rapide « passait » le lobby. `detent()` dans le director (avant `lenis.raf`) : en
  descendant depuis la façade, au moment où la cible Lenis franchit la fin de la piste 3D (`trigger.end`), elle
  est ramenée au lobby et y reste tant que la caméra n'est pas posée (`frame.progress` > 0.995) + 450 ms mini
  + 260 ms sans molette/clavier/tactile (l'inertie du trackpad finit d'abord), 2,6 s maxi.
  RÉGLAGE 24/09 (« divise par 2 le temps ») : minHold 225 ms, maxHold 1300 ms, posée à 0.985 ; `quiet` GARDÉ à
  260 ms (à 130 ms, les intervalles d'un même tour de molette comptent comme une fin de geste → le flick
  repasse). Molette continue : retenue 2,3 s → 1,25 s. Un défilement continu de plus de 1,3 s passe le lobby. Une fois par
  descente (ré-armé 0,3 écran au-dessus du lobby). Les défilements programmés (menu, CTA, sauts) le coupent
  (`muteDetent`, qui désarme aussi). Sans Lenis (mouvement réduit) : pas de cran.
- Vérifié (Playwright) : 40 crans de molette → arrêt pile au lobby ; geste suivant → sections ; menu « Nos
  services » depuis la façade → section atteinte (bug corrigé : le cran ramenait au lobby après le menu).
- Franchissement détecté sur la position réelle de la page (`lastScroll`), pas seulement la cible Lenis : la
  molette au-dessus d'une zone `data-lenis-prevent` (fil du chat de May) fait défiler en natif → la page est
  remise au lobby (`scrollTo immediate, force`). Vérifié depuis 5 positions de souris.
- Bouton de secours (demande 24/09) : l'indice « Continuez l'exploration de notre univers » du lobby est un
  <button> (`ScrollCue onClick label`) → `scrollToElement(nos-services)` ; anneau qui s'allume au survol, focus
  visible. L'indice de la façade reste un simple repère.

## En cours / à faire
- Domaine (21/09) : d2saigency.com (IONOS) ajouté à Cloudflare (Free, zone 972705025ea475ab0aaecee6c72028fc),
  NS IONOS → matt / wanda.ns.cloudflare.com. Zone : 5 CNAME DNS only (autodiscover, _dmarc, _domainconnect,
  s1/s2-ionos._domainkey), 2 MX IONOS, SPF ; A/AAAA de la page d'attente IONOS supprimés. DNSSEC n'était pas
  actif. EN LIGNE (22/09) : zone active ; domaines perso du Worker d2s = `d2saigency.com` + `www.d2saigency.com` ;
  règle « Redirect from WWW to root » (https://www.* → https://${1}, 301, query conservée) ; Always Use HTTPS ;
  variable de BUILD `NEXT_PUBLIC_SITE_URL=https://d2saigency.com` + « Retry build ». Vérifié : canonical/OG/
  sitemap/robots en d2saigency.com, 308 des anciennes pages, site prêt en ~4,5 s (loader compris), 0 erreur.
  Reste : les secrets de May / Resend / Calendly (voir section May). Piège : onglet Chrome masqué = chargement très
  lent (rAF freiné) → mesurer en headless.
- Zones suivantes (services, réf 05) : à démarrer quand demandé.
- faf2edb (poussé sur main) : passe matériaux lobby + bassin + memory.md/CLAUDE.md.
- 4476cd4 (poussé sur main, 21/09) : tout le reste — façade, agents 3D, Services, Agents, diagnostic,
  contact, mission, marque D2S AIgency, menu, correctifs du rendu. Plus rien de non commité à cette date.
- PR https://github.com/RudyStark/D2S/pull/2 (feature/may-agent → main) ouverte le 23/09, NON fusionnée : fusion =
  mise en ligne ; d'abord les secrets Cloudflare (ANTHROPIC_API_KEY, RESEND_API_KEY, CALENDLY_API_TOKEN, par l'utilisateur).
- bc7cb37 (poussé sur `feature/may-agent`, 23/09, PAS sur main) : May hybride + Claude, Resend, réservation
  Calendly (desktop + mobile), contact direct du menu, indice de scroll, étiquettes des agents, RGPD.
- 581dd1c (poussé sur main, 21/09) : halo + « AI » animé en 3D, méthode pilotée par le scroll, RGPD
  (pages légales), sécurité (en-têtes, API), SEO + IA (métadonnées, JSON-LD, FAQ, llms.txt, robots, sitemap).
