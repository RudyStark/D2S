import { create } from "zustand";
import type { CameraProfile } from "./cameraPath";
import type { QualityTier } from "./quality";

/**
 * Low-frequency state (React subscribes to it).
 * Per-frame values live in `frame` below and are never put in React state.
 */
interface ExperienceState {
  ready: boolean;
  /** Asset loading (three's DefaultLoadingManager), published by the canvas for the site loader. */
  assets: { loaded: number; total: number; active: boolean; started: boolean };
  webgl: "pending" | "ok" | "unavailable";
  profile: CameraProfile;
  quality: QualityTier;
  reducedMotion: boolean;
  debug: boolean;
  /** Visual tests / debug: keep the requested tier, never auto-downgrade. */
  lockQuality: boolean;
  /** ?debugMaterials=1 — no agents, no bloom, no DOM overlays: materials only. */
  debugMaterials: boolean;
  /** Desktop lobby → services transition rendered in 3D (depth of field): the DOM veil stays light. */
  focusPull: boolean;
  /** The GPU dropped the WebGL context: the 3D layer is blank until it comes back or the page reloads. */
  glLost: boolean;
  setReady: (ready: boolean) => void;
  setAssets: (assets: ExperienceState["assets"]) => void;
  setWebgl: (webgl: ExperienceState["webgl"]) => void;
  setProfile: (profile: CameraProfile) => void;
  setQuality: (quality: QualityTier) => void;
  setReducedMotion: (reducedMotion: boolean) => void;
  setDebug: (debug: boolean) => void;
  setLockQuality: (lockQuality: boolean) => void;
  setDebugMaterials: (debugMaterials: boolean) => void;
  setFocusPull: (focusPull: boolean) => void;
  setGlLost: (glLost: boolean) => void;
}

export const useExperience = create<ExperienceState>((set) => ({
  ready: false,
  assets: { loaded: 0, total: 0, active: false, started: false },
  webgl: "pending",
  profile: "desktop",
  quality: "high",
  reducedMotion: false,
  debug: false,
  lockQuality: false,
  debugMaterials: false,
  focusPull: false,
  glLost: false,
  setReady: (ready) => set({ ready }),
  setAssets: (assets) => set({ assets }),
  setWebgl: (webgl) => set({ webgl }),
  setProfile: (profile) => set({ profile }),
  setQuality: (quality) => set({ quality }),
  setReducedMotion: (reducedMotion) => set({ reducedMotion }),
  setDebug: (debug) => set({ debug }),
  setLockQuality: (lockQuality) => set({ lockQuality }),
  setDebugMaterials: (debugMaterials) => set({ debugMaterials }),
  setFocusPull: (focusPull) => set({ focusPull }),
  setGlLost: (glLost) => set({ glLost }),
}));

export interface ScreenAnchor {
  x: number;
  y: number;
  /** In front of the camera and inside the frame. */
  visible: boolean;
}

export interface ScreenRect {
  left: number;
  top: number;
  right: number;
  bottom: number;
  visible: boolean;
}

/** An agent's silhouette on screen (CSS px): head top, feet, centre and approximate width. */
export interface AgentScreen {
  x: number;
  top: number;
  bottom: number;
  width: number;
  /** In front of the camera and at least partly inside the frame. */
  visible: boolean;
}

/** Mutable per-frame state shared by the director loop, the WebGL scene and the DOM overlays. */
export const frame = {
  /** Raw scroll progress (0–1). */
  target: 0,
  /** Smoothed progress: the single value everything renders from. */
  progress: 0,
  /** Forced progress (debug / visual tests), overrides scroll when not null. */
  forced: null as number | null,
  time: 0,
  delta: 0,
  fps: 60,
  /** Settled when the smoothed progress has caught up with the target. */
  settled: true,
  /** Instant jump requested: the camera rig skips its inertia for one frame. */
  snap: false,
  camera: { x: 0, y: 0, z: 0, fov: 40, veil: 0 },
  anchors: {} as Record<string, ScreenAnchor>,
  /** Services section arrival below the lobby: 0 = below the fold, 1 = section top at the viewport top. */
  services: 0,
  /** Screen rect (CSS px) of 3D objects the DOM must avoid covering (e.g. the hero veil). */
  rects: {} as Record<string, ScreenRect>,
  /** Every agent's silhouette on screen, by agent type (hover labels). */
  agents: {} as Record<string, AgentScreen>,
};

export type FrameState = typeof frame;
