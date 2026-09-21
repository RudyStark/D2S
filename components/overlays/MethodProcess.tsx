"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import {
  ArrowRight,
  Bars,
  Check,
  Doc,
  Gear,
  Rocket,
} from "@/components/ui/Icons";
import { useFrameUpdate } from "@/hooks/useFrameUpdate";
import { useInView, useReducedMotion } from "@/hooks/useInView";
import { contactClick } from "@/lib/contact";
import { scrollToY } from "@/lib/experience/director";
import { clamp, smoothstep } from "@/lib/math";
import { CONTACT_HREF } from "@/lib/navigation";
import { METHOD_PROMISES, METHOD_STEPS } from "@/lib/services";
import glass from "./Glass.module.css";
import styles from "./MethodProcess.module.css";

const STEP_ICONS = {
  doc: Doc,
  gear: Gear,
  bars: Bars,
  rocket: Rocket,
} as const;
/** Time on each step while the process plays by itself (below 1025 px). */
const STEP_MS = 5200;
/** Desktop: scroll length given to each step while the block is pinned, in viewport heights. */
const SCROLL_PER_STEP = 0.42;
/** Share of each step's scroll spent on it before the line travels to the next one. */
const HOLD = 0.45;

/** Desktop only: the process advances with the scroll. Smaller screens keep the autoplay (own design to come). */
function useScrollMode() {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const q = window.matchMedia("(min-width: 1025px)");
    const apply = () => setOn(q.matches);
    apply();
    q.addEventListener("change", apply);
    return () => q.removeEventListener("change", apply);
  }, []);
  return on;
}

/**
 * "Notre méthode": a four-step timeline (the line fills, each step lights up, its detail card explains
 * what we do, what the client gets and what we need from them).
 * Desktop: the block is pinned while the visitor scrolls through the steps — each step holds for a
 * moment, then the line travels to the next one; a click on a step scrolls to it.
 * Below 1025 px: it plays by itself once in view (hover / focus pauses, any interaction stops it).
 */
export function MethodProcess() {
  const scroller = useRef<HTMLDivElement>(null);
  const root = useRef<HTMLDivElement>(null);
  const scrollMode = useScrollMode();
  const [direction, setDirection] = useState<1 | -1>(1);
  const activeRef = useRef(0);
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

  const playing =
    !scrollMode && started && inView && !paused && !manual && !reduced;

  // Scroll-driven progress (desktop): written straight to CSS variables every frame, React state only
  // when the active step changes.
  useFrameUpdate(() => {
    const box = scroller.current;
    const el = root.current;
    if (!scrollMode || !box || !el) return;
    const n = METHOD_STEPS.length;
    const top =
      parseFloat(getComputedStyle(el).top) || 96; // resolved sticky offset, px
    const rect = box.getBoundingClientRect();
    const range = Math.max(1, rect.height - el.offsetHeight);
    const s = clamp((top - rect.top) / range);
    const seg = Math.min(n - 1, Math.floor(s * n));
    const local = clamp(s * n - seg);
    const travel =
      seg < n - 1 ? smoothstep(clamp((local - HOLD) / (1 - HOLD))) : 0;
    el.style.setProperty("--fill", ((seg + travel) / (n - 1)).toFixed(4));
    el.style.setProperty(
      "--local",
      (seg < n - 1 ? clamp(local / HOLD) : local).toFixed(4),
    );
    el.style.setProperty("--scrolled", s.toFixed(4));
    if (seg !== activeRef.current) {
      setDirection(seg > activeRef.current ? 1 : -1);
      activeRef.current = seg;
      setActive(seg);
    }
  });

  /** Page position where a step is shown (start of its hold). */
  const stepY = (i: number) => {
    const box = scroller.current;
    const el = root.current;
    if (!box || !el) return 0;
    const top =
      parseFloat(getComputedStyle(el).top) || 96; // resolved sticky offset, px
    const rect = box.getBoundingClientRect();
    const range = rect.height - el.offsetHeight;
    const start = rect.top + window.scrollY - top;
    return start + range * ((i + 0.08) / METHOD_STEPS.length);
  };
  useEffect(() => {
    if (!playing) return;
    const t = window.setTimeout(
      () => setActive((a) => (a + 1) % METHOD_STEPS.length),
      STEP_MS,
    );
    return () => window.clearTimeout(t);
  }, [playing, active]);

  const choose = (i: number, focus = false) => {
    if (focus) tabs.current[i]?.focus({ preventScroll: true });
    if (scrollMode) {
      scrollToY(stepY(i), { immediate: reduced });
      return;
    }
    setManual(true);
    setDirection(i > active ? 1 : -1);
    setActive(i);
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
      ref={scroller}
      className={styles.scroller}
      data-mode={scrollMode ? "scroll" : "auto"}
      style={
        {
          "--scroll-steps": METHOD_STEPS.length,
          "--scroll-per-step": SCROLL_PER_STEP,
        } as React.CSSProperties
      }
    >
      <div
        ref={root}
        className={`${styles.method} ${glass.glass}`}
        data-started={started}
        data-glass={started ? "in" : "out"}
        data-playing={playing}
        data-mode={scrollMode ? "scroll" : "auto"}
        style={
          {
            "--active": active,
            "--steps": METHOD_STEPS.length,
            "--step-ms": `${STEP_MS}ms`,
          } as React.CSSProperties
        }
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
          <p className={styles.text}>
            De l’idée à l’impact, nous vous accompagnons à chaque étape. Vous
            savez toujours où en est votre projet.
          </p>
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
          <Link
            href={CONTACT_HREF}
            className={styles.cta}
            onClick={contactClick({ source: "method" })}
          >
            Démarrer par un brief
            <ArrowRight size={18} />
          </Link>
        </div>

        <div className={styles.timeline}>
          <div className={styles.track} aria-hidden="true">
            <span className={styles.trackFill} />
          </div>
          <div
            className={styles.tabs}
            role="tablist"
            aria-label="Les étapes de notre méthode"
            onKeyDown={onKey}
          >
            {METHOD_STEPS.map((s, i) => {
              const Icon = STEP_ICONS[s.icon];
              const state =
                i < active ? "done" : i === active ? "active" : "todo";
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
                  <span className={styles.tabIndex}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className={styles.tabTitle}>{s.title}</span>
                  <span className={styles.tabSummary}>{s.summary}</span>
                  <span className={styles.tabProgress} aria-hidden="true" />
                </button>
              );
            })}
          </div>

          <div
            className={styles.panel}
            role="tabpanel"
            id={`${id}-panel`}
            aria-labelledby={`${id}-tab-${active}`}
            aria-live="polite"
          >
            <div
              key={active}
              className={styles.panelInner}
              data-direction={direction}
            >
              <div className={styles.panelMain}>
                <p className={styles.panelStep}>
                  Étape {String(active + 1).padStart(2, "0")}{" "}
                  <span aria-hidden="true">/</span>{" "}
                  {String(METHOD_STEPS.length).padStart(2, "0")}
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
          {scrollMode && (
            <p className={styles.scrollHint} aria-hidden="true">
              <span className={styles.scrollMouse} />
              Continuez à scroller : le processus avance avec vous
            </p>
          )}
        </div>
      </div>
      {scrollMode && <div className={styles.pinSpace} aria-hidden="true" />}
    </div>
  );
}
