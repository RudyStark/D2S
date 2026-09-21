"use client";

import dynamic from "next/dynamic";
import { useSyncExternalStore } from "react";
import MobileHome from "@/components/mobile/MobileHome";
import styles from "./AdaptiveHome.module.css";

/** Match the existing desktop UI breakpoint. No WebGL module is imported by the mobile tree. */
const MOBILE_QUERY = "(max-width: 1024px)";
const subscribe = (listener: () => void) => {
  const query = window.matchMedia(MOBILE_QUERY);
  query.addEventListener("change", listener);
  return () => query.removeEventListener("change", listener);
};
const getSnapshot = () => window.matchMedia(MOBILE_QUERY).matches;
const getServerSnapshot = (): boolean | null => null;

function DesktopBoot() {
  return (
    <div
      className={styles.boot}
      role="status"
      aria-label="Chargement de l’agence"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/brand/d2s-aigency.svg"
        width={174}
        height={65}
        alt="D2S AIgency"
      />
      <span>Chargement de l’agence</span>
    </div>
  );
}

// This import must stay conditional: CSS hiding alone still boots and downloads the 3D experience.
const DesktopHome = dynamic(() => import("./DesktopHome"), {
  ssr: false,
  loading: DesktopBoot,
});

export function AdaptiveHome() {
  const mobile = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );
  if (mobile === false) return <DesktopHome />;
  return (
    <>
      {/* Readable, indexable HTML is rendered immediately; CSS avoids a mobile flash on desktop. */}
      <div className={styles.mobile}>
        <MobileHome />
      </div>
      {mobile === null && (
        <div className={styles.desktopInitial}>
          <DesktopBoot />
        </div>
      )}
      <noscript>
        <style>{`.${styles.mobile}{display:block!important}.${styles.desktopInitial}{display:none!important}`}</style>
      </noscript>
    </>
  );
}
