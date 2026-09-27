/*
 * « Toute l'équipe » : the eleven D2S agents beyond the five of the 3D world, shown in 2D only (desktop agents
 * section). Written from what they really do in the D2S hub. No price here: pricing is discussed with the client.
 * Kept apart from TEAM (lib/team.ts), which drives the 3D world, the diagnostic, May and the mobile version.
 */

/** The eleven, in display order (their keys everywhere: images, demos, the diagnostic). */
export const MORE_SLUGS = [
  "fireflies",
  "proposition",
  "strategiste",
  "designer",
  "veille",
  "ecommerce",
  "gmail",
  "comptabilite",
  "presentateur",
  "cerveau",
  "orchestrateur",
] as const;

export type MoreSlug = (typeof MORE_SLUGS)[number];

export interface MoreAgent {
  slug: MoreSlug;
  name: string;
  role: string;
  pole: PoleId;
  /** One line for the card. */
  blurb: string;
  /** Full pitch (profile window). */
  pitch: string;
  missions: string[];
  channels: string[];
  /** What stays in your hands. */
  control: string;
  /** Title of the live demo (components/overlays/AgentDemosMore.tsx). */
  demo: string;
  tint: [string, string];
  image: string;
  avatar: string;
}

export type PoleId = "commercial" | "marketing" | "operations" | "pilotage";

export const POLES: { id: PoleId; label: string }[] = [
  { id: "commercial", label: "Vente" },
  { id: "marketing", label: "Contenu & marketing" },
  { id: "operations", label: "Opérations & finance" },
  { id: "pilotage", label: "Pilotage" },
];

export const MORE_INTRO = {
  kicker: "Toute l’équipe",
  title: ["Onze autres experts,", "prêts à rejoindre la vôtre."],
  lead: "Au-delà de nos cinq agents phares, une équipe complète couvre la vente, le marketing, la gestion et le pilotage. Chacun connaît son métier et travaille avec les autres.",
};

const img = (slug: string) => ({ image: `/images/agents/${slug}.webp`, avatar: `/images/agents/${slug}-avatar.webp` });

