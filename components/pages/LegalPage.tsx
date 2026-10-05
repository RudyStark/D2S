import Link from "next/link";
import type { ReactNode } from "react";
import { Header } from "@/components/ui/Header";
import type { Locale } from "@/lib/i18n";
import { LEGAL_UPDATED, legalHrefOf, privacyHrefOf } from "@/lib/legal";
import { homeOf } from "@/lib/navigation";
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

const TEXTS = {
  fr: { updated: "Dernière mise à jour :", toc: "Sommaire", home: "Retour à l’accueil", legal: "Mentions légales", privacy: "Politique de confidentialité", date: LEGAL_UPDATED },
  en: { updated: "Last updated:", toc: "Contents", home: "Back to home", legal: "Legal notice", privacy: "Privacy policy", date: "23 September 2026" },
};

/**
 * Shared layout of the legal pages: readable column, table of contents, last update, and the links
 * between the two pages. Plain, fast, no 3D.
 */
export function LegalPage({
  kicker,
  title,
  intro,
  sections,
  locale = "fr",
}: {
  kicker: string;
  title: string;
  intro: ReactNode;
  sections: LegalSection[];
  locale?: Locale;
}) {
  const t = TEXTS[locale];
  return (
    <>
      <Header />
      <main className={styles.main}>
        <article className={styles.card}>
          <header className={styles.head}>
            <p className={styles.kicker}>{kicker}</p>
            <h1 className={styles.title}>{title}</h1>
            <div className={styles.intro}>{intro}</div>
            <p className={styles.updated}>
              {t.updated} {t.date}
            </p>
          </header>

          <nav className={styles.toc} aria-label={t.toc}>
            <p className={styles.tocTitle}>{t.toc}</p>
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
            <Link href={homeOf(locale)}>{t.home}</Link>
            <Link href={legalHrefOf(locale)}>{t.legal}</Link>
            <Link href={privacyHrefOf(locale)}>{t.privacy}</Link>
          </footer>
        </article>
      </main>
    </>
  );
}
