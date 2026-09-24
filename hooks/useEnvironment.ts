"use client";

import { useEffect } from "react";
import type { CameraProfile } from "@/lib/experience/cameraPath";
import { detectQualityTier, hasWebGL2, type QualityTier } from "@/lib/experience/quality";
import { frame, useExperience } from "@/lib/experience/store";

const TIERS: QualityTier[] = ["high", "medium", "low"];

/**
 * Resolves device profile, motion preference, quality tier and URL flags:
 *   ?debug3d=1     debug HUD + camera path
 *   ?p=0.45        freeze the sequence at a progress value
 *   ?quality=low   force a tier (also disables auto-downgrade)
 *   ?capture=1     visual tests: no auto-downgrade, exposes window.__d2s
 *   ?debugMaterials=1  materials only: no agents, no bloom, no DOM overlays
 */
export function useEnvironment() {
  useEffect(() => {
    const store = useExperience.getState();
    const params = new URLSearchParams(window.location.search);
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const mobileQuery = window.matchMedia("(max-width: 767px), (orientation: portrait) and (max-width: 1024px)");

    const resolveProfile = (): CameraProfile =>
      motionQuery.matches ? "reduced" : mobileQuery.matches ? "mobile" : "desktop";

    const apply = () => {
      store.setReducedMotion(motionQuery.matches);
      store.setProfile(resolveProfile());
    };
    apply();

    const debug = params.get("debug3d") === "1";
    const capture = params.get("capture") === "1";
    const forcedQuality = params.get("quality") as QualityTier | null;
    store.setDebug(debug);
    const debugMaterials = params.get("debugMaterials") === "1";
    store.setDebugMaterials(debugMaterials);
    document.documentElement.toggleAttribute("data-debug-materials", debugMaterials);
    store.setLockQuality(debug || capture || !!forcedQuality);
    store.setQuality(forcedQuality && TIERS.includes(forcedQuality) ? forcedQuality : detectQualityTier());
    store.setWebgl(hasWebGL2() ? "ok" : "unavailable");

    const forced = params.get("p");
    if (forced !== null && !Number.isNaN(Number(forced))) {
      frame.forced = Math.min(1, Math.max(0, Number(forced)));
      frame.progress = frame.forced;
    }

    if (debug || capture) {
      const d2s: Record<string, unknown> = { frame, store: useExperience };
      (window as unknown as { __d2s: unknown }).__d2s = d2s;
      // Texture bake tool (scripts/bake-textures.mjs): loaded only in capture mode.
      if (capture) void import("@/components/experience/textures").then((m) => (d2s.bakeTextures = m.bakeTextures));
      // Quality-swap QA (scripts/flash-qa): a runtime tier change, as the performance monitor makes it.
      void import("@/lib/experience/qualitySwap").then((m) => (d2s.swapQuality = m.swapQuality));
    }

    motionQuery.addEventListener("change", apply);
    mobileQuery.addEventListener("change", apply);
    return () => {
      motionQuery.removeEventListener("change", apply);
      mobileQuery.removeEventListener("change", apply);
    };
  }, []);
}
