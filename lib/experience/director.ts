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
let scrollLocked = false;
/** Frames still to render under the "covered" freeze (after an instant jump, the kept frame must be the new place). */
let renderBudget = 0;

export function requestRender(frames = 24) {
  renderBudget = Math.max(renderBudget, frames);
}

/** Freezes scrolling while the site loader is up (wheel, touch, keys and the Lenis smoother). */
export function setScrollLocked(locked: boolean) {
  scrollLocked = locked;
  document.documentElement.style.overflow = locked ? "hidden" : "";
  if (locked) lenis?.stop();
  else lenis?.start();
}

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
  const { reducedMotion, profile, ready } = useExperience.getState();
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

  // No WebGL frames while the world is still streaming in (it is hidden under the site loader):
  // each new asset would compile its shaders synchronously mid-frame and freeze the loader.
  // ReadyMarker compiles everything at once and renders the warm-up frames itself.
  // Once the services section covers the (blurred) lobby and nothing moves, the last frame is kept:
  // no GPU work behind a static page.
  const covered = frame.services >= 0.999 && frame.settled;
  if (canvasActive && ready && (!covered || renderBudget > 0)) {
    advance(time);
    if (renderBudget > 0) renderBudget--;
  }
  for (const update of updaters) update(frame);
}

export function startDirector(track: HTMLElement, { smooth }: { smooth: boolean }) {
  if (running) stopDirector();
  running = true;
  gsap.registerPlugin(ScrollTrigger);

  if (smooth) {
    lenis = new Lenis({ lerp: 0.11, wheelMultiplier: 0.9, smoothWheel: true, autoRaf: false });
    lenis.on("scroll", ScrollTrigger.update);
    if (scrollLocked) lenis.stop();
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

  // While the render is frozen behind the sections, the browser can drop the canvas' contents (resize,
  // tab switch, GPU recovery) and leave it blank: redraw a few frames whenever that can happen.
  window.addEventListener("resize", wake);
  window.addEventListener("pageshow", wake);
  document.addEventListener("visibilitychange", wake);
}

function wake() {
  if (document.visibilityState === "hidden") return;
  frame.snap = true;
  requestRender(8);
}

export function stopDirector() {
  window.removeEventListener("resize", wake);
  window.removeEventListener("pageshow", wake);
  document.removeEventListener("visibilitychange", wake);
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

/** Scroll to a section below the sequence (e.g. services). Immediate jumps also settle the 3D at the end. */
export function scrollToElement(el: HTMLElement, { immediate = false } = {}) {
  if (immediate) {
    frame.target = 1;
    frame.progress = 1;
    // The camera lands without easing, and the frozen backdrop is re-rendered at the lobby.
    frame.snap = true;
    requestRender();
  }
  // Absolute target from the real scroll position: Lenis resolves an element against its own animated
  // value, which lags when the page was scrolled by other means (and scrollIntoView is off on mobile).
  const top = el.getBoundingClientRect().top + window.scrollY;
  if (lenis) {
    lenis.scrollTo(top, immediate ? { immediate: true } : { duration: 2.4, easing: (t) => 1 - Math.pow(1 - t, 3) });
  } else {
    window.scrollTo({ top, behavior: immediate ? "auto" : "smooth" });
  }
}

export function refreshDirector() {
  ScrollTrigger.refresh();
}
