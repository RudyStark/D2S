/** Single source for the logo: replacing this SVG updates the header and the 3D façade sign. */
export const LOGO_SRC = "/images/brand/d2s-logo.svg";
export const LOGO_VIEWBOX = { width: 344, height: 147 } as const;

/** Colours shared with WebGL (CSS mirrors them in app/globals.css). */
export const COLORS = {
  ink: "#0b1238",
  logo: "#0d1340",
  text: "#4d5884",
  blue: "#1570f0",
  blueDeep: "#0b55f0",
  cyan: "#129be6",
  wallType: "#6b7391",
  white: "#ffffff",
  marble: "#f3f3f1",
  steel: "#c9ced6",
  warmLight: "#ffe2bf",
} as const;
