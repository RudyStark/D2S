import { onAfterRender } from "./director";
import type { QualityTier } from "./quality";
import { useExperience } from "./store";

/*
 * A quality change resizes the drawing buffer (pixel ratio) and recompiles materials (shadows, post-processing):
 * the canvas is cleared and stays blank for 100–600 ms — a white flash over the scene. swapQuality() hides it:
 * the last frame is copied into a still image laid over the canvas, the tier changes underneath, and the still
 * fades out once the new tier has really drawn a few frames.
 */

let glCanvas: HTMLCanvasElement | null = null;
let swapping = false;

/** The WebGL canvas (set once by ExperienceCanvas). */
export function registerGlCanvas(canvas: HTMLCanvasElement | null) {
  glCanvas = canvas;
}

/** Frames of the new tier to draw before the still fades (the first ones compile shaders). */
const SETTLE_FRAMES = 3;
const FADE_MS = 450;

export function swapQuality(next: QualityTier) {
  const { quality, setQuality } = useExperience.getState();
  if (next === quality || swapping) return;
  const host = glCanvas?.parentElement;
  if (!glCanvas || !host) {
    setQuality(next);
    return;
  }
  swapping = true;
  const canvas = glCanvas;
  // Right after a frame, in the same task: the buffer still holds the image (preserveDrawingBuffer is off).
  onAfterRender(() => {
    const still = document.createElement("canvas");
    still.width = canvas.clientWidth;
    still.height = canvas.clientHeight;
    still.setAttribute("aria-hidden", "true");
    Object.assign(still.style, {
      position: "absolute",
      inset: "0",
      width: "100%",
      height: "100%",
      pointerEvents: "none",
      transition: `opacity ${FADE_MS}ms ease-out`,
    });
    try {
      still.getContext("2d")?.drawImage(canvas, 0, 0, still.width, still.height);
    } catch {
      setQuality(next);
      swapping = false;
      return;
    }
    host.appendChild(still);
    setQuality(next);
    // Counted from after React has applied the new settings (two animation frames).
    let frames = 0;
    const settle = () =>
      onAfterRender(() => {
        if (++frames < SETTLE_FRAMES) return settle();
        still.style.opacity = "0";
        window.setTimeout(() => {
          still.remove();
          swapping = false;
        }, FADE_MS + 50);
      });
    requestAnimationFrame(() => requestAnimationFrame(settle));
  });
}
