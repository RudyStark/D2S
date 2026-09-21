export type QualityTier = "high" | "medium" | "low";

export interface QualitySettings {
  dpr: [number, number];
  shadows: boolean;
  shadowMapSize: number;
  postprocessing: boolean;
  ambientOcclusion: boolean;
  bloom: boolean;
  /** Real planar reflections (floor + basin water). Kept down to "medium": they carry the look. */
  reflections: boolean;
  /** Floor reflector render-target size (px). */
  reflectionResolution: number;
  /** Water reflector size as a share of the viewport. */
  waterReflectionScale: number;
  antialias: boolean;
  /** MSAA samples of the post-processing input buffer (SMAA alone leaves thin letters stair-stepped). */
  msaa: number;
}

export const QUALITY: Record<QualityTier, QualitySettings> = {
  /*
   * Degradation order = least visible first: AO, pixel ratio and shadow size go before the reflections,
   * which are dropped only on "low" (the basin and the polished floor are the signature of the scene).
   */
  high: {
    dpr: [1, 2],
    shadows: true,
    shadowMapSize: 2048,
    postprocessing: true,
    ambientOcclusion: true,
    bloom: true,
    reflections: true,
    reflectionResolution: 1024,
    waterReflectionScale: 0.6,
    antialias: false, // MSAA + SMAA in the composer instead
    msaa: 4,
  },
  medium: {
    dpr: [1, 1.5],
    shadows: true,
    shadowMapSize: 1024,
    postprocessing: true,
    ambientOcclusion: false,
    bloom: true,
    reflections: true,
    reflectionResolution: 512,
    waterReflectionScale: 0.42,
    antialias: false,
    msaa: 2,
  },
  low: {
    dpr: [1, 1.25],
    shadows: false,
    shadowMapSize: 512,
    postprocessing: false,
    ambientOcclusion: false,
    bloom: false,
    reflections: false,
    reflectionResolution: 256,
    waterReflectionScale: 0.3,
    antialias: true,
    msaa: 0,
  },
};

/*
 * Pixel budget. A retina screen in a wide window asks for a 4× bigger buffer than the CSS size, and with
 * MSAA + HDR + reflections that is what makes the GPU give up (lost context → blank canvas). The tier's
 * pixel ratio is therefore capped so the drawing buffer stays under ~4.2 Mpx.
 */
const MAX_PIXELS = 4_200_000;

export function cappedDpr([min, max]: [number, number]): [number, number] {
  if (typeof window === "undefined") return [min, max];
  const pixels = window.innerWidth * window.innerHeight;
  const fit = Math.sqrt(MAX_PIXELS / Math.max(1, pixels));
  return [min, Math.max(1, Math.min(max, window.devicePixelRatio || 1, Number(fit.toFixed(2))))];
}

/** First guess before any frame is measured; PerformanceMonitor refines it at runtime. */
export function detectQualityTier(): QualityTier {
  if (typeof window === "undefined") return "high";
  // The GPU dropped the context earlier in this session: come back gentler, lower again if it happened twice.
  try {
    const trouble = Number(sessionStorage.getItem("d2s:gpu-trouble") ?? 0);
    if (trouble >= 2) return "low";
    if (trouble === 1) return "medium";
  } catch {}
  const nav = navigator as Navigator & { deviceMemory?: number };
  const cores = nav.hardwareConcurrency ?? 4;
  const memory = nav.deviceMemory ?? 8;
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const small = Math.min(window.innerWidth, window.innerHeight) < 600;

  if (cores <= 2 || memory <= 2) return "low";
  if (coarse || small) return cores >= 8 && memory >= 6 ? "medium" : "low";
  return cores >= 6 ? "high" : "medium";
}

export function hasWebGL2(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return !!canvas.getContext("webgl2");
  } catch {
    return false;
  }
}
