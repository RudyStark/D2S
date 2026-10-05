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
import { useLocale } from "@/components/i18n/LocaleProvider";
import { contactHrefOf, homeOf } from "@/lib/navigation";
import { AGENTS_ID } from "./AgentsSection";
import styles from "./HeroOverlay.module.css";
import { ScrollCue } from "./ScrollCue";

const TEAM = [AGENTS.automation, AGENTS.support, AGENTS.data];

const TEXTS = {
  fr: {
    badge: "L’IA, plus humaine, plus utile",
    title: ["L’agence IA", "qui transforme votre", "temps en", "performance."],
    lead: "Nous concevons et déployons des agents IA sur mesure pour automatiser vos tâches, accélérer votre croissance et libérer ce qui compte vraiment.",
    start: "Démarrer un projet",
    discover: "Découvrir nos agents",
    cue: ["Scrollez pour entrer", "dans notre univers"],
    team: ["Une équipe d’agents IA", "à vos côtés"],
  },
  en: {
    badge: "AI, more human, more useful",
    title: ["The AI agency", "that turns your", "time into", "performance."],
    lead: "We design and deploy custom AI agents to automate your tasks, speed up your growth and free up what really matters.",
    start: "Start a project",
    discover: "Meet our agents",
    cue: ["Scroll to step into", "our world"],
    team: ["A team of AI agents", "by your side"],
  },
};

/**
 * Façade copy, positioned on design/references/01-home-final.png (1672×861).
 * Real DOM (SEO, a11y, crisp text), lifted and faded by the "heroFade" beat.
 */
export function HeroOverlay() {
  const locale = useLocale();
  const t = TEXTS[locale];
  const section = useRef<HTMLElement>(null);
  const copy = useRef<HTMLDivElement>(null);
  const aside = useRef<HTMLDivElement>(null);
  const cue = useRef<HTMLDivElement>(null);
  const haze = useRef<HTMLDivElement>(null);
  useFrameUpdate(({ progress }) => {
    const fade = beatEased(progress, "heroFade");
    const visible = 1 - fade;
    if (section.current) {
      section.current.style.setProperty("--hero", visible.toFixed(3));
      setInteractive(section.current, visible > 0.2);
    }
    if (copy.current) copy.current.style.transform = `translate3d(0, ${(-fade * 46).toFixed(2)}px, 0)`;
    if (aside.current) aside.current.style.transform = `translate3d(${(fade * 30).toFixed(2)}px, ${(fade * 12).toFixed(2)}px, 0)`;
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
          {t.badge}
        </p>
        <h1 id="hero-title" className={styles.title}>
          <span className={styles.line}>{t.title[0]}</span>{" "}
          <span className={styles.line}>{t.title[1]}</span>{" "}
          <span className={styles.line}>
            {t.title[2]} <span className={styles.accent}>{t.title[3]}</span>
          </span>
        </h1>
        <p className={styles.lead}>{t.lead}</p>
        <div className={styles.actions}>
          <Button href={contactHrefOf(locale)} icon={<ArrowRight />} className={styles.primary} onClick={contactClick({ source: "hero" })}>
            {t.start}
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
            {t.discover}
          </Button>
        </div>
      </div>

      <div ref={cue} className={styles.cue}>
        <ScrollCue lines={t.cue} />
      </div>

      <div ref={aside} className={styles.aside}>
        <Link
          href={`${homeOf(locale)}#${AGENTS_ID}`}
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
            {t.team[0]}
            <br />
            {t.team[1]}
          </span>
          <ChevronRight className={styles.teamChevron} />
        </Link>
      </div>
    </section>
  );
}
