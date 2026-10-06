import type { AgentType } from "@/components/experience/agents/agents.config";

/*
 * The D2S agents, as described by the client (19/09). Name, role, pitch and the five missions come from
 * the brief; channels, the human safeguard and the demo complete each profile in the same logic.
 * Demos (components/overlays/AgentDemos.tsx) are illustrations with fictional data.
 */

export const TEAM_INTRO = {
  kicker: "Nos agents IA",
  title: ["Des agents IA pour chaque défi,", "des résultats concrets."],
  lead: "Cinq agents IA spécialisés, chacun expert de son métier. Ils travaillent dans vos outils, 24h/24, et vous laissent toujours le dernier mot.",
  note: ["Une équipe IA", "au service de vos ambitions"],
};

export interface AgentProfile {
  type: AgentType;
  name: string;
  role: string;
  /** One line for the card. */
  blurb: string;
  /** Full pitch (dialog). */
  pitch: string;
  missions: string[];
  /** Where the agent works. */
  channels: string[];
  /** Human safeguard: what stays in your hands. */
  control: string;
  /** Title of the live demo in the profile window. */
  demo: string;
  /** Stage gradient behind the portrait (card and profile). */
  tint: [string, string];
}

export const TEAM: AgentProfile[] = [
  {
    type: "content",
    name: "Déa",
    role: "Créatrice de contenu",
    blurb: "Du contenu percutant, calé sur votre stratégie et votre ton.",
    pitch:
      "Déa écrit comme une pro et ne rate jamais une deadline. Elle génère du contenu percutant, calé sur votre stratégie et votre ton.",
    missions: [
      "Rédige posts LinkedIn, captions Instagram et newsletters",
      "Planifie et tient votre calendrier éditorial",
      "Adapte le message selon le ton et l’audience",
      "Génère des articles à partir de mots-clés ou de briefs",
      "Suggère hooks viraux et angles pour chaque sujet",
    ],
    channels: ["LinkedIn", "Instagram", "Newsletter", "Blog", "Calendrier éditorial"],
    control: "Vous validez chaque contenu avant publication.",
    demo: "Du brief au post programmé",
    tint: ["#efeaff", "#dde5fe"],
  },
  {
    type: "support",
    name: "Loic",
    role: "Support client IA",
    blurb: "Répond à vos clients instantanément, à toute heure.",
    pitch:
      "Loic répond à vos clients instantanément, à toute heure. Il résout les problèmes, suit les commandes et rend le support fluide.",
    missions: [
      "Répond aux questions courantes par chat, WhatsApp ou e-mail",
      "Escalade les cas complexes à vos équipes",
      "Suit les commandes et informe les clients en temps réel",
      "Collecte les retours après chaque échange",
      "Guide les clients avec des instructions claires",
    ],
    channels: ["Chat du site", "WhatsApp", "E-mail", "Suivi de commandes"],
    control: "Les cas sensibles passent à votre équipe, avec tout l’historique de l’échange.",
    demo: "Une demande client résolue, à 21\u00a0h\u00a047",
    tint: ["#e5f3ff", "#d3e8fc"],
  },
  {
    type: "prospection",
    name: "May",
    role: "Commerciale IA",
    blurb: "Contacte, qualifie et garde votre pipeline chaud, 24/7.",
    pitch:
      "May est votre commerciale infatigable. Elle contacte, qualifie, gère les objections et garde votre pipeline chaud, 24/7.",
    missions: [
      "Qualifie vos leads par e-mail, LinkedIn ou WhatsApp",
      "Réserve les rendez-vous dans votre agenda",
      "Relance et conclut seule les petites affaires",
      "Personnalise chaque message selon le profil du lead",
      "Met à jour le CRM à chaque échange",
    ],
    channels: ["E-mail", "LinkedIn", "WhatsApp", "Agenda", "CRM"],
    control: "Les affaires importantes reviennent à vos commerciaux, prêtes à être conclues.",
    demo: "Du premier message au rendez-vous",
    tint: ["#e7efff", "#d2dffd"],
  },
  {
    type: "automation",
    name: "Diva",
    role: "Coordinatrice RH IA",
    blurb: "Fluidifie recrutement, onboarding et process RH.",
    pitch:
      "Diva fluidifie votre recrutement, votre onboarding et vos process RH internes. Candidats comme employés se sentent toujours accompagnés.",
    missions: [
      "Trie les CV et classe les candidats par pertinence",
      "Envoie les invitations d’entretien et les relances",
      "Accueille les nouveaux avec checklists et documents",
      "Répond aux questions RH internes par chat",
      "Recueille l’avis des employés via des sondages automatisés",
    ],
    channels: ["E-mail", "Agenda", "Messagerie interne", "Documents", "Sondages"],
    control: "Les décisions de recrutement restent entre vos mains.",
    demo: "48 candidatures triées en quelques secondes",
    tint: ["#efebfb", "#dde2fb"],
  },
  {
    type: "data",
    name: "Morgan",
    role: "Analyste de données IA",
    blurb: "Transforme vos données en décisions, en temps réel.",
    pitch:
      "Morgan transforme vos données en décisions. Il suit vos indicateurs, repère les tendances et vous alerte au bon moment.",
    missions: [
      "Rassemble vos données : ventes, CRM, marketing, finance",
      "Produit vos tableaux de bord et rapports automatiquement",
      "Détecte tendances, anomalies et opportunités",
      "Répond à vos questions en langage naturel",
      "Vous alerte dès qu’un indicateur décroche",
    ],
    channels: ["Tableurs", "CRM", "Outils de vente", "Tableaux de bord", "E-mail"],
    control: "Vous gardez l’accès à toutes les données sources.",
    demo: "Vos ventes du mois, expliquées",
    tint: ["#e2f4f4", "#d3e6f7"],
  },
];

