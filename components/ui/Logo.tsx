"use client";

import Link from "next/link";
import { useId } from "react";
import { LOGO } from "@/lib/generated/logo";
import styles from "./Logo.module.css";

/*
 * D2S AIgency logo, drawn inline from the brand's own vector file (design/brand/logo-vector.svg, mirrored
 * into lib/generated/logo.ts by scripts/build-logo.mjs) so the "AI" can live: the brand gradient, a light
 * that sweeps across the glyph and a soft glow. The same file feeds the site loader and the 3D signage.
 * Gradient ids are namespaced per instance — the logo appears more than once on the page.
 */
const { viewBox, aiBox } = LOGO;

export function Logo({ width = 116, className, animated = true }: { width?: number; className?: string; animated?: boolean }) {
  const height = Math.round((width * viewBox.height) / viewBox.width);
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
    <Link href="/" className={className} aria-label="D2S AIgency — accueil">
      <svg
        className={styles.logo}
        viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
        width={width}
        height={height}
        aria-hidden="true"
        data-animated={animated}
      >
        <defs dangerouslySetInnerHTML={{ __html: defs }} />
        <defs>
          <linearGradient id={`${uid}-sweep`} x1="0" x2="1" y1="0" y2="0">
            <stop offset="0" stopColor="#fff" stopOpacity="0" />
            <stop offset=".5" stopColor="#fff" stopOpacity=".8" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
          <clipPath id={`${uid}-clip`}>
            <path d={LOGO.ai.d} />
          </clipPath>
        </defs>

        <path d={LOGO.mark.d} {...paint(LOGO.mark)} />

        <g className={styles.ai}>
          <path d={LOGO.ai.d} {...paint(LOGO.ai)} />
          <g clipPath={`url(#${uid}-clip)`}>
            <rect
              className={styles.sweep}
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
      </svg>
    </Link>
  );
}
