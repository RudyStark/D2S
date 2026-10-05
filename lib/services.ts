import type { AgentType } from "@/components/experience/agents/agents.config";

/*
 * Content of the sections below the reception: Services (the offer + the method) and Agents.
 * Copy written from the client's brief; claims stay within what D2S AIgency states it delivers.
 */

/* ——— Services ——— */

export const SERVICES_INTRO = {
  kicker: "Nos services",
  title: ["L’IA qui s’adapte à vous,", "pas l’inverse."],
  lead: "Nous concevons, connectons et faisons évoluer des agents IA qui prennent en charge le travail répétitif de vos équipes, sans rien changer à vos outils.",
};

export type BenefitIcon = "sparkle" | "bolt" | "plug" | "nocode" | "trend";

export interface Service {
  index: string;
  tag: string;
  title: string;
  text: string;
  functions: string[];
  benefits: { icon: BenefitIcon; title: string; text: string }[];
}

/** One service for now (numbered: more will follow). */
export const SERVICES: Service[] = [
  {
    index: "01",
    tag: "Plug & Play",
    title: "Agents IA Plug & Play",
    text: "Des agents IA spécialisés pour vos fonctions clés. Nous les adaptons à votre activité et les connectons à vos outils : ils sont prêts à travailler dès leur mise en service.",
    functions: ["Contenu", "Vente", "RH", "Support"],
    benefits: [
      { icon: "sparkle", title: "Pré-entraînés", text: "Formés à vos métiers, ajustés à vos process." },
      { icon: "bolt", title: "Rapides et rentables", text: "24h/24, pour une fraction du coût d’une embauche." },
      { icon: "plug", title: "Connectés", text: "À votre messagerie, CRM, agenda, documents…" },
      { icon: "nocode", title: "Zéro code", text: "La technique, c’est nous. Les résultats, c’est vous." },
      { icon: "trend", title: "Évolutifs", text: "Ils grandissent avec vos besoins." },
    ],
  },
];

export type ToolIcon = "chat" | "mail" | "crm" | "calendar" | "doc" | "web";

/** Tools shown around the agent in the plug & play diagram (generic, no third-party brands). */
export const PLUG_TOOLS: { id: string; label: string; icon: ToolIcon }[] = [
  { id: "chat", label: "Messagerie", icon: "chat" },
  { id: "mail", label: "E-mail", icon: "mail" },
  { id: "crm", label: "CRM", icon: "crm" },
  { id: "calendar", label: "Agenda", icon: "calendar" },
  { id: "doc", label: "Documents", icon: "doc" },
  { id: "web", label: "Site web", icon: "web" },
];

/** Illustrative activity feed of the diagram (examples of tasks, not statistics) and the tools each one uses. */
export const PLUG_ACTIVITY: { agent: AgentType; role: string; text: string; tools: string[] }[] = [
  { agent: "support", role: "Support", text: "Demande client résolue", tools: ["chat", "crm"] },
  { agent: "prospection", role: "Vente", text: "Relance envoyée à un prospect", tools: ["mail", "crm"] },
  { agent: "content", role: "Contenu", text: "Article de blog publié", tools: ["doc", "web"] },
  { agent: "automation", role: "RH", text: "Entretien planifié", tools: ["mail", "calendar"] },
  { agent: "data", role: "Données", text: "Rapport hebdo prêt", tools: ["crm", "doc"] },
];

/* ——— Method ——— */

export type StepIcon = "doc" | "gear" | "bars" | "rocket";

export interface MethodStep {
  title: string;
  summary: string;
  detail: string;
  outcome: string;
  role: string;
  icon: StepIcon;
}

export const METHOD_STEPS: MethodStep[] = [
  {
    title: "Brief",
    summary: "Nous analysons vos besoins et vos objectifs.",
    detail:
      "Un échange pour comprendre votre activité : vos tâches récurrentes, vos outils, vos priorités. Ensemble, nous repérons où un agent IA vous fera gagner le plus.",
    outcome: "Une feuille de route claire : les agents à créer et les gains attendus.",
    role: "Nous présenter votre quotidien. C’est tout.",
    icon: "doc",
  },
  {
    title: "Conception & déploiement",
    summary: "Nous créons et intégrons vos agents IA sur mesure.",
    detail:
      "Nous configurons chaque agent pour votre activité, le connectons à vos outils et le testons sur des cas réels avant sa mise en service.",
    outcome: "Des agents opérationnels, intégrés à vos outils.",
    role: "Valider les tests avant le lancement.",
    icon: "gear",
  },
  {
    title: "Analyse",
    summary: "Nous mesurons les performances et l’impact.",
    detail:
      "Une fois en service, nous suivons le travail de vos agents : temps gagné, qualité des réponses, volumes traités.",
    outcome: "Des indicateurs concrets, partagés avec vous.",
    role: "Nous faire vos retours du terrain.",
    icon: "bars",
  },
  {
    title: "Optimisation",
    summary: "Nous améliorons en continu pour aller plus loin.",
    detail:
      "Nous ajustons vos agents à partir des résultats et de vos retours, puis les étendons à de nouvelles tâches quand vous êtes prêts.",
    outcome: "Des agents qui progressent avec votre entreprise.",
    role: "Choisir la prochaine étape.",
    icon: "rocket",
  },
];

