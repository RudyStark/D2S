import type { AgentType } from "@/components/experience/agents/agents.config";

export type AgentFacing = "fixed" | "camera";

export interface AgentPlacement {
  type: AgentType;
  zone: "facade" | "lobby";
  /** Feet position, metres. */
  position: [number, number, number];
  /** Radians around Y (0 faces the street, +Z). */
  rotationY: number;
  /** Rendered height, metres. */
  height: number;
  facing: AgentFacing;
  /** 0 = fixed orientation, 1 = fully turned to the camera (Y axis only). */
  follow: number;
  /** Screen anchor published for DOM overlays (id → head position). */
  anchor?: string;
}

/**
 * One place per agent — no agent is ever duplicated in the world.
 * Façade: Création de contenu (left) and Support client (right) greet visitors.
 * Lobby: Prospection (May) at the reception desk, Automatisation (Diva) left, Analyse de données right.
 */
export const CASTING: AgentPlacement[] = [
  { type: "content", zone: "facade", position: [-1.57, 0, 5.96], rotationY: 0.2, height: 1.42, facing: "camera", follow: 0.25 },
  { type: "support", zone: "facade", position: [0.86, 0, 5.95], rotationY: -0.18, height: 1.4, facing: "camera", follow: 0.25 },
  // May (prospection) welcomes visitors: the reception is a live demo of her job — understand the need,
  // guide, book the call (user decision, 19/09). Stands on the platform behind the desk (a volume must not
  // cut through the counter), at the same size as the other lobby agents (was 3.09 m to copy the reference
  // framing: next to the 1.26 m counter she read as a giant).
  { type: "prospection", zone: "lobby", position: [0, 0.45, -16.45], rotationY: 0, height: 1.94, facing: "camera", follow: 0.2, anchor: "reception" },
  { type: "automation", zone: "lobby", position: [-4.35, 0, -12.6], rotationY: 0.38, height: 1.94, facing: "camera", follow: 0.35 },
  { type: "data", zone: "lobby", position: [3.95, 0, -11.2], rotationY: -0.3, height: 1.94, facing: "camera", follow: 0.35 },
];
