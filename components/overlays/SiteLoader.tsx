"use client";

import { useEffect, useRef, useState } from "react";
import { setScrollLocked } from "@/lib/experience/director";
import { useExperience } from "@/lib/experience/store";
import styles from "./SiteLoader.module.css";

/** Loading steps shown under the counter (by displayed progress). */
const STEPS: [number, string][] = [
  [0, "Préparation de la façade"],
  [0.3, "Mise en lumière du lobby"],
  [0.62, "Arrivée des agents IA"],
  [0.9, "Ouverture des portes"],
];
/** Never flashes: the loader stays at least this long (ms). */
const MIN_DURATION = 1400;
/** Pause on "Bienvenue" before the doors slide open (ms). */
const HOLD = 450;
/** Doors sliding apart (ms), keep in sync with SiteLoader.module.css. */
const OPEN = 1100;

type Phase = "loading" | "welcome" | "opening" | "done";

/**
 * Full-screen site loader: the D2S AIgency logo fills with the real loading progress (every texture,
 * model, agent, font, and the shader warm-up), then the screen splits like the façade's sliding
 * doors to reveal the agency. Rendered on the server, so it covers the page from the first paint.
 */
export function SiteLoader() {
  const root = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<Phase>("loading");
  const [percent, setPercent] = useState(0);
  const [step, setStep] = useState(STEPS[0][1]);

  useEffect(() => {
    const html = document.documentElement;
    html.dataset.siteLoading = "true";
    setScrollLocked(true);

    const params = new URLSearchParams(window.location.search);
    // Visual tests capture the agency itself: open instantly once ready.
    const instant = params.get("capture") === "1";
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let fontsReady = false;
    document.fonts?.ready.then(() => (fontsReady = true), () => (fontsReady = true));
    if (!document.fonts) fontsReady = true;

    const start = performance.now();
    let shown = 0;
    let last = start;
    let raf = 0;
    let timers: number[] = [];

    const target = () => {
      const { webgl, assets, ready, calibrated } = useExperience.getState();
      if (webgl === "unavailable") return 1;
      // Boot (scripts, WebGL context) → assets → warm-up.
      let t = 0.06;
      if (assets.started && assets.total > 0) t = 0.06 + 0.84 * (assets.loaded / assets.total);
      // Ready, then the quality tier measured under the loader (AdaptiveQuality): the agency opens settled.
      if (ready && !assets.active) t = fontsReady && calibrated ? 1 : 0.96;
      else t = Math.min(t, 0.94);
      return t;
    };

    const open = () => {
      setPhase("welcome");
      setPercent(100);
      const hold = instant ? 0 : HOLD;
      timers.push(
        window.setTimeout(() => {
          setPhase("opening");
          delete html.dataset.siteLoading;
          html.dataset.siteLoaded = "true";
          setScrollLocked(false);
          timers.push(window.setTimeout(() => setPhase("done"), instant ? 0 : reduced ? 450 : OPEN));
        }, hold),
      );
    };

    const tick = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      // While a large file downloads the real progress plateaus: a slow creep (≥ 1 %/s, never past 94 %)
      // keeps the counter alive; the real value takes over as soon as it is ahead.
      const real = target();
      const goal = real >= 1 ? 1 : Math.max(real, Math.min(0.94, shown + dt * 0.012));
      // Eased and monotonic: the asset total grows as the scene streams in, the counter never goes back.
      shown = Math.max(shown, shown + (goal - shown) * Math.min(1, dt * (goal >= 1 ? 5 : 2.4)));
      if (goal >= 1 && goal - shown < 0.004) shown = 1;
      const pct = Math.floor(shown * 100);
      setPercent(pct);
      root.current?.style.setProperty("--p", shown.toFixed(4));
      setStep(STEPS.reduce((label, [at, text]) => (shown >= at ? text : label), STEPS[0][1]));

      if (shown >= 1 && (instant || now - start >= MIN_DURATION)) {
        open();
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      timers.forEach((id) => window.clearTimeout(id));
      timers = [];
      delete html.dataset.siteLoading;
      setScrollLocked(false);
    };
  }, []);

  if (phase === "done") return null;

  const welcome = phase !== "loading";
  return (
    <div ref={root} className={styles.loader} data-phase={phase}>
      <noscript>
        <style>{`.${styles.loader}{display:none}`}</style>
      </noscript>
      <div className={styles.door} data-side="left" aria-hidden="true" />
      <div className={styles.door} data-side="right" aria-hidden="true" />
      <div className={styles.seam} aria-hidden="true" />

      <div
        className={styles.center}
        role="progressbar"
        aria-label="Chargement de l’agence D2S AIgency"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
      >
        <div className={styles.logo} aria-hidden="true">
          <span className={styles.logoGhost} />
          <span className={styles.logoFill} />
          <span className={styles.logoEdge} />
        </div>
        <p className={styles.label}>
          <span>{welcome ? "Bienvenue chez D2S AIgency" : "Chargement de l’agence"}</span>
          {!welcome && <span className={styles.percent}>{percent} %</span>}
        </p>
        <span className={styles.bar} aria-hidden="true" />
        <p className={styles.step} aria-hidden="true">
          {welcome ? "L’IA, plus humaine, plus utile" : step}
        </p>
      </div>
      <p className="visually-hidden" role="status">
        {welcome ? "L’agence est prête." : ""}
      </p>
    </div>
  );
}
