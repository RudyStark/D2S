"use client";

import Link from "next/link";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { AGENTS, type AgentType } from "@/components/experience/agents/agents.config";
import { ArrowRight, ChevronLeft, ChevronRight, Close, Replay, Shield } from "@/components/ui/Icons";
import { useReducedMotion } from "@/hooks/useInView";
import { setScrollLocked } from "@/lib/experience/director";
import { goToContact, type ContactIntent } from "@/lib/contact";
import { CONTACT_HREF } from "@/lib/navigation";
import { TEAM } from "@/lib/team";
import { AgentDemo } from "./AgentDemos";
import styles from "./AgentDialog.module.css";

/** The demo waits until its stage is on screen (it sits below the missions on phones). */
function DemoStage({ type, run, reduced }: { type: AgentType; run: number; reduced: boolean }) {
  const stage = useRef<HTMLDivElement>(null);
  const [play, setPlay] = useState(false);
  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setPlay(true);
        io.disconnect();
      },
      { threshold: 0.45 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={stage} className={styles.demoStage}>
      <AgentDemo key={`${type}-${run}`} type={type} run={run} reduced={reduced} play={play} />
    </div>
  );
}

interface AgentDialogProps {
  /** Index in TEAM, or null when closed. */
  index: number | null;
  /** Screen rect of the card that opened the dialog: the panel grows out of it and returns to it. */
  origin: DOMRect | null;
  onChange: (index: number) => void;
  onClose: () => void;
}

/**
 * Agent profile. Identity up top, what the agent does on the left, and — the point of the window — a live
 * demo of the agent at work on the right. Native <dialog> (top layer, page inert, focus kept inside);
 * opens out of the clicked card; ← / → browse the team; Échap or a click outside closes.
 */
