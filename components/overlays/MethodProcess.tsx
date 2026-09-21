"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { ArrowRight, Bars, Check, Doc, Gear, Rocket } from "@/components/ui/Icons";
import { useInView, useReducedMotion } from "@/hooks/useInView";
import { contactClick } from "@/lib/contact";
import { CONTACT_HREF } from "@/lib/navigation";
import { METHOD_PROMISES, METHOD_STEPS } from "@/lib/services";
import glass from "./Glass.module.css";
import styles from "./MethodProcess.module.css";

const STEP_ICONS = { doc: Doc, gear: Gear, bars: Bars, rocket: Rocket } as const;
/** Time on each step while the process plays by itself. */
const STEP_MS = 5200;

/**
 * "Notre méthode": a four-step timeline that plays by itself once in view (the line fills, each step
 * lights up, its detail card explains what we do, what the client gets and what we need from them).
 * Tabs: click or arrow keys to choose a step; any interaction stops the autoplay. Hover/focus pauses it.
 */
export function MethodProcess() {
  const root = useRef<HTMLDivElement>(null);
  const inView = useInView(root, 0.35);
  const reduced = useReducedMotion();
  const [active, setActive] = useState(0);
  const [started, setStarted] = useState(false);
  const [paused, setPaused] = useState(false);
  const [manual, setManual] = useState(false);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const id = useId();

  useEffect(() => {
    if (inView) setStarted(true);
  }, [inView]);

  const playing = started && inView && !paused && !manual && !reduced;
  useEffect(() => {
    if (!playing) return;
    const t = window.setTimeout(() => setActive((a) => (a + 1) % METHOD_STEPS.length), STEP_MS);
    return () => window.clearTimeout(t);
  }, [playing, active]);

  const choose = (i: number, focus = false) => {
    setManual(true);
    setActive(i);
    if (focus) tabs.current[i]?.focus();
  };

  const onKey = (e: React.KeyboardEvent) => {
    const n = METHOD_STEPS.length;
    if (e.key === "ArrowRight") choose((active + 1) % n, true);
    else if (e.key === "ArrowLeft") choose((active - 1 + n) % n, true);
    else if (e.key === "Home") choose(0, true);
    else if (e.key === "End") choose(n - 1, true);
    else return;
    e.preventDefault();
  };

  const step = METHOD_STEPS[active];

  return (
    <div
      ref={root}
      className={`${styles.method} ${glass.glass}`}
      data-started={started}
      data-glass={started ? "in" : "out"}
      data-playing={playing}
      style={{ "--active": active, "--steps": METHOD_STEPS.length, "--step-ms": `${STEP_MS}ms` } as React.CSSProperties}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className={styles.intro}>
        <p className={styles.kicker}>Notre méthode</p>
        <h3 className={styles.title}>
          Un processus simple,
          <br />
          des <span className={styles.accent}>résultats rapides.</span>
        </h3>
        <p className={styles.text}>De l’idée à l’impact, nous vous accompagnons à chaque étape. Vous savez toujours où en est votre projet.</p>
        <ul className={styles.promises}>
          {METHOD_PROMISES.map((p) => (
            <li key={p}>
              <span className={styles.promiseIcon} aria-hidden="true">
                <Check size={13} />
              </span>
              {p}
            </li>
          ))}
        </ul>
        <Link href={CONTACT_HREF} className={styles.cta} onClick={contactClick({ source: "method" })}>
          Démarrer par un brief
          <ArrowRight size={18} />
        </Link>
      </div>

      <div className={styles.timeline}>
        <div className={styles.track} aria-hidden="true">
          <span className={styles.trackFill} />
        </div>
        <div className={styles.tabs} role="tablist" aria-label="Les étapes de notre méthode" onKeyDown={onKey}>
          {METHOD_STEPS.map((s, i) => {
            const Icon = STEP_ICONS[s.icon];
            const state = i < active ? "done" : i === active ? "active" : "todo";
            return (
              <button
                key={s.title}
                ref={(el) => {
                  tabs.current[i] = el;
                }}
                type="button"
                role="tab"
                id={`${id}-tab-${i}`}
                aria-selected={i === active}
                aria-controls={`${id}-panel`}
                tabIndex={i === active ? 0 : -1}
                className={styles.tab}
                data-state={state}
                style={{ "--i": i } as React.CSSProperties}
                onClick={() => choose(i)}
              >
                <span className={styles.tabIcon} aria-hidden="true">
                  <Icon size={24} />
                  <span className={styles.tabDone}>
                    <Check size={12} />
                  </span>
                </span>
                <span className={styles.tabIndex}>{String(i + 1).padStart(2, "0")}</span>
                <span className={styles.tabTitle}>{s.title}</span>
                <span className={styles.tabSummary}>{s.summary}</span>
                <span className={styles.tabProgress} aria-hidden="true" />
              </button>
            );
          })}
        </div>

        <div className={styles.panel} role="tabpanel" id={`${id}-panel`} aria-labelledby={`${id}-tab-${active}`} aria-live="polite">
          <div key={active} className={styles.panelInner}>
            <div className={styles.panelMain}>
              <p className={styles.panelStep}>
                Étape {String(active + 1).padStart(2, "0")} <span aria-hidden="true">/</span> {String(METHOD_STEPS.length).padStart(2, "0")}
              </p>
              <h4 className={styles.panelTitle}>{step.title}</h4>
              <p className={styles.panelText}>{step.detail}</p>
            </div>
            <dl className={styles.panelFacts}>
              <div className={styles.fact}>
                <dt>Ce que vous obtenez</dt>
                <dd>{step.outcome}</dd>
              </div>
              <div className={styles.fact}>
                <dt>Votre rôle</dt>
                <dd>{step.role}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

    </div>
  );
}