export const MORE_TEAM: MoreAgent[] = [
  {
    slug: "fireflies",
    name: "Jules",
    role: "Analyste de rendez-vous",
    pole: "commercial",
    blurb: "Chaque rendez-vous commercial devient un plan d’action, sans prendre une note.",
    pitch: "Jules écoute vos rendez-vous commerciaux à votre place. Il en tire les besoins, les objections et les chances de signature, puis prépare la relance : vous restez concentré sur votre prospect.",
    missions: [
      "Rejoint vos visios pour les enregistrer et les transcrire",
      "Résume le rendez-vous : besoins, budget, décideur, délai",
      "Relève chaque objection et la réponse à apporter",
      "Estime les chances de signature du prospect",
      "Prépare le plan d’action et l’e-mail de relance",
    ],
    channels: ["Google Meet", "Zoom", "Teams", "Transcriptions", "E-mail de relance"],
    control: "Le prospect est prévenu de l’enregistrement. Sans enregistrement, vous collez vos notes et Jules les analyse de la même façon.",
    demo: "Du rendez-vous au plan d’action",
    tint: ["#f1e9ff", "#e2d9fb"],
    ...img("fireflies"),
  },
  {
    slug: "proposition",
    name: "Victor",
    role: "Propositions commerciales",
    pole: "commercial",
    blurb: "Une proposition solide, envoyée le jour même du rendez-vous.",
    pitch: "Victor transforme un rendez-vous en proposition commerciale structurée et convaincante, prête à envoyer. Il vend le résultat, pas la liste des fonctionnalités, et vous dit quand le prospect l’ouvre.",
    missions: [
      "Rédige la proposition à partir de l’analyse du rendez-vous",
      "Structure la situation du client, la solution et plusieurs options",
      "Traite à l’avance les objections entendues en rendez-vous",
      "Met en forme un PDF professionnel, prêt à envoyer",
      "Suit l’ouverture de chaque proposition par le prospect",
    ],
    channels: ["PDF", "Lien de suivi", "E-mail", "Suivi des propositions"],
    control: "Chaque montant et chaque engagement passent par votre validation avant l’envoi.",
    demo: "Du rendez-vous à la proposition",
    tint: ["#ebe9ff", "#dcdcfc"],
    ...img("proposition"),
  },
  {
    slug: "strategiste",
    name: "Antoine",
    role: "Stratège marketing",
    pole: "marketing",
    blurb: "Des décisions claires sur votre cible, votre message et vos campagnes.",
    pitch: "Antoine transforme une intention floue en décisions claires : à qui parler, avec quel message, par quels canaux. Il s’appuie sur des méthodes éprouvées et vous remet des briefs prêts pour le reste de l’équipe.",
    missions: [
      "Pose le diagnostic et reformule votre objectif",
      "Analyse vos concurrents et ce qui vous distingue",
      "Définit votre client idéal et ses déclencheurs d’achat",
      "Construit votre positionnement et votre message",
      "Rédige les briefs de campagne pour Déa, Mia et May",
    ],
    channels: ["Stratégie", "Positionnement", "Briefs de campagne", "Plan d’action"],
    control: "Antoine propose et argumente chaque choix : la décision reste la vôtre.",
    demo: "De l’idée au plan de campagne",
    tint: ["#e8ecff", "#d7defb"],
    ...img("strategiste"),
  },
  {
    slug: "designer",
    name: "Mia",
    role: "Directrice artistique",
    pole: "marketing",
    blurb: "Des visuels et des miniatures à vos couleurs, sans graphiste ni séance photo.",
    pitch: "Mia est votre directrice artistique : elle part de votre charte, propose des concepts, puis produit les visuels et les miniatures qui donnent envie de cliquer, dans tous les formats.",
    missions: [
      "Crée des visuels de marque à partir de votre charte",
      "Compose des miniatures YouTube avec votre visage",
      "Propose plusieurs concepts avant de produire",
      "Décline chaque création par format : post, story, bannière",
      "Garde une identité visuelle cohérente partout",
    ],
    channels: ["Instagram", "LinkedIn", "YouTube", "Bannières", "Charte graphique"],
    control: "Votre photo de référence reste privée, et vous choisissez chaque visuel avant usage.",
    demo: "Une miniature qui donne envie de cliquer",
    tint: ["#fde9f6", "#f3dcf5"],
    ...img("designer"),
  },
  {
    slug: "veille",
    name: "Nina",
    role: "Veille des tendances",
    pole: "marketing",
    blurb: "Sachez ce qui marche dans votre secteur avant d’écrire une ligne.",
    pitch: "Nina repère ce qui capte vraiment l’attention dans votre niche : les vidéos qui performent, leurs accroches, leurs formats. Elle décortique pourquoi elles marchent et en tire vos prochaines idées.",
    missions: [
      "Remonte les vidéos les plus vues de votre sujet",
      "Suit vos concurrents et les comptes qui vous inspirent",
      "Retranscrit le texte parlé de chaque vidéo",
      "Explique pourquoi une vidéo surperforme",
      "Transforme ses trouvailles en idées pour Déa",
    ],
    channels: ["Instagram", "Reels", "Tendances", "Veille concurrentielle"],
    control: "Nina s’inspire de contenus publics, elle ne copie jamais.",
    demo: "Des idées qui ont fait leurs preuves",
    tint: ["#fff3dc", "#fde8c7"],
    ...img("veille"),
  },
  {
    slug: "ecommerce",
    name: "Emma",
    role: "Experte e-commerce",
    pole: "marketing",
    blurb: "Des vidéos produit qui vendent, sans tournage ni acteur.",
    pitch: "Emma produit les vidéos qui font vendre vos produits : un avatar qui les présente comme un créateur de contenu, ou une mise en scène soignée. Le script et l’accroche sont pensés pour convertir.",
    missions: [
      "Crée des vidéos produit présentées par un avatar",
      "Met en scène vos produits, sans studio ni matériel",
      "Écrit le script et l’accroche des premières secondes",
      "Choisit l’angle de vente : problème, démonstration, objection",
      "Range vos vidéos par produit, prêtes à publier",
    ],
    channels: ["Fiches produit", "Instagram", "TikTok", "Publicités"],
    control: "Vous validez le script et l’avatar avant chaque vidéo.",
    demo: "Un lancement produit en vidéo",
    tint: ["#ffede0", "#fcdcc8"],
    ...img("ecommerce"),
  },
  {
    slug: "gmail",
    name: "Inès",
    role: "Assistante e-mail",
    pole: "operations",
    blurb: "Une boîte mail triée chaque jour, avec les réponses déjà prêtes.",
    pitch: "Inès vous rend le temps que vous prend votre boîte de réception : elle trie, vous dit quoi traiter en premier et prépare des réponses claires, prêtes à envoyer.",
    missions: [
      "Classe chaque e-mail : client, prospect, fournisseur, administratif",
      "Établit la liste des priorités du jour",
      "Rédige des brouillons de réponse courts et clairs",
      "Repère les messages restés sans réponse",
      "Prépare les relances au bon moment",
    ],
    channels: ["Gmail", "Outlook", "Toute messagerie", "To-do du jour"],
    control: "Inès ne voit que ce que vous lui confiez, et ne répond jamais seule.",
    demo: "Quarante e-mails, dix minutes",
    tint: ["#ffe9e6", "#fbd8d3"],
    ...img("gmail"),
  },
  {
    slug: "comptabilite",
    name: "Chloé",
    role: "Comptable IA",
    pole: "operations",
    blurb: "Vos chiffres lisibles, vos factures suivies et relancées au bon moment.",
    pitch: "Chloé rend vos finances lisibles pour un dirigeant qui n’est pas comptable : ce qui est encaissé, ce qui est en retard, ce qu’il faut relancer, et où va votre marge.",
    missions: [
      "Suit vos factures : encaissées, en attente, en retard",
      "Relance par paliers, du rappel courtois à la relance ferme",
      "Prépare vos factures en PDF, prêtes à envoyer",
      "Présente votre chiffre d’affaires, vos dépenses et votre marge",
      "Vous alerte sur ce qui mérite votre attention",
    ],
    channels: ["Airtable", "Factures PDF", "Relances e-mail", "Tableau de bord"],
    control: "Chaque relance et chaque facture passent par votre validation.",
    demo: "Des factures qui rentrent enfin",
    tint: ["#e3f7ef", "#cfeee2"],
    ...img("comptabilite"),
  },
  {
    slug: "presentateur",
    name: "Hugo",
    role: "Créateur de présentations",
    pole: "operations",
    blurb: "Des présentations claires et à vos couleurs, en quelques minutes.",
    pitch: "Hugo transforme un brief ou un rapport en présentation slide par slide, mise en page automatiquement : chiffres clés, comparaisons et étapes deviennent des schémas lisibles.",
    missions: [
      "Construit un deck complet à partir d’un brief",
      "Met en page chaque slide automatiquement",
      "Transforme vos chiffres en schémas lisibles",
      "Prépare un mode présentation plein écran",
      "Exporte le tout en PDF pour l’envoyer",
    ],
    channels: ["Présentations", "PDF", "Réunions clients", "Comités"],
    control: "Vous relisez et ajustez le contenu avant de présenter.",
    demo: "Une présentation client, prête à temps",
    tint: ["#e2f6fb", "#cdeef7"],
    ...img("presentateur"),
  },
  {
    slug: "cerveau",
    name: "Clément",
    role: "La mémoire de l’entreprise",
    pole: "pilotage",
    blurb: "Toute la mémoire de votre entreprise, disponible en une question.",
    pitch: "Clément connaît tout ce que sait votre entreprise : documents, rendez-vous, propositions, prospects. Posez-lui une question, il répond et cite d’où vient l’information.",
    missions: [
      "Relie automatiquement toute la connaissance de l’entreprise",
      "Répond aux questions en citant ses sources",
      "Donne une vue d’ensemble de l’activité de l’équipe",
      "Accueille les nouvelles recrues avec l’essentiel à savoir",
      "Signale ce qui manque ou n’est plus à jour",
    ],
    channels: ["Documents", "Rendez-vous", "Propositions", "Toute l’équipe d’agents"],
    control: "Clément ne répond qu’avec vos données, et dit quand il ne sait pas.",
    demo: "La bonne réponse, avec sa source",
    tint: ["#eee8ff", "#e0d8fb"],
    ...img("cerveau"),
  },
  {
    slug: "orchestrateur",
    name: "Noam",
    role: "Chef d’orchestre",
    pole: "pilotage",
    blurb: "Un seul interlocuteur pour toute votre équipe d’agents.",
    pitch: "Noam est le point d’entrée de votre équipe : vous lui écrivez, il confie chaque demande à l’agent dont c’est le métier et vous propose le bon enchaînement pour atteindre vos objectifs.",
    missions: [
      "Confie chaque demande au bon agent, automatiquement",
      "Répond à « qui fait quoi ? » et « par où commencer ? »",
      "Propose l’enchaînement d’agents pour chaque objectif",
      "Fait circuler le travail d’un agent à l’autre",
      "Vous évite de chercher à qui vous adresser",
    ],
    channels: ["Toute l’équipe d’agents", "Point d’entrée unique"],
    control: "Noam oriente : c’est toujours vous qui validez le travail des agents.",
    demo: "Un objectif, toute une équipe",
    tint: ["#e6efff", "#d4e2fd"],
    ...img("orchestrateur"),
  },
];

/*
 * Mobile (« Nos agents IA »): the rest of the team in a few lines instead of eleven cards — one concrete sentence
 * per pole, with the faces of who does it.
 */
export const MORE_BY_POLE: { pole: PoleId; label: string; agents: string[]; text: string }[] = [
  { pole: "commercial", label: "Vente", agents: ["fireflies", "proposition"], text: "Jules analyse vos rendez-vous, Victor rédige vos propositions commerciales." },
  { pole: "marketing", label: "Contenu & marketing", agents: ["strategiste", "designer", "veille", "ecommerce"], text: "Antoine pose votre stratégie, Mia crée vos visuels, Nina repère les tendances, Emma produit vos vidéos produit." },
  { pole: "operations", label: "Opérations & finance", agents: ["gmail", "comptabilite", "presentateur"], text: "Inès trie vos e-mails, Chloé suit et relance vos factures, Hugo monte vos présentations." },
  { pole: "pilotage", label: "Pilotage", agents: ["cerveau", "orchestrateur"], text: "Clément retrouve toute l’information de l’entreprise, Noam coordonne l’équipe." },
];
