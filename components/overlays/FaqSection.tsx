"use client";

import { useLocale } from "@/components/i18n/LocaleProvider";
import { siteText } from "@/lib/site";
import styles from "./FaqSection.module.css";
import glass from "./Glass.module.css";
import head from "./SectionHead.module.css";

export const FAQ_ID = "questions";

/**
 * Questions fréquentes — short, quotable answers (the same text feeds the FAQPage structured data and
 * llms.txt). Native <details>: readable without JavaScript, by search engines and by assistants alike.
 */
const TEXTS = {
  fr: { kicker: "Questions fréquentes", title: ["Vos questions,", "nos réponses."], lead: "Ce que l’on nous demande le plus souvent avant un premier échange." },
  en: { kicker: "Frequently asked questions", title: ["Your questions,", "our answers."], lead: "What people ask us most often before a first call." },
};

export function FaqSection() {
  const locale = useLocale();
  const t = TEXTS[locale];
  const FAQ = siteText(locale).faq;
  return (
    <section id={FAQ_ID} className={styles.faq} aria-labelledby="faq-title">
      <div className={styles.frame}>
        <header className={head.head}>
          <p className={head.kicker}>{t.kicker}</p>
          <h2 id="faq-title" className={head.title}>
            <span className={head.line}>{t.title[0]}</span>{" "}
            <span className={`${head.line} ${head.accent}`}>{t.title[1]}</span>
          </h2>
          <p className={head.lead}>{t.lead}</p>
        </header>

        {/* Two independent columns: opening an answer never leaves a hole in the other one. */}
        <div className={`${styles.panel} ${glass.glass}`} data-glass="out">
          {[FAQ.slice(0, Math.ceil(FAQ.length / 2)), FAQ.slice(Math.ceil(FAQ.length / 2))].map((column, c) => (
            <div key={c} className={styles.column}>
              {column.map(({ q, a }, j) => {
                const i = c * Math.ceil(FAQ.length / 2) + j;
                return (
                  <details key={q} className={styles.item} name="faq" open={i === 0}>
                    <summary className={styles.question}>
                      <span className={styles.index} aria-hidden="true">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      {q}
                      <span className={styles.chevron} aria-hidden="true" />
                    </summary>
                    <p className={styles.answer}>{a}</p>
                  </details>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
