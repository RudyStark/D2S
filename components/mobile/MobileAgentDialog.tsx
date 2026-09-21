"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, Check, Close, Replay } from "@/components/ui/Icons";
import { useReducedMotion } from "@/hooks/useInView";
import type { AgentProfile } from "@/lib/team";
import type { MobileContactIntent } from "./mobile-navigation";
import styles from "./MobileHome.module.css";

// The DOM demos have no WebGL dependency and only download when a profile is opened.
const AgentDemo = dynamic(
  () =>
    import("@/components/overlays/AgentDemos").then(
      (module) => module.AgentDemo,
    ),
  { loading: () => <p role="status">Chargement de la démonstration…</p> },
);

export function MobileAgentDialog({
  agent,
  onClose,
  onContact,
}: {
  agent: AgentProfile;
  onClose: () => void;
  onContact: (intent: MobileContactIntent) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const reduced = useReducedMotion();
  const [run, setRun] = useState(0);
  const [play, setPlay] = useState(false);
  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    const overflow = document.body.style.overflow;
    element.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      element.close();
      document.body.style.overflow = overflow;
    };
  }, []);

  return (
    <dialog
      ref={dialog}
      className={styles.agentDialog}
      aria-labelledby="mobile-agent-title"
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={styles.dialogBar}>
        <span>Nos agents IA</span>
        <button
          type="button"
          className={styles.iconButton}
          autoFocus
          aria-label="Fermer la fiche"
          onClick={onClose}
        >
          <Close />
        </button>
      </div>
      <div className={styles.dialogBody}>
        <div
          className={styles.dialogPortrait}
          style={{
            background: `linear-gradient(150deg, ${agent.tint[0]}, ${agent.tint[1]})`,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/images/agents/${agent.type}.webp`}
            alt={`${agent.name}, ${agent.role}`}
            width={260}
            height={600}
          />
        </div>
        <p className={styles.eyebrow}>{agent.role}</p>
        <h2 id="mobile-agent-title">{agent.name}</h2>
        <p>{agent.pitch}</p>
        <h3>Ce que {agent.name} fait pour vous</h3>
        <ul className={styles.dialogMissions}>
          {agent.missions.map((mission) => (
            <li key={mission}>
              <Check size={18} />
              {mission}
            </li>
          ))}
        </ul>
        <h3>Dans vos outils</h3>
        <ul className={styles.chips}>
          {agent.channels.map((channel) => (
            <li key={channel}>{channel}</li>
          ))}
        </ul>
        <p className={styles.control}>
          <Check size={24} />
          <span>
            <strong>Vous gardez la main.</strong>
            {agent.control}
          </span>
        </p>
        <div className={styles.demo}>
          <h3>{agent.demo}</h3>
          <p className={styles.demoNote}>
            Démonstration illustrative · données fictives
          </p>
          {play ? (
            <>
              <div className={styles.demoBody} data-agent={agent.type}>
                <AgentDemo type={agent.type} run={run} play reduced={reduced} />
              </div>
              <button
                type="button"
                className={styles.textButton}
                onClick={() => setRun((current) => current + 1)}
              >
                <Replay size={16} />
                Rejouer la démonstration
              </button>
            </>
          ) : (
            <button
              type="button"
              className={styles.secondary}
              onClick={() => setPlay(true)}
            >
              Voir la démonstration
              <ArrowRight size={18} />
            </button>
          )}
        </div>
        <button
          type="button"
          className={styles.primary}
          onClick={() => {
            dialog.current?.close();
            onContact({ source: "mobile-agent", need: agent.type });
          }}
        >
          Recruter {agent.name}
          <ArrowRight size={18} />
        </button>
      </div>
    </dialog>
  );
}
