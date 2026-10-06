"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { ArrowRight, Check, Close, Replay } from "@/components/ui/Icons";
import { useReducedMotion } from "@/hooks/useInView";
import type { AgentProfile } from "@/lib/team";
import type { MobileContactIntent } from "./mobile-navigation";
import styles from "./MobileHome.module.css";

const TEXTS = {
  fr: {
    loading: "Chargement de la démonstration…",
    bar: "Nos agents IA",
    close: "Fermer la fiche",
    missions: (n: string) => `Ce que ${n} fait pour vous`,
    tools: "Dans vos outils",
    control: "Vous gardez la main.",
    note: "Démonstration illustrative · données fictives",
    replay: "Rejouer la démonstration",
    watch: "Voir la démonstration",
    hire: (n: string) => `Recruter ${n}`,
  },
  en: {
    loading: "Loading the demo…",
    bar: "Our AI agents",
    close: "Close the profile",
    missions: (n: string) => `What ${n} does for you`,
    tools: "In your tools",
    control: "You stay in control.",
    note: "Illustrative demo · fictitious data",
    replay: "Replay the demo",
    watch: "Watch the demo",
    hire: (n: string) => `Hire ${n}`,
  },
};

function DemoLoading() {
  return <p role="status">{TEXTS[useLocale()].loading}</p>;
}

// The DOM demos have no WebGL dependency and only download when a profile is opened.
const AgentDemo = dynamic(
  () =>
    import("@/components/overlays/AgentDemos").then(
      (module) => module.AgentDemo,
    ),
  { loading: DemoLoading },
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
  const t = TEXTS[useLocale()];
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
        <span>{t.bar}</span>
        <button
          type="button"
          className={styles.iconButton}
          autoFocus
          aria-label={t.close}
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
        <h3>{t.missions(agent.name)}</h3>
        <ul className={styles.dialogMissions}>
          {agent.missions.map((mission) => (
            <li key={mission}>
              <Check size={18} />
              {mission}
            </li>
          ))}
        </ul>
        <h3>{t.tools}</h3>
        <ul className={styles.chips}>
          {agent.channels.map((channel) => (
            <li key={channel}>{channel}</li>
          ))}
        </ul>
        <p className={styles.control}>
          <Check size={24} />
          <span>
            <strong>{t.control}</strong>
            {agent.control}
          </span>
        </p>
        <div className={styles.demo}>
          <h3>{agent.demo}</h3>
          <p className={styles.demoNote}>
            {t.note}
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
                {t.replay}
              </button>
            </>
          ) : (
            <button
              type="button"
              className={styles.secondary}
              onClick={() => setPlay(true)}
            >
              {t.watch}
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
          {t.hire(agent.name)}
          <ArrowRight size={18} />
        </button>
      </div>
    </dialog>
  );
}
