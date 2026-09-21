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
