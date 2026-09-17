"use client";

import { scrollToProgress } from "@/lib/experience/director";
import { frame, useExperience } from "@/lib/experience/store";

/** Skip link: brings keyboard users straight to the reception, then focuses its heading. */
export function SkipToLobby() {
  return (
    <a
      className="skip-link"
      href="#mission-title"
      onClick={(e) => {
        e.preventDefault();
        frame.forced = null;
        scrollToProgress(1, { immediate: useExperience.getState().reducedMotion });
        const focus = () => {
          const heading = document.getElementById("mission-title");
          if (heading?.closest("[inert]")) return requestAnimationFrame(focus);
          heading?.setAttribute("tabindex", "-1");
          heading?.focus({ preventScroll: true });
        };
        requestAnimationFrame(focus);
      }}
    >
      Aller à l’accueil de l’agence
    </a>
  );
}
