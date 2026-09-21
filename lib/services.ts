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
