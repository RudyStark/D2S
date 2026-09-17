export type QualityTier = "high" | "medium" | "low";

export interface QualitySettings {
  dpr: [number, number];
  shadows: boolean;
  shadowMapSize: number;
  postprocessing: boolean;
  ambientOcclusion: boolean;
  bloom: boolean;
  reflections: boolean;
  antialias: boolean;
}

export const QUALITY: Record<QualityTier, QualitySettings> = {
  high: {
    dpr: [1, 2],
    shadows: true,
    shadowMapSize: 2048,
    postprocessing: true,
    ambientOcclusion: true,
    bloom: true,
    reflections: true,
    antialias: false, // SMAA in the composer instead
  },
  medium: {
    dpr: [1, 1.5],
    shadows: true,
    shadowMapSize: 1024,
    postprocessing: true,
    ambientOcclusion: false,
    bloom: true,
    reflections: false,
    antialias: false,
  },
  low: {
    dpr: [1, 1.25],
    shadows: false,
    shadowMapSize: 512,
    postprocessing: false,
    ambientOcclusion: false,
    bloom: false,
    reflections: false,
    antialias: true,
  },
};

/** First guess before any frame is measured; PerformanceMonitor refines it at runtime. */
export function detectQualityTier(): QualityTier {
  if (typeof window === "undefined") return "high";
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
