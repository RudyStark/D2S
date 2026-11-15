"use client";

import { AgentNode, Check } from "@/components/ui/Icons";
import styles from "./SolutionMocks.module.css";

/** A business application, in miniature: the agent prepares three actions, they get approved one by one. */
export function AppMock({ words }: { words: { window: string; items: string[]; validate: string; done: string } }) {
  return (
    <div className={styles.app}>
      <div className={styles.appBar}>
        <span />
        <span />
        <span />
        <em>{words.window}</em>
      </div>
      <div className={styles.appBody}>
        <div className={styles.appSide}>
          <i />
          <i />
          <i />
          <i />
          <i />
        </div>
        <ul className={styles.appList}>
          {words.items.map((item, i) => (
            <li key={item} style={{ "--i": i } as React.CSSProperties}>
              <span className={styles.appSpark}>
                <AgentNode size={14} />
              </span>
              <span className={styles.appItem}>{item}</span>
              <span className={styles.appBtn}>
                <span className={styles.appValidate}>{words.validate}</span>
                <span className={styles.appDone}>
                  <Check size={12} />
                  {words.done}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/** A command centre, in miniature: a coordinating agent and six department teams, hand-offs and one approval. */
export function CommandMock({ words }: { words: { orchestrator: string; departments: string[]; approval: string; approved: string } }) {
  const cx = 200;
  const cy = 112;
  // Six departments on an ellipse, rotated so that no wire runs straight up or down (the labels stay clear).
  const nodes = words.departments.map((label, i) => {
    const a = (-60 + i * 60) * (Math.PI / 180);
    // Rounded: the server and the browser must render the same numbers (hydration).
    const r = (v: number) => Math.round(v * 100) / 100;
    return { label, x: r(cx + Math.cos(a) * 150), y: r(cy + Math.sin(a) * 80) };
  });
  return (
    <div className={styles.command}>
      <svg viewBox="0 0 400 224" className={styles.commandSvg}>
        <defs>
          <radialGradient id="cmd-core" cx="50%" cy="40%" r="60%">
            <stop offset="0" stopColor="#7fb6ff" />
            <stop offset="1" stopColor="#1570f0" />
          </radialGradient>
        </defs>
        <ellipse cx={cx} cy={cy} rx="150" ry="80" className={styles.orbit} />
        {nodes.map((n, i) => (
          <g key={n.label}>
            <line x1={cx} y1={cy} x2={n.x} y2={n.y} className={styles.wire} />
            <line x1={cx} y1={cy} x2={n.x} y2={n.y} className={styles.pulse} style={{ "--i": i } as React.CSSProperties} pathLength={100} />
          </g>
        ))}
        {/* Hand-off between two departments (logistics → customer care). */}
        <path d={`M ${nodes[2].x} ${nodes[2].y} Q ${cx + 205} ${cy + 52} ${nodes[1].x} ${nodes[1].y}`} className={styles.relay} pathLength={100} />
        <circle cx={cx} cy={cy} r="30" className={styles.coreHalo} />
        <circle cx={cx} cy={cy} r="21" fill="url(#cmd-core)" />
        <rect x={cx - (words.orchestrator.length * 6.4 + 20) / 2} y={cy + 33} width={words.orchestrator.length * 6.4 + 20} height="20" rx="10" className={styles.coreChip} />
        <text x={cx} y={cy + 47} className={styles.coreLabel}>
          {words.orchestrator}
        </text>
        {nodes.map((n, i) => (
          <g key={`n-${n.label}`} className={styles.node} style={{ "--i": i } as React.CSSProperties}>
            <circle cx={n.x} cy={n.y} r="7" />
            <text x={n.x} y={n.y + (n.y < cy - 5 ? -14 : 24)}>{n.label}</text>
          </g>
        ))}
      </svg>
      <p className={styles.approval}>
        <span className={styles.approvalWait}>{words.approval}</span>
        <span className={styles.approvalOk}>
          <Check size={12} />
          {words.approved}
        </span>
      </p>
    </div>
  );
}
