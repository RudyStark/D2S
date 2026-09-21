import type React from "react";
import { create } from "zustand";
import type { AgentType } from "@/components/experience/agents/agents.config";
import { scrollToElement } from "./experience/director";
import { frame } from "./experience/store";

/*
 * "Parlons de votre projet" — the end of the visit. Every call to action of the site leads here, carrying
 * what the visitor was looking at (an agent, the diagnostic result) so the form arrives pre-filled.
 */

export * from "./contact-content";
import type { NeedId } from "./contact-content";
import { CONTACT_ID } from "./contact-content";

export interface ContactIntent {
  /** Which call to action was used (kept with the request). */
  source: string;
  need?: NeedId;
  /** Diagnostic answers and recommendation, attached to the request. */
  diagnostic?: string[];
  /** A question typed at the reception: becomes the message of the request. */
  message?: string;
}

export const useContactIntent = create<{ intent: ContactIntent | null; stamp: number; set: (intent: ContactIntent) => void; clearDiagnostic: () => void }>((set) => ({
  intent: null,
  stamp: 0,
  set: (intent) => set({ intent, stamp: Date.now() }),
  clearDiagnostic: () => set((s) => ({ intent: s.intent ? { ...s.intent, diagnostic: undefined } : null })),
}));

/** Soft white veil for long jumps (from the façade straight to the form): no fly-through of the whole visit. */
function veilJump(jump: () => void) {
  const veil = document.createElement("div");
  veil.setAttribute("aria-hidden", "true");
  Object.assign(veil.style, {
    position: "fixed",
    inset: "0",
    zIndex: "150",
    background: "rgb(247 249 253)",
    opacity: "0",
    transition: "opacity 0.3s cubic-bezier(0.65, 0, 0.35, 1)",
    pointerEvents: "none",
  });
  document.body.appendChild(veil);
  requestAnimationFrame(() => (veil.style.opacity = "1"));
  window.setTimeout(() => {
    jump();
    window.setTimeout(() => {
      veil.style.transition = "opacity 0.55s cubic-bezier(0.22, 1, 0.36, 1)";
      veil.style.opacity = "0";
      window.setTimeout(() => veil.remove(), 600);
    }, 260);
  }, 320);
}

/**
 * Takes the visitor to the form with their context. Returns false when the form is not on this page
 * (the link then navigates to /#contact and the section picks the hash up).
 */
export function goToContact(intent: ContactIntent) {
  useContactIntent.getState().set(intent);
  const el = document.getElementById(CONTACT_ID);
  if (!el) return false;
  frame.forced = null;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  // Still in the 3D walk (façade, lobby): a veiled jump. Already in the sections below: a smooth scroll.
  if (frame.services < 0.5 && !reduced) veilJump(() => scrollToElement(el, { immediate: true }));
  else scrollToElement(el, { immediate: reduced });
  return true;
}

/** onClick for links to CONTACT_HREF: stays on the page when the form is here. */
export const contactClick = (intent: ContactIntent) => (e: React.MouseEvent) => {
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
  if (goToContact(intent)) e.preventDefault();
};
