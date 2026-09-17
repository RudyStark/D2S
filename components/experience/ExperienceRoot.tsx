"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef } from "react";
import { useEnvironment } from "@/hooks/useEnvironment";
import { useFrameUpdate } from "@/hooks/useFrameUpdate";
import { refreshDirector, startDirector, stopDirector } from "@/lib/experience/director";
import { useExperience } from "@/lib/experience/store";
import styles from "./ExperienceRoot.module.css";

const ExperienceCanvas = dynamic(() => import("./ExperienceCanvas"), { ssr: false });
const DebugHud = dynamic(() => import("./debug/DebugHud").then((m) => m.DebugHud), { ssr: false });

/** Client entry of the immersive sequence: environment, director loop, WebGL layer, veil, loader. */
export function ExperienceRoot({ trackId }: { trackId: string }) {
  useEnvironment();
  const profile = useExperience((s) => s.profile);
  const reducedMotion = useExperience((s) => s.reducedMotion);
  const webgl = useExperience((s) => s.webgl);
  const ready = useExperience((s) => s.ready);
  const debug = useExperience((s) => s.debug);
  const veil = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const track = document.getElementById(trackId);
    if (!track) return;
    startDirector(track, { smooth: !reducedMotion && profile === "desktop" });
    const onResize = () => refreshDirector();
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      stopDirector();
    };
  }, [trackId, profile, reducedMotion]);

  useFrameUpdate((f) => {
    if (veil.current) veil.current.style.opacity = f.camera.veil.toFixed(3);
  });

  return (
    <>
      <div className={styles.stage} data-ready={ready || webgl === "unavailable"}>
        {webgl === "ok" && <ExperienceCanvas />}
      </div>
      <div ref={veil} className={styles.veil} aria-hidden="true" />
      <div className={styles.loader} data-hidden={ready || webgl === "unavailable"} role="status" aria-live="polite">
        <span className={styles.loaderBar} />
        <span className={styles.loaderLabel}>{ready ? "Bienvenue" : "Ouverture de l’agence…"}</span>
      </div>
      {debug && <DebugHud />}
    </>
  );
}
