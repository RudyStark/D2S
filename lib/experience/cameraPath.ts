import { MonotoneCurve } from "@/lib/math";

export type CameraProfile = "desktop" | "mobile" | "reduced";

export interface CameraKey {
  p: number;
  /** World position, metres. */
  pos: [number, number, number];
  /** Degrees. Yaw > 0 turns left, pitch > 0 looks up. Keep pitch ≈ 0: verticals stay straight. */
  yaw?: number;
  pitch?: number;
  roll?: number;
  /** Vertical field of view, degrees. */
  fov?: number;
  /**
   * Lens shift as a fraction of the frame height (architectural tilt-shift):
   * > 0 moves the horizon down without tilting the camera.
   */
  shiftY?: number;
  /** Full-screen white veil, 0–1 (reduced-motion cut only). */
  veil?: number;
}

/**
 * Desktop path. Composition targets:
 *   p = 0  → design/references/01-home-final.png — low hero camera (0.5 m), horizon at ~75%,
 *            doors at ~62% of the width (measured on the reference — see .claude/skills/webgl-r3f-cinematics)
 *   p = 1  → design/references/03-lobby-final.png — 1.15 m, centred desk, horizon at ~68%
 * The camera cranes up while dollying in: monumental at the door, human inside.
 */
const DESKTOP: CameraKey[] = [
  { p: 0.0, pos: [-2.16, 0.5, 13.8], fov: 38, shiftY: 0.25 },
  { p: 0.1, pos: [-2.12, 0.52, 13.35], fov: 38, shiftY: 0.25 },
  { p: 0.22, pos: [-1.78, 0.7, 10.5], yaw: -0.8, fov: 38, shiftY: 0.225 },
  { p: 0.34, pos: [-1.0, 0.98, 7.0], yaw: -1.6, roll: -0.22, fov: 38.5, shiftY: 0.18 },
  { p: 0.45, pos: [-0.22, 1.16, 3.4], yaw: -0.7, roll: -0.08, fov: 39.5, shiftY: 0.13 },
  { p: 0.56, pos: [0, 1.24, 0.3], fov: 42.5, shiftY: 0.11 },
  { p: 0.66, pos: [0.05, 1.23, -1.5], yaw: 0.3, roll: 0.1, fov: 42, shiftY: 0.13 },
  { p: 0.78, pos: [0.09, 1.2, -2.95], yaw: 0.35, fov: 41, shiftY: 0.16 },
  { p: 0.9, pos: [0.03, 1.16, -3.95], yaw: 0.1, fov: 40.2, shiftY: 0.18 },
  { p: 1.0, pos: [0, 1.15, -4.4], fov: 40, shiftY: 0.185 },
];

/** Portrait phones: wider lens, closer start, shorter travel; same beats. */
const MOBILE: CameraKey[] = [
  { p: 0.0, pos: [-0.35, 1.2, 12.2], fov: 62, shiftY: -0.12 },
  { p: 0.1, pos: [-0.34, 1.22, 11.8], fov: 62, shiftY: -0.12 },
  { p: 0.3, pos: [-0.2, 1.36, 7.4], fov: 62, shiftY: -0.06 },
  { p: 0.45, pos: [-0.05, 1.5, 3.4], fov: 63, shiftY: -0.02 },
  { p: 0.56, pos: [0, 1.56, 0.3], fov: 66, shiftY: 0 },
  { p: 0.7, pos: [0.04, 1.62, -1.8], fov: 64, shiftY: 0 },
  { p: 0.88, pos: [0.02, 1.66, -2.9], fov: 62, shiftY: -0.04 },
  { p: 1.0, pos: [0, 1.68, -3.2], fov: 62, shiftY: -0.05 },
];

/**
 * prefers-reduced-motion: no long dolly (vection). Short push at the façade,
 * a soft white cut through the doors, then a short settle in the lobby.
 */
const REDUCED: CameraKey[] = [
  { p: 0.0, pos: [-2.16, 0.5, 13.8], fov: 38, shiftY: 0.25, veil: 0 },
  { p: 0.3, pos: [-2.0, 0.56, 12.6], fov: 38, shiftY: 0.25, veil: 0 },
  { p: 0.4, pos: [-1.96, 0.57, 12.3], fov: 38, shiftY: 0.25, veil: 1 },
  { p: 0.46, pos: [0, 1.15, -3.2], fov: 40, shiftY: 0.185, veil: 1 },
  { p: 0.58, pos: [0, 1.15, -3.4], fov: 40, shiftY: 0.185, veil: 0 },
  { p: 1.0, pos: [0, 1.15, -4.4], fov: 40, shiftY: 0.185, veil: 0 },
];

export const CAMERA_KEYS: Record<CameraProfile, CameraKey[]> = {
  desktop: DESKTOP,
  mobile: MOBILE,
  reduced: REDUCED,
};

export interface CameraSample {
  x: number;
  y: number;
  z: number;
  yaw: number;
  pitch: number;
  roll: number;
  fov: number;
  shiftY: number;
  veil: number;
}

const CHANNELS = ["x", "y", "z", "yaw", "pitch", "roll", "fov", "shiftY", "veil"] as const;

export function buildCameraPath(keys: CameraKey[]) {
  const ps = keys.map((k) => k.p);
  const pick: Record<(typeof CHANNELS)[number], (k: CameraKey) => number> = {
    x: (k) => k.pos[0],
    y: (k) => k.pos[1],
    z: (k) => k.pos[2],
    yaw: (k) => k.yaw ?? 0,
    pitch: (k) => k.pitch ?? 0,
    roll: (k) => k.roll ?? 0,
    fov: (k) => k.fov ?? 40,
    shiftY: (k) => k.shiftY ?? 0,
    veil: (k) => k.veil ?? 0,
  };
  const curves = Object.fromEntries(
    CHANNELS.map((c) => [c, new MonotoneCurve(ps, keys.map(pick[c]))]),
  ) as Record<(typeof CHANNELS)[number], MonotoneCurve>;

  return {
    keys,
    sample(p: number, out: CameraSample): CameraSample {
      for (const c of CHANNELS) out[c] = curves[c].at(p);
      return out;
    },
  };
}

export type CameraPath = ReturnType<typeof buildCameraPath>;

export const createCameraSample = (): CameraSample => ({
  x: 0, y: 0, z: 0, yaw: 0, pitch: 0, roll: 0, fov: 40, shiftY: 0, veil: 0,
});