export function AgentDialog({ index, origin, onChange, onClose }: AgentDialogProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const [closing, setClosing] = useState(false);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [run, setRun] = useState(0);
  const reduced = useReducedMotion();
  /** "Recruter X": the form is reached once the window has closed and the page scrolls again. */
  const pendingContact = useRef<ContactIntent | null>(null);
  const open = index !== null;
  const agent = open ? TEAM[index] : null;

  useLayoutEffect(() => {
    const d = dialog.current;
    if (!d || !open || d.open) return;
    const p = panel.current;
    if (p && origin) {
      p.style.setProperty("--from-x", `${(origin.left + origin.width / 2 - window.innerWidth / 2).toFixed(0)}px`);
      p.style.setProperty("--from-y", `${(origin.top + origin.height / 2 - window.innerHeight / 2).toFixed(0)}px`);
    }
    setClosing(false);
    d.showModal();
    setScrollLocked(true);
  }, [open, origin]);

  const requestClose = useCallback(() => {
    if (closing) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      dialog.current?.close();
      return;
    }
    setClosing(true);
  }, [closing]);

  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    const onNativeClose = () => {
      setClosing(false);
      setScrollLocked(false);
      onClose();
      const intent = pendingContact.current;
      pendingContact.current = null;
      if (intent && !goToContact(intent)) window.location.assign(CONTACT_HREF);
    };
    const onCancel = (e: Event) => {
      e.preventDefault();
      requestClose();
    };
    d.addEventListener("close", onNativeClose);
    d.addEventListener("cancel", onCancel);
    return () => {
      d.removeEventListener("close", onNativeClose);
      d.removeEventListener("cancel", onCancel);
    };
  }, [onClose, requestClose]);

  const go = useCallback(
    (step: 1 | -1) => {
      if (index === null) return;
      setDirection(step);
      onChange((index + step + TEAM.length) % TEAM.length);
    },
    [index, onChange],
  );

  const def = agent ? AGENTS[agent.type] : null;
  const prev = index === null ? null : TEAM[(index - 1 + TEAM.length) % TEAM.length];
  const next = index === null ? null : TEAM[(index + 1) % TEAM.length];

  return (
    <dialog
      ref={dialog}
      className={styles.dialog}
      data-closing={closing}
      aria-labelledby="agent-dialog-name"
      aria-describedby="agent-dialog-pitch"
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") {
          e.preventDefault();
          go(1);
        } else if (e.key === "ArrowLeft") {
          e.preventDefault();
          go(-1);
        }
      }}
      onClick={(e) => {
        if (e.target === dialog.current) requestClose();
      }}
    >
      <div
        ref={panel}
        className={styles.panel}
        data-lenis-prevent
        onAnimationEnd={(e) => {
          if (e.target === panel.current && closing) dialog.current?.close();
        }}
      >
        {agent && def && (
          <div
            key={agent.type}
            className={styles.body}
            data-direction={direction}
            style={{ "--tint-a": agent.tint[0], "--tint-b": agent.tint[1] } as React.CSSProperties}
          >
            <div className={styles.layout}>
              <div className={styles.intro}>
                <header className={styles.hero}>
                  <div className={styles.portrait} aria-hidden="true">
                    {/* eslint-disable-next-line @next/next/no-img-element -- transparent cut-out */}
                    <img src={def.image} alt="" />
                  </div>
                  <div className={styles.identity}>
                    <p className={styles.status}>
                      <span className={styles.dot} aria-hidden="true" />
                      En ligne · 24h/24
                    </p>
                    <h2 id="agent-dialog-name" className={styles.name}>
                      {agent.name}
                    </h2>
                    <p className={styles.role}>{agent.role}</p>
                  </div>
                </header>
                <p id="agent-dialog-pitch" className={styles.pitch}>
                  {agent.pitch}
                </p>
                <ul className={styles.channels} aria-label={`Là où ${agent.name} travaille`}>
                  {agent.channels.map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
              </div>

              <section className={styles.missions} aria-labelledby="agent-dialog-missions">
                <h3 id="agent-dialog-missions" className={styles.heading}>
                  Ce que {agent.name} fait pour vous
                </h3>
                <ol>
                  {agent.missions.map((m, i) => (
                    <li key={m} style={{ "--i": i } as React.CSSProperties}>
                      <span className={styles.num} aria-hidden="true">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      {m}
                    </li>
                  ))}
                </ol>
                <p className={styles.control}>
                  <Shield size={18} />
                  <span>
                    <strong>Vous gardez la main.</strong> {agent.control}
                  </span>
                </p>
              </section>

              <section className={styles.demo} aria-label={`Démonstration : ${agent.demo}`}>
                <h3 className={styles.demoTitle}>
                  <span>{agent.name} en action</span>
                  {agent.demo}
                </h3>
                <DemoStage type={agent.type} run={run} reduced={reduced} />
                <div className={styles.demoFoot}>
                  <p className={styles.demoNote}>Démonstration illustrative, données fictives.</p>
                  <button type="button" className={styles.replay} onClick={() => setRun((r) => r + 1)}>
                    <Replay size={15} />
                    Rejouer
                  </button>
                </div>
              </section>
            </div>

            <footer className={styles.footer}>
              <nav className={styles.browse} aria-label="Parcourir l’équipe">
                <button type="button" className={styles.arrow} onClick={() => go(-1)} aria-label={`Agent précédent : ${prev?.name}`}>
                  <ChevronLeft size={18} />
                </button>
                <ul className={styles.team}>
                  {TEAM.map((t, i) => (
                    <li key={t.type}>
                      <button
                        type="button"
                        data-active={i === index}
                        aria-current={i === index ? "true" : undefined}
                        aria-label={`${t.name}, ${t.role}`}
                        onClick={() => {
                          if (index === null || i === index) return;
                          setDirection(i > index ? 1 : -1);
                          onChange(i);
                        }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element -- avatar */}
                        <img src={AGENTS[t.type].avatar} alt="" width={34} height={34} />
                      </button>
                    </li>
                  ))}
                </ul>
                <button type="button" className={styles.arrow} onClick={() => go(1)} aria-label={`Agent suivant : ${next?.name}`}>
                  <ChevronRight size={18} />
                </button>
              </nav>
              <Link
                href={CONTACT_HREF}
                className={styles.cta}
                onClick={(e) => {
                  e.preventDefault();
                  pendingContact.current = { source: "agent", need: agent.type };
                  requestClose();
                }}
              >
                Recruter {agent.name}
                <ArrowRight size={18} />
              </Link>
            </footer>
          </div>
        )}

        <button type="button" className={styles.close} onClick={requestClose} aria-label="Fermer la fiche" autoFocus>
          <Close size={20} />
        </button>
      </div>
    </dialog>
  );
}
