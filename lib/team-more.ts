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

/* ——— English (same agents, same faces: only the words change) ——— */

const POLES_EN: typeof POLES = [
  { id: "commercial", label: "Sales" },
  { id: "marketing", label: "Content & marketing" },
  { id: "operations", label: "Operations & finance" },
  { id: "pilotage", label: "Management" },
];

const MORE_INTRO_EN: typeof MORE_INTRO = {
  kicker: "The whole team",
  title: ["Eleven more experts,", "ready to join yours."],
  lead: "Beyond our five flagship agents, a full team covers sales, marketing, operations and management. Each one knows its trade and works with the others.",
};

type MoreWords = Pick<MoreAgent, "role" | "blurb" | "pitch" | "missions" | "channels" | "control" | "demo">;

const MORE_WORDS_EN: Record<MoreSlug, MoreWords> = {
  fireflies: {
    role: "Meeting analyst",
    blurb: "Every sales meeting becomes an action plan, without taking a single note.",
    pitch: "Jules listens to your sales meetings for you. He pulls out the needs, the objections and the chances of closing, then prepares the follow-up: you stay focused on your prospect.",
    missions: [
      "Joins your video calls to record and transcribe them",
      "Sums up the meeting: needs, budget, decision-maker, timing",
      "Lists every objection and the answer to give",
      "Estimates the prospect’s chances of signing",
      "Prepares the action plan and the follow-up e-mail",
    ],
    channels: ["Google Meet", "Zoom", "Teams", "Transcripts", "Follow-up e-mail"],
    control: "The prospect is told about the recording. Without a recording, you paste your notes and Jules analyses them the same way.",
    demo: "From meeting to action plan",
  },
  proposition: {
    role: "Sales proposals",
    blurb: "A solid proposal, sent the same day as the meeting.",
    pitch: "Victor turns a meeting into a structured, convincing sales proposal, ready to send. He sells the outcome, not a list of features, and tells you when the prospect opens it.",
    missions: [
      "Writes the proposal from the meeting analysis",
      "Lays out the client’s situation, the solution and several options",
      "Answers in advance the objections heard in the meeting",
      "Formats a professional PDF, ready to send",
      "Tracks when each proposal is opened by the prospect",
    ],
    channels: ["PDF", "Tracking link", "E-mail", "Proposal tracking"],
    control: "Every amount and every commitment needs your approval before it is sent.",
    demo: "From meeting to proposal",
  },
  strategiste: {
    role: "Marketing strategist",
    blurb: "Clear decisions on your audience, your message and your campaigns.",
    pitch: "Antoine turns a vague intention into clear decisions: who to talk to, with which message, through which channels. He relies on proven methods and hands you briefs ready for the rest of the team.",
    missions: [
      "Makes the diagnosis and restates your goal",
      "Analyses your competitors and what sets you apart",
      "Defines your ideal customer and their buying triggers",
      "Builds your positioning and your message",
      "Writes the campaign briefs for Déa, Mia and May",
    ],
    channels: ["Strategy", "Positioning", "Campaign briefs", "Action plan"],
    control: "Antoine proposes and argues every choice: the decision stays yours.",
    demo: "From idea to campaign plan",
  },
  designer: {
    role: "Art director",
    blurb: "Visuals and thumbnails in your colours, with no designer or photo shoot.",
    pitch: "Mia is your art director: she starts from your brand guidelines, suggests concepts, then produces the visuals and thumbnails that make people click, in every format.",
    missions: [
      "Creates brand visuals from your guidelines",
      "Designs YouTube thumbnails with your face",
      "Suggests several concepts before producing",
      "Adapts each creation to every format: post, story, banner",
      "Keeps a consistent visual identity everywhere",
    ],
    channels: ["Instagram", "LinkedIn", "YouTube", "Banners", "Brand guidelines"],
    control: "Your reference photo stays private, and you choose every visual before it is used.",
    demo: "A thumbnail that makes people click",
  },
  veille: {
    role: "Trend watch",
    blurb: "Know what works in your industry before you write a line.",
    pitch: "Nina spots what really grabs attention in your niche: the videos that perform, their hooks, their formats. She breaks down why they work and turns that into your next ideas.",
    missions: [
      "Finds the most-viewed videos on your topic",
      "Follows your competitors and the accounts that inspire you",
      "Transcribes the spoken words of each video",
      "Explains why a video outperforms",
      "Turns her findings into ideas for Déa",
    ],
    channels: ["Instagram", "Reels", "Trends", "Competitive watch"],
    control: "Nina draws inspiration from public content, she never copies.",
    demo: "Ideas that have proven themselves",
  },
  ecommerce: {
    role: "E-commerce expert",
    blurb: "Product videos that sell, with no shoot and no actor.",
    pitch: "Emma produces the videos that sell your products: an avatar presenting them like a content creator, or a polished product showcase. The script and the hook are written to convert.",
    missions: [
      "Creates product videos presented by an avatar",
      "Stages your products, with no studio or equipment",
      "Writes the script and the hook of the first seconds",
      "Picks the sales angle: problem, demo, objection",
      "Files your videos by product, ready to publish",
    ],
    channels: ["Product pages", "Instagram", "TikTok", "Ads"],
    control: "You approve the script and the avatar before each video.",
    demo: "A product launch on video",
  },
  gmail: {
    role: "E-mail assistant",
    blurb: "An inbox sorted every day, with the replies already drafted.",
    pitch: "Inès gives you back the time your inbox takes: she sorts it, tells you what to handle first and prepares clear replies, ready to send.",
    missions: [
      "Files each e-mail: customer, prospect, supplier, admin",
      "Draws up the day’s priority list",
      "Drafts short, clear replies",
      "Spots messages left unanswered",
      "Prepares follow-ups at the right time",
    ],
    channels: ["Gmail", "Outlook", "Any mailbox", "Today’s to-do"],
    control: "Inès only sees what you share with her, and never replies on her own.",
    demo: "Forty e-mails, ten minutes",
  },
  comptabilite: {
    role: "AI accountant",
    blurb: "Your figures made readable, your invoices tracked and chased at the right time.",
    pitch: "Chloé makes your finances readable for a manager who is not an accountant: what has been paid, what is late, what to chase, and where your margin goes.",
    missions: [
      "Tracks your invoices: paid, pending, overdue",
      "Chases in stages, from a polite reminder to a firm one",
      "Prepares your invoices as PDFs, ready to send",
      "Shows your revenue, your expenses and your margin",
      "Alerts you to what needs your attention",
    ],
    channels: ["Airtable", "PDF invoices", "E-mail reminders", "Dashboard"],
    control: "Every reminder and every invoice needs your approval.",
    demo: "Invoices that finally get paid",
  },
  presentateur: {
    role: "Presentation maker",
    blurb: "Clear presentations in your colours, in minutes.",
    pitch: "Hugo turns a brief or a report into a slide-by-slide presentation, laid out automatically: key figures, comparisons and steps become readable diagrams.",
    missions: [
      "Builds a full deck from a brief",
      "Lays out every slide automatically",
      "Turns your figures into readable diagrams",
      "Prepares a full-screen presenter mode",
      "Exports it all as a PDF to send",
    ],
    channels: ["Presentations", "PDF", "Client meetings", "Board meetings"],
    control: "You review and adjust the content before presenting.",
    demo: "A client presentation, ready on time",
  },
  cerveau: {
    role: "The company’s memory",
    blurb: "Your whole company’s memory, one question away.",
    pitch: "Clément knows everything your company knows: documents, meetings, proposals, prospects. Ask him a question, he answers and says where the information comes from.",
    missions: [
      "Links all the company’s knowledge automatically",
      "Answers questions and cites his sources",
      "Gives an overview of the team’s activity",
      "Welcomes new hires with what they need to know",
      "Flags what is missing or out of date",
    ],
    channels: ["Documents", "Meetings", "Proposals", "The whole agent team"],
    control: "Clément only answers from your data, and says when he does not know.",
    demo: "The right answer, with its source",
  },
  orchestrateur: {
    role: "Conductor",
    blurb: "A single point of contact for your whole agent team.",
    pitch: "Noam is your team’s front door: you write to him, he hands each request to the agent whose job it is and suggests the right sequence to reach your goals.",
    missions: [
      "Hands each request to the right agent, automatically",
      "Answers “who does what?” and “where do I start?”",
      "Suggests the chain of agents for each goal",
      "Passes work from one agent to the next",
      "Saves you from wondering who to ask",
    ],
    channels: ["The whole agent team", "Single point of contact"],
    control: "Noam directs: you always approve the agents’ work.",
    demo: "One goal, a whole team",
  },
};

