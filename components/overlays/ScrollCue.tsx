import { ChevronDown } from "@/components/ui/Icons";
import styles from "./ScrollCue.module.css";

/** Ring with mouse + two spaced lines + chevron (01-home-final.png, bottom centre). */
export function ScrollCue({ lines }: { lines: [string, string] }) {
  return (
    <div className={styles.cue}>
      <span className={styles.ring} aria-hidden="true">
        <span className={styles.mouse}>
          <span className={styles.wheel} />
        </span>
        <svg className={styles.smile} viewBox="0 0 14 7" fill="none">
          <path d="M1 1.2c1.6 2.9 3.6 4.3 6 4.3s4.4-1.4 6-4.3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      </span>
      <p className={styles.text}>
        {lines[0]}
        <br />
        {lines[1]}
      </p>
      <ChevronDown className={styles.chevron} />
    </div>
  );
}
