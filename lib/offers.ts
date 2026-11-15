import type { Locale } from "./i18n";

/*
 * The three ways D2S AIgency puts AI to work (shared by desktop, mobile, metadata, JSON-LD and llms.txt):
 * 01 Plug & Play agents (detailed in lib/services.ts), 02 custom AI agents, 03 custom AI solutions
 * (a business application for one trade, up to a command centre that runs agent teams for large groups).
 * No product names here: the site describes the kind of solution, never a client's or an internal product.
 * No price, no figure: what is written is what D2S builds.
 */

export type OfferId = "plug" | "agent" | "solution";
export type OfferIcon = "plug" | "agent" | "layers";

export interface OfferCard {
  id: OfferId;
  index: string;
  /** Short tag above the title. */
  tag: string;
  title: string;
  text: string;
  /** "Pour qui / quand". */
  fit: string;
  /** Section of the home page that details it. */
  anchor: string;
  icon: OfferIcon;
}

export interface SolutionFormat {
  id: "app" | "command";
  tag: string;
  title: string;
  audience: string;
  text: string;
  points: string[];
}

const FR = {
  overview: {
    label: "Trois façons de travailler avec nous",
    more: "Découvrir",
  },
  cards: [
    {
      id: "plug",
      index: "01",
      tag: "Prêts à l’emploi",
      title: "Agents IA Plug & Play",
      text: "Seize agents spécialisés, adaptés à votre activité et connectés à vos outils.",
      fit: "Pour déléguer une tâche précise : prospection, support, contenu, RH, gestion.",
      anchor: "nos-agents-ia",
      icon: "plug",
    },
    {
      id: "agent",
      index: "02",
      tag: "Votre processus",
      title: "Agent IA sur mesure",
      text: "Un agent construit autour de vos règles, de vos validations et de vos cas particuliers.",
      fit: "Pour un processus propre à votre métier, branché sur vos logiciels.",
      anchor: "sur-mesure",
      icon: "agent",
    },
    {
      id: "solution",
      index: "03",
      tag: "Votre logiciel",
      title: "Solutions IA sur mesure",
      text: "Une application complète, avec ses écrans et ses agents, conçue pour votre activité.",
      fit: "Pour équiper un métier entier, ou piloter les équipes d’un grand groupe.",
      anchor: "solutions-ia",
      icon: "layers",
    },
  ] satisfies OfferCard[],
  intro: {
    kicker: "Sur mesure",
    title: ["Quand votre métier", "dépasse le prêt-à-l’emploi."],
    lead: "Certaines tâches suivent vos règles, vos validations et vos exceptions. Nous construisons alors l’agent, ou l’application entière, qui les connaît.",
  },
  agent: {
    index: "02",
    tag: "Agent IA sur mesure",
    title: "Votre processus a ses règles. Votre agent les connaît.",
    text: "Nous partons d’un processus réel de votre entreprise, du début à la fin. L’agent apprend vos règles, se branche sur vos logiciels et gère les exceptions ; ce qui est sensible revient toujours à vos équipes.",
    points: [
      { title: "Branché sur vos logiciels", text: "CRM, ERP, comptabilité, réservation, outils internes : il lit et agit là où vous travaillez." },
      { title: "Il gère les exceptions", text: "Cas particuliers, pièces manquantes, demandes ambiguës : il raisonne au lieu de bloquer." },
      { title: "Plusieurs étapes, plusieurs agents", text: "Un dossier complet, de la demande à l’action, avec des agents qui se passent le relais." },
    ],
    steps: [
      { title: "Atelier de cadrage", text: "Votre processus, vos règles, vos cas difficiles." },
      { title: "Prototype sur vos cas réels", text: "Testé et ajusté avec vous, avant toute mise en service." },
      { title: "Mise en service et suivi", text: "Résultats mesurés, agent amélioré chaque mois." },
    ],
    flow: {
      title: "Exemple : une demande client",
      nodes: ["Demande reçue", "Vos règles vérifiées", "Exception détectée", "Validation par votre équipe", "Action dans votre logiciel"],
      caption: "Illustration du principe",
    },
    cta: "Parler de votre processus",
  },
  solutions: {
    index: "03",
    tag: "Solutions IA sur mesure",
    title: "Un logiciel IA à vous, conçu pour votre activité.",
    text: "Au-delà d’un agent, nous concevons des applications complètes : des écrans pensés pour votre métier, des agents intégrés qui préparent le travail, vos données et vos outils réunis. Nous les livrons, les maintenons et les faisons évoluer avec vous.",
    formats: [
      {
        id: "app",
        tag: "Indépendants, cabinets, PME",
        title: "Application métier IA",
        audience: "Pour un métier précis",
        text: "Une application installée sur vos postes qui réunit vos e-mails, votre courrier, vos documents et votre agenda, avec un agent qui connaît les règles de votre profession.",
        points: [
          "Conçue autour du quotidien d’une profession",
          "Vos fichiers restent sur vos postes et dans vos outils",
          "Chaque action préparée par l’agent, validée par vous",
          "Accès sécurisé, historique de tout ce qui a été fait",
        ],
      },
      {
        id: "command",
        tag: "Grandes entreprises et groupes",
        title: "Centre de pilotage IA",
        audience: "Pour des équipes entières, en France et à l’international",
        text: "Un poste de pilotage où un agent coordinateur dirige des équipes d’agents par département : ventes, service client, logistique, finance, RH. Ils se passent le relais, montent les dossiers et vos responsables décident.",
        points: [
          "Une équipe d’agents par département, coordonnée en temps réel",
          "Relais entre services : un incident logistique prévient le service client",
          "Chaque décision sensible validée par un responsable, tout est tracé",
          "Branché sur vos systèmes : ERP, CRM, outils internes",
        ],
      },
    ] satisfies SolutionFormat[],
    command: { orchestrator: "Agent coordinateur", departments: ["Ventes", "Service client", "Logistique", "Finance", "RH", "Marketing"], approval: "Validation requise", approved: "Validé par un responsable" },
    app: { window: "Votre application", items: ["Courrier rangé dans le bon dossier", "Réponse préparée, à relire", "Échéance ajoutée à l’agenda"], validate: "Valider", done: "Fait" },
    cta: "Étudier votre projet",
  },
};

