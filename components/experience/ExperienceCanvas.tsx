"use client";

import { PerformanceMonitor, useProgress } from "@react-three/drei";
import { Canvas, useThree } from "@react-three/fiber";
import dynamic from "next/dynamic";
import { Suspense, useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import { requestRender, setCanvasActive } from "@/lib/experience/director";
import { cappedDpr, QUALITY, type QualityTier } from "@/lib/experience/quality";
import { useExperience } from "@/lib/experience/store";
import { CameraRig } from "./camera/CameraRig";
import { setGlassQuality } from "./materials";
import { PostEffects } from "./effects/PostEffects";
import { Lighting } from "./lights/Lighting";
import { World } from "./World";

const DebugScene = dynamic(
  () => import("./debug/DebugScene").then((m) => m.DebugScene),
  { ssr: false },
);

const DOWNGRADE: Record<QualityTier, QualityTier> = {
  high: "medium",
  medium: "low",
  low: "low",
};

/** Every texture referenced by the scene's materials (maps and shader uniforms). */
function collectTextures(scene: THREE.Scene) {
  const textures = new Set<THREE.Texture>();
  const add = (v: unknown) => {
    if (
      v instanceof THREE.Texture &&
      !(v as THREE.Texture & { isRenderTargetTexture?: boolean })
        .isRenderTargetTexture
    )
      textures.add(v);
  };
  scene.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.material) return;
    for (const m of Array.isArray(mesh.material)
      ? mesh.material
      : [mesh.material]) {
      Object.values(m).forEach(add);
      const uniforms = (m as THREE.ShaderMaterial).uniforms;
      if (uniforms) Object.values(uniforms).forEach((u) => add(u?.value));
    }
  });
  return textures;
}

const nextFrame = () =>
  new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

/**
 * GPU uploads spread over frames (a 2048² texture takes tens of ms): the site loader keeps
 * animating instead of freezing for the whole batch.
 */
async function uploadTextures(
  gl: THREE.WebGLRenderer,
  scene: THREE.Scene,
  cancelled: () => boolean,
) {
  let sliceStart = performance.now();
  for (const texture of collectTextures(scene)) {
    if (cancelled()) return;
    if (!texture.image) continue;
    gl.initTexture(texture);
    if (performance.now() - sliceStart > 12) {
      await nextFrame();
      sliceStart = performance.now();
    }
  }
}

/**
 * Mounted inside the world's Suspense boundary: it commits only once every asset has resolved.
 * The director renders nothing before "ready", so the whole world is warmed up here, under the site
 * loader: textures uploaded in slices, every shader compiled at once (parallel compile when available),
 * then two real frames (post-processing, shadows, reflections) before the agency is declared ready.
 */
function ReadyMarker() {
  const setReady = useExperience((s) => s.setReady);
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);
  const advance = useThree((s) => s.advance);
  useEffect(() => {
    let cancelled = false;
    const ids: number[] = [];
    const frameThen = (next: () => void) =>
      ids.push(
        window.setTimeout(() => {
          if (cancelled) return;
          advance(performance.now() / 1000);
          next();
        }, 30),
      );
    const warm = () => {
      if (cancelled) return;
      frameThen(() => frameThen(() => !cancelled && setReady(true)));
    };
    uploadTextures(gl, scene, () => cancelled)
      .then(() => gl.compileAsync(scene, camera))
      .then(warm, warm);
    return () => {
      cancelled = true;
      ids.forEach((id) => window.clearTimeout(id));
      setReady(false);
    };
  }, [gl, scene, camera, advance, setReady]);
  return null;
}

/** Seconds after the reveal before the frame rate is judged (last shader links, first uploads, loader exit). */
const MONITOR_DELAY = 3000;

/**
 * Runtime quality adaptation. Starts only once the agency is open and settled (the warm-up used to be
 * counted and triggered needless downgrades), and only declines under ~30 fps sustained.
 */
function AdaptiveQuality() {
  const ready = useExperience((s) => s.ready);
  const lockQuality = useExperience((s) => s.lockQuality);
  const setQuality = useExperience((s) => s.setQuality);
  const [active, setActive] = useState(false);
  useEffect(() => {
    if (!ready || lockQuality) return;
    const id = window.setTimeout(() => setActive(true), MONITOR_DELAY);
    return () => window.clearTimeout(id);
  }, [ready, lockQuality]);
  if (!active) return null;
  return (
    <PerformanceMonitor
      flipflops={2}
      bounds={(refreshrate) => (refreshrate > 100 ? [45, 100] : [30, 55])}
      onDecline={() => setQuality(DOWNGRADE[useExperience.getState().quality])}
    />
  );
}

/** Publishes three's loading-manager progress (via drei) to the store read by the DOM site loader. */
function LoadingBridge() {
  useEffect(() => {
    const setAssets = useExperience.getState().setAssets;
    const publish = ({
      loaded,
      total,
      active,
    }: {
      loaded: number;
      total: number;
      active: boolean;
    }) => setAssets({ loaded, total, active, started: true });
    publish(useProgress.getState());
    return useProgress.subscribe(publish);
  }, []);
  return null;
}

/** Full-screen fixed WebGL layer. Rendered by the director (frameloop="never"). */
export default function ExperienceCanvas() {
  const quality = useExperience((s) => s.quality);
  const debug = useExperience((s) => s.debug);
  const settings = QUALITY[quality];
  const dpr = useMemo(
    () => cappedDpr(settings.dpr as unknown as [number, number]),
    [settings.dpr],
  );

  useEffect(() => {
    setCanvasActive(true);
    return () => setCanvasActive(false);
  }, []);

  // Real refraction only where it is affordable; lower tiers keep a reflective transparent glass.
  useEffect(() => {
    setGlassQuality(quality === "high");
  }, [quality]);

  return (
    <>
      <Canvas
        frameloop="never"
        dpr={dpr}
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
          // Error checks read program status synchronously on first use, which defeats parallel shader
          // compilation (hundreds of ms of stall at load). Kept in development only.
          gl.debug.checkShaderErrors = process.env.NODE_ENV !== "production";
          gl.setClearColor("#eef3f9");
          /*
           * A lost context (GPU out of memory or driver reset) leaves a blank canvas behind the whole site.
           * Nothing here may re-render <Canvas> while the context is dead (R3F would read the dead GL state
           * and throw): the flag goes to the store, the DOM shows a notice, and the next load starts one
           * tier lower. The browser restores the context by itself when it can — we then draw again.
           */
          const canvas = gl.domElement;
          canvas.addEventListener("webglcontextlost", (e) => {
            e.preventDefault();
            console.warn("[d2s] contexte WebGL perdu");
            useExperience.getState().setGlLost(true);
            try {
              const n = Number(sessionStorage.getItem("d2s:gpu-trouble") ?? 0);
              sessionStorage.setItem("d2s:gpu-trouble", String(n + 1));
            } catch {}
          });
          canvas.addEventListener("webglcontextrestored", () => {
            console.warn("[d2s] contexte WebGL restauré");
            useExperience.getState().setGlLost(false);
            requestRender(60);
          });
        }}
        aria-hidden="true"
      >
        <AdaptiveQuality />
        <LoadingBridge />
        <Suspense fallback={null}>
          <Lighting />
          <World />
          {/* No drei <Preload all/>: it renders the scene 6× into a cubemap in one task (~0.8 s freeze).
            ReadyMarker warms up the same things in slices and with parallel shader compilation. */}
          <ReadyMarker />
        </Suspense>
        <CameraRig />
        <PostEffects />
        {debug && <DebugScene />}
      </Canvas>
    </>
  );
}
