"use client";

import { useSyncExternalStore } from "react";

/*
 * The language gate: the very first screen of a home page (/ and /en), before the agency loads behind it.
 *
 * The decision is taken by a tiny inline script in <head> (GATE_SCRIPT in ./language-gate-script, rendered by RootDocument) BEFORE the
 * first paint, and written on <html data-lang-gate>:
 *   open  → first visit: the visitor chooses French or English;
 *   enter → the visitor just chose the other language on the previous page: the scene opens on its own;
 *   skip  → a language was already chosen, a robot, a visual test (?capture=1): no gate;
 *   (none)→ JavaScript off or a page without the gate: nothing is shown (the gate is hidden by default).
 * The gate component then writes leaving / done.
 *
 * The choice is kept in localStorage (`d2s:lang` = "fr|<time>" or "en|<time>"): a preference the visitor
 * asked for, no cookie, nothing sent anywhere. A returning visitor who chose English is sent from / to /en;
 * switching language later with the site's own selector (a same-site page change) updates the choice.
 * `?langue=1` forces the gate (checks). This file must stay free of any 3D import: the mobile tree uses it.
 */

import { LANG_KEY } from "./language-gate-script";

export type GateState = "open" | "enter" | "leaving" | "done" | "skip" | "";

export function gateState(): GateState {
  if (typeof document === "undefined") return "";
  return (document.documentElement.dataset.langGate ?? "") as GateState;
}

/** True while the gate covers the page: the 3D neither renders nor measures itself underneath. */
export function gateHolding(): boolean {
  const state = gateState();
  return state === "open" || state === "enter";
}

export function setGateState(state: GateState) {
  document.documentElement.dataset.langGate = state;
}

export function rememberLanguage(lang: "fr" | "en", crossing: boolean) {
  try {
    localStorage.setItem(LANG_KEY, `${lang}|${crossing ? Date.now() : 0}`);
  } catch {
    /* private mode or storage blocked: the choice just won't be remembered */
  }
}

function subscribe(listener: () => void) {
  const observer = new MutationObserver(listener);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-lang-gate"] });
  return () => observer.disconnect();
}

/** Re-renders when the gate opens or closes (client components only). */
export function useGateHolding() {
  return useSyncExternalStore(subscribe, gateHolding, () => false);
}

/** Resolves once the gate no longer covers the page (immediately when there is none). */
export function waitForGate(): Promise<void> {
  if (!gateHolding()) return Promise.resolve();
  return new Promise((resolve) => {
    const stop = subscribe(() => {
      if (gateHolding()) return;
      stop();
      resolve();
    });
  });
}
