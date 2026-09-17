"use client";

import { PerformanceMonitor, Preload } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import dynamic from "next/dynamic";
import { Suspense, useEffect } from "react";
import * as THREE from "three";
import { setCanvasActive } from "@/lib/experience/director";
import { QUALITY, type QualityTier } from "@/lib/experience/quality";
import { useExperience } from "@/lib/experience/store";
import { CameraRig } from "./camera/CameraRig";
import { PostEffects } from "./effects/PostEffects";
import { Lighting } from "./lights/Lighting";
import { World } from "./World";

const DebugScene = dynamic(() => import("./debug/DebugScene").then((m) => m.DebugScene), { ssr: false });

const DOWNGRADE: Record<QualityTier, QualityTier> = { high: "medium", medium: "low", low: "low" };

/** Mounted inside the world's Suspense boundary: it commits only once every asset has resolved. */
function ReadyMarker() {
  const setReady = useExperience((s) => s.setReady);
  useEffect(() => {
    // Let the first frames compile shaders before revealing the canvas.
    const id = window.setTimeout(() => setReady(true), 250);
    return () => {
      window.clearTimeout(id);
      setReady(false);
    };
  }, [setReady]);
  return null;
}

/** Full-screen fixed WebGL layer. Rendered by the director (frameloop="never"). */
export default function ExperienceCanvas() {
  const quality = useExperience((s) => s.quality);
  const setQuality = useExperience((s) => s.setQuality);
  const debug = useExperience((s) => s.debug);
  const lockQuality = useExperience((s) => s.lockQuality);
  const settings = QUALITY[quality];

  useEffect(() => {
    setCanvasActive(true);
    return () => setCanvasActive(false);
  }, []);

  return (
    <Canvas
      frameloop="never"
      dpr={settings.dpr}
      shadows={settings.shadows ? "percentage" : false}
      camera={{ fov: 38, near: 0.05, far: 220, position: [-2, 1.1, 13.8] }}
      gl={{
        antialias: settings.antialias,
        powerPreference: "high-performance",
        alpha: false,
        stencil: false,
        preserveDrawingBuffer: false,
      }}
      onCreated={({ gl }) => {
        gl.outputColorSpace = THREE.SRGBColorSpace;
        gl.setClearColor("#eef3f9");
      }}
      aria-hidden="true"
    >
      <PerformanceMonitor
        flipflops={2}
        onDecline={() => {
          if (!lockQuality) setQuality(DOWNGRADE[useExperience.getState().quality]);
        }}
      />
      <Suspense fallback={null}>
        <Lighting />
        <World />
        <Preload all />
        <ReadyMarker />
      </Suspense>
      <CameraRig />
      <PostEffects />
      {debug && <DebugScene />}
    </Canvas>
  );
}
