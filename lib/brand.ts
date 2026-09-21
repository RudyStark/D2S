import { LOGO } from "./generated/logo";

/*
 * Single source for the logo: design/brand/logo-source.webp → `node scripts/build-logo.mjs` writes both the
 * SVG (header fallback, loader mask, 3D signage) and lib/generated/logo.ts (inline, animated header logo).
 */
export const LOGO_SRC = "/images/brand/d2s-aigency.svg";
/** The designer's viewBox does not start at 0,0: keep its origin (x, y) for anything laid out in it. */
export const LOGO_VIEWBOX = LOGO.viewBox;

/** Colours shared with WebGL (CSS mirrors them in app/globals.css). */
export const COLORS = {
  ink: "#0b1238",
  logo: "#0d1340",
  text: "#4d5884",
  blue: "#1570f0",
  blueDeep: "#0b55f0",
  cyan: "#129be6",
  wallType: "#5d6688",
  white: "#ffffff",
  marble: "#f3f3f1",
  steel: "#c9ced6",
  warmLight: "#ffe2bf",
} as const;
