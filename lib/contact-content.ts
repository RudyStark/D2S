import type { AgentType } from "@/components/experience/agents/agents.config";

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

export type NeedId = AgentType | "custom" | "unsure";

export const NEEDS: { id: NeedId; label: string; agent?: AgentType }[] = [
  { id: "content", label: "Contenu", agent: "content" },
  { id: "support", label: "Support client", agent: "support" },
  { id: "prospection", label: "Prospection", agent: "prospection" },
  { id: "automation", label: "RH", agent: "automation" },
  { id: "data", label: "Données", agent: "data" },
  { id: "custom", label: "Agent sur mesure" },
  { id: "unsure", label: "Je ne sais pas encore" },
];

export const MESSAGE_HINTS: Record<NeedId, string> = {
  content: "Ex. : nous publions deux posts LinkedIn par semaine et une newsletter mensuelle, nous aimerions…",
  support: "Ex. : nous recevons une centaine de demandes par semaine, surtout sur le suivi de commande…",
  prospection: "Ex. : nous ciblons des PME du BTP et voulons plus de rendez-vous qualifiés…",
  automation: "Ex. : nous recrutons quinze personnes cette année et l’onboarding nous prend beaucoup de temps…",
  data: "Ex. : nos chiffres sont éparpillés entre le CRM et des tableurs, nous voulons un point clair chaque lundi…",
  custom: "Ex. : le processus à confier à l’agent, les outils utilisés et vos règles particulières…",
  unsure: "Ex. : votre activité et ce qui vous prend le plus de temps aujourd’hui…",
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
