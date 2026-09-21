import Link from "next/link";
import type { ReactNode } from "react";
import { Header } from "@/components/ui/Header";
import { LEGAL_HREF, LEGAL_UPDATED, PRIVACY_HREF } from "@/lib/legal";
import styles from "./LegalPage.module.css";

export interface LegalSection {
  id: string;
  title: string;
  body: ReactNode;
}

/** A missing company detail: shown, never invented. */
export function ToFill({ value, label }: { value: string | null; label: string }) {
  if (value) return <>{value}</>;
  return <mark className={styles.toFill}>{label} · à compléter</mark>;
}

/**
 * Shared layout of the legal pages: readable column, table of contents, last update, and the links
 * between the two pages. Plain, fast, no 3D.
 */
export function LegalPage({ kicker, title, intro, sections }: { kicker: string; title: string; intro: ReactNode; sections: LegalSection[] }) {
  return (
    <>
      <Header />
      <main className={styles.main}>
        <article className={styles.card}>
          <header className={styles.head}>
            <p className={styles.kicker}>{kicker}</p>
            <h1 className={styles.title}>{title}</h1>
            <div className={styles.intro}>{intro}</div>
            <p className={styles.updated}>Dernière mise à jour : {LEGAL_UPDATED}</p>
          </header>

          <nav className={styles.toc} aria-label="Sommaire">
            <p className={styles.tocTitle}>Sommaire</p>
            <ol>
              {sections.map((s) => (
                <li key={s.id}>
                  <a href={`#${s.id}`}>{s.title}</a>
                </li>
              ))}
            </ol>
          </nav>

          {sections.map((s, i) => (
            <section key={s.id} id={s.id} className={styles.section} aria-labelledby={`${s.id}-title`}>
              <h2 id={`${s.id}-title`} className={styles.sectionTitle}>
                <span aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
                {s.title}
              </h2>
              <div className={styles.body}>{s.body}</div>
            </section>
          ))}

          <footer className={styles.footer}>
            <Link href="/">Retour à l’accueil</Link>
            <Link href={LEGAL_HREF}>Mentions légales</Link>
            <Link href={PRIVACY_HREF}>Politique de confidentialité</Link>
          </footer>
        </article>
      </main>
    </>
  );
}
