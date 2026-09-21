"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { ArrowRight, Bolt, CodeOff, Plug, Sparkle, TrendUp } from "@/components/ui/Icons";
import { useFrameUpdate } from "@/hooks/useFrameUpdate";
import { useInView } from "@/hooks/useInView";
import { scrollToElement } from "@/lib/experience/director";
import { FOCUS_PULL, focusPullCurve } from "@/lib/experience/focusPull";
import { frame, useExperience } from "@/lib/experience/store";
import { clamp, smootherstep } from "@/lib/math";
import { contactClick } from "@/lib/contact";
import { CONTACT_HREF } from "@/lib/navigation";
import { SERVICES, SERVICES_INTRO, type BenefitIcon } from "@/lib/services";
import { AGENTS_ID } from "./AgentsSection";
import { MethodProcess } from "./MethodProcess";
import { PlugDiagram } from "./PlugDiagram";
import glass from "./Glass.module.css";
import head from "./SectionHead.module.css";
import styles from "./ServicesSection.module.css";

export const SERVICES_ID = "nos-services";

const BENEFIT_ICONS: Record<BenefitIcon, typeof Bolt> = {
  sparkle: Sparkle,
  bolt: Bolt,
  plug: Plug,
  nocode: CodeOff,
  trend: TrendUp,
};

/**
 * Services, reached by scrolling on from the reception. No new 3D: the lobby stays behind, blurred under
 * a frosted veil, and the page content scrolls in over it. Publishes its arrival (frame.services) for the
 * lobby UI fade, the header state and the render freeze.
 */
export function ServicesSection() {
  const section = useRef<HTMLElement>(null);
  const feature = useRef<HTMLDivElement>(null);
  const featureIn = useInView(feature, 0.25);
  const focusPull = useExperience((s) => s.focusPull);

  useFrameUpdate(() => {
    const el = section.current;
    if (!el) return;
    const top = el.getBoundingClientRect().top;
    const k = clamp(1 - top / window.innerHeight);
    frame.services = k;
    el.style.setProperty("--services", smootherstep(clamp(k / 0.85)).toFixed(3));
    el.style.setProperty("--veil-blur", `${(focusPullCurve(k).rack * FOCUS_PULL.veilBlur).toFixed(2)}px`);
  });

  // Deep link (/#nos-services, or /nos-services redirected here): jump once the agency has opened.
  useEffect(() => {
    if (window.location.hash !== `#${SERVICES_ID}`) return;
    const html = document.documentElement;
    const go = () => section.current && scrollToElement(section.current, { immediate: true });
    if (html.dataset.siteLoaded) {
      go();
      return;
    }
    const mo = new MutationObserver(() => {
      if (!html.dataset.siteLoaded) return;
      mo.disconnect();
      requestAnimationFrame(go);
    });
    mo.observe(html, { attributes: true, attributeFilter: ["data-site-loaded"] });
    return () => mo.disconnect();
  }, []);

  const service = SERVICES[0];

  return (
    <section ref={section} id={SERVICES_ID} className={styles.services} aria-labelledby="services-title">
      <div className={styles.backdrop} data-focus-pull={focusPull} aria-hidden="true" />

      <div className={styles.frame}>
        <header className={head.head}>
          <p className={head.kicker}>{SERVICES_INTRO.kicker}</p>
          <h2 id="services-title" className={head.title}>
            <span className={head.line}>{SERVICES_INTRO.title[0]}</span>
            <span className={`${head.line} ${head.accent}`}>{SERVICES_INTRO.title[1]}</span>
          </h2>
          <p className={head.lead}>{SERVICES_INTRO.lead}</p>
        </header>

        <article
          ref={feature}
          className={`${styles.feature} ${glass.glass}`}
          data-in={featureIn}
          data-glass={featureIn ? "in" : "out"}
          aria-labelledby="service-01-title"
        >
          <div className={styles.featureCopy}>
            <p className={styles.meta}>
              <span className={styles.index} aria-hidden="true">
                {service.index}
              </span>
              <span className={styles.tag}>
                <Plug size={14} />
                {service.tag}
              </span>
            </p>
            <h3 id="service-01-title" className={styles.featureTitle}>
              {service.title}
            </h3>
            <p className={styles.featureText}>{service.text}</p>
            <p className={styles.functionsLabel}>Pour vos fonctions clés</p>
            <ul className={styles.functions}>
              {service.functions.map((f) => (
                <li key={f}>{f}</li>
              ))}
              <li className={styles.functionsMore}>et bien d’autres…</li>
            </ul>
            <div className={styles.actions}>
              <Link href={CONTACT_HREF} className={styles.primary} onClick={contactClick({ source: "services" })}>
                Parlons de votre projet
                <ArrowRight size={18} />
              </Link>
              <button
                type="button"
                className={styles.secondary}
                onClick={() => {
                  const target = document.getElementById(AGENTS_ID);
                  if (target) scrollToElement(target);
                }}
              >
                Voir nos agents
              </button>
            </div>
          </div>

          <div className={styles.featureVisual}>
            <PlugDiagram />
          </div>

          <ul className={styles.benefits}>
            {service.benefits.map((b, i) => {
              const Icon = BENEFIT_ICONS[b.icon];
              return (
                <li key={b.title} className={styles.benefit} style={{ "--i": i } as React.CSSProperties}>
                  <span className={styles.benefitIcon} aria-hidden="true">
                    <Icon size={20} />
                  </span>
                  <span className={styles.benefitTitle}>{b.title}</span>
                  <span className={styles.benefitText}>{b.text}</span>
                </li>
              );
            })}
          </ul>
        </article>

        <div className={styles.methodWrap}>
          <MethodProcess />
        </div>
      </div>
    </section>
  );
}
