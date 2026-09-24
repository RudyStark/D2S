"use client";

import { PerformanceMonitor, useProgress } from "@react-three/drei";
import { Canvas, useThree } from "@react-three/fiber";
import dynamic from "next/dynamic";
import { Suspense, useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import { requestRender, setCanvasActive } from "@/lib/experience/director";
import { cappedDpr, QUALITY, type QualityTier } from "@/lib/experience/quality";
import { registerGlCanvas, swapQuality } from "@/lib/experience/qualitySwap";
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
const UPGRADE: Record<QualityTier, QualityTier> = {
  low: "medium",
  medium: "high",
  high: "high",
};
const RANK: Record<QualityTier, number> = { low: 0, medium: 1, high: 2 };

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

/** Seconds after the reveal before the frame rate is judged again (loader exit, first scroll). */
const MONITOR_DELAY = 3000;
/** Lowest acceptable frame rate, as the runtime monitor judges it (high-refresh screens ask for more). */
const floorFps = (refresh: number) => (refresh > 100 ? 45 : 30);
/**
 * Calibration keeps this margin above the floor on 60 Hz screens. None on high-refresh screens (120 Hz MacBooks):
 * 45 fps there is already smooth, and asking 50 used to send them to "low" (plain floor, no reflections).
 */
const margin = (refresh: number) => (refresh > 100 ? 0 : 5);
/**
 * "low" drops the reflections, the signature of the scene: from "medium" it is taken only when the frame rate is
 * clearly short (this many fps under the floor), not for a borderline measure.
 */
const LOW_SLACK = 8;

const frameTime = () => new Promise<number>((resolve) => requestAnimationFrame(resolve));
const sleep = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

/** Display refresh rate, from the median frame interval (measured while nothing heavy renders). */
async function measureRefresh() {
  const intervals: number[] = [];
  let last = await frameTime();
  for (let i = 0; i < 24; i++) {
    const now = await frameTime();
    intervals.push(now - last);
    last = now;
  }
  intervals.sort((a, b) => a - b);
  return 1000 / Math.max(1, intervals[intervals.length >> 1]);
}

/** Frames per second over `duration`, or null when the tab was hidden meanwhile (rAF is paused there). */
async function sampleFps(duration: number) {
  if (document.visibilityState !== "visible") return null;
  const start = await frameTime();
  let frames = 0;
  let now = start;
  while (now - start < duration) {
    now = await frameTime();
    frames++;
  }
  if (document.visibilityState !== "visible" || now - start > duration * 3) return null;
  return (frames * 1000) / (now - start);
}

/**
 * Quality adaptation, in two stages.
 * 1. Calibration, under the site loader: once the world is ready, the real frame rate of the chosen tier is
 *    measured and the tier is lowered until it holds. A tier change clears the canvas and recompiles shaders
 *    (it used to happen seconds after the reveal: two white flashes); here the loader hides it, and it opens
 *    only once `calibrated` is set.
 * 2. Runtime monitor, once open: a later sustained drop still lowers the tier, through swapQuality() (the last
 *    frame is kept on screen and cross-fades, no flash).
 */
function AdaptiveQuality() {
  const ready = useExperience((s) => s.ready);
  const lockQuality = useExperience((s) => s.lockQuality);
  const calibrated = useExperience((s) => s.calibrated);
  const [active, setActive] = useState(false);
  const [refresh] = useState(() => measureRefresh());
  // The tier the device was detected for: a tier lowered on the way may climb back up to it, never above.
  const [ceiling] = useState(() => useExperience.getState().quality);

  useEffect(() => {
    if (!ready || calibrated) return;
    const { setCalibrated } = useExperience.getState();
    if (lockQuality) {
      setCalibrated(true);
      return;
    }
    let cancelled = false;
    void (async () => {
      const rate = await refresh;
      const floor = floorFps(rate) + margin(rate);
      const trace: string[] = [];
      // The first frames of a tier are not representative: the browser still finishes preparing the GPU
      // pipelines (on Macs, Chrome/ANGLE compiles them at first use: stutters for a second or so). Each tier
      // gets two measures after a settle; it is lowered only when BOTH are short (a single stutter no longer
      // costs "high"), and kept as soon as one is enough.
      let settle = 700;
      for (let round = 0; round < 3 && !cancelled; round++) {
        await sleep(settle);
        let best = -1;
        for (let sample = 0; sample < 2 && !cancelled; sample++) {
          const fps = await sampleFps(600);
          if (fps === null) {
            sample--; // tab hidden: measure again once visible
            await sleep(400);
            continue;
          }
          best = Math.max(best, fps);
          if (best >= floor) break;
        }
        if (cancelled) return;
        const { quality, setQuality } = useExperience.getState();
        trace.push(`${quality} ${Math.round(best)} fps`);
        if (best >= floor || quality === "low") break;
        if (quality === "medium" && best >= floor - LOW_SLACK) break;
        setQuality(DOWNGRADE[quality]);
        settle = 700;
      }
      if (cancelled) return;
      // One line in the console: why this tier (support, and checking a machine that "never gets high").
      console.info(`[d2s] qualité ${useExperience.getState().quality} · écran ${Math.round(rate)} Hz, seuil ${floor} fps · mesures : ${trace.join(", ") || "aucune"}`);
      setCalibrated(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [ready, calibrated, lockQuality, refresh]);

  useEffect(() => {
    if (!calibrated || lockQuality) return;
    const id = window.setTimeout(() => setActive(true), MONITOR_DELAY);
    return () => window.clearTimeout(id);
  }, [calibrated, lockQuality]);

  if (!active) return null;
  return (
    <PerformanceMonitor
      flipflops={3}
      bounds={(refreshrate) => [
        floorFps(refreshrate) - (useExperience.getState().quality === "medium" ? LOW_SLACK : 0),
        // Comfortably above the floor for a while: the tier goes back up (a pessimistic first measure
        // must not keep a capable machine out of "high" for the whole visit).
        refreshrate > 100 ? 75 : 57,
      ]}
      onDecline={() => swapQuality(DOWNGRADE[useExperience.getState().quality])}
      onIncline={() => {
        const current = useExperience.getState().quality;
        if (RANK[current] < RANK[ceiling]) {
          console.info(`[d2s] qualité remontée : ${current} → ${UPGRADE[current]}`);
          swapQuality(UPGRADE[current]);
        }
      }}
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
          registerGlCanvas(canvas);
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
