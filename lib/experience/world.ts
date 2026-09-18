/**
 * World layout, in metres. One continuous space:
 *   +Z  exterior plaza   →   Z = 0 glass façade   →   −Z lobby   →   (next zones further along −Z)
 *
 * The façade block is solved from design/references/01-home-final.png: screen measurements
 * (scripts/measure.mjs) back-projected through the p=0 camera — see .claude/skills/webgl-r3f-cinematics.
 */
export const WORLD = {
  facade: {
    z: 0,
    /** Door opening (between the steel posts). */
    halfOpening: 2.07,
    doorHeight: 3.3,
    post: { width: 0.18, depth: 0.3, front: 0.06 },
    transom: { bottom: 3.3, top: 3.45 },
    sign: { width: 3.44, height: 1.3, bottom: 3.36, depth: 0.2, front: 0.3, radius: 0.12, logoWidth: 2.06, logoScaleY: 1.15 },
    glassHeight: 8.4,
    /** White panel carrying AUTOMATISER / SIMPLIFIER…, left of the entrance. */
    leftPanel: { from: -3.62, to: -2.25, height: 4.25 },
    leftPillar: { from: -5.4, to: -3.62 },
    rightGlass: { from: 2.25, to: 2.71 },
    rightPillar: { from: 2.71, to: 4.45 },
    pillar: { front: 0.25, depth: 1.2, height: 11 },
    wingEnd: 13,
    parapet: 12,
  },
  pool: { center: [-5.55, 10.55] as const, outerR: 4.62, innerR: 4.42, rim: 0.22, water: 0.195 },
  lobby: {
    halfWidth: 13,
    depth: 30,
    ceiling: 7.2,
    desk: { centerZ: -21, outerR: 5.8, innerR: 5.0, halfAngle: 0.465, height: 1.26 },
    drum: { centerZ: -21, radius: 3.6, height: 7.2 },
  },
  plaza: { halfWidth: 40, depth: 45 },
} as const;

/** Where the next zones will start along −Z (services offices, etc.). */
export const ZONE_ORIGINS = {
  facade: 0,
  lobby: -2,
  services: -30,
} as const;
