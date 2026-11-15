"use client";

import { ArrowRight, Check, ChevronDown } from "@/components/ui/Icons";
import { AppMock, CommandMock } from "@/components/offers/SolutionMocks";
import { offersOf } from "@/lib/offers";
import type { MobileContactIntent } from "./mobile-navigation";
import styles from "./MobileCustom.module.css";

/**
 * « Sur mesure » on mobile (added on the client's request, 14/11): the custom AI agent and the custom AI
 * solutions, compact. Same texts as the desktop section (lib/offers). No 3D, no director: mobile-only deps.
 */
export function MobileCustom({ locale, onContact }: { locale: "fr" | "en"; onContact: (intent: MobileContactIntent) => void }) {
  const o = offersOf(locale);
  const includes = locale === "en" ? "What it includes" : "Ce qui est inclus";
  const howTitle = locale === "en" ? "How we build it" : "Comment nous le construisons";

  return (
    <>
      <ol className={styles.overview} data-reveal>
        {o.cards.map((c) => (
          <li key={c.id} data-tone={c.id === "solution" ? "deep" : "light"}>
            <span className={styles.ovIndex}>{c.index}</span>
            <span>
              <strong>{c.title}</strong>
              {c.fit}
            </span>
          </li>
        ))}
      </ol>

      <article className={styles.card} data-reveal aria-labelledby="mobile-custom-agent">
        <p className={styles.tag}>
          {o.agent.index} · {o.agent.tag}
        </p>
        <h3 id="mobile-custom-agent">{o.agent.title}</h3>
        <p className={styles.text}>{o.agent.text}</p>
        <ul className={styles.points}>
          {o.agent.points.map((p) => (
            <li key={p.title}>
              <Check size={16} />
              <span>
                <strong>{p.title}</strong>
                {p.text}
              </span>
            </li>
          ))}
        </ul>
        <details className={styles.more}>
          <summary>
            {howTitle}
            <ChevronDown size={18} />
          </summary>
          <ol className={styles.steps}>
            {o.agent.steps.map((s, i) => (
              <li key={s.title}>
                <span>{String(i + 1).padStart(2, "0")}</span>
                <span>
                  <strong>{s.title}</strong>
                  {s.text}
                </span>
              </li>
            ))}
          </ol>
        </details>
      </article>

      <article id="solutions-ia" className={styles.card} data-reveal aria-labelledby="mobile-custom-solutions">
        <p className={styles.tag}>
          {o.solutions.index} · {o.solutions.tag}
        </p>
        <h3 id="mobile-custom-solutions">{o.solutions.title}</h3>
        <p className={styles.text}>{o.solutions.text}</p>
        {o.solutions.formats.map((f) => (
          <section key={f.id} className={styles.format} data-tone={f.id === "command" ? "deep" : "light"} aria-labelledby={`mobile-format-${f.id}`}>
            <div className={styles.stage} aria-hidden="true">
              {f.id === "command" ? <CommandMock words={o.solutions.command} /> : <AppMock words={o.solutions.app} />}
            </div>
            <p className={styles.formatTag}>{f.tag}</p>
            <h4 id={`mobile-format-${f.id}`}>{f.title}</h4>
            <p className={styles.audience}>{f.audience}</p>
            <p className={styles.formatText}>{f.text}</p>
            <details className={styles.more}>
              <summary>
                {includes}
                <ChevronDown size={18} />
              </summary>
              <ul className={styles.list}>
                {f.points.map((p) => (
                  <li key={p}>
                    <Check size={14} />
                    {p}
                  </li>
                ))}
              </ul>
            </details>
          </section>
        ))}
        <button type="button" className={styles.cta} onClick={() => onContact({ source: "mobile-custom-solution", need: "custom" })}>
          {o.solutions.cta}
          <ArrowRight size={18} />
        </button>
      </article>
    </>
  );
}
