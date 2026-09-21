"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef } from "react";
import { useEnvironment } from "@/hooks/useEnvironment";
import { useFrameUpdate } from "@/hooks/useFrameUpdate";
import { refreshDirector, startDirector, stopDirector } from "@/lib/experience/director";
import { useExperience } from "@/lib/experience/store";
import { SiteLoader } from "../overlays/SiteLoader";
import styles from "./ExperienceRoot.module.css";

const ExperienceCanvas = dynamic(() => import("./ExperienceCanvas"), { ssr: false });
const DebugHud = dynamic(() => import("./debug/DebugHud").then((m) => m.DebugHud), { ssr: false });

/** Client entry of the immersive sequence: environment, director loop, WebGL layer, veil, site loader. */
export function ExperienceRoot({ trackId }: { trackId: string }) {
  useEnvironment();
  const profile = useExperience((s) => s.profile);
  const reducedMotion = useExperience((s) => s.reducedMotion);
  const webgl = useExperience((s) => s.webgl);
  const ready = useExperience((s) => s.ready);
  const debug = useExperience((s) => s.debug);
  const glLost = useExperience((s) => s.glLost);
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
      {glLost && (
        <p className={styles.glLost} role="status">
          Le décor 3D s’est interrompu.
          <button type="button" onClick={() => window.location.reload()}>
            Relancer
          </button>
        </p>
      )}
      <SiteLoader />
      {debug && <DebugHud />}
    </>
  );
}