/* ——— English (same agents: only the words change) ——— */

const TEAM_INTRO_EN: typeof TEAM_INTRO = {
  kicker: "Our AI agents",
  title: ["An AI agent for every challenge,", "concrete results."],
  lead: "Five specialised AI agents, each an expert in its trade. They work in your tools, 24/7, and always leave you the final say.",
  note: ["An AI team", "serving your ambitions"],
};

type Words = Pick<AgentProfile, "role" | "blurb" | "pitch" | "missions" | "channels" | "control" | "demo">;

const TEAM_WORDS_EN: Record<AgentType, Words> = {
  content: {
    role: "Content creator",
    blurb: "Punchy content, in line with your strategy and your tone.",
    pitch: "Déa writes like a pro and never misses a deadline. She produces punchy content, in line with your strategy and your tone.",
    missions: [
      "Writes LinkedIn posts, Instagram captions and newsletters",
      "Plans and keeps your editorial calendar",
      "Adapts the message to the tone and the audience",
      "Generates articles from keywords or briefs",
      "Suggests viral hooks and angles for every topic",
    ],
    channels: ["LinkedIn", "Instagram", "Newsletter", "Blog", "Editorial calendar"],
    control: "You approve every piece of content before it is published.",
    demo: "From brief to scheduled post",
  },
  support: {
    role: "AI customer support",
    blurb: "Answers your customers instantly, at any hour.",
    pitch: "Loic answers your customers instantly, at any hour. He solves problems, tracks orders and keeps support smooth.",
    missions: [
      "Answers common questions by chat, WhatsApp or e-mail",
      "Escalates complex cases to your teams",
      "Tracks orders and keeps customers informed in real time",
      "Collects feedback after every conversation",
      "Guides customers with clear instructions",
    ],
    channels: ["Website chat", "WhatsApp", "E-mail", "Order tracking"],
    control: "Sensitive cases go to your team, with the full history of the conversation.",
    demo: "A customer request solved, at 9:47 pm",
  },
  prospection: {
    role: "AI sales rep",
    blurb: "Reaches out, qualifies and keeps your pipeline warm, 24/7.",
    pitch: "May is your tireless sales rep. She reaches out, qualifies, handles objections and keeps your pipeline warm, 24/7.",
    missions: [
      "Qualifies your leads by e-mail, LinkedIn or WhatsApp",
      "Books meetings in your calendar",
      "Follows up and closes small deals on her own",
      "Personalises every message to the lead’s profile",
      "Updates the CRM after every exchange",
    ],
    channels: ["E-mail", "LinkedIn", "WhatsApp", "Calendar", "CRM"],
    control: "The big deals come back to your sales team, ready to close.",
    demo: "From the first message to the meeting",
  },
  automation: {
    role: "AI HR coordinator",
    blurb: "Smooths out recruiting, onboarding and HR processes.",
    pitch: "Diva smooths out your recruiting, your onboarding and your internal HR processes. Candidates and employees always feel looked after.",
    missions: [
      "Screens CVs and ranks candidates by relevance",
      "Sends interview invitations and reminders",
      "Welcomes newcomers with checklists and documents",
      "Answers internal HR questions by chat",
      "Gathers employee feedback through automated surveys",
    ],
    channels: ["E-mail", "Calendar", "Internal messaging", "Documents", "Surveys"],
    control: "Hiring decisions stay in your hands.",
    demo: "48 applications sorted in seconds",
  },
  data: {
    role: "AI data analyst",
    blurb: "Turns your data into decisions, in real time.",
    pitch: "Morgan turns your data into decisions. He tracks your metrics, spots trends and alerts you at the right time.",
    missions: [
      "Brings your data together: sales, CRM, marketing, finance",
      "Produces your dashboards and reports automatically",
      "Detects trends, anomalies and opportunities",
      "Answers your questions in plain language",
      "Alerts you as soon as a metric drops",
    ],
    channels: ["Spreadsheets", "CRM", "Sales tools", "Dashboards", "E-mail"],
    control: "You keep access to all the source data.",
    demo: "Your month’s sales, explained",
  },
};

const TEAM_EN: AgentProfile[] = TEAM.map((a) => ({ ...a, ...TEAM_WORDS_EN[a.type] }));

/** The five agents in a language (names, faces and colours stay the same). */
export const teamOf = (locale: "fr" | "en") => (locale === "en" ? TEAM_EN : TEAM);
export const teamIntroOf = (locale: "fr" | "en") => (locale === "en" ? TEAM_INTRO_EN : TEAM_INTRO);
