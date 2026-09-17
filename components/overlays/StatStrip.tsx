import styles from "./StatStrip.module.css";

/** Key figures — placeholder values from the brief, to be confirmed before launch. */
export const STATS = [
  { value: "+250", label: "Projets livrés" },
  { value: "98%", label: "Clients satisfaits" },
  { value: "-70%", label: "de temps sur les tâches" },
];

export function StatStrip({ className, variant = "plain" }: { className?: string; variant?: "plain" | "card" }) {
  return (
    <dl className={[styles.stats, styles[variant], className].filter(Boolean).join(" ")}>
      {STATS.map((s) => (
        <div key={s.label} className={styles.item}>
          <dt className={styles.label}>{s.label}</dt>
          <dd className={styles.value}>{s.value}</dd>
        </div>
      ))}
    </dl>
  );
}
