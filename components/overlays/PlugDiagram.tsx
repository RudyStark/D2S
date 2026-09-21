"use client";

import { useEffect, useRef, useState } from "react";
import { AGENTS } from "@/components/experience/agents/agents.config";
import { Calendar, ChatDots, Check, ContactCard, Doc, Globe, Mail } from "@/components/ui/Icons";
import { useInView, useReducedMotion } from "@/hooks/useInView";
import { PLUG_ACTIVITY, PLUG_TOOLS, type ToolIcon } from "@/lib/services";
import styles from "./PlugDiagram.module.css";

const TOOL_ICONS: Record<ToolIcon, typeof Mail> = {
  chat: ChatDots,
  mail: Mail,
  crm: ContactCard,
  calendar: Calendar,
  doc: Doc,
  web: Globe,
};

/** Diagram space (SVG viewBox), HTML nodes are placed in % of it. */
const VW = 600;
const VH = 340;
const AGENT = { x: 300, y: 150, w: 210, h: 104 };
/** Tools: 3 on each side. */
const NODE_POS = [
  { x: 64, y: 58 },
  { x: 64, y: 170 },
  { x: 64, y: 282 },
  { x: 536, y: 58 },
  { x: 536, y: 170 },
  { x: 536, y: 282 },
];
const STEP_MS = 2600;

function connector(i: number) {
  const n = NODE_POS[i];
  const left = n.x < AGENT.x;
  const x0 = left ? n.x + 30 : n.x - 30;
  const x1 = left ? AGENT.x - AGENT.w / 2 : AGENT.x + AGENT.w / 2;
  const y1 = AGENT.y + (n.y - 170) * 0.28;
  const mid = (x0 + x1) / 2;
  return `M${x0} ${n.y} C${mid} ${n.y} ${mid} ${y1} ${x1} ${y1}`;
}

/**
 * "Plug & Play", told by motion: the client's tools sit disconnected around an agent; when the diagram
 * comes into view the switch flips, the connections light up, the agent goes online and starts working —
 * each example task lights the tools it uses. Reduced motion: connected, static.
 */
export function PlugDiagram() {
  const root = useRef<HTMLDivElement>(null);
  const inView = useInView(root, 0.4);
  const reduced = useReducedMotion();
  const [connected, setConnected] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (reduced) {
      setConnected(true);
      return;
    }
    if (!inView || connected) return;
    const id = window.setTimeout(() => setConnected(true), 650);
    return () => window.clearTimeout(id);
  }, [inView, connected, reduced]);

  useEffect(() => {
    if (!connected || !inView || reduced) return;
    const id = window.setInterval(() => setStep((s) => s + 1), STEP_MS);
    return () => window.clearInterval(id);
  }, [connected, inView, reduced]);

  const current = PLUG_ACTIVITY[step % PLUG_ACTIVITY.length];
  const feed = [0, 1, 2].map((k) => ({ key: step - k, item: PLUG_ACTIVITY[(((step - k) % PLUG_ACTIVITY.length) + PLUG_ACTIVITY.length) % PLUG_ACTIVITY.length] }));
  const agent = AGENTS[current.agent];

  return (
    <div ref={root} className={styles.diagram} data-connected={connected} aria-hidden="true">
      <svg className={styles.wires} viewBox={`0 0 ${VW} ${VH}`} preserveAspectRatio="none">
        <defs>
          <linearGradient id="plug-wire" x1="0" x2="1">
            <stop offset="0" stopColor="#14a6e2" />
            <stop offset="1" stopColor="#1570f0" />
          </linearGradient>
        </defs>
        {PLUG_TOOLS.map((tool, i) => {
          const d = connector(i);
          const active = connected && current.tools.includes(tool.id);
          return (
            <g key={tool.id} className={styles.wire} data-active={active} data-side={NODE_POS[i].x < AGENT.x ? "in" : "out"}>
              <path d={d} className={styles.wireBase} />
              <path d={d} className={styles.wireFlow} pathLength={100} />
              <path d={d} className={styles.wirePulse} pathLength={100} />
            </g>
          );
        })}
      </svg>

      <div className={styles.switch} style={{ left: `${(AGENT.x / VW) * 100}%` }}>
        <span className={styles.switchTrack}>
          <span className={styles.switchKnob} />
        </span>
        <span className={styles.switchLabel}>{connected ? "Connecté" : "Connexion…"}</span>
      </div>

      {PLUG_TOOLS.map((tool, i) => {
        const Icon = TOOL_ICONS[tool.icon];
        const active = connected && current.tools.includes(tool.id);
        return (
          <div
            key={tool.id}
            className={styles.tool}
            data-active={active}
            data-side={NODE_POS[i].x < AGENT.x ? "left" : "right"}
            style={{ left: `${(NODE_POS[i].x / VW) * 100}%`, top: `${(NODE_POS[i].y / VH) * 100}%`, "--d": `${i * 80}ms` } as React.CSSProperties}
          >
            <span className={styles.toolIcon}>
              <Icon size={22} />
            </span>
            <span className={styles.toolLabel}>{tool.label}</span>
          </div>
        );
      })}

      <div
        className={styles.agent}
        style={{
          left: `${(AGENT.x / VW) * 100}%`,
          top: `${(AGENT.y / VH) * 100}%`,
          width: `${(AGENT.w / VW) * 100}%`,
          height: `${(AGENT.h / VH) * 100}%`,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- avatar */}
        <img key={current.agent} className={styles.agentAvatar} src={agent.avatar} alt="" width={48} height={48} />
        <span className={styles.agentText}>
          <span className={styles.agentName}>Agent {current.role}</span>
          <span className={styles.agentStatus}>
            <span className={styles.dot} />
            {connected ? "En ligne" : "Hors ligne"}
          </span>
        </span>
        <span className={styles.agentBars}>
          <span />
          <span />
          <span />
        </span>
      </div>

      <ul className={styles.feed} style={{ left: `${(AGENT.x / VW) * 100}%` }}>
        {connected &&
          feed.map(({ key, item }, k) => (
            <li key={key} className={styles.feedItem} data-rank={k}>
              <Check size={14} />
              <span>{item.text}</span>
            </li>
          ))}
      </ul>
    </div>
  );
}
