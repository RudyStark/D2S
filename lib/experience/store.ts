import { create } from "zustand";
import type { CameraProfile } from "./cameraPath";
import type { QualityTier } from "./quality";

/**
 * Low-frequency state (React subscribes to it).
 * Per-frame values live in `frame` below and are never put in React state.
 */
interface ExperienceState {
  ready: boolean;
  webgl: "pending" | "ok" | "unavailable";
  profile: CameraProfile;
  quality: QualityTier;
  reducedMotion: boolean;
  debug: boolean;
  /** Visual tests / debug: keep the requested tier, never auto-downgrade. */
  lockQuality: boolean;
  /** ?debugMaterials=1 — no agents, no bloom, no DOM overlays: materials only. */
  debugMaterials: boolean;
  setReady: (ready: boolean) => void;
  setWebgl: (webgl: ExperienceState["webgl"]) => void;
  setProfile: (profile: CameraProfile) => void;
  setQuality: (quality: QualityTier) => void;
  setReducedMotion: (reducedMotion: boolean) => void;
  setDebug: (debug: boolean) => void;
  setLockQuality: (lockQuality: boolean) => void;
  setDebugMaterials: (debugMaterials: boolean) => void;
}

export const useExperience = create<ExperienceState>((set) => ({
  ready: false,
  webgl: "pending",
  profile: "desktop",
  quality: "high",
  reducedMotion: false,
  debug: false,
  lockQuality: false,
  debugMaterials: false,
  setReady: (ready) => set({ ready }),
  setWebgl: (webgl) => set({ webgl }),
  setProfile: (profile) => set({ profile }),
  setQuality: (quality) => set({ quality }),
  setReducedMotion: (reducedMotion) => set({ reducedMotion }),
  setDebug: (debug) => set({ debug }),
  setLockQuality: (lockQuality) => set({ lockQuality }),
  setDebugMaterials: (debugMaterials) => set({ debugMaterials }),
}));

export interface ScreenAnchor {
  x: number;
  y: number;
  /** In front of the camera and inside the frame. */
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
  camera: { x: 0, y: 0, z: 0, fov: 40, veil: 0 },
  anchors: {} as Record<string, ScreenAnchor>,
};

export type FrameState = typeof frame;
