import { ExperienceRoot } from "@/components/experience/ExperienceRoot";
import { HeroOverlay } from "@/components/overlays/HeroOverlay";
import { LobbyOverlay } from "@/components/overlays/LobbyOverlay";
import { SkipToLobby } from "@/components/overlays/SkipToLobby";
import { Header } from "@/components/ui/Header";
import styles from "./page.module.css";

const TRACK_ID = "sequence-track";

/**
 * Home = the agency itself. One continuous 3D space driven by scroll:
 * façade → doors → threshold → reception. The track only provides scroll length.
 */
export default function Home() {
  return (
    <>
      <SkipToLobby />
      <Header />
      <main id="agence" className={styles.main}>
        <ExperienceRoot trackId={TRACK_ID} />
        <HeroOverlay />
        <LobbyOverlay />
        <div id={TRACK_ID} className={styles.track} aria-hidden="true" />
      </main>
    </>
  );
}
