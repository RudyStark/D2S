"use client";

import { useRef, useState } from "react";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { MayChat } from "@/components/may/MayChat";
import { homeOf } from "@/lib/navigation";
import { goToContact } from "@/lib/contact";
import { Button } from "@/components/ui/Button";
import { ArrowRight, Bars, Bolt, People, Sparkle } from "@/components/ui/Icons";
import { setInteractive, useFrameUpdate } from "@/hooks/useFrameUpdate";
import { scrollToElement } from "@/lib/experience/director";
import { beatEased } from "@/lib/experience/timeline";
import { clamp, smootherstep } from "@/lib/math";
import glass from "./Glass.module.css";
import styles from "./LobbyOverlay.module.css";
import { ScrollCue } from "./ScrollCue";
import { AGENTS_ID } from "./AgentsSection";
import { SERVICES_ID } from "./ServicesSection";

const TEXTS = {
  fr: {
    kicker: "Notre mission",
    title: ["Mettre l’IA au service", "des gens et des idées", "qui comptent."],
    text: "Chez D2S AIgency, nous concevons et déployons des agents IA sur mesure pour automatiser vos tâches, accélérer votre croissance et libérer ce qui compte vraiment : l’humain, la créativité et l’impact.",
    services: "Découvrir nos services",
    meet: "Rencontrer nos agents",
    benefits: ["Plus de temps", "Plus d’impact", "Croissance durable"],
    cue: ["Continuez l’exploration", "de notre univers"],
    cueLabel: "Continuer l’exploration : découvrir nos services",
  },
  en: {
    kicker: "Our mission",
    title: ["AI that works", "for the people and", "ideas that matter."],
    text: "At D2S AIgency, we design and deploy custom AI agents to automate your tasks, speed up your growth and free up what really matters: people, creativity and impact.",
    services: "Explore our services",
    meet: "Meet our agents",
    benefits: ["More time", "More impact", "Lasting growth"],
    cue: ["Keep exploring", "our world"],
    cueLabel: "Keep exploring: discover our services",
  },
};

function WelcomeBubble() {
  return (
    <div className={styles.bubble}>
      <MayChat
        variant="desktop"
        onContact={(message) => goToContact({ source: "may-chat-desktop", need: "unsure", message })}
        onDraft={(draft) => goToContact({ source: "may-chat-desktop", ...draft })}
      />
    </div>
  );
}

/**
 * Reception UI. Appears once the camera settles at the desk.
 * The welcome bubble is pinned to the receptionist's head (screen anchor published by WebGL).
 */