const MORE_TEAM_EN: MoreAgent[] = MORE_TEAM.map((a) => ({ ...a, ...MORE_WORDS_EN[a.slug] }));

const MORE_BY_POLE_EN: typeof MORE_BY_POLE = [
  { pole: "commercial", label: "Sales", agents: ["fireflies", "proposition"], text: "Jules analyses your meetings, Victor writes your sales proposals." },
  { pole: "marketing", label: "Content & marketing", agents: ["strategiste", "designer", "veille", "ecommerce"], text: "Antoine sets your strategy, Mia creates your visuals, Nina spots the trends, Emma produces your product videos." },
  { pole: "operations", label: "Operations & finance", agents: ["gmail", "comptabilite", "presentateur"], text: "Inès sorts your e-mails, Chloé tracks and chases your invoices, Hugo builds your presentations." },
  { pole: "pilotage", label: "Management", agents: ["cerveau", "orchestrateur"], text: "Clément finds any information in the company, Noam coordinates the team." },
];

/** The eleven in a language. */
export const moreTeamOf = (locale: "fr" | "en") => (locale === "en" ? MORE_TEAM_EN : MORE_TEAM);
export const moreIntroOf = (locale: "fr" | "en") => (locale === "en" ? MORE_INTRO_EN : MORE_INTRO);
export const polesOf = (locale: "fr" | "en") => (locale === "en" ? POLES_EN : POLES);
export const moreByPoleOf = (locale: "fr" | "en") => (locale === "en" ? MORE_BY_POLE_EN : MORE_BY_POLE);
