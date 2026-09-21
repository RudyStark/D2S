"use client";

import { useCallback, useRef, useState } from "react";
import { AGENTS } from "@/components/experience/agents/agents.config";
import { ArrowUpRight, Sparkle } from "@/components/ui/Icons";
import { useInView } from "@/hooks/useInView";
import { lowerFirst } from "@/lib/site";
import { TEAM, TEAM_INTRO } from "@/lib/team";
import { AgentDialog } from "./AgentDialog";
import styles from "./AgentsSection.module.css";
import head from "./SectionHead.module.css";

export const AGENTS_ID = "nos-agents-ia";

/**
 * The team. Hover (or focus) a card: the agent's name rises into the caption and the others step back.
 * Click: the profile window opens out of the card, with a live demo of the agent at work (AgentDialog).
 */
export function AgentsSection() {
  const section = useRef<HTMLElement>(null);
  const inView = useInView(section, 0.2);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [origin, setOrigin] = useState<DOMRect | null>(null);
  const cards = useRef<(HTMLButtonElement | null)[]>([]);
  const lastOpened = useRef<number>(0);

  const onClose = useCallback(() => {
    setOpenIndex(null);
    // Back to the card of the agent last shown (the visitor may have browsed the team in the dialog).
    cards.current[lastOpened.current]?.focus({ preventScroll: true });
  }, []);

  const onChange = useCallback((i: number) => {
    lastOpened.current = i;
    setOpenIndex(i);
  }, []);

  return (
    <section ref={section} id={AGENTS_ID} className={styles.agents} aria-labelledby="agents-title" data-in={inView}>
      <div className={styles.frame}>
        <header className={head.head}>
          <p className={head.kicker}>{TEAM_INTRO.kicker}</p>
          <h2 id="agents-title" className={head.title}>
            <span className={head.line}>{TEAM_INTRO.title[0]}</span>{" "}
            <span className={`${head.line} ${head.accent}`}>{TEAM_INTRO.title[1]}</span>
          </h2>
          <p className={head.lead}>{TEAM_INTRO.lead}</p>
          <p className={styles.note} aria-hidden="true">
            {TEAM_INTRO.note[0]}
            <br />
            {TEAM_INTRO.note[1]}
            <svg className={styles.noteArrow} viewBox="0 0 60 40" fill="none">
              <path d="M56 6C44 8 26 16 12 32" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
              <path d="M9.5 21.5 11.5 33.5 23 30" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </p>
        </header>

        <ul className={styles.cards}>
          {TEAM.map((agent, i) => {
            const def = AGENTS[agent.type];
            return (
              <li
                key={agent.type}
                className={styles.card}
                style={{ "--i": i, "--tint-a": agent.tint[0], "--tint-b": agent.tint[1] } as React.CSSProperties}
              >
                <button
                  ref={(el) => {
                    cards.current[i] = el;
                  }}
                  type="button"
                  className={styles.cardButton}
                  aria-haspopup="dialog"
                  aria-label={`${agent.name}, ${agent.role}. Découvrir ses missions`}
                  onClick={(e) => {
                    lastOpened.current = i;
                    setOrigin(e.currentTarget.getBoundingClientRect());
                    setOpenIndex(i);
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- transparent cut-out, sized in design units */}
                  <img className={styles.figure} src={def.image} alt={`${agent.name}, ${lowerFirst(agent.role)} de D2S AIgency`} loading="lazy" decoding="async" />
                  <span className={styles.open} aria-hidden="true">
                    <ArrowUpRight size={18} />
                  </span>
                  <span className={styles.caption} aria-hidden="true">
                    <span className={styles.nameRow}>
                      <span>
                        <span className={styles.name}>{agent.name}</span>
                      </span>
                    </span>
                    <span className={styles.role}>{agent.role}</span>
                    <span className={styles.blurb}>{agent.blurb}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
        <p className={styles.hint}>
          <Sparkle size={18} />
          <span className={styles.hintMouse}>Survolez un agent pour faire connaissance, cliquez pour le voir à l’œuvre.</span>
          <span className={styles.hintTouch}>Touchez un agent pour le voir à l’œuvre.</span>
        </p>
      </div>

      <AgentDialog index={openIndex} origin={origin} onChange={onChange} onClose={onClose} />
    </section>
  );
}