/** Process commitments shown under the method (to be confirmed by D2S AIgency). */
/** Our engagements: concrete, checkable, consistent with the method steps and the contact promise. */
export const METHOD_PROMISES = [
  "Un interlocuteur dédié, du premier échange au suivi",
  "Rien n’est mis en service sans votre feu vert",
  "Vos résultats mesurés et partagés chaque mois",
];

/* ——— English ——— */

const SERVICES_INTRO_EN: typeof SERVICES_INTRO = {
  kicker: "Our services",
  title: ["AI that adapts to you,", "not the other way round."],
  lead: "We design, connect and keep improving AI agents that take the repetitive work off your teams’ hands, without changing any of your tools.",
};

const SERVICES_EN: Service[] = [
  {
    index: "01",
    tag: "Plug & Play",
    title: "Plug & Play AI agents",
    text: "Specialised AI agents for your key functions. We adapt them to your business and connect them to your tools: they are ready to work from the day they go live.",
    functions: ["Content", "Sales", "HR", "Support"],
    benefits: [
      { icon: "sparkle", title: "Pre-trained", text: "Trained for your trade, tuned to your processes." },
      { icon: "bolt", title: "Fast and cost-effective", text: "24/7, for a fraction of the cost of a hire." },
      { icon: "plug", title: "Connected", text: "To your messaging, CRM, calendar, documents…" },
      { icon: "nocode", title: "Zero code", text: "We handle the tech. You get the results." },
      { icon: "trend", title: "Scalable", text: "They grow with your needs." },
    ],
  },
];

const PLUG_TOOLS_EN: typeof PLUG_TOOLS = [
  { id: "chat", label: "Messaging", icon: "chat" },
  { id: "mail", label: "E-mail", icon: "mail" },
  { id: "crm", label: "CRM", icon: "crm" },
  { id: "calendar", label: "Calendar", icon: "calendar" },
  { id: "doc", label: "Documents", icon: "doc" },
  { id: "web", label: "Website", icon: "web" },
];

const PLUG_ACTIVITY_EN: typeof PLUG_ACTIVITY = [
  { agent: "support", role: "Support", text: "Customer request solved", tools: ["chat", "crm"] },
  { agent: "prospection", role: "Sales", text: "Follow-up sent to a prospect", tools: ["mail", "crm"] },
  { agent: "content", role: "Content", text: "Blog post published", tools: ["doc", "web"] },
  { agent: "automation", role: "HR", text: "Interview scheduled", tools: ["mail", "calendar"] },
  { agent: "data", role: "Data", text: "Weekly report ready", tools: ["crm", "doc"] },
];

const METHOD_STEPS_EN: MethodStep[] = [
  {
    title: "Brief",
    summary: "We analyse your needs and your goals.",
    detail: "A conversation to understand your business: your recurring tasks, your tools, your priorities. Together, we find where an AI agent will save you the most.",
    outcome: "A clear roadmap: the agents to build and the expected gains.",
    role: "Walk us through your day. That’s all.",
    icon: "doc",
  },
  {
    title: "Design & deployment",
    summary: "We build and integrate your tailor-made AI agents.",
    detail: "We set up each agent for your business, connect it to your tools and test it on real cases before it goes live.",
    outcome: "Working agents, built into your tools.",
    role: "Approve the tests before launch.",
    icon: "gear",
  },
  {
    title: "Analysis",
    summary: "We measure performance and impact.",
    detail: "Once live, we track your agents’ work: time saved, quality of answers, volumes handled.",
    outcome: "Concrete metrics, shared with you.",
    role: "Tell us how it goes on the ground.",
    icon: "bars",
  },
  {
    title: "Optimisation",
    summary: "We keep improving to go further.",
    detail: "We fine-tune your agents from the results and your feedback, then extend them to new tasks when you are ready.",
    outcome: "Agents that progress with your company.",
    role: "Choose the next step.",
    icon: "rocket",
  },
];

const METHOD_PROMISES_EN = [
  "One dedicated contact, from the first call to the follow-up",
  "Nothing goes live without your go-ahead",
  "Your results measured and shared every month",
];

/** The sections' content in a language (the French constants above stay the reference). */
export const servicesText = (locale: "fr" | "en") =>
  locale === "en"
    ? { intro: SERVICES_INTRO_EN, services: SERVICES_EN, tools: PLUG_TOOLS_EN, activity: PLUG_ACTIVITY_EN, steps: METHOD_STEPS_EN, promises: METHOD_PROMISES_EN }
    : { intro: SERVICES_INTRO, services: SERVICES, tools: PLUG_TOOLS, activity: PLUG_ACTIVITY, steps: METHOD_STEPS, promises: METHOD_PROMISES };
