"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { ArrowRight, Bars, Bolt, People, Search } from "@/components/ui/Icons";
import { setInteractive, useFrameUpdate } from "@/hooks/useFrameUpdate";
import { beatEased } from "@/lib/experience/timeline";
import { clamp, smootherstep } from "@/lib/math";
import styles from "./LobbyOverlay.module.css";
import { ScrollCue } from "./ScrollCue";
import { StatStrip } from "./StatStrip";

function WelcomeBubble() {
  const [sent, setSent] = useState(false);
  return (
    <div className={styles.bubble}>
      <p className={styles.bubbleTitle}>
        Bonjour ! <span aria-hidden="true">👋</span>
        <br />
        Bienvenue chez D2S Studio !
      </p>
      <p className={styles.bubbleText}>Je suis votre agente IA. Comment puis-je vous aider aujourd’hui ?</p>
      <form
        className={styles.ask}
        onSubmit={(e) => {
          e.preventDefault();
          setSent(true);
        }}
      >
        <label className={styles.askField}>
          <Search size={18} />
          <span className="visually-hidden">Votre question</span>
          <input type="text" name="question" placeholder="Poser une question…" autoComplete="off" />
        </label>
        <button type="submit" className={styles.askSend} aria-label="Envoyer la question">
          <ArrowRight size={18} />
        </button>
      </form>
      <p className={styles.askNote} role="status" aria-live="polite">
        {sent ? "Bientôt disponible : je pourrai vous répondre ici." : ""}
      </p>
    </div>
  );
}

/**
 * Reception UI. Appears once the camera settles at the desk.
 * The welcome bubble is pinned to the receptionist's head (screen anchor published by WebGL).
 */
export function LobbyOverlay() {
  const section = useRef<HTMLElement>(null);
  const bubble = useRef<HTMLDivElement>(null);
  const mission = useRef<HTMLDivElement>(null);
  const stats = useRef<HTMLDivElement>(null);
  const cue = useRef<HTMLDivElement>(null);

  useFrameUpdate(({ progress, anchors }) => {
    const t = beatEased(progress, "lobbyUI");
    if (section.current) {
      section.current.style.setProperty("--lobby", t.toFixed(3));
      setInteractive(section.current, t > 0.6);
    }
    // Staggered arrival: bubble, then mission panel, then figures.
    const step = (delay: number) => smootherstep(clamp((t - delay) / (1 - delay)));
    const apply = (el: HTMLElement | null, k: number, dx: number, dy: number) => {
      if (!el) return;
      el.style.opacity = k.toFixed(3);
      el.style.setProperty("--dx", `${((1 - k) * dx).toFixed(2)}px`);
      el.style.setProperty("--dy", `${((1 - k) * dy).toFixed(2)}px`);
    };
    apply(mission.current, step(0.12), 28, 0);
    apply(stats.current, step(0.3), 0, 18);
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

      <div ref={mission} className={styles.mission}>
        <p className={styles.kicker}>Notre mission</p>
        <h2 id="mission-title" className={styles.missionTitle}>
          Mettre l’IA au service des gens et des idées <span className={styles.accent}>qui comptent.</span>
        </h2>
        <p className={styles.missionText}>
          Chez D2S Studio, nous concevons et déployons des agents IA sur mesure pour automatiser vos tâches, accélérer
          votre croissance et libérer ce qui compte vraiment : l’humain, la créativité et l’impact.
        </p>
        <div className={styles.missionActions}>
          <Button href="/nos-services" icon={<ArrowRight size={20} />} className={styles.wide}>
            Découvrir nos services
          </Button>
          <Button href="/nos-agents-ia" variant="secondary" className={styles.wide}>
            <span className={styles.meet}>
              <People size={22} />
              Rencontrer nos agents
            </span>
          </Button>
        </div>
        <ul className={styles.benefits}>
          <li>
            <Bolt size={22} />
            Plus de temps
          </li>
          <li>
            <People size={22} />
            Plus d’impact
          </li>
          <li>
            <Bars size={22} />
            Une croissance durable
          </li>
        </ul>
      </div>

      <div ref={stats} className={styles.stats}>
        <StatStrip variant="card" />
      </div>

      <div ref={cue} className={styles.cue}>
        <ScrollCue lines={["Continuez l’exploration", "de notre univers"]} />
      </div>
    </section>
  );
}
