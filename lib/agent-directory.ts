import type { AgentType } from "@/components/experience/agents/agents.config";
import type { NeedId } from "./contact-content";
import type { Locale } from "./i18n";
import { teamOf } from "./team";
import { moreTeamOf, type MoreSlug } from "./team-more";

/*
 * The whole team in one flat list (the five of the 3D world, then the eleven others), for everything that
 * recommends an agent: the diagnostic (desktop and mobile) and May. Pure data: no 3D, no browser code.
 */

export type AgentKey = AgentType | MoreSlug;

export interface AgentCard {
  key: AgentKey;
  name: string;
  role: string;
  blurb: string;
  missions: string[];
  control: string;
  tint: [string, string];
  image: string;
  avatar: string;
  /** Grammatical gender of the name (« prête », « adaptée »…). */
  feminine: boolean;
  /** One of the five of the 3D world (they have a mobile profile window). */
  core: boolean;
  /** The contact form's need for this agent (every agent has its own). */
  need: NeedId;
}

const FEMININE: Record<AgentKey, boolean> = {
  content: true,
  support: false,
  prospection: true,
  automation: true,
  data: false,
  fireflies: false,
  proposition: false,
  strategiste: false,
  designer: true,
  veille: true,
  ecommerce: true,
  gmail: true,
  comptabilite: true,
  presentateur: false,
  cerveau: false,
  orchestrateur: false,
};

const picture = (key: AgentKey) => ({
  image: `/images/agents/${key}.webp`,
  avatar: `/images/agents/${key}-avatar.webp`,
});

function cards(locale: Locale): AgentCard[] {
  return [
    ...teamOf(locale).map((t) => ({
      key: t.type,
      name: t.name,
      role: t.role,
      blurb: t.blurb,
      missions: t.missions,
      control: t.control,
      tint: t.tint,
      ...picture(t.type),
      feminine: FEMININE[t.type],
      core: true,
      need: t.type,
    })),
    ...moreTeamOf(locale).map((m) => ({
      key: m.slug,
      name: m.name,
      role: m.role,
      blurb: m.blurb,
      missions: m.missions,
      control: m.control,
      tint: m.tint,
      ...picture(m.slug),
      feminine: FEMININE[m.slug],
      core: false,
      need: m.slug,
    })),
  ];
}

export const AGENT_CARDS: AgentCard[] = cards("fr");
const AGENT_CARDS_EN: AgentCard[] = cards("en");
export const agentCardsOf = (locale: Locale) =>
  locale === "en" ? AGENT_CARDS_EN : AGENT_CARDS;

const BY_KEY = new Map(AGENT_CARDS.map((a) => [a.key, a]));
const BY_KEY_EN = new Map(AGENT_CARDS_EN.map((a) => [a.key, a]));

export const agentCard = (key: AgentKey, locale: Locale = "fr") =>
  (locale === "en" ? BY_KEY_EN : BY_KEY).get(key)!;
