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
  { p: 0.0, pos: [-0.72, 0.37, 10.26], yaw: 5, fov: 38, shiftY: 0.249 },
  { p: 0.1, pos: [-0.71, 0.39, 9.92], yaw: 4.8, fov: 38, shiftY: 0.249 },
  { p: 0.22, pos: [-0.63, 0.58, 8.35], yaw: 4, fov: 38, shiftY: 0.232 },
  { p: 0.3, pos: [-0.5, 0.75, 6.9], yaw: 3.2, fov: 38.4, shiftY: 0.215, roll: -0.2 },
  { p: 0.38, pos: [-0.32, 0.92, 5.6], yaw: 2.2, fov: 38.8, shiftY: 0.19, roll: -0.1 },
  { p: 0.46, pos: [-0.14, 1.04, 4.2], yaw: 1.2, fov: 39.4, shiftY: 0.168 },
  { p: 0.56, pos: [-0.02, 1.13, 2.2], yaw: 0.4, fov: 41, shiftY: 0.145 },
  { p: 0.66, pos: [0, 1.18, 0.2], yaw: 0, fov: 42.5, shiftY: 0.128 },
  { p: 0.78, pos: [0.06, 1.2, -2.0], yaw: 0.3, fov: 41.5, shiftY: 0.15, roll: 0.1 },
  { p: 0.9, pos: [0.04, 1.17, -3.6], yaw: 0.1, fov: 40.4, shiftY: 0.174 },
  { p: 1.0, pos: [0, 1.15, -4.4], yaw: 0, fov: 40, shiftY: 0.185 },
];

/** Portrait phones: wider lens, closer start, shorter travel; same beats. */
const MOBILE: CameraKey[] = [
  { p: 0.0, pos: [-0.1, 0.9, 9.4], yaw: 4, fov: 60, shiftY: 0.02 },
  { p: 0.1, pos: [-0.1, 0.92, 9.1], yaw: 3.8, fov: 60, shiftY: 0.02 },
  { p: 0.3, pos: [-0.05, 1.05, 6.2], yaw: 2.4, fov: 60, shiftY: 0.03 },
  { p: 0.45, pos: [0, 1.15, 3.2], yaw: 0.8, fov: 61, shiftY: 0.05 },
  { p: 0.56, pos: [0, 1.2, 0.2], yaw: 0, fov: 64, shiftY: 0.06 },
  { p: 0.7, pos: [0.03, 1.22, -1.8], yaw: 0.2, fov: 63, shiftY: 0.08 },
  { p: 0.88, pos: [0.02, 1.2, -2.9], yaw: 0.1, fov: 61, shiftY: 0.1 },
  { p: 1.0, pos: [0, 1.18, -3.3], yaw: 0, fov: 60, shiftY: 0.11 },
];

/**
 * prefers-reduced-motion: no long dolly (vection). Short push at the façade,
 * a soft white cut through the doors, then a short settle in the lobby.
 */
const REDUCED: CameraKey[] = [
  { p: 0.0, pos: [-0.72, 0.37, 10.26], yaw: 5, fov: 38, shiftY: 0.249, veil: 0 },
  { p: 0.3, pos: [-0.7, 0.42, 9.3], yaw: 4.7, fov: 38, shiftY: 0.245, veil: 0 },
  { p: 0.4, pos: [-0.69, 0.43, 9.05], yaw: 4.6, fov: 38, shiftY: 0.244, veil: 1 },
  { p: 0.46, pos: [0, 1.15, -3.2], yaw: 0, fov: 40, shiftY: 0.185, veil: 1 },
  { p: 0.58, pos: [0, 1.15, -3.4], yaw: 0, fov: 40, shiftY: 0.185, veil: 0 },
  { p: 1.0, pos: [0, 1.15, -4.4], yaw: 0, fov: 40, shiftY: 0.185, veil: 0 },
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
