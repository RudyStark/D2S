import { range, smootherstep } from "@/lib/math";

/**
 * Normalised scroll timeline (0 → 1) for sequence 01: façade → lobby.
 * Every scroll-driven value in WebGL and in the DOM reads from these ranges,
 * so tuning a beat here moves the camera, the doors and the UI together.
 */
export const BEATS = {
  heroHold: [0, 0.1],
  heroFade: [0.08, 0.24],
  scrollHint: [0.02, 0.08],
  approach: [0.1, 0.5],
  doors: [0.3, 0.52],
  threshold: [0.52, 0.72],
  headerCompact: [0.5, 0.62],
  lightShift: [0.6, 0.84],
  exteriorFade: [0.7, 0.86],
  lobbyReveal: [0.74, 0.92],
  settle: [0.88, 1],
  lobbyUI: [0.86, 0.97],
} as const satisfies Record<string, readonly [number, number]>;

export type Beat = keyof typeof BEATS;

/** Linear 0 → 1 progress inside a beat. */
export const beat = (p: number, name: Beat) => range(p, BEATS[name][0], BEATS[name][1]);

/** Eased 0 → 1 progress inside a beat. */
export const beatEased = (p: number, name: Beat) => smootherstep(beat(p, name));

/** Scroll length of the sequence, in viewport heights. */
export const SEQUENCE_LENGTH_VH = { desktop: 720, mobile: 520, reduced: 420 } as const;

/** Named stops, used by the navigation and the debug panel. */
export const STOPS = [
  { id: "facade", label: "Façade", p: 0 },
  { id: "approach", label: "Approche", p: 0.25 },
  { id: "doors", label: "Portes", p: 0.45 },
  { id: "threshold", label: "Traversée", p: 0.65 },
  { id: "lobby", label: "Accueil", p: 1 },
] as const;
