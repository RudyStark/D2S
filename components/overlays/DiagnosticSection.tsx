"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AGENTS, type AgentType } from "@/components/experience/agents/agents.config";
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
  PlayBox,
  Replay,
  Sparkle,
  Target,
  Users,
} from "@/components/ui/Icons";
import { useInView, useReducedMotion } from "@/hooks/useInView";
import {
  AGENT_TOOLS,
  barFill,
  buildResult,
  CANDIDATES,
  CUSTOM_STEPS,
  DIAGNOSTIC_INTRO,
  diagnosticSummary,
  FEMININE,
  hoursSentence,
  joinFr,
  matchPercent,
  QUESTIONS,
  scoreAnswers,
  type Answers,
  type Candidate,
  type DiagnosticResult,
  type OptionIcon,
} from "@/lib/diagnostic";
import { contactClick } from "@/lib/contact";
import { CONTACT_HREF } from "@/lib/navigation";
import { TEAM } from "@/lib/team";
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
  mail: Mail,
  chat: Chat,
  social: Globe,
  crm: ContactCard,
  sheet: Doc,
  calendar: Calendar,
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

const agentOf = (type: AgentType) => TEAM.find((t) => t.type === type)!;

/**
 * "Comment choisir votre agent IA ?" — an animated four-question diagnostic after the team.
 * Left: one question at a time (native radios / checkboxes, click = next, keyboard = Continuer).
 * Right: every answer re-ranks the team and the custom agent live. Then the recommendation: one of our
 * agents as is, one of our agents adapted to the company's rules, or an agent built for its trade.
 */
