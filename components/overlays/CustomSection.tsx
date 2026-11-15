"use client";

import Link from "next/link";
import { useRef } from "react";
import { AgentNode, ArrowRight, Check, Layers } from "@/components/ui/Icons";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { useInView } from "@/hooks/useInView";
import { contactClick } from "@/lib/contact";
import { contactHrefOf } from "@/lib/navigation";
import { CUSTOM_ID, offersOf, SOLUTIONS_ID } from "@/lib/offers";
import { AppMock, CommandMock } from "@/components/offers/SolutionMocks";
import { MethodProcess } from "./MethodProcess";
import glass from "./Glass.module.css";
import head from "./SectionHead.module.css";
import styles from "./CustomSection.module.css";

/**
 * « Sur mesure »: what goes beyond the ready-made agents. 02 the custom AI agent (built around one process),
 * 03 custom AI solutions (a business application for one trade, a command centre for large groups), then
 * the method, which applies to every offer. Illustrations are drawn in CSS / SVG, no product is named.
 */
export function CustomSection() {
  const locale = useLocale();
  const o = offersOf(locale);
  const agentRef = useRef<HTMLElement>(null);
  const solRef = useRef<HTMLElement>(null);
  const agentIn = useInView(agentRef, 0.2);
  const solIn = useInView(solRef, 0.15);

  return (
    <section id={CUSTOM_ID} className={styles.custom} aria-labelledby="custom-title">
      <div className={styles.frame}>
        <header className={head.head}>
          <p className={head.kicker}>{o.intro.kicker}</p>
          <h2 id="custom-title" className={head.title}>
            <span className={head.line}>{o.intro.title[0]}</span>{" "}
            <span className={`${head.line} ${head.accent}`}>{o.intro.title[1]}</span>
          </h2>
          <p className={head.lead}>{o.intro.lead}</p>
        </header>

        {/* 02 — Custom AI agent */}
        <article ref={agentRef} className={`${styles.agent} ${glass.glass}`} data-in={agentIn} data-glass={agentIn ? "in" : "out"} aria-labelledby="custom-agent-title">
          <div className={styles.agentCopy}>
            <p className={styles.meta}>
              <span className={styles.index} aria-hidden="true">
                {o.agent.index}
              </span>
              <span className={styles.tag}>
                <AgentNode size={14} />
                {o.agent.tag}
              </span>
            </p>
            <h3 id="custom-agent-title" className={styles.blockTitle}>
              {o.agent.title}
            </h3>
            <p className={styles.blockText}>{o.agent.text}</p>
            <ul className={styles.points}>
              {o.agent.points.map((p) => (
                <li key={p.title}>
                  <span className={styles.pointIcon} aria-hidden="true">
                    <Check size={14} />
                  </span>
                  <span>
                    <strong>{p.title}</strong>
                    <span className={styles.pointText}>{p.text}</span>
                  </span>
                </li>
              ))}
            </ul>
            <Link href={contactHrefOf(locale)} className={styles.primary} onClick={contactClick({ source: "custom-agent", need: "custom" })}>
              {o.agent.cta}
              <ArrowRight size={18} />
            </Link>
          </div>

          <figure className={styles.flow} aria-label={o.agent.flow.title}>
            <figcaption className={styles.flowTitle}>
              <span className={styles.live} aria-hidden="true" />
              {o.agent.flow.title}
            </figcaption>
            <ol className={styles.flowList}>
              {o.agent.flow.nodes.map((n, i) => (
                <li key={n} className={styles.flowNode} data-kind={i === 2 ? "warn" : i === 3 ? "human" : i === 4 ? "done" : "step"} style={{ "--i": i } as React.CSSProperties}>
                  <span className={styles.flowDot} aria-hidden="true" />
                  <span className={styles.flowLabel}>{n}</span>
                </li>
              ))}
            </ol>
            <p className={styles.flowNote}>{o.agent.flow.caption}</p>
          </figure>

          <ol className={styles.steps}>
            {o.agent.steps.map((s, i) => (
              <li key={s.title}>
                <span className={styles.stepNum} aria-hidden="true">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span>
                  <strong>{s.title}</strong>
                  <span className={styles.stepText}>{s.text}</span>
                </span>
              </li>
            ))}
          </ol>
        </article>

        {/* 03 — Custom AI solutions */}
        <article ref={solRef} id={SOLUTIONS_ID} className={styles.solutions} data-in={solIn} aria-labelledby="custom-solutions-title">
          <header className={styles.solHead}>
            <p className={styles.meta}>
              <span className={styles.index} aria-hidden="true">
                {o.solutions.index}
              </span>
              <span className={styles.tag}>
                <Layers size={14} />
                {o.solutions.tag}
              </span>
            </p>
            <h3 id="custom-solutions-title" className={styles.blockTitle}>
              {o.solutions.title}
            </h3>
            <p className={styles.blockText}>{o.solutions.text}</p>
          </header>

          <div className={styles.formats}>
            {o.solutions.formats.map((f, i) => (
              <section key={f.id} className={styles.format} data-tone={f.id === "command" ? "deep" : "light"} style={{ "--i": i } as React.CSSProperties} aria-labelledby={`format-${f.id}`}>
                <div className={styles.stage} aria-hidden="true">
                  {f.id === "app" ? <AppMock words={o.solutions.app} /> : <CommandMock words={o.solutions.command} />}
                </div>
                <div className={styles.formatBody}>
                  <p className={styles.formatTag}>{f.tag}</p>
                  <h4 id={`format-${f.id}`} className={styles.formatTitle}>
                    {f.title}
                  </h4>
                  <p className={styles.formatAudience}>{f.audience}</p>
                  <p className={styles.formatText}>{f.text}</p>
                  <ul className={styles.formatPoints}>
                    {f.points.map((p) => (
                      <li key={p}>
                        <Check size={14} />
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
              </section>
            ))}
          </div>

          <div className={styles.solFoot}>
            <Link href={contactHrefOf(locale)} className={styles.primary} onClick={contactClick({ source: "custom-solution", need: "custom" })}>
              {o.solutions.cta}
              <ArrowRight size={18} />
            </Link>
          </div>
        </article>

        <div className={styles.methodWrap}>
          <MethodProcess />
        </div>
      </div>
    </section>
  );
}
