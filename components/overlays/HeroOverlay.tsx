"use client";

import Link from "next/link";
import { useRef } from "react";
import { AGENTS } from "@/components/experience/agents/agents.config";
import { Button } from "@/components/ui/Button";
import { ArrowRight, ChevronRight, Play, Sparkle } from "@/components/ui/Icons";
import { setInteractive, useFrameUpdate } from "@/hooks/useFrameUpdate";
import { scrollToProgress } from "@/lib/experience/director";
import { frame } from "@/lib/experience/store";
import { beat, beatEased } from "@/lib/experience/timeline";
import { CONTACT_HREF } from "@/lib/navigation";
import { easeOutCubic } from "@/lib/math";
import styles from "./HeroOverlay.module.css";
import { ScrollCue } from "./ScrollCue";
import { StatStrip } from "./StatStrip";

/**
 * Façade copy. Real DOM (SEO, a11y, crisp text), faded and lifted by the "heroFade" beat
 * while the camera starts walking. Layers leave at slightly different speeds for depth.
 */
export function HeroOverlay() {
  const section = useRef<HTMLElement>(null);
  const copy = useRef<HTMLDivElement>(null);
  const aside = useRef<HTMLDivElement>(null);
  const cue = useRef<HTMLDivElement>(null);

  useFrameUpdate(({ progress }) => {
    const t = beatEased(progress, "heroFade");
    const visible = 1 - t;
    if (section.current) {
      section.current.style.setProperty("--hero", visible.toFixed(3));
      setInteractive(section.current, visible > 0.2);
    }
    if (copy.current) {
      copy.current.style.transform = `translate3d(0, ${(-t * 46).toFixed(2)}px, 0)`;
    }
    if (aside.current) {
      aside.current.style.transform = `translate3d(${(t * 30).toFixed(2)}px, ${(t * 12).toFixed(2)}px, 0)`;
    }
    if (cue.current) {
      const c = 1 - easeOutCubic(beat(progress, "scrollHint"));
      cue.current.style.opacity = c.toFixed(3);
    }
  });

  const team = [AGENTS.content, AGENTS.support, AGENTS.data];

  return (
    <section ref={section} className={styles.hero} aria-labelledby="hero-title">
      <div className={styles.haze} aria-hidden="true" />
      <div ref={copy} className={styles.copy}>
        <p className={styles.badge}>
          <Sparkle size={17} />
          L’IA, plus humaine, plus utile
        </p>
        <h1 id="hero-title" className={styles.title}>
          L’agence IA
          <br />
          qui transforme votre
          <br />
          temps en <span className={styles.accent}>performance.</span>
        </h1>
        <p className={styles.lead}>
          Nous concevons et déployons des agents IA sur mesure pour automatiser vos tâches, accélérer votre croissance
          et libérer ce qui compte vraiment.
        </p>
        <div className={styles.actions}>
          <Button href={CONTACT_HREF} icon={<ArrowRight size={20} />}>
            Démarrer un projet
          </Button>
          <Button
            variant="secondary"
            icon={<Play size={15} />}
            onClick={() => {
              frame.forced = null;
              scrollToProgress(1);
            }}
          >
            Découvrir nos agents
          </Button>
        </div>
        <StatStrip className={styles.stats} />
      </div>

      <p className={styles.motto} aria-hidden="true">
        Ideas
        <br />
        Agents
        <br />
        Real impact
      </p>

      <div ref={cue} className={styles.cue}>
        <ScrollCue lines={["Scrollez pour entrer", "dans notre univers"]} />
      </div>

      <div ref={aside} className={styles.aside}>
        <Link href="/nos-agents-ia" className={styles.team}>
          <span className={styles.avatars} aria-hidden="true">
            {team.map((a) => (
              // eslint-disable-next-line @next/next/no-img-element -- 96px decorative avatars
              <img key={a.type} src={a.avatar} alt="" width={40} height={40} />
            ))}
          </span>
          <span className={styles.teamDot} aria-hidden="true" />
          <span className={styles.teamLabel}>
            Une équipe d’agents IA
            <br />à vos côtés
          </span>
          <ChevronRight size={16} />
        </Link>
      </div>
    </section>
  );
}
