import { Button } from "@/components/ui/Button";
import { Header } from "@/components/ui/Header";
import { ArrowRight } from "@/components/ui/Icons";
import type { Locale } from "@/lib/i18n";
import { contactHrefOf, homeOf } from "@/lib/navigation";
import styles from "./PlaceholderRoom.module.css";

/** V1 placeholder for rooms of the agency that are not built yet. */
const TEXTS = {
  fr: { home: "Retour à l’accueil", cta: "Parlons de votre projet", note: "Espace en cours d’aménagement" },
  en: { home: "Back to home", cta: "Let’s talk about your project", note: "Room being fitted out" },
};

export function PlaceholderRoom({ kicker, title, text, locale = "fr" }: { kicker: string; title: string; text: string; locale?: Locale }) {
  const t = TEXTS[locale];
  return (
    <>
      <Header />
      <main className={styles.main}>
        <div className={styles.card}>
          <p className={styles.kicker}>{kicker}</p>
          <h1 className={styles.title}>{title}</h1>
          <p className={styles.text}>{text}</p>
          <div className={styles.actions}>
            <Button href={homeOf(locale)} variant="secondary">
              {t.home}
            </Button>
            <Button href={contactHrefOf(locale)} icon={<ArrowRight size={20} />}>
              {t.cta}
            </Button>
          </div>
          <p className={styles.note} aria-hidden="true">
            {t.note}
          </p>
        </div>
      </main>
    </>
  );
}