const EN: typeof FR = {
  overview: {
    label: "Three ways to work with us",
    more: "Explore",
  },
  cards: [
    {
      id: "plug",
      index: "01",
      tag: "Ready to use",
      title: "Plug & Play AI agents",
      text: "Sixteen specialised agents, adapted to your business and connected to your tools.",
      fit: "To hand over a precise task: prospecting, support, content, HR, back office.",
      anchor: "nos-agents-ia",
      icon: "plug",
    },
    {
      id: "agent",
      index: "02",
      tag: "Your process",
      title: "Custom AI agent",
      text: "An agent built around your rules, your approvals and your special cases.",
      fit: "For a process specific to your business, connected to your software.",
      anchor: "sur-mesure",
      icon: "agent",
    },
    {
      id: "solution",
      index: "03",
      tag: "Your software",
      title: "Custom AI solutions",
      text: "A complete application, with its own screens and agents, designed for your business.",
      fit: "To equip a whole trade, or run the teams of a large group.",
      anchor: "solutions-ia",
      icon: "layers",
    },
  ],
  intro: {
    kicker: "Custom-built",
    title: ["When your business", "goes beyond ready-made."],
    lead: "Some work follows your own rules, approvals and exceptions. That is when we build the agent, or the whole application, that knows them.",
  },
  agent: {
    index: "02",
    tag: "Custom AI agent",
    title: "Your process has its rules. Your agent knows them.",
    text: "We start from a real process in your company, end to end. The agent learns your rules, connects to your software and handles the exceptions; anything sensitive always goes back to your teams.",
    points: [
      { title: "Connected to your software", text: "CRM, ERP, accounting, booking, in-house tools: it reads and acts where you work." },
      { title: "It handles exceptions", text: "Special cases, missing documents, unclear requests: it reasons instead of getting stuck." },
      { title: "Several steps, several agents", text: "A complete case, from the request to the action, with agents handing over to each other." },
    ],
    steps: [
      { title: "Scoping workshop", text: "Your process, your rules, your hard cases." },
      { title: "Prototype on your real cases", text: "Tested and tuned with you, before anything goes live." },
      { title: "Go-live and follow-up", text: "Results measured, agent improved every month." },
    ],
    flow: {
      title: "Example: a customer request",
      nodes: ["Request received", "Your rules checked", "Exception spotted", "Approved by your team", "Action in your software"],
      caption: "How it works, illustrated",
    },
    cta: "Talk about your process",
  },
  solutions: {
    index: "03",
    tag: "Custom AI solutions",
    title: "AI software of your own, designed for your business.",
    text: "Beyond a single agent, we design complete applications: screens built for your trade, built-in agents that prepare the work, your data and tools in one place. We deliver them, maintain them and grow them with you.",
    formats: [
      {
        id: "app",
        tag: "Freelancers, practices, SMEs",
        title: "AI business application",
        audience: "For one specific trade",
        text: "An application installed on your computers that brings together your e-mails, your mail, your documents and your calendar, with an agent that knows the rules of your profession.",
        points: [
          "Designed around the daily work of one profession",
          "Your files stay on your computers and in your tools",
          "Every action prepared by the agent, approved by you",
          "Secure access, a log of everything that was done",
        ],
      },
      {
        id: "command",
        tag: "Large companies and groups",
        title: "AI command centre",
        audience: "For whole teams, in France and abroad",
        text: "A command centre where a coordinating agent runs teams of agents by department: sales, customer care, logistics, finance, HR. They hand over to each other, build the cases, and your managers decide.",
        points: [
          "One team of agents per department, coordinated in real time",
          "Hand-offs between teams: a logistics incident alerts customer care",
          "Every sensitive decision approved by a manager, everything logged",
          "Connected to your systems: ERP, CRM, in-house tools",
        ],
      },
    ],
    command: { orchestrator: "Coordinating agent", departments: ["Sales", "Customer care", "Logistics", "Finance", "HR", "Marketing"], approval: "Approval needed", approved: "Approved by a manager" },
    app: { window: "Your application", items: ["Mail filed in the right folder", "Reply drafted, ready to review", "Deadline added to the calendar"], validate: "Approve", done: "Done" },
    cta: "Discuss your project",
  },
};

export const offersOf = (locale: Locale) => (locale === "en" ? EN : FR);

/** Ids of the home page sections that detail the custom offers. */
export const CUSTOM_ID = "sur-mesure";
export const SOLUTIONS_ID = "solutions-ia";
