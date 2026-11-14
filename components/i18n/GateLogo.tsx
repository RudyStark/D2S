import { useId } from "react";
import { LOGO } from "@/lib/generated/logo";
import styles from "./LanguageGate.module.css";

/*
 * The official D2S AIgency logo (same paths and gradients as components/ui/Logo.tsx, from
 * design/brand/logo-vector.svg), drawn over the gate picture where the picture's own logo was erased: always
 * sharp, whatever the screen. It keeps its two living effects (halo that breathes 4.5 s, light that sweeps the
 * AI 5.5 s) and adds a sheen that crosses the whole logo when it appears, then from time to time.
 */
const { viewBox, aiBox } = LOGO;

export function GateLogo() {
  const uid = useId().replace(/:/g, "");
  const defs = LOGO.defs.replace(/id="([\w-]+)"/g, `id="${uid}-$1"`);
  const url = (fill: string | undefined) => fill?.replace(/url\(#([\w-]+)\)/, `url(#${uid}-$1)`);
  const paint = (p: { d: string; fill?: string; stroke?: string; strokeOpacity?: string; strokeWidth?: string }) => ({
    fill: url(p.fill),
    fillRule: "evenodd" as const,
    stroke: p.stroke,
    strokeOpacity: p.strokeOpacity,
    strokeWidth: p.strokeWidth,
    strokeLinejoin: "round" as const,
  });

  return (
    <svg
      className={styles.logo}
      viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
      aria-hidden="true"
      focusable="false"
    >
      <defs dangerouslySetInnerHTML={{ __html: defs }} />
      <defs>
        <linearGradient id={`${uid}-sweep`} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset=".5" stopColor="#fff" stopOpacity=".85" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        {/* The light that runs along the outline of D2S: a bright stroke, seen only through a moving band. */}
        <linearGradient id={`${uid}-band`} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#000" />
          <stop offset="0.35" stopColor="#fff" stopOpacity="0.35" />
          <stop offset="0.5" stopColor="#fff" />
          <stop offset="0.65" stopColor="#fff" stopOpacity="0.35" />
          <stop offset="1" stopColor="#000" />
        </linearGradient>
        <linearGradient id={`${uid}-rimInk`} x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#e6f6ff" />
          <stop offset="0.5" stopColor="#7cc8ff" />
          <stop offset="1" stopColor="#2f86ff" />
        </linearGradient>
        <filter id={`${uid}-bloom`} x="-20%" y="-40%" width="140%" height="180%">
          <feGaussianBlur stdDeviation="16" />
        </filter>
        <filter id={`${uid}-soft`} x="-20%" y="-40%" width="140%" height="180%">
          <feGaussianBlur stdDeviation="4" />
        </filter>
        <mask id={`${uid}-rim`} maskUnits="userSpaceOnUse" x={viewBox.x - 40} y={viewBox.y - 40} width={viewBox.width + 80} height={viewBox.height + 80}>
          <rect
            className={styles.rimBand}
            x={viewBox.x - viewBox.width * 0.45}
            y={viewBox.y - 40}
            width={viewBox.width * 0.45}
            height={viewBox.height + 80}
            fill={`url(#${uid}-band)`}
            style={{ "--rim": `${viewBox.width * 1.45}px` } as React.CSSProperties}
          />
        </mask>
        <clipPath id={`${uid}-ai`}>
          <path d={LOGO.ai.d} />
        </clipPath>
        <clipPath id={`${uid}-all`}>
          <path d={LOGO.mark.d} />
          <path d={LOGO.ai.d} />
          <path d={LOGO.wordmark.d} />
        </clipPath>
      </defs>

      <g className={styles.logoMark}>
        <path d={LOGO.mark.d} {...paint(LOGO.mark)} />
      </g>
      {/* Electric rim light on D2S (bloom + sharp edge), revealed by the band that sweeps across. */}
      <g className={styles.rim} mask={`url(#${uid}-rim)`} fill="none" strokeLinejoin="round">
        <path d={LOGO.mark.d} stroke="#2f8cff" strokeWidth="34" filter={`url(#${uid}-bloom)`} />
        <path d={LOGO.mark.d} stroke="#9fd8ff" strokeWidth="14" filter={`url(#${uid}-soft)`} />
        <path d={LOGO.mark.d} stroke={`url(#${uid}-rimInk)`} strokeWidth="7" />
      </g>
      <g className={styles.logoAi}>
        <path d={LOGO.ai.d} {...paint(LOGO.ai)} />
        <g clipPath={`url(#${uid}-ai)`}>
          <rect
            className={styles.logoAiSweep}
            x={aiBox.x - aiBox.width * 0.4}
            y={aiBox.y - 10}
            width={aiBox.width * 0.4}
            height={aiBox.height + 20}
            fill={`url(#${uid}-sweep)`}
            style={{ "--sweep": `${aiBox.width * 1.5}px` } as React.CSSProperties}
          />
        </g>
      </g>
      <path d={LOGO.wordmark.d} {...paint(LOGO.wordmark)} />

      <g clipPath={`url(#${uid}-all)`}>
        <rect
          className={styles.logoSheen}
          x={viewBox.x - 260}
          y={viewBox.y - 40}
          width={220}
          height={viewBox.height + 80}
          fill={`url(#${uid}-sweep)`}
          style={{ "--sheen": `${viewBox.width + 520}px` } as React.CSSProperties}
        />
      </g>
    </svg>
  );
}
