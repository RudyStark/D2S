"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  ArrowRight,
  Bars,
  Calendar,
  Chat,
  ChatDots,
  Check,
  ChevronLeft,
  ContactCard,
  Doc,
  Gear,
  Globe,
  Mail,
  Package,
  People,
  Picture,
  Play,
  PlayBox,
  Receipt,
  Replay,
  Rocket,
  Search,
  Slides,
  Sparkle,
  Target,
  TrendUp,
  Users,
} from "@/components/ui/Icons";
import { useInView, useReducedMotion } from "@/hooks/useInView";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { agentCard } from "@/lib/agent-directory";
import type { Locale } from "@/lib/i18n";
import { valueOf } from "@/lib/value";
import {
  activeQuestions,
  AGENT_TOOLS,
  barFill,
  buildResult,
  CANDIDATES,
  customStepsOf,
  diagnosticIntroOf,
  diagnosticSummary,
  joinIn,
  matchPercent,
  optionsFor,
  rankCandidates,
  resultNeed,
  scoreAnswers,
  withAnswer,
  type Answers,
  type Candidate,
  type DiagnosticResult,
  type OptionIcon,
} from "@/lib/diagnostic";
import { contactClick } from "@/lib/contact";
import { contactHrefOf } from "@/lib/navigation";
import { allAgentsOf } from "@/lib/team-all";
import { AgentDialog } from "./AgentDialog";
import styles from "./DiagnosticSection.module.css";
import glass from "./Glass.module.css";
import head from "./SectionHead.module.css";

export const DIAGNOSTIC_ID = "comment-choisir";

const ICONS: Partial<Record<OptionIcon, (p: { size?: number }) => ReactNode>> = {
  content: PlayBox,
  support: ChatDots,
  prospection: Target,
  hr: Users,
  data: Bars,
  custom: Sparkle,
  meetings: Calendar,
  proposals: Doc,
  inbox: Mail,
  visuals: Picture,
  video: Play,
  trends: TrendUp,
  strategy: Rocket,
  billing: Receipt,
  decks: Slides,
  knowledge: Search,
  orchestration: People,
  mail: Mail,
  chat: Chat,
  social: Globe,
  crm: ContactCard,
  sheet: Doc,
  calendar: Calendar,
  shop: Package,
  docs: Doc,
  software: Gear,
  standard: Check,
  specific: Gear,
  unique: Sparkle,
};

const LEVEL: Partial<Record<OptionIcon, number>> = { "clock-low": 1, "clock-mid": 2, "clock-high": 3 };

function OptionGlyph({ icon }: { icon: OptionIcon }) {
  const level = LEVEL[icon];
  if (level) {
    return (
      <span className={styles.meter} aria-hidden="true">
        {[1, 2, 3].map((l) => (
          <span key={l} data-on={l <= level} />
        ))}
      </span>
    );
  }
  const Icon = ICONS[icon] ?? Sparkle;
  return <Icon size={20} />;
}

/** Number that eases to its value (compatibility %). */
function Counter({ value, reduced }: { value: number; reduced: boolean }) {
  const [shown, setShown] = useState(0);
  const from = useRef(0);
  useEffect(() => {
    if (reduced) {
      from.current = value;
      setShown(value);
      return;
    }
    const start = from.current;
    const t0 = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const k = Math.min(1, (now - t0) / 700);
      const v = start + (value - start) * (1 - Math.pow(1 - k, 3));
      from.current = v;
      setShown(v);
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, reduced]);
  return <>{Math.round(shown)}</>;
}

