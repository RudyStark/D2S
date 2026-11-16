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
    role: "Accueil & support client IA",
    blurb: "Décroche, répond sur WhatsApp et prend vos rendez-vous, 24\u00a0h/24, dans toutes les langues.",
    pitch:
      "Loic est votre accueil, jour et nuit. Il décroche votre téléphone, répond sur WhatsApp (notes vocales comprises) et sur votre site, renseigne vos clients et prend leurs rendez-vous dans votre agenda. Il parle la langue de chacun : un client qui écrit en anglais, en espagnol ou en indonésien reçoit sa réponse dans sa langue. Tout ce qu’il fait se retrouve dans votre espace.",
    missions: [
      "Décroche votre téléphone 24\u00a0h/24 sur votre numéro habituel, avec une voix naturelle",
      "Répond sur WhatsApp, à l’écrit comme aux notes vocales, et sur le chat de votre site",
      "Parle la langue de chaque client : français, anglais, espagnol, arabe, indonésien…",
      "Prend, déplace et annule les rendez-vous dans votre agenda, confirmés par SMS, rappelés la veille",
      "Prend les messages à rappeler, vous passe les urgences et range tout dans votre espace : appels résumés, conversations WhatsApp, rendez-vous, messages",
    ],
    channels: ["Téléphone", "WhatsApp", "Chat du site", "SMS", "Agenda", "Multilingue"],
    control: "Il se présente comme assistant virtuel, vous passe les urgences et les cas sensibles, et chaque échange reste consultable dans votre espace.",
    demo: "Un rendez-vous pris sur WhatsApp, à 21\u00a0h\u00a047",
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
    blurb: "Votre RH : recrutement, équipe, absences et paie.",
    pitch:
      "Diva est la RH qui vous manquait : elle recrute, suit votre équipe et ses échéances légales, gère les absences et prépare la paie du mois. Vous validez, elle s’occupe du reste.",
    missions: [
      "Publie vos offres et lit chaque candidature à l’aveugle, sur la même grille",
      "Fait réserver les entretiens dans votre agenda et prépare les réponses",
      "Suit les échéances légales : DPAE, visite médicale, période d’essai, fin de CDD",
      "Gère absences et congés, avec un espace personnel pour chaque salarié",
      "Prépare la paie du mois et l’envoie à votre expert-comptable",
    ],
    channels: ["Page Carrières", "E-mail", "Agenda", "Espace salarié", "Logiciel de paie"],
    control: "Chaque décision reste la vôtre : rien ne part sans validation, tout est tracé.",
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
    role: "AI front desk & customer support",
    blurb: "Answers your phone and WhatsApp and books your appointments, 24/7, in any language.",
    pitch: "Loic is your front desk, day and night. He answers your phone, replies on WhatsApp (voice notes included) and on your website, informs your customers and books their appointments in your calendar. He speaks each customer’s language: someone who writes in Spanish, Arabic or Indonesian gets the answer in their own language. Everything he does is in your space.",
    missions: [
      "Answers your phone 24/7 on your usual number, with a natural voice",
      "Replies on WhatsApp, in writing and to voice notes, and on your website chat",
      "Speaks each customer’s language: French, English, Spanish, Arabic, Indonesian…",
      "Books, moves and cancels appointments in your calendar, confirmed by text, reminded the day before",
      "Takes messages to call back, passes urgent cases to you and keeps everything in your space: summarised calls, WhatsApp conversations, appointments, messages",
    ],
    channels: ["Phone", "WhatsApp", "Website chat", "Text messages", "Calendar", "Multilingual"],
    control: "He introduces himself as a virtual assistant, passes urgent and sensitive cases to you, and every conversation stays available in your space.",
    demo: "An appointment booked on WhatsApp, at 9:47 pm",
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
    blurb: "Your HR: hiring, team, absences and payroll.",
    pitch: "Diva is the HR department you were missing: she hires, keeps track of your team and its legal deadlines, manages absences and prepares the month’s payroll. You approve, she handles the rest.",
    missions: [
      "Publishes your job ads and reads every application blind, on the same grid",
      "Lets candidates book their interview in your calendar and drafts the replies",
      "Tracks legal deadlines: pre-hire declaration, medical check, trial period, end of fixed-term contracts",
      "Manages absences and leave, with a personal space for each employee",
      "Prepares the month’s payroll and sends it to your accountant",
    ],
    channels: ["Careers page", "E-mail", "Calendar", "Employee space", "Payroll software"],
    control: "Every decision stays yours: nothing leaves without approval, everything is logged.",
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
