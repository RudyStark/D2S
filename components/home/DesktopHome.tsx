"use client";

import { ExperienceRoot } from "@/components/experience/ExperienceRoot";
import { HeroOverlay } from "@/components/overlays/HeroOverlay";
import { LobbyOverlay } from "@/components/overlays/LobbyOverlay";
import { AgentsSection } from "@/components/overlays/AgentsSection";
import { ContactSection } from "@/components/overlays/ContactSection";
import { DiagnosticSection } from "@/components/overlays/DiagnosticSection";
import { FaqSection } from "@/components/overlays/FaqSection";
import { ServicesSection } from "@/components/overlays/ServicesSection";
import { SkipToLobby } from "@/components/overlays/SkipToLobby";
import { Header } from "@/components/ui/Header";
import styles from "@/app/page.module.css";

const TRACK_ID = "sequence-track";

/**
 * Home = the agency itself. One continuous 3D space driven by scroll:
 * façade → doors → threshold → reception. The track only provides scroll length.
 */
export default function DesktopHome() {
  return (
    <>
      <SkipToLobby />
      <Header />
      <main id="agence" className={styles.main}>
        <ExperienceRoot trackId={TRACK_ID} />
        <HeroOverlay />
        <LobbyOverlay />
        <div id={TRACK_ID} className={styles.track} aria-hidden="true" />
        {/* Scrolling on from the reception, over the blurred lobby (no new 3D): services, agents, diagnostic, contact. */}
        <ServicesSection />
        <AgentsSection />
        <DiagnosticSection />
        <FaqSection />
        <ContactSection />
      </main>
    </>
  );
}
