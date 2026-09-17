/**
 * World layout, in metres. One continuous space:
 *   +Z  exterior plaza   →   Z = 0 glass façade   →   −Z lobby   →   (next zones further along −Z)
 * Reconstructed from design/references/02-home-clean.png and 04-lobby-clean.png.
 */
export const WORLD = {
  facade: {
    z: 0,
    /** Glazed section between the two pillars. */
    glassHalfWidth: 3.2,
    glassHeight: 8.4,
    doorWidth: 3.0,
    doorHeight: 4.7,
    pillar: { inner: 3.2, outer: 4.9, depth: 1.6, front: 0.9, height: 11 },
    sign: { width: 5.0, height: 1.55, depth: 0.36, bottom: 4.96, logoWidth: 2.8 },
    transomY: 7.2,
  },
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
