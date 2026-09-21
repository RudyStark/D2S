"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { AGENTS } from "@/components/experience/agents/agents.config";
import { Button } from "@/components/ui/Button";
import { ArrowRight, ChevronRight, Play, Sparkle } from "@/components/ui/Icons";
import { setInteractive, useFrameUpdate } from "@/hooks/useFrameUpdate";
import { scrollToElement, scrollToProgress } from "@/lib/experience/director";
import { frame } from "@/lib/experience/store";
import { beat, beatEased } from "@/lib/experience/timeline";
import { easeOutCubic } from "@/lib/math";
import { contactClick } from "@/lib/contact";
import { CONTACT_HREF } from "@/lib/navigation";
import { AGENTS_ID } from "./AgentsSection";
import styles from "./HeroOverlay.module.css";
import { ScrollCue } from "./ScrollCue";

const TEAM = [AGENTS.automation, AGENTS.support, AGENTS.data];

/**
 * Façade copy, positioned on design/references/01-home-final.png (1672×861).
 * Real DOM (SEO, a11y, crisp text), lifted and faded by the "heroFade" beat.
 */
export function HeroOverlay() {
  const section = useRef<HTMLElement>(null);
  const copy = useRef<HTMLDivElement>(null);
  const aside = useRef<HTMLDivElement>(null);
  const cue = useRef<HTMLDivElement>(null);
  const haze = useRef<HTMLDivElement>(null);
  useFrameUpdate(({ progress }) => {
    const t = beatEased(progress, "heroFade");
    const visible = 1 - t;
    if (section.current) {
      section.current.style.setProperty("--hero", visible.toFixed(3));
      setInteractive(section.current, visible > 0.2);
    }
    if (copy.current) copy.current.style.transform = `translate3d(0, ${(-t * 46).toFixed(2)}px, 0)`;
    if (aside.current) aside.current.style.transform = `translate3d(${(t * 30).toFixed(2)}px, ${(t * 12).toFixed(2)}px, 0)`;
    if (cue.current) cue.current.style.opacity = (1 - easeOutCubic(beat(progress, "scrollHint"))).toFixed(3);
    // Cut the veil around the black planter block (published by the 3D scene each frame).
    const planter = frame.rects.heroPlanter;
    if (haze.current) {
      const s = haze.current.style;
      const on = planter?.visible;
      s.setProperty("--cut-left", on ? `${planter.left.toFixed(1)}px` : "200vw");
      s.setProperty("--cut-top", on ? `${planter.top.toFixed(1)}px` : "200vh");
      s.setProperty("--cut-bottom", on ? `${planter.bottom.toFixed(1)}px` : "200vh");
    }
  });

  return (
    <section ref={section} className={styles.hero} aria-labelledby="hero-title">
      <div ref={haze} className={styles.haze} aria-hidden="true" />

      <div ref={copy} className={styles.copy}>
        <p className={styles.badge}>
          <Sparkle className={styles.badgeIcon} />
          L’IA, plus humaine, plus utile
        </p>
        <h1 id="hero-title" className={styles.title}>
          <span className={styles.line}>L’agence IA</span>{" "}
          <span className={styles.line}>qui transforme votre</span>{" "}
          <span className={styles.line}>
            temps en <span className={styles.accent}>performance.</span>
          </span>
        </h1>
        <p className={styles.lead}>
          Nous concevons et déployons des agents IA sur mesure pour automatiser vos tâches, accélérer votre croissance
          et libérer ce qui compte vraiment.
        </p>
        <div className={styles.actions}>
          <Button href={CONTACT_HREF} icon={<ArrowRight />} className={styles.primary} onClick={contactClick({ source: "hero" })}>
            Démarrer un projet
          </Button>
          <Button
            variant="secondary"
            icon={<Play />}
            className={styles.secondary}
            onClick={() => {
              frame.forced = null;
              scrollToProgress(1);
            }}
          >
            Découvrir nos agents
          </Button>
        </div>
      </div>

      <div ref={cue} className={styles.cue}>
        <ScrollCue lines={["Scrollez pour entrer", "dans notre univers"]} />
      </div>

      <div ref={aside} className={styles.aside}>
        <Link
          href={`/#${AGENTS_ID}`}
          className={styles.team}
          onClick={(e) => {
            // Same page: scroll instead of navigating (the redirect would remount the 3D world).
            const target = document.getElementById(AGENTS_ID);
            if (!target) return;
            e.preventDefault();
            scrollToElement(target);
          }}
        >
          <span className={styles.avatars} aria-hidden="true">
            {TEAM.map((a) => (
              // eslint-disable-next-line @next/next/no-img-element -- 96px decorative avatars
              <img key={a.type} src={a.avatar} alt="" width={40} height={40} />
            ))}
          </span>
          <span className={styles.teamDot} aria-hidden="true" />
          <span className={styles.teamLabel}>
            Une équipe d’agents IA
            <br />à vos côtés
          </span>
          <ChevronRight className={styles.teamChevron} />
        </Link>
      </div>
    </section>
  );
}
