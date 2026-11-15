"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight } from "@/components/ui/Icons";
import type { AgentProfile } from "@/lib/team";
import styles from "./MobileAgentFan.module.css";

/*
 * The five flagship agents as a fanned card deck you drag with a finger. Adapted from the 21st.dev
 * « Stacked Card Carousel » (shadcnspace / carousel-07): same geometry (offset → x, rotation, drop, scale,
 * depth, wrap-around), rewritten without Tailwind nor the motion library — pointer events, a small spring in
 * requestAnimationFrame, transforms written straight on the cards (no React render per frame).
 * Any card opens its profile on tap; a drag turns the deck; arrows, dots and focus do the same for keyboards.
 */

const GEOMETRY = { x: 96, y: 18, rotate: 8, scale: 0.075, sensitivity: 170, distance: 110, velocity: 0.45 };

/** Signed distance of a card to the front, wrapped around the deck (−n/2 … n/2). */
function offsetOf(index: number, progress: number, total: number) {
  let d = (index - progress) % total;
  if (d > total / 2) d -= total;
  if (d < -total / 2) d += total;
  return d;
}

/** Card style for an offset — rounded so the server and the browser write the same strings. */
function cardStyle(o: number) {
  const a = Math.abs(o);
  const r = (v: number) => Math.round(v * 100) / 100;
  return {
    transform: `translate3d(${r(o * GEOMETRY.x)}px, ${r(a < 0.05 ? 0 : a * GEOMETRY.y)}px, 0) rotate(${r(a < 0.05 ? 0 : o * GEOMETRY.rotate)}deg) scale(${r(1 - a * GEOMETRY.scale)})`,
    zIndex: String(Math.round(100 - a * 10)),
    opacity: String(r(a > 2.2 ? Math.max(0, 1 - (a - 2.2) * 3) : 1)),
    "--shade": String(r(Math.min(0.42, a * 0.22))),
    "--caption": String(r(Math.max(0, 1 - a * 1.6))),
  };
}

export function MobileAgentFan({
  team,
  label,
  cta,
  prev,
  next,
  onOpen,
}: {
  team: AgentProfile[];
  label: (name: string, role: string) => string;
  cta: string;
  prev: string;
  next: string;
  onOpen: (agent: AgentProfile) => void;
}) {
  const total = team.length;
  const cards = useRef<(HTMLButtonElement | null)[]>([]);
  const progress = useRef(0);
  const target = useRef(0);
  const raf = useRef(0);
  const drag = useRef<{ x: number; start: number; moved: boolean; t: number; lastX: number; v: number } | null>(null);
  const suppressClick = useRef(false);
  const [front, setFront] = useState(0);

  const paint = useCallback(() => {
    cards.current.forEach((el, i) => {
      if (!el) return;
      const s = cardStyle(offsetOf(i, progress.current, total));
      el.style.transform = s.transform;
      el.style.zIndex = s.zIndex;
      el.style.opacity = s.opacity;
      el.style.setProperty("--shade", s["--shade"]);
      el.style.setProperty("--caption", s["--caption"]);
    });
    const f = ((Math.round(progress.current) % total) + total) % total;
    setFront((prevFront) => (prevFront === f ? prevFront : f));
  }, [total]);

  // A light spring toward the target index (critically damped feel, ~0.4 s).
  const run = useCallback(() => {
    cancelAnimationFrame(raf.current);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const step = () => {
      const d = target.current - progress.current;
      if (reduced || Math.abs(d) < 0.002) {
        progress.current = target.current;
        paint();
        return;
      }
      progress.current += d * 0.16;
      paint();
      raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
  }, [paint]);

  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  const goTo = (index: number) => {
    // The shortest way round the deck to that card.
    const base = Math.round(progress.current);
    const delta = offsetOf(index, base, total);
    target.current = base + Math.round(delta);
    run();
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    cancelAnimationFrame(raf.current);
    drag.current = { x: e.clientX, start: progress.current, moved: false, t: e.timeStamp, lastX: e.clientX, v: 0 };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.x;
    if (!d.moved && Math.abs(dx) > 6) {
      d.moved = true;
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    }
    if (!d.moved) return;
    const dt = Math.max(1, e.timeStamp - d.t);
    d.v = (e.clientX - d.lastX) / dt; // px per ms
    d.lastX = e.clientX;
    d.t = e.timeStamp;
    progress.current = d.start - dx / GEOMETRY.sensitivity;
    paint();
  };

  const onPointerUp = (e: React.PointerEvent) => {
    const d = drag.current;
    drag.current = null;
    if (!d || !d.moved) return;
    suppressClick.current = true;
    const dx = e.clientX - d.x;
    const shift = Math.max(-3, Math.min(3, Math.round(-dx / GEOMETRY.distance - d.v * GEOMETRY.velocity * 2)));
    target.current = Math.round(d.start) + shift;
    run();
  };

  return (
    <div className={styles.fan}>
      <div
        className={styles.stage}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <span className={styles.glow} aria-hidden="true" />
        {team.map((agent, i) => {
          const s = cardStyle(offsetOf(i, 0, total));
          return (
            <button
              key={agent.type}
              ref={(el) => {
                cards.current[i] = el;
              }}
              type="button"
              data-agent-card={agent.type}
              className={styles.card}
              style={{
                transform: s.transform,
                zIndex: s.zIndex,
                opacity: s.opacity,
                ...({ "--shade": s["--shade"], "--caption": s["--caption"], "--tint-a": agent.tint[0], "--tint-b": agent.tint[1] } as React.CSSProperties),
              }}
              aria-label={label(agent.name, agent.role)}
              aria-haspopup="dialog"
              onFocus={() => i !== front && goTo(i)}
              onClick={() => {
                if (suppressClick.current) {
                  suppressClick.current = false;
                  return;
                }
                onOpen(agent);
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/images/agents/${agent.type}.webp`} alt="" width={240} height={560} loading="lazy" draggable={false} />
              <span className={styles.shade} aria-hidden="true" />
              <span className={styles.caption} aria-hidden="true">
                <strong>{agent.name}</strong>
                <span>{agent.role}</span>
                <em>
                  {cta}
                  <ArrowRight size={14} />
                </em>
              </span>
            </button>
          );
        })}
      </div>

      <div className={styles.controls}>
        <button type="button" className={styles.arrow} aria-label={prev} onClick={() => goTo((front - 1 + total) % total)}>
          <ChevronLeft size={18} />
        </button>
        <span className={styles.dots} aria-hidden="true">
          {team.map((a, i) => (
            <span key={a.type} data-on={i === front} />
          ))}
        </span>
        <button type="button" className={styles.arrow} aria-label={next} onClick={() => goTo((front + 1) % total)}>
          <ChevronRight size={18} />
        </button>
      </div>
      <p className={styles.blurb} aria-live="polite">
        <strong>{team[front].name}</strong> · {team[front].blurb}
      </p>
    </div>
  );
}
