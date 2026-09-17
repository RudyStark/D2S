import { Button } from "@/components/ui/Button";
import { Header } from "@/components/ui/Header";
import { ArrowRight } from "@/components/ui/Icons";
import { CONTACT_HREF } from "@/lib/navigation";
import styles from "./PlaceholderRoom.module.css";

/** V1 placeholder for rooms of the agency that are not built yet. */
export function PlaceholderRoom({ kicker, title, text }: { kicker: string; title: string; text: string }) {
  return (
    <>
      <Header />
      <main className={styles.main}>
        <div className={styles.card}>
          <p className={styles.kicker}>{kicker}</p>
          <h1 className={styles.title}>{title}</h1>
          <p className={styles.text}>{text}</p>
          <div className={styles.actions}>
            <Button href="/" variant="secondary">
              Retour à l’accueil
            </Button>
            <Button href={CONTACT_HREF} icon={<ArrowRight size={20} />}>
              Parlons de votre projet
            </Button>
          </div>
          <p className={styles.note} aria-hidden="true">
            Espace en cours d’aménagement
          </p>
        </div>
      </main>
    </>
  );
}