export function DiagnosticSection() {
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

  const question = QUESTIONS[step];
  const selected = answers[question.id] ?? [];
  const answered = Object.keys(answers).length > 0;
  const scores = useMemo(() => scoreAnswers(answers), [answers]);
  const ranking = useMemo(
    () => [...CANDIDATES].sort((a, b) => scores[b] - scores[a] || CANDIDATES.indexOf(a) - CANDIDATES.indexOf(b)),
    [scores],
  );
  const leader = answered ? ranking[0] : null;

  useEffect(() => () => void (advance.current && window.clearTimeout(advance.current)), []);

  useEffect(() => {
    if (result) resultTitle.current?.focus({ preventScroll: true });
  }, [result]);

  const next = useCallback(
    (current: Answers) => {
      if (step < QUESTIONS.length - 1) {
        setDir(1);
        setStep((s) => s + 1);
      } else {
        setResult(buildResult(current));
      }
    },
    [step],
  );

  const choose = (id: string, pointer: boolean) => {
    const q = question;
    const current = answers[q.id] ?? [];
    const value = q.multiple ? (current.includes(id) ? current.filter((v) => v !== id) : [...current, id]) : [id];
    const updated = { ...answers, [q.id]: value };
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

  const recommended = result ? agentOf(result.agent) : null;

  return (
    <section ref={section} id={DIAGNOSTIC_ID} className={styles.diagnostic} aria-labelledby="diagnostic-title">
      <div className={styles.frame}>
        <header className={head.head}>
          <p className={head.kicker}>{DIAGNOSTIC_INTRO.kicker}</p>
          <h2 id="diagnostic-title" className={head.title}>
            <span className={head.line}>{DIAGNOSTIC_INTRO.title[0]}</span>
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
                  <button type="button" className={styles.back} onClick={back} disabled={step === 0} aria-label="Question précédente">
                    <ChevronLeft size={16} />
                  </button>
                  <span className={styles.count} aria-live="polite">
                    Question <strong>{step + 1}</strong> sur {QUESTIONS.length}
                  </span>
                  <span className={styles.segments} aria-hidden="true">
                    {QUESTIONS.map((q, i) => (
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
                    {question.options.map((o, i) => {
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
                    Anonyme, sans inscription : vos réponses restent dans votre navigateur.
                  </p>
                  <button type="submit" className={styles.next} disabled={!selected.length}>
                    {step === QUESTIONS.length - 1 ? "Voir ma recommandation" : "Continuer"}
                    <ArrowRight size={17} />
                  </button>
                </div>
              </form>
            ) : (
              <div className={styles.result} data-outcome={result.outcome}>
                <p className={styles.resultKicker}>
                  Votre recommandation
                  <span className={styles.badge} data-outcome={result.outcome}>
                    {result.outcome === "ready" ? "Prêt à l’emploi" : result.outcome === "adapted" ? "Adapté à vos règles" : "Sur mesure"}
                  </span>
                </p>
                <h3 ref={resultTitle} tabIndex={-1} className={styles.resultTitle}>
                  {result.outcome === "custom" ? (
                    <>
                      Un agent sur mesure, <span className={styles.accent}>conçu pour votre métier.</span>
                    </>
                  ) : result.outcome === "adapted" ? (
                    <>
                      {recommended!.name}, <span className={styles.accent}>{FEMININE[result.agent] ? "adaptée" : "adapté"} à votre métier.</span>
                    </>
                  ) : (
                    <>
                      {recommended!.name} est <span className={styles.accent}>{FEMININE[result.agent] ? "faite" : "fait"} pour vous.</span>
                    </>
                  )}
                </h3>
                <p className={styles.resultText}>
                  {result.outcome === "custom"
                    ? `Votre processus a sa propre logique. Plutôt que de le faire entrer dans un agent standard, nous construisons un agent autour de vos règles${result.tools.length ? `, connecté à ${joinFr(result.tools.map((t) => t.phrase ?? t.label))}` : ""}.`
                    : result.outcome === "adapted"
                      ? `Nous partons de ${recommended!.name} (${recommended!.role}) et l’entraînons à vos règles : le cœur est prêt, nous ajustons le reste avec vous.`
                      : `${recommended!.role}, ${FEMININE[result.agent] ? "prête" : "prêt"} à travailler dans vos outils en quelques jours, sans rien changer à votre organisation.`}
                </p>

                {result.outcome === "custom" ? (
                  <>
                  <p className={styles.gain}>
                    <strong>{hoursSentence(result.hours)}*</strong> une fois votre agent en service.
                  </p>
                  <ol className={styles.steps}>
                    {CUSTOM_STEPS.map((s, i) => (
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
                      {whyLines(result).map((line, i) => (
                        <li key={line} style={{ "--i": i } as React.CSSProperties}>
                          <Check size={15} />
                          {line}
                        </li>
                      ))}
                    </ul>
                    {result.duo && (
                      <p className={styles.duo}>
                        {/* eslint-disable-next-line @next/next/no-img-element -- avatar */}
                        <img src={AGENTS[result.duo].avatar} alt="" width={36} height={36} />
                        <span>
                          Idéal en duo avec <strong>{agentOf(result.duo).name}</strong>, {agentOf(result.duo).role}
                        </span>
                      </p>
                    )}
                  </>
                )}

                <div className={styles.resultActions}>
                  <Link
                    href={CONTACT_HREF}
                    className={styles.primary}
                    onClick={contactClick({
                      source: "diagnostic",
                      need: result.outcome === "custom" ? "custom" : result.agent,
                      diagnostic: diagnosticSummary(answers, result),
                    })}
                  >
                    {result.outcome === "custom" ? "Concevoir mon agent" : "Parlons de votre projet"}
                    <ArrowRight size={17} />
                  </Link>
                  {result.outcome !== "custom" && (
                    <button
                      ref={discover}
                      type="button"
                      className={styles.secondary}
                      onClick={(e) => {
                        setOrigin(e.currentTarget.getBoundingClientRect());
                        setDialogIndex(TEAM.findIndex((t) => t.type === result.agent));
                      }}
                    >
                      Découvrir {recommended!.name}
                    </button>
                  )}
                  <button type="button" className={styles.restart} onClick={restart}>
                    <Replay size={15} />
                    Refaire le diagnostic
                  </button>
                </div>
                <p className={styles.footnote}>
                  * Estimation indicative : votre temps déclaré × la part qu’un agent prend en charge en moyenne sur ce type de tâche
                  ({result.hours.share[0]} à {result.hours.share[1]} %), ajustée à la spécificité de votre processus. À affiner ensemble lors du brief.
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
                  Compatibilité en direct
                </p>
                <p className={styles.liveHelp}>{answered ? "Le classement évolue à chaque réponse." : "Répondez : l’équipe se classe en direct."}</p>
                <ol className={styles.ranking} aria-hidden="true">
                  {CANDIDATES.map((c) => (
                    <LiveRow key={c} candidate={c} rank={ranking.indexOf(c)} score={scores[c]} answered={answered} lead={leader === c} reduced={reduced} />
                  ))}
                </ol>
                <p className="visually-hidden" role="status">
                  {leader ? `En tête : ${leader === "custom" ? "un agent sur mesure" : agentOf(leader).name}, ${matchPercent(scores[leader])} % de compatibilité.` : ""}
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

function whyLines(result: DiagnosticResult) {
  const agent = agentOf(result.agent);
  const pronoun = FEMININE[result.agent] ? "Elle" : "Il";
  const shared = result.tools.filter((t) => AGENT_TOOLS[result.agent].includes(t.id)).map((t) => t.phrase ?? t.label);
  const lines = [
    `Votre priorité, « ${result.task.label.toLowerCase()} », c’est le métier de ${agent.name}.`,
    shared.length
      ? `${pronoun} travaille déjà avec ${joinFr(shared)}.`
      : `${pronoun} se connecte à vos outils actuels, sans rien changer.`,
    `${hoursSentence(result.hours)}*.`,
  ];
  if (result.outcome === "adapted") lines.push("Vos règles métier intégrées dès le brief, validées avec vous.");
  return lines;
}

function LiveRow({
  candidate,
  rank,
  score,
  answered,
  lead,
  reduced,
}: {
  candidate: Candidate;
  rank: number;
  score: number;
  answered: boolean;
  lead: boolean;
  reduced: boolean;
}) {
  const agent = candidate === "custom" ? null : agentOf(candidate);
  return (
    <li
      className={styles.row}
      data-lead={lead}
      data-custom={candidate === "custom"}
      style={{ "--rank": rank, "--fill": answered ? barFill(score) : 0, "--tint-a": agent?.tint[0], "--tint-b": agent?.tint[1] } as React.CSSProperties}
    >
      <span className={styles.rowAvatar}>
        {agent ? (
          // eslint-disable-next-line @next/next/no-img-element -- avatar
          <img src={AGENTS[agent.type].avatar} alt="" width={40} height={40} />
        ) : (
          <Sparkle size={18} />
        )}
      </span>
      <span className={styles.rowText}>
        <strong>{agent ? agent.name : "Sur mesure"}</strong>
        <small>{agent ? agent.role : "Conçu pour votre métier"}</small>
      </span>
      <span className={styles.rowBar}>
        <span />
      </span>
      <span className={styles.rowPct}>
        {answered && score > 0 ? (
          <>
            <Counter value={matchPercent(score)} reduced={reduced} /> %
          </>
        ) : (
          "—"
        )}
      </span>
    </li>
  );
}

function Portrait({ result, reduced }: { result: DiagnosticResult; reduced: boolean }) {
  const agent = agentOf(result.agent);
  return (
    <div className={styles.portrait} style={{ "--tint-a": agent.tint[0], "--tint-b": agent.tint[1], "--pct": result.percent } as React.CSSProperties}>
      {/* eslint-disable-next-line @next/next/no-img-element -- transparent cut-out */}
      <img className={styles.figure} src={AGENTS[result.agent].image} alt="" />
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
        compatible avec votre besoin
      </p>
    </div>
  );
}

function Blueprint({ result }: { result: DiagnosticResult }) {
  const inputs = (result.tools.length ? result.tools.map((t) => t.label) : ["Vos outils actuels"]).slice(0, 4);
  const rules = ["Vos règles métier", "Vos validations", "Vos cas particuliers"];
  return (
    <div className={styles.blueprint}>
      <p className={styles.blueprintLabel}>Plan de votre agent</p>
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
          <strong>Votre agent</strong>
          <small>{result.task.id === "other" ? "Conçu pour votre métier" : `${result.task.label}, à votre façon`}</small>
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
