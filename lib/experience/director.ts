import { advance } from "@react-three/fiber";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { clamp, damp } from "@/lib/math";
import { frame, useExperience, type FrameState } from "./store";

/**
 * The director owns the only clock of the experience.
 * Each tick: Lenis → smoothed progress → WebGL frame (R3F, frameloop="never") → DOM overlays.
 * WebGL and DOM therefore always render the exact same progress value.
 */

type OverlayUpdater = (state: FrameState) => void;

const updaters = new Set<OverlayUpdater>();
let lenis: Lenis | null = null;
let trigger: ScrollTrigger | null = null;
let running = false;
let fpsAccumulator = 0;
let fpsFrames = 0;
let canvasActive = false;

export function onFrame(updater: OverlayUpdater) {
  updaters.add(updater);
  return () => {
    updaters.delete(updater);
  };
}

export function setCanvasActive(active: boolean) {
  canvasActive = active;
}

function tick(time: number, deltaMs: number) {
  lenis?.raf(time * 1000);

  const dt = Math.min(deltaMs / 1000, 0.1);
  const { reducedMotion, profile } = useExperience.getState();
  const target = frame.forced ?? frame.target;
  const lambda = reducedMotion ? 16 : profile === "mobile" ? 6.5 : 4.8;
  let next = damp(frame.progress, target, lambda, dt);
  if (Math.abs(target - next) < 1e-5) next = target;
  frame.progress = next;
  frame.settled = Math.abs(target - next) < 4e-4;
  frame.time = time;
  frame.delta = dt;

  fpsAccumulator += dt;
  fpsFrames++;
  if (fpsAccumulator >= 0.5) {
    frame.fps = Math.round(fpsFrames / fpsAccumulator);
    fpsAccumulator = 0;
    fpsFrames = 0;
  }

  if (canvasActive) advance(time);
  for (const update of updaters) update(frame);
}

export function startDirector(track: HTMLElement, { smooth }: { smooth: boolean }) {
  if (running) stopDirector();
  running = true;
  gsap.registerPlugin(ScrollTrigger);

  if (smooth) {
    lenis = new Lenis({ lerp: 0.11, wheelMultiplier: 0.9, smoothWheel: true, autoRaf: false });
    lenis.on("scroll", ScrollTrigger.update);
  }

  trigger = ScrollTrigger.create({
    trigger: track,
    start: "top top",
    end: "bottom bottom",
    onUpdate: (self) => {
      frame.target = clamp(self.progress);
    },
    onRefresh: (self) => {
      frame.target = clamp(self.progress);
    },
  });
  frame.target = clamp(trigger.progress);
  frame.progress = frame.forced ?? frame.target;

  gsap.ticker.lagSmoothing(0);
  gsap.ticker.add(tick);
}

export function stopDirector() {
  gsap.ticker.remove(tick);
  trigger?.kill();
  trigger = null;
  lenis?.destroy();
  lenis = null;
  running = false;
}

/** Scroll the page so the sequence lands on progress p (navigation, debug stops). */
export function scrollToProgress(p: number, { immediate = false } = {}) {
  if (!trigger) return;
  const y = trigger.start + (trigger.end - trigger.start) * clamp(p);
  if (lenis) {
    lenis.scrollTo(y, immediate ? { immediate: true } : { duration: 2.4, easing: (t) => 1 - Math.pow(1 - t, 3) });
  } else {
    window.scrollTo({ top: y, behavior: immediate ? "auto" : "smooth" });
  }
  if (immediate) frame.target = clamp(p);
}

export function refreshDirector() {
  ScrollTrigger.refresh();
}
