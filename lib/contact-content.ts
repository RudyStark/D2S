import type { AgentKey } from "./agent-directory";
import { TEAM } from "./team";
import { MORE_TEAM, type MoreSlug } from "./team-more";

/*
 * Pure content of the contact section (no browser code): importable from server components, the
 * structured data and llms.txt. The client logic (intent store, scroll) lives in lib/contact.ts.
 */

export const CONTACT_ID = "contact";

export const CONTACT_INTRO = {
  kicker: "Contact",
  title: ["Parlons de", "votre projet."],
  lead: "Un premier échange de 30 minutes, gratuit et sans engagement. Vous repartez avec une idée claire de ce qu’un agent IA peut faire pour votre entreprise.",
};

/** The need of a request: one of the sixteen agents, a custom agent, or not sure yet. */
export type NeedId = AgentKey | "custom" | "unsure";

export interface Need {
  id: NeedId;
  /** Short domain (« Contenu », « Propositions »…). */
  label: string;
  agent?: AgentKey;
  /** The agent's first name. */
  name?: string;
  /** One of the eleven of « Toute l'équipe » (the form shows them on demand). */
  team?: boolean;
}

const CORE_LABELS = { content: "Contenu", support: "Support client", prospection: "Prospection", automation: "RH", data: "Données" };
const TEAM_LABELS: Record<MoreSlug, string> = {
  fireflies: "Rendez-vous",
  proposition: "Propositions",
  strategiste: "Stratégie",
  designer: "Visuels",
  veille: "Veille",
  ecommerce: "Vidéos produit",
  gmail: "E-mails",
  comptabilite: "Factures",
  presentateur: "Présentations",
  cerveau: "Mémoire interne",
  orchestrateur: "Coordination",
};

export const NEEDS: Need[] = [
  ...TEAM.map((t) => ({ id: t.type, label: CORE_LABELS[t.type], agent: t.type, name: t.name })),
  { id: "custom", label: "Agent sur mesure" },
  { id: "unsure", label: "Je ne sais pas encore" },
  ...MORE_TEAM.map((m) => ({ id: m.slug, label: TEAM_LABELS[m.slug], agent: m.slug, name: m.name, team: true })),
];

export const NEED_IDS = NEEDS.map((n) => n.id);

/** « Victor · Propositions », « Agent sur mesure » (e-mails, chat). */
export const needLabel = (id: string) => {
  const need = NEEDS.find((n) => n.id === id);
  return need ? (need.name ? `${need.name} · ${need.label}` : need.label) : "";
};

export const MESSAGE_HINTS: Record<NeedId, string> = {
  content: "Ex. : nous publions deux posts LinkedIn par semaine et une newsletter mensuelle, nous aimerions…",
  support: "Ex. : nous recevons une centaine de demandes par semaine, surtout sur le suivi de commande…",
  prospection: "Ex. : nous ciblons des PME du BTP et voulons plus de rendez-vous qualifiés…",
  automation: "Ex. : nous recrutons quinze personnes cette année et l’onboarding nous prend beaucoup de temps…",
  data: "Ex. : nos chiffres sont éparpillés entre le CRM et des tableurs, nous voulons un point clair chaque lundi…",
  custom: "Ex. : le processus à confier à l’agent, les outils utilisés et vos règles particulières…",
  unsure: "Ex. : votre activité et ce qui vous prend le plus de temps aujourd’hui…",
  fireflies: "Ex. : nous faisons une dizaine de rendez-vous commerciaux par semaine en visio, et les comptes rendus nous prennent…",
  proposition: "Ex. : chaque proposition commerciale nous prend une demi-journée, nous voudrions l’envoyer le jour du rendez-vous…",
  strategiste: "Ex. : nous lançons une nouvelle offre et hésitons encore sur la cible et le message…",
  designer: "Ex. : nous publions plusieurs visuels par semaine sur Instagram et LinkedIn, sans graphiste…",
  veille: "Ex. : nous voulons savoir quelles vidéos marchent dans notre secteur avant de produire les nôtres…",
  ecommerce: "Ex. : nous vendons une quarantaine de produits en ligne et voudrions une vidéo pour chacun…",
  gmail: "Ex. : nous recevons beaucoup d’e-mails chaque jour et certains restent sans réponse…",
  comptabilite: "Ex. : nos relances de factures se font à la main et les retards de paiement s’accumulent…",
  presentateur: "Ex. : nous préparons chaque semaine une présentation client ou un point d’équipe…",
  cerveau: "Ex. : nos informations sont éparpillées entre Drive, e-mails et comptes rendus, on perd du temps à les retrouver…",
  orchestrateur: "Ex. : nous voulons confier plusieurs tâches à des agents, avec un seul interlocuteur…",
};

export const CHANNELS = [
  { id: "visio", label: "Visio, 30 min" },
  { id: "phone", label: "Appel" },
  { id: "email", label: "E-mail" },
] as const;

export type ChannelId = (typeof CHANNELS)[number]["id"];

export const NEXT_STEPS = [
  { title: "Nous lisons votre demande", text: "Une réponse sous 24 h ouvrées, par un humain de l’équipe." },
  { title: "Un appel découverte", text: "30 minutes sur vos tâches, vos outils et vos priorités." },
  { title: "Votre proposition", text: "Agent recommandé, planning et budget, noir sur blanc." },
];

/* ---------- Direct contact (menu "Contact" → dialog → rudy.saksik@d2saigency.com) ---------- */

export const DIRECT_TOPICS = [
  { id: "project", label: "Un projet d’agent IA" },
  { id: "quote", label: "Une demande de devis" },
  { id: "partnership", label: "Un partenariat" },
  { id: "press", label: "Presse et médias" },
  { id: "other", label: "Autre sujet" },
] as const;

export type DirectTopicId = (typeof DIRECT_TOPICS)[number]["id"];