export function LobbyOverlay() {
  const locale = useLocale();
  const tx = TEXTS[locale];
  const section = useRef<HTMLElement>(null);
  const bubble = useRef<HTMLDivElement>(null);
  const mission = useRef<HTMLDivElement>(null);
  const cue = useRef<HTMLDivElement>(null);
  // The mission block plays its entrance each time the camera settles at the desk.
  const [arrived, setArrived] = useState(false);
  const arrivedRef = useRef(false);

  useFrameUpdate(({ progress, anchors, services }) => {
    const t = beatEased(progress, "lobbyUI");
    const settled = t > 0.6 ? true : t < 0.2 ? false : arrivedRef.current;
    if (settled !== arrivedRef.current) {
      arrivedRef.current = settled;
      setArrived(settled);
    }
    // The reception UI steps aside as the services section scrolls in over the lobby.
    const away = smootherstep(clamp(services / 0.45));
    if (section.current) {
      section.current.style.setProperty("--lobby", t.toFixed(3));
      section.current.style.opacity = (1 - away).toFixed(3);
      setInteractive(section.current, t > 0.6 && away < 0.5);
    }
    // Staggered arrival: bubble, then mission panel, then the scroll cue.
    const step = (delay: number) => smootherstep(clamp((t - delay) / (1 - delay)));
    const apply = (el: HTMLElement | null, k: number, dx: number, dy: number) => {
      if (!el) return;
      el.style.opacity = k.toFixed(3);
      el.style.setProperty("--dx", `${((1 - k) * dx).toFixed(2)}px`);
      el.style.setProperty("--dy", `${((1 - k) * dy).toFixed(2)}px`);
    };
    apply(mission.current, step(0.12), 28, 0);
    apply(cue.current, step(0.45), 0, 10);

    const el = bubble.current;
    const anchor = anchors.reception;
    if (el) {
      const k = step(0);
      apply(el, anchor?.visible ? k : 0, 0, 14);
      if (anchor && window.innerWidth > 1024) {
        el.style.setProperty("--ax", `${anchor.x.toFixed(1)}px`);
        el.style.setProperty("--ay", `${anchor.y.toFixed(1)}px`);
      }
    }
  });

  return (
    <section ref={section} className={styles.lobby} aria-labelledby="mission-title" inert aria-hidden="true">
      <div ref={bubble} className={styles.bubbleWrap}>
        <WelcomeBubble />
      </div>

      {/*
        Notre mission — read at once, no click: a decorative glass block on the right (aurora + orbit, light
        edge and glint, a drawn accent rule, the title revealed line by line when the camera settles).
      */}
      <div ref={mission} className={styles.mission}>
        <div className={`${styles.missionCard} ${glass.glass}`} data-glass={arrived ? "in" : "out"} data-arrived={arrived}>
          <span className={styles.aurora} aria-hidden="true" />
          <span className={styles.orbit} aria-hidden="true" />
          <p className={styles.kicker}>
            <span className={styles.kickerIcon} aria-hidden="true">
              <Sparkle size={13} />
            </span>
            {tx.kicker}
          </p>
          <h2 id="mission-title" className={styles.missionTitle}>
            <span className={styles.rule} aria-hidden="true" />
            <span className={styles.titleLine} style={{ "--l": 0 } as React.CSSProperties}>
              {tx.title[0]}{" "}
            </span>
            <span className={styles.titleLine} style={{ "--l": 1 } as React.CSSProperties}>
              {tx.title[1]}{" "}
            </span>
            <span className={`${styles.titleLine} ${styles.accent}`} style={{ "--l": 2 } as React.CSSProperties}>
              {tx.title[2]}
            </span>
          </h2>
          <p className={styles.missionText}>{tx.text}</p>
          <div className={styles.missionActions}>
            <Button
              icon={<ArrowRight size={20} />}
              className={styles.wide}
              onClick={() => {
                const target = document.getElementById(SERVICES_ID);
                if (target) scrollToElement(target);
              }}
            >
              {tx.services}
            </Button>
            {/* Scroll on the page: following the link would redirect to "/" and remount the 3D world. */}
            <Button
              href={`${homeOf(locale)}#${AGENTS_ID}`}
              variant="secondary"
              className={styles.wide}
              onClick={(e) => {
                const target = document.getElementById(AGENTS_ID);
                if (!target) return;
                e.preventDefault();
                scrollToElement(target);
              }}
            >
              <span className={styles.meet}>
                <People size={22} />
                {tx.meet}
              </span>
            </Button>
          </div>
          <ul className={styles.benefits}>
            <li>
              <span className={styles.benefitIcon}>
                <Bolt size={22} />
              </span>
              {tx.benefits[0]}
            </li>
            <li>
              <span className={styles.benefitIcon}>
                <People size={22} />
              </span>
              {tx.benefits[1]}
            </li>
            <li>
              <span className={styles.benefitIcon}>
                <Bars size={22} />
              </span>
              {tx.benefits[2]}
            </li>
          </ul>
        </div>
      </div>

      <div ref={cue} className={styles.cue}>
        {/* Also a button: a way on for visitors who do not scroll (or who are stopped by the lobby detent). */}
        <ScrollCue
          lines={tx.cue}
          label={tx.cueLabel}
          onClick={() => {
            const target = document.getElementById(SERVICES_ID);
            if (target) scrollToElement(target);
          }}
        />
      </div>
    </section>
  );
}
