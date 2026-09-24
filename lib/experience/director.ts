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
/*
 * Lobby detent. A fast wheel or trackpad flick used to fly past the reception straight into the sections.
 * Coming down from the façade, the scroll now stops at the lobby (end of the 3D track) until the camera has
 * landed and the input has been quiet for a moment; the next gesture carries on. Once per descent (re-armed
 * above the lobby), never for programmatic scrolls (menu, CTAs), and never longer than maxHold.
 */
const DETENT = {
  /** Re-armed once the page is this many viewport heights above the lobby. */
  rearm: 0.3,
  /** Input (wheel, keys, touch) must have stopped this long (ms): trackpad momentum ends first. Below ~250 ms
   * the gaps inside one fast wheel spin already count as "stopped" and the flick flies past again. */
  quiet: 260,
  /** Shortest stop once the camera has landed (ms). */
  minHold: 225,
  /** Never held longer (ms), even under continuous input (halved on 24/09: the lobby held too long). */
  maxHold: 1300,
  /** Smoothed progress counted as "landed" at the lobby. */
  landed: 0.985,
};
let detentArmed = false;
let holdSince = 0;
let lastInput = 0;
let detentMutedUntil = 0;
/** Page scroll at the previous tick (crossing detection, whatever moved the page). */
let lastScroll = 0;

function markInput() {
  lastInput = performance.now();
}

/**
 * Runs before Lenis steps: clamps the scroll at the lobby while the detent holds. Two input paths: Lenis'
 * smoothed wheel (its target is clamped, it eases into the lobby) and the browser's own scroll (wheel over a
 * `data-lenis-prevent` area such as May's chat, keyboard, scrollbar), which is put back at the lobby.
 */
function detent(now: number) {
  if (!lenis || !trigger || scrollLocked) return;
  const lobby = trigger.end;
  const actual = window.scrollY;
  const previous = lastScroll;
  lastScroll = actual;
  if (actual < lobby - window.innerHeight * DETENT.rearm) detentArmed = true;
  if (holdSince) {
    const held = now - holdSince;
    const landed = frame.progress > DETENT.landed;
    if ((landed && held > DETENT.minHold && now - lastInput > DETENT.quiet) || held > DETENT.maxHold) {
      holdSince = 0;
      detentArmed = false;
      return;
    }
    if (actual > lobby + 1) lenis.scrollTo(lobby, { immediate: true, force: true });
    else if (lenis.targetScroll > lobby) lenis.scrollTo(lobby, { force: true });
    return;
  }
  if (!detentArmed || now < detentMutedUntil) return;
  // Only when crossing the lobby on the way down: the page was above it, the scroll (or its target) is below.
  if (previous <= lobby + 1 && (lenis.targetScroll > lobby + 1 || actual > lobby + 1)) {
    holdSince = now;
    if (actual > lobby + 1) lenis.scrollTo(lobby, { immediate: true, force: true });
    else lenis.scrollTo(lobby, { force: true });
  }
}

/** Programmatic scrolls (menu, CTAs, jumps) go through: the detent is off for their duration. */
function muteDetent(ms: number) {
  detentMutedUntil = performance.now() + ms;
  holdSince = 0;
  // A programmatic scroll past the lobby consumes this descent: re-armed only back above the lobby.
  detentArmed = false;
}

/** One-shot callbacks run right after the next WebGL frame, while its drawing buffer is still readable. */
let afterRender: (() => void)[] = [];
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

/** Runs `callback` right after the next rendered WebGL frame (in the same task, before compositing). */
export function onAfterRender(callback: () => void) {
  afterRender.push(callback);
  requestRender(4);
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
  detent(performance.now());
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
    if (afterRender.length) {
      const callbacks = afterRender;
      afterRender = [];
      for (const callback of callbacks) callback();
    }
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

  detentArmed = false;
  holdSince = 0;
  lastScroll = window.scrollY;
  window.addEventListener("wheel", markInput, { passive: true });
  window.addEventListener("keydown", markInput);
  window.addEventListener("touchmove", markInput, { passive: true });

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
  window.removeEventListener("wheel", markInput);
  window.removeEventListener("keydown", markInput);
  window.removeEventListener("touchmove", markInput);
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
  muteDetent(immediate ? 300 : 2700);
  if (lenis) {
    lenis.scrollTo(y, immediate ? { immediate: true } : { duration: 2.4, easing: (t) => 1 - Math.pow(1 - t, 3) });
  } else {
    window.scrollTo({ top: y, behavior: immediate ? "auto" : "smooth" });
  }
  if (immediate) frame.target = clamp(p);
}

/** Scroll to a section below the sequence (e.g. services). Immediate jumps also settle the 3D at the end. */
export function scrollToElement(el: HTMLElement, { immediate = false } = {}) {
  muteDetent(immediate ? 300 : 2700);
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

/** Smooth scroll to an absolute page position (e.g. a step of a scroll-driven block). */
export function scrollToY(y: number, { immediate = false } = {}) {
  muteDetent(immediate ? 300 : 1400);
  if (lenis) lenis.scrollTo(y, immediate ? { immediate: true } : { duration: 1.1, easing: (t) => 1 - Math.pow(1 - t, 3) });
  else window.scrollTo({ top: y, behavior: immediate ? "auto" : "smooth" });
}

export function refreshDirector() {
  ScrollTrigger.refresh();
}
