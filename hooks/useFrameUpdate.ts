"use client";

import { useEffect, useRef } from "react";
import { onFrame } from "@/lib/experience/director";
import type { FrameState } from "@/lib/experience/store";

/** Runs `update` on every director tick (after the WebGL frame). Never triggers React renders. */
export function useFrameUpdate(update: (state: FrameState) => void) {
  const ref = useRef(update);
  ref.current = update;
  useEffect(() => onFrame((state) => ref.current(state)), []);
}

/** Toggles `inert` + aria-hidden on overlays that are faded out, so hidden CTAs never take focus. */
export function setInteractive(el: HTMLElement | null, interactive: boolean) {
  if (!el) return;
  if (el.inert === !interactive) return;
  el.inert = !interactive;
  el.setAttribute("aria-hidden", interactive ? "false" : "true");
}
