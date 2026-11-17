/* eslint-disable @next/next/no-img-element -- the official lockup, a tiny static image */
import styles from "./BrainPartner.module.css";

/**
 * « brAin Partner » seal: D2S AIgency is an official partner of the brAin ecosystem. The official lockup (mark + « brAin »
 * wordmark, white on black, the same file as the hub's login badge) is used as supplied, only scaled: the brAin
 * guidelines forbid any change of colour, shape or effect, so it always sits on pure black. Small on purpose: a seal,
 * not a banner. No 3D, no store: usable everywhere (language gate, footers, mobile).
 */
export function BrainPartner({ size = "sm", className = "", label = "Partenaire officiel du réseau brAin" }: { size?: "sm" | "md"; className?: string; label?: string }) {
  return (
    <span className={`${styles.seal} ${styles[size]} ${className}`} role="img" aria-label={label} title={label}>
      <img src="/images/partners/brain-lockup.webp" alt="" width={328} height={84} className={styles.lockup} />
      <span className={styles.divider} aria-hidden="true" />
      <span className={styles.partner} aria-hidden="true">
        Partner
      </span>
    </span>
  );
}