/* The section's words (the questions and agents come from lib/diagnostic and lib/agent-directory). */
const DIAG = {
  fr: {
    prev: "Question précédente",
    count: (n: number, total: number) => (
      <>
        Question <strong>{n}</strong> sur {total}
      </>
    ),
    privacy: "Anonyme, sans inscription : vos réponses restent dans votre navigateur.",
    see: "Voir ma recommandation",
    next: "Continuer",
    yours: "Votre recommandation",
    badge: { ready: "Prêt à l’emploi", adapted: "Adapté à vos règles", custom: "Sur mesure" },
    customTitle: ["Un agent sur mesure,", "conçu pour votre métier."],
    adaptedTitle: (fem: boolean) => `${fem ? "adaptée" : "adapté"} à votre métier.`,
    readyTitle: (fem: boolean) => ["est", `${fem ? "faite" : "fait"} pour vous.`],
    customText: (tools: string) => `Votre processus a sa propre logique. Plutôt que de le faire entrer dans un agent standard, nous construisons un agent autour de vos règles${tools ? `, connecté à ${tools}` : ""}.`,
    adaptedText: (name: string, role: string) => `Nous partons de ${name} (${role}) et l’entraînons à vos règles : le cœur est prêt, nous ajustons le reste avec vous.`,
    readyText: (role: string, fem: boolean) => `${role}, ${fem ? "prête" : "prêt"} à travailler dans vos outils en quelques jours, sans rien changer à votre organisation.`,
    duo: "Idéal en duo avec",
    design: "Concevoir mon agent",
    talk: "Parlons de votre projet",
    discover: (n: string) => `Découvrir ${n}`,
    restart: "Refaire le diagnostic",
    footnote: (basis: string) => `* Estimation indicative : ${basis}. À affiner ensemble sur vos propres chiffres lors du premier échange.`,
    live: "Compatibilité en direct",
    liveOn: "Les 5 plus compatibles parmi nos 16 agents, à chaque réponse.",
    liveOff: "Répondez : nos 16 agents se classent en direct.",
    leader: (who: string, pct: number) => `En tête : ${who}, ${pct} % de compatibilité.`,
    aCustom: "un agent sur mesure",
    custom: "Sur mesure",
    forTrade: "Conçu pour votre métier",
    pct: " %",
    compatible: "compatible avec votre besoin",
    yourTools: "Vos outils actuels",
    rules: ["Vos règles métier", "Vos validations", "Vos cas particuliers"],
    plan: "Plan de votre agent",
    yourAgent: "Votre agent",
    yourWay: (task: string) => `${task}, à votre façon`,
    why: {
      task: (task: string, name: string) => `Votre priorité, « ${task.toLowerCase()} », c’est le métier de ${name}.`,
      tools: (fem: boolean, tools: string) => `${fem ? "Elle" : "Il"} travaille déjà avec ${tools}.`,
      noTools: (fem: boolean) => `${fem ? "Elle" : "Il"} se connecte à vos outils actuels, sans rien changer.`,
      rules: "Vos règles métier intégrées dès le brief, validées avec vous.",
    },
  },
  en: {
    prev: "Previous question",
    count: (n: number, total: number) => (
      <>
        Question <strong>{n}</strong> of {total}
      </>
    ),
    privacy: "Anonymous, no sign-up: your answers stay in your browser.",
    see: "See my recommendation",
    next: "Continue",
    yours: "Your recommendation",
    badge: { ready: "Ready to use", adapted: "Adapted to your rules", custom: "Custom" },
    customTitle: ["A custom agent,", "designed for your trade."],
    adaptedTitle: () => "adapted to your trade.",
    readyTitle: () => ["is", "made for you."],
    customText: (tools: string) => `Your process has its own logic. Rather than squeezing it into a standard agent, we build an agent around your rules${tools ? `, connected to ${tools}` : ""}.`,
    adaptedText: (name: string, role: string) => `We start from ${name} (${role}) and train them on your rules: the core is ready, we adjust the rest with you.`,
    readyText: (role: string) => `${role}, ready to work in your tools within a few days, without changing anything in your organisation.`,
    duo: "Ideal paired with",
    design: "Design my agent",
    talk: "Discuss your project",
    discover: (n: string) => `Meet ${n}`,
    restart: "Start the diagnostic again",
    footnote: (basis: string) => `* Indicative estimate: ${basis}. To be refined together on your own figures during the first call.`,
    live: "Live compatibility",
    liveOn: "The 5 best matches among our 16 agents, with every answer.",
    liveOff: "Answer: our 16 agents rank themselves live.",
    leader: (who: string, pct: number) => `In the lead: ${who}, ${pct}% compatible.`,
    aCustom: "a custom agent",
    custom: "Custom",
    forTrade: "Designed for your trade",
    pct: "%",
    compatible: "compatible with your need",
    yourTools: "Your current tools",
    rules: ["Your business rules", "Your approvals", "Your special cases"],
    plan: "Your agent’s blueprint",
    yourAgent: "Your agent",
    yourWay: (task: string) => `${task}, your way`,
    why: {
      task: (task: string, name: string) => `Your priority, “${task.toLowerCase()}”, is exactly ${name}’s job.`,
      tools: (_fem: boolean, tools: string) => `Already works with ${tools}.`,
      noTools: () => "Connects to your current tools, without changing anything.",
      rules: "Your business rules built in from the brief, approved with you.",
    },
  },
};

