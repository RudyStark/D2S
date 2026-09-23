"use client";

import { useEffect, useRef, useState } from "react";
import { useFrameUpdate } from "@/hooks/useFrameUpdate";
import { TEAM, type AgentProfile } from "@/lib/team";
import styles from "./AgentHoverLabel.module.css";

/*
 * Hovering an agent of the 3D world (façade, lobby) shows its name and role above its head.
 * The hit test uses the silhouettes AgentSlot publishes (frame.agents): no WebGL raycasting. The label only
 * shows when the pointer is really over the 3D background (not over a panel, a button or the sections),
 * for mice only (touch has no hover). Decorative: the same information is in the "Nos agents IA" section.
 */

/** Agents smaller than this share of the screen height (the lobby seen through the doors) get no label. */
const MIN_HEIGHT = 0.17;
/** Elements that are the 3D background itself (every overlay above it lets the pointer through). */
/** Height kept free for the fixed header above the label. */
const HEADER_CLEARANCE = 88;
const BACKGROUND = new Set(["HTML", "BODY", "MAIN", "CANVAS"]);

const byType = new Map(TEAM.map((agent) => [agent.type as string, agent]));

function overBackground(x: number, y: number) {
  const el = document.elementFromPoint(x, y);
  return !!el && (BACKGROUND.has(el.tagName) || el.id === "sequence-track" || !!el.closest("[data-experience-stage]"));
}

export function AgentHoverLabel() {
  const label = useRef<HTMLDivElement>(null);
  const pointer = useRef({ x: 0, y: 0, over: false });
  const hovered = useRef<string | null>(null);
  const [profile, setProfile] = useState<AgentProfile | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    const move = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || !fine.matches) return;
      pointer.current = { x: e.clientX, y: e.clientY, over: overBackground(e.clientX, e.clientY) };
    };
    // Scrolling moves the world (and the sections) under a still pointer.
    const scroll = () => {
      const p = pointer.current;
      if (p.x || p.y) p.over = overBackground(p.x, p.y);
    };
    const leave = () => {
      pointer.current.over = false;
    };
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("scroll", scroll, { passive: true });
    window.addEventListener("blur", leave);
    document.documentElement.addEventListener("pointerleave", leave);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("scroll", scroll);
      window.removeEventListener("blur", leave);
      document.documentElement.removeEventListener("pointerleave", leave);
    };
  }, []);

  useFrameUpdate((f) => {
    const p = pointer.current;
    let hit: string | null = null;
    let nearest = 0;
    const minHeight = MIN_HEIGHT * window.innerHeight;
    if (p.over && f.services < 0.05) {
      for (const type in f.agents) {
        const a = f.agents[type];
        const height = a.bottom - a.top;
        if (!a.visible || height < minHeight || height <= nearest) continue;
        if (Math.abs(p.x - a.x) < a.width / 2 && p.y > a.top && p.y < a.bottom) {
          hit = type;
          nearest = height;
        }
      }
    }
    if (hit !== hovered.current) {
      hovered.current = hit;
      setVisible(!!hit);
      if (hit) setProfile(byType.get(hit) ?? null);
    }
    // Follows the head while shown (the agents turn and breathe, the camera moves with the scroll); on the
    // way out it stays where it was and fades.
    const a = hit ? f.agents[hit] : undefined;
    const el = label.current;
    if (!a || !el) return;
    // Kept inside the screen (agents stand near the edges in the lobby); the tail still points at the head.
    // Read every frame (before any write): the card changes width with the agent, a frame after the hit.
    const card = el.firstElementChild as HTMLElement | null;
    const half = (card?.offsetWidth ?? 0) / 2;
    const x = half ? Math.min(Math.max(a.x, half + 12), window.innerWidth - half - 12) : a.x;
    const tail = half ? Math.min(Math.max(a.x - x, -half + 18), half - 18) : 0;
    // Never under the header when a head is near the top of the screen (close-up during the approach).
    const y = Math.max(a.top - 6, (card?.offsetHeight ?? 0) + HEADER_CLEARANCE);
    el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
    el.style.setProperty("--tail", `${tail.toFixed(1)}px`);
  });

  return (
    <div ref={label} className={styles.label} data-agent-label data-visible={visible && !!profile} aria-hidden="true">
      {profile && (
        <div className={styles.card}>
          <span className={styles.name}>
            <span className={styles.dot} />
            {profile.name}
          </span>
          <span className={styles.role}>{profile.role}</span>
        </div>
      )}
    </div>
  );
}
