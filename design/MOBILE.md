# D2S AIgency — version mobile 2D

Base : `581dd1c4f8239e8783bc0298ba1def701344dbb2` (`main`, 21 septembre 2026).
Développement publié sur la branche dédiée `mobile` ; `main` reste inchangée.

## Direction

La maquette image a été produite et présentée avant la modification du code applicatif.
Elle reprend le logo vectoriel officiel, Inter / Inter Tight, les fonds blancs et bleu pâle,
les titres bleu nuit, les CTA bleus et les panneaux translucides du site.
Les portraits proviennent exclusivement de `public/images/agents/*.webp` ; aucun agent
n’a été régénéré et aucune capture de la scène 3D ne sert de fond au mobile.

Le parcours suit le défilement vertical natif : accueil → mission / May → services →
méthode → cinq agents → diagnostic → FAQ → contact. Les sections se révèlent à leur
entrée dans l’écran. Aucune capture du scroll, aucun carrousel obligatoire, aucune
longueur de défilement artificielle. Le mode « réduire les animations » est respecté.

## Isolation du desktop

- `app/page.tsx` conserve les données structurées et délègue le choix du parcours à
  `components/home/AdaptiveHome.tsx`.
- Jusqu’à 1024 px inclus : `components/mobile/`. Au-delà : import dynamique du
  `DesktopHome`, qui reprend exactement la composition JSX précédente de la page
  (seules les données structurées restent dans la page serveur et le chemin CSS devient absolu).
- Les composants desktop existants, leurs styles, la scène, les caméras, le director,
  les textures et les modèles restent inchangés.
- Le choix se fait avant le montage du desktop : masquer un canvas en CSS n’aurait pas
  empêché ses chargements. Le mobile n’importe ni le director, ni le store 3D, ni R3F.
- Le HTML mobile est pré-rendu pour conserver un contenu lisible et indexable. Sur grand
  écran, un écran de chargement neutre le masque avant le montage du desktop ; il ne
  s’agit pas d’une seconde scène. Sans JavaScript, le contenu reste lisible.

## Interactions conservées

- Menu accessible, ancres directes et indicateur de lecture.
- Question à May transmise au formulaire.
- Les cinq profils complets : missions, outils, contrôle humain, démonstrations DOM
  existantes chargées à la demande, recrutement avec besoin pré-sélectionné.
- Diagnostic à quatre questions, choix explicites, retour sans perte des réponses,
  résultats « prêt », « adapté » et « sur mesure ». Le calcul provient de `lib/diagnostic.ts`.
  Résumé joint au contact et retirable. Les estimations restent indiquées comme telles.
- FAQ et contenus issus des modules existants pour éviter les divergences avec le SEO.
- Même API `/api/contact`, mêmes besoins et préférences de contact, champs bornés,
  consentement décoché par défaut, pot de miel, validation et retour au premier champ
  incorrect. En cas d’échec, le formulaire conserve la saisie. La confirmation suit une
  réponse positive du serveur.

## Vérification

```sh
npm run typecheck
npx playwright test -c playwright.mobile.config.ts
npm run build
```

Les tests mobiles couvrent 320, 375, 390, 430, 768 et 1024 px, les débordements,
l’absence de canvas et d’appels aux assets 3D, le scroll, le menu, les profils, les
démonstrations, les trois résultats du diagnostic et les états du formulaire.
Les envois de formulaire sont interceptés pendant les tests : aucune demande n’est envoyée.

Résultat de cette passe : les 11 scénarios sont validés (suite initiale et relance ciblée
après correction de trois attentes de test). Les cinq démonstrations ont ensuite été
revalidées ensemble à 320 px. Le contrôle TypeScript et le build de production webpack
sont passés avec les fontes locales de test décrites ci-dessous. La composition JSX
desktop est identique à l’original après extraction ; 11 des 12 mesures DOM sont
strictement identiques, avec une variation de 1,16 px de largeur sur le titre animé.

Le contexte de test peut fournir `D2S_QA_BROWSER` (chemin d’un Chromium local) et
`D2S_QA_WEBPACK=1`. Dans l’environnement de travail, Google Fonts n’est pas joignable :
les mêmes familles et graisses sont fournies localement par Fontsource via le mécanisme
de test de Next, sans modifier `app/layout.tsx`. Ces fichiers de test et leurs chemins
ne sont pas nécessaires au site et ne font pas partie du livrable applicatif.

Les captures de revue sont dans `design/captures/mobile-work/` (gitignoré).
Le rendu GPU logiciel limite les comparaisons de la scène 3D complète : la protection
du desktop s’appuie aussi sur l’identité des sources et la comparaison de sa géométrie DOM.

Comme sur le desktop existant, l’envoi réel en production dépend de `CONTACT_WEBHOOK_URL`.
