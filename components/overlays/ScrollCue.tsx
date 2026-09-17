import { ChevronDown } from "@/components/ui/Icons";
import styles from "./ScrollCue.module.css";

export function ScrollCue({ lines }: { lines: [string, string] }) {
  return (
    <div className={styles.cue}>
      <span className={styles.mouse} aria-hidden="true">
        <span className={styles.wheel} />
      </span>
      <p className={styles.text}>
        {lines[0]}
        <br />
        {lines[1]}
      </p>
      <ChevronDown size={16} className={styles.chevron} />
    </div>
  );
}
