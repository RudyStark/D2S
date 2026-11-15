"use client";

import { useRef } from "react";
import { AgentNode, ArrowRight, Layers, Plug } from "@/components/ui/Icons";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { useInView } from "@/hooks/useInView";
import { scrollToElement } from "@/lib/experience/director";
import { offersOf, type OfferIcon } from "@/lib/offers";
import styles from "./OffersOverview.module.css";

const ICONS: Record<OfferIcon, typeof Plug> = { plug: Plug, agent: AgentNode, layers: Layers };

/**
 * The offer at a glance, right under the services heading: three ways to work with D2S AIgency, from the
 * ready-made agent to the custom AI software. Each card scrolls to the part of the page that details it.
 */
export function OffersOverview() {
  const locale = useLocale();
  const o = offersOf(locale);
  const list = useRef<HTMLDivElement>(null);
  const inView = useInView(list, 0.2);

  return (
    <div ref={list} className={styles.overview} data-in={inView}>
      <p className={styles.label}>
        <span className={styles.labelLine} aria-hidden="true" />
        {o.overview.label}
      </p>
      <ol className={styles.cards}>
        {o.cards.map((card, i) => {
          const Icon = ICONS[card.icon];
          return (
            <li key={card.id} className={styles.card} data-tone={card.id === "solution" ? "deep" : "light"} style={{ "--i": i } as React.CSSProperties}>
              <span className={styles.numeral} aria-hidden="true">
                {card.index}
              </span>
              <span className={styles.icon} aria-hidden="true">
                <Icon size={22} />
              </span>
              <p className={styles.tag}>{card.tag}</p>
              <h3 className={styles.title}>{card.title}</h3>
              <p className={styles.text}>{card.text}</p>
              <p className={styles.fit}>{card.fit}</p>
              <button
                type="button"
                className={styles.more}
                aria-label={`${o.overview.more} : ${card.title}`}
                onClick={() => {
                  const target = document.getElementById(card.anchor);
                  if (target) scrollToElement(target);
                }}
              >
                {o.overview.more}
                <ArrowRight size={16} />
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
