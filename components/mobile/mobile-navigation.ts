import type { NeedId } from "@/lib/contact-content";

/** Mobile-only context. Deliberately independent from the WebGL director/store. */
export interface MobileContactIntent {
  source: string;
  need?: NeedId;
  message?: string;
  diagnostic?: string[];
  stamp?: number;
}

export function scrollToMobileSection(id: string, immediate = false) {
  const target = document.getElementById(id);
  if (!target) return;
  const header = document.querySelector<HTMLElement>("[data-mobile-header]");
  const top =
    target.getBoundingClientRect().top +
    window.scrollY -
    (header?.offsetHeight ?? 72) -
    16;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  window.scrollTo({
    top: Math.max(0, top),
    behavior: immediate || reduced ? "auto" : "smooth",
  });
  target.focus({ preventScroll: true });
}

export const MOBILE_SECTIONS = [
  { id: "agence", label: "Accueil" },
  { id: "mission", label: "Notre mission" },
  { id: "nos-services", label: "Nos services" },
  { id: "nos-agents-ia", label: "Nos agents IA" },
  { id: "comment-choisir", label: "Comment choisir" },
  { id: "contact", label: "Parlons de votre projet" },
];