/** Rows of the live ranking: the five best agents, and the custom agent. */
const SHOWN = 5;

/**
 * "Comment choisir votre agent IA ?" — an animated diagnostic after the team (field, precise task, time, tools,
 * process). Left: one question at a time (native radios / checkboxes, click = next, keyboard = Continuer).
 * Right: every answer re-ranks the sixteen agents and the custom agent live (the five best are shown). Then the
 * recommendation: one of our agents as is, one of our agents adapted to the company's rules, or an agent built
 * for its trade.
 */
export function DiagnosticSection() {
  const locale = useLocale();
  const tx = DIAG[locale];
  const DIAGNOSTIC_INTRO = diagnosticIntroOf(locale);
  const ALL_AGENTS = allAgentsOf(locale);
  const section = useRef<HTMLElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const inView = useInView(panel, 0.3);
  const reduced = useReducedMotion();
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState<1 | -1>(1);
  const [answers, setAnswers] = useState<Answers>({});
  const [result, setResult] = useState<DiagnosticResult | null>(null);
  const [dialogIndex, setDialogIndex] = useState<number | null>(null);
  const [origin, setOrigin] = useState<DOMRect | null>(null);
  const resultTitle = useRef<HTMLHeadingElement>(null);
  const discover = useRef<HTMLButtonElement>(null);
  const advance = useRef<number | null>(null);
  // Radios also fire "click" on arrow keys: only a pointer pick moves on by itself.
  const viaPointer = useRef(false);

  const questions = activeQuestions(answers, locale);
  const question = questions[Math.min(step, questions.length - 1)];
  const options = optionsFor(question, answers);
  const selected = answers[question.id] ?? [];
  const answered = Object.keys(answers).length > 0;
  const scores = useMemo(() => scoreAnswers(answers), [answers]);
  // The five best agents and the custom agent, in rank order (the others wait, hidden, below the last row).
  const ranking = useMemo(() => {
    const ranked = rankCandidates(scores);
    const top = new Set<Candidate>([...ranked.filter((c) => c !== "custom").slice(0, SHOWN), "custom"]);
    return ranked.filter((c) => top.has(c));
  }, [scores]);
  const leader = answered ? ranking[0] : null;

  useEffect(() => () => void (advance.current && window.clearTimeout(advance.current)), []);

  useEffect(() => {
    if (result) resultTitle.current?.focus({ preventScroll: true });
  }, [result]);

  const next = useCallback(
    (current: Answers) => {
      if (step < activeQuestions(current, locale).length - 1) {
        setDir(1);
        setStep((s) => s + 1);
      } else {
        setResult(buildResult(current, locale));
      }
    },
    [step, locale],
  );

  const choose = (id: string, pointer: boolean) => {
    const q = question;
    const current = answers[q.id] ?? [];
    const value = q.multiple ? (current.includes(id) ? current.filter((v) => v !== id) : [...current, id]) : [id];
    const updated = withAnswer(answers, q.id, value);
    setAnswers(updated);
    // Single choice picked with the pointer: move on after a beat (keyboard users confirm with Continuer).
    if (!q.multiple && pointer) {
      if (advance.current) window.clearTimeout(advance.current);
      advance.current = window.setTimeout(() => next(updated), reduced ? 0 : 420);
    }
  };

  const back = () => {
    if (advance.current) window.clearTimeout(advance.current);
    setDir(-1);
    setStep((s) => Math.max(0, s - 1));
  };

  const restart = () => {
    setAnswers({});
    setResult(null);
    setDir(-1);
    setStep(0);
  };

  const recommended = result ? agentCard(result.agent, locale) : null;

  return (
    <section ref={section} id={DIAGNOSTIC_ID} className={styles.diagnostic} aria-labelledby="diagnostic-title">
      <div className={styles.frame}>
        <header className={head.head}>
          <p className={head.kicker}>{DIAGNOSTIC_INTRO.kicker}</p>
          <h2 id="diagnostic-title" className={head.title}>
            <span className={head.line}>{DIAGNOSTIC_INTRO.title[0]}</span>{" "}
            <span className={`${head.line} ${head.accent}`}>{DIAGNOSTIC_INTRO.title[1]}</span>
          </h2>
          <p className={head.lead}>{DIAGNOSTIC_INTRO.lead}</p>
        </header>

        <div
          ref={panel}
          className={`${styles.panel} ${glass.glass}`}
          data-glass={inView ? "in" : "out"}
          data-phase={result ? "result" : "quiz"}
        >
          {/* ——— Left: the questions, then the recommendation ——— */}
          <div className={styles.main}>
            {!result ? (
              <form
                className={styles.quiz}
                onSubmit={(e) => {
                  e.preventDefault();
                  if (selected.length) next(answers);
                }}
              >
                <div className={styles.progress}>
                  <button type="button" className={styles.back} onClick={back} disabled={step === 0} aria-label={tx.prev}>
                    <ChevronLeft size={16} />
                  </button>
                  <span className={styles.count} aria-live="polite">
                    {tx.count(step + 1, questions.length)}
                  </span>
                  <span className={styles.segments} aria-hidden="true">
                    {questions.map((q, i) => (
                      <span key={q.id} data-state={i < step ? "done" : i === step ? "now" : "todo"} />
                    ))}
                  </span>
                </div>

                <fieldset key={question.id} className={styles.question} data-dir={dir}>
                  <legend className={styles.legend}>{question.title}</legend>
                  <p className={styles.help}>{question.help}</p>
                  <div
                    className={styles.options}
                    data-kind={question.id}
                    onPointerDown={() => (viaPointer.current = true)}
                    onKeyDown={() => (viaPointer.current = false)}
                  >
                    {options.map((o, i) => {
                      const checked = selected.includes(o.id);
                      return (
                        <label
                          key={o.id}
                          className={styles.option}
                          data-checked={checked}
                          style={{ "--i": i } as React.CSSProperties}
                        >
                          <input
                            className={styles.input}
                            type={question.multiple ? "checkbox" : "radio"}
                            name={question.id}
                            value={o.id}
                            checked={checked}
                            onChange={() => {}}
                            onClick={() => choose(o.id, viaPointer.current)}
                          />
                          <span className={styles.glyph}>
                            <OptionGlyph icon={o.icon} />
                          </span>
                          <span className={styles.optionText}>
                            <span className={styles.optionLabel}>{o.label}</span>
                            {o.hint && <span className={styles.optionHint}>{o.hint}</span>}
                          </span>
                          <span className={styles.tick} aria-hidden="true">
                            <Check size={13} />
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </fieldset>

                <div className={styles.actions}>
                  <p className={styles.privacy}>
                    <span className={styles.lock} aria-hidden="true" />
                    {tx.privacy}
                  </p>
                  <button type="submit" className={styles.next} disabled={!selected.length}>
                    {step === questions.length - 1 ? tx.see : tx.next}
                    <ArrowRight size={17} />
                  </button>
                </div>
              </form>
            ) : (
              <div className={styles.result} data-outcome={result.outcome}>
                <p className={styles.resultKicker}>
                  {tx.yours}
                  <span className={styles.badge} data-outcome={result.outcome}>
                    {tx.badge[result.outcome]}
                  </span>
                </p>
                <h3 ref={resultTitle} tabIndex={-1} className={styles.resultTitle}>
                  {result.outcome === "custom" ? (
                    <>
                      {tx.customTitle[0]} <span className={styles.accent}>{tx.customTitle[1]}</span>
                    </>
                  ) : result.outcome === "adapted" ? (
                    <>
                      {recommended!.name}, <span className={styles.accent}>{tx.adaptedTitle(recommended!.feminine)}</span>
                    </>
                  ) : (
                    <>
                      {recommended!.name} {tx.readyTitle(recommended!.feminine)[0]} <span className={styles.accent}>{tx.readyTitle(recommended!.feminine)[1]}</span>
                    </>
                  )}
                </h3>
                <p className={styles.resultText}>
                  {result.outcome === "custom"
                    ? tx.customText(joinIn(result.tools.map((t) => t.phrase ?? t.label), locale))
                    : result.outcome === "adapted"
                      ? tx.adaptedText(recommended!.name, recommended!.role)
                      : tx.readyText(recommended!.role, recommended!.feminine)}
                </p>

                {result.outcome === "custom" ? (
                  <>
                  <p className={styles.gain}>
                    <strong>{valueOf({ task: result.task.id, time: answers.time?.[0], hours: result.hours }, locale).headline}*</strong>
                  </p>
                  <ol className={styles.steps}>
                    {customStepsOf(locale).map((s, i) => (
                      <li key={s.title} style={{ "--i": i } as React.CSSProperties}>
                        <span className={styles.stepNum}>{i + 1}</span>
                        <span>
                          <strong>{s.title}</strong>
                          {s.text}
                        </span>
                      </li>
                    ))}
                  </ol>
                  </>
                ) : (
                  <>
                    <ul className={styles.why}>
                      {whyLines(result, locale, answers.time?.[0]).map((line, i) => (
                        <li key={line} style={{ "--i": i } as React.CSSProperties}>
                          <Check size={15} />
                          {line}
                        </li>
                      ))}
                    </ul>
                    {result.duo && (
                      <p className={styles.duo}>
                        {/* eslint-disable-next-line @next/next/no-img-element -- avatar */}
                        <img src={agentCard(result.duo, locale).avatar} alt="" width={36} height={36} />
                        <span>
                          {tx.duo} <strong>{agentCard(result.duo, locale).name}</strong>, {locale === "en" ? agentCard(result.duo, locale).role : lowerFirst(agentCard(result.duo, locale).role)}
                        </span>
                      </p>
                    )}
                  </>
                )}

                <div className={styles.resultActions}>
                  <Link
                    href={contactHrefOf(locale)}
                    className={styles.primary}
                    onClick={contactClick({
                      source: "diagnostic",
                      need: resultNeed(result),
                      diagnostic: diagnosticSummary(answers, result, locale),
                    })}
                  >
                    {result.outcome === "custom" ? tx.design : tx.talk}
                    <ArrowRight size={17} />
                  </Link>
                  {result.outcome !== "custom" && (
                    <button
                      ref={discover}
                      type="button"
                      className={styles.secondary}
                      onClick={(e) => {
                        setOrigin(e.currentTarget.getBoundingClientRect());
                        setDialogIndex(ALL_AGENTS.findIndex((a) => a.key === result.agent));
                      }}
                    >
                      {tx.discover(recommended!.name)}
                    </button>
                  )}
                  <button type="button" className={styles.restart} onClick={restart}>
                    <Replay size={15} />
                    {tx.restart}
                  </button>
                </div>
                <p className={styles.footnote}>
                  {tx.footnote(valueOf({ task: result.task.id, time: answers.time?.[0], hours: result.hours }, locale).basis)}
                </p>
              </div>
            )}
          </div>

          {/* ——— Right: live compatibility, then the recommended agent (or the custom blueprint) ——— */}
          <div className={styles.side}>
            {!result ? (
              <div className={styles.live}>
                <p className={styles.liveTitle}>
                  <span className={styles.liveDot} aria-hidden="true" />
                  {tx.live}
                </p>
                <p className={styles.liveHelp}>{answered ? tx.liveOn : tx.liveOff}</p>
                <ol className={styles.ranking} aria-hidden="true">
                  {CANDIDATES.map((c) => {
                    const rank = ranking.indexOf(c);
                    return (
                      <LiveRow
                        key={c}
                        candidate={c}
                        rank={rank < 0 ? SHOWN : rank}
                        hidden={rank < 0}
                        score={scores[c]}
                        answered={answered}
                        lead={leader === c}
                        reduced={reduced}
                      />
                    );
                  })}
                </ol>
                <p className="visually-hidden" role="status">
                  {leader ? tx.leader(leader === "custom" ? tx.aCustom : agentCard(leader, locale).name, matchPercent(scores[leader])) : ""}
                </p>
              </div>
            ) : result.outcome === "custom" ? (
              <Blueprint result={result} />
            ) : (
              <Portrait result={result} reduced={reduced} />
            )}
          </div>
        </div>
      </div>

      <AgentDialog
        index={dialogIndex}
        origin={origin}
        onChange={setDialogIndex}
        onClose={() => {
          setDialogIndex(null);
          discover.current?.focus({ preventScroll: true });
        }}
      />
    </section>
  );
}

const lowerFirst = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

function whyLines(result: DiagnosticResult, locale: Locale, time?: string) {
  const why = DIAG[locale].why;
  const agent = agentCard(result.agent, locale);
  const value = valueOf({ task: result.task.id, time, hours: result.hours }, locale);
  const shared = result.tools.filter((t) => AGENT_TOOLS[result.agent].includes(t.id)).map((t) => t.phrase ?? t.label);
  // The outcome first; hours only when they are worth saying (value.time), the opportunity when time is low.
  const lines = [
    `${value.headline}*.`,
    why.task(result.task.label, agent.name),
    shared.length ? why.tools(agent.feminine, joinIn(shared, locale)) : why.noTools(agent.feminine),
    ...(value.time ? [`${value.time}*.`] : value.reframe ? [value.reframe] : []),
  ];
  if (result.outcome === "adapted") lines.push(why.rules);
  return lines;
}

function LiveRow({
  candidate,
  rank,
  hidden,
  score,
  answered,
  lead,
  reduced,
}: {
  candidate: Candidate;
  rank: number;
  /** Outside the five best: faded out below the last row, ready to slide in. */
  hidden: boolean;
  score: number;
  answered: boolean;
  lead: boolean;
  reduced: boolean;
}) {
  const locale = useLocale();
  const tx = DIAG[locale];
  const agent = candidate === "custom" ? null : agentCard(candidate, locale);
  return (
    <li
      className={styles.row}
      data-hidden={hidden}
      data-lead={lead}
      data-custom={candidate === "custom"}
      style={{ "--rank": rank, "--fill": answered ? barFill(score) : 0, "--tint-a": agent?.tint[0], "--tint-b": agent?.tint[1] } as React.CSSProperties}
    >
      <span className={styles.rowAvatar}>
        {agent ? (
          // eslint-disable-next-line @next/next/no-img-element -- avatar
          <img src={agent.avatar} alt="" width={40} height={40} loading="lazy" />
        ) : (
          <Sparkle size={18} />
        )}
      </span>
      <span className={styles.rowText}>
        <strong>{agent ? agent.name : tx.custom}</strong>
        <small>{agent ? agent.role : tx.forTrade}</small>
      </span>
      <span className={styles.rowBar}>
        <span />
      </span>
      <span className={styles.rowPct}>
        {answered && score > 0 ? (
          <>
            <Counter value={matchPercent(score)} reduced={reduced} />
            {tx.pct}
          </>
        ) : (
          "—"
        )}
      </span>
    </li>
  );
}

function Portrait({ result, reduced }: { result: DiagnosticResult; reduced: boolean }) {
  const locale = useLocale();
  const agent = agentCard(result.agent, locale);
  return (
    <div className={styles.portrait} style={{ "--tint-a": agent.tint[0], "--tint-b": agent.tint[1], "--pct": result.percent } as React.CSSProperties}>
      {/* eslint-disable-next-line @next/next/no-img-element -- transparent cut-out */}
      <img className={styles.figure} src={agent.image} alt="" />
      <div className={styles.score}>
        <svg viewBox="0 0 64 64" aria-hidden="true">
          <circle cx="32" cy="32" r="27" pathLength={100} className={styles.ringTrack} />
          <circle cx="32" cy="32" r="27" pathLength={100} className={styles.ring} />
        </svg>
        <span className={styles.scoreValue}>
          <Counter value={result.percent} reduced={reduced} />
          <small>%</small>
        </span>
      </div>
      <p className={styles.scoreLabel}>
        <strong>{agent.name}</strong>
        {DIAG[locale].compatible}
      </p>
    </div>
  );
}

function Blueprint({ result }: { result: DiagnosticResult }) {
  const tx = DIAG[useLocale()];
  const inputs = (result.tools.length ? result.tools.map((t) => t.label) : [tx.yourTools]).slice(0, 4);
  const rules = tx.rules;
  return (
    <div className={styles.blueprint}>
      <p className={styles.blueprintLabel}>{tx.plan}</p>
      <ul className={styles.nodes} data-row="in">
        {inputs.map((t, i) => (
          <li key={t} style={{ "--i": i } as React.CSSProperties}>
            {t}
          </li>
        ))}
      </ul>
      <span className={styles.wire} aria-hidden="true" />
      <div className={styles.core}>
        <span className={styles.coreIcon}>
          <Sparkle size={20} />
        </span>
        <span>
          <strong>{tx.yourAgent}</strong>
          <small>{result.task.id === "other" ? tx.forTrade : tx.yourWay(result.task.label)}</small>
        </span>
      </div>
      <span className={styles.wire} aria-hidden="true" />
      <ul className={styles.nodes} data-row="rules">
        {rules.map((r, i) => (
          <li key={r} style={{ "--i": i + 4 } as React.CSSProperties}>
            {r}
          </li>
        ))}
      </ul>
    </div>
  );
}
