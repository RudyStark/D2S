import {
  AGENTS,
  type AgentType,
} from "@/components/experience/agents/agents.config";
import { agentCard } from "@/lib/agent-directory";
import type { ContactIntent } from "@/lib/contact";
import type { Locale } from "@/lib/i18n";
import { TEAM, teamOf } from "@/lib/team";
import { moreTeamOf } from "@/lib/team-more";

/*
 * Every agent the profile window can show (desktop agents section): the five of the 3D world first (with their live
 * demo), then the rest of the team (with theirs). One list, so ← / → browse the whole team.
 */
export interface DialogAgent {
  key: string;
  name: string;
  role: string;
  pitch: string;
  missions: string[];
  channels: string[];
  control: string;
  tint: [string, string];
  image: string;
  avatar: string;
  /** « phares »: the five of the 3D world; « equipe »: the others. */
  group: "phares" | "equipe";
  /** The live demo: one of the five (AgentDemos), or the rest of the team (AgentDemosMore). */
  demo:
    | { kind: "five"; type: AgentType; title: string }
    | { kind: "more"; slug: string; title: string };
  /** « Recruter {prénom} »: what the contact form receives. */
  contact: ContactIntent;
}

function dialogAgents(locale: Locale): DialogAgent[] {
  return [
    ...teamOf(locale).map((t) => ({
      key: t.type,
      name: t.name,
      role: t.role,
      pitch: t.pitch,
      missions: t.missions,
      channels: t.channels,
      control: t.control,
      tint: t.tint,
      image: AGENTS[t.type].image,
      avatar: AGENTS[t.type].avatar,
      group: "phares" as const,
      demo: { kind: "five" as const, type: t.type, title: t.demo },
      contact: { source: "agent", need: t.type },
    })),
    ...moreTeamOf(locale).map((m) => ({
      key: m.slug,
      name: m.name,
      role: m.role,
      pitch: m.pitch,
      missions: m.missions,
      channels: m.channels,
      control: m.control,
      tint: m.tint,
      image: m.image,
      avatar: m.avatar,
      group: "equipe" as const,
      demo: { kind: "more" as const, slug: m.slug, title: m.demo },
      contact: {
        source: "agent",
        need: agentCard(m.slug, locale).need,
        message:
          locale === "en"
            ? `Hello, we are interested in ${m.name} (${m.role.charAt(0).toLowerCase()}${m.role.slice(1)}) for our company. Could you tell me more?`
            : `Bonjour, ${m.name} (${m.role.charAt(0).toLowerCase()}${m.role.slice(1)}) m’intéresse pour notre entreprise. Pouvez-vous m’en dire plus ?`,
      },
    })),
  ];
}

export const ALL_AGENTS: DialogAgent[] = dialogAgents("fr");
const ALL_AGENTS_EN: DialogAgent[] = dialogAgents("en");
export const allAgentsOf = (locale: Locale) =>
  locale === "en" ? ALL_AGENTS_EN : ALL_AGENTS;

/** Index of the first agent of the rest of the team (the dialog shows each group's avatars in its footer). */
export const MORE_START = TEAM.length;
