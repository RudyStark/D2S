"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Replay,
  Sparkle,
} from "@/components/ui/Icons";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { agentCard } from "@/lib/agent-directory";
import {
  activeQuestions,
  buildResult,
  customStepsOf,
  diagnosticSummary,
  optionsFor,
  resultNeed,
  withAnswer,
  type Answers,
  type DiagnosticResult,
} from "@/lib/diagnostic";
import { teamOf, type AgentProfile } from "@/lib/team";
import { valueOf } from "@/lib/value";
import type { MobileContactIntent } from "./mobile-navigation";
import styles from "./MobileHome.module.css";

const TEXTS = {
  fr: {
    kicker: "Comment choisir",
    title: ["Quel agent IA", "pour vous ?"],
    lead: "Quelques questions pour trouver, parmi nos 16 agents, votre point de départ.",
    count: (n: number, total: number) => (
      <>
        Question <strong>{n}</strong> sur {total}
      </>
    ),
    back: "Retour",
    see: "Voir mon résultat",
    next: "Continuer",
    privacy: "Vos réponses restent dans cette page.",
    start: "Votre point de départ",
    customTitle: "Un agent sur mesure, autour de votre métier.",
    customText: "Vos règles et vos outils appellent une réponse spécifique. Nous la construisons avec vous.",
    adapted: (fem: boolean) => `adapté${fem ? "e" : ""} à vos règles.`,
    ready: "à vos côtés.",
    discover: (n: string) => `Découvrir ${n}`,
    footnote: (basis: string) => `* Estimation indicative : ${basis}. À affiner ensemble sur vos propres chiffres.`,
    why: "Pourquoi cette recommandation ?",
    priority: (task: string) => `Votre priorité : ${task.toLowerCase()}.`,
    tools: (list: string) => `Vos outils : ${list}.`,
    rules: "Nous tenons compte des règles propres à votre activité.",
    duo: "Idéal en duo avec",
    talk: "Parlons de ce résultat",
    restart: "Recommencer",
  },
  en: {
    kicker: "How to choose",
    title: ["Which AI agent", "for you?"],
    lead: "A few questions to find, among our 16 agents, your starting point.",
    count: (n: number, total: number) => (
      <>
        Question <strong>{n}</strong> of {total}
      </>
    ),
    back: "Back",
    see: "See my result",
    next: "Continue",
    privacy: "Your answers stay in this page.",
    start: "Your starting point",
    customTitle: "A custom agent, built around your trade.",
    customText: "Your rules and your tools call for a specific answer. We build it with you.",
    adapted: () => "adapted to your rules.",
    ready: "by your side.",
    discover: (n: string) => `Meet ${n}`,
    footnote: (basis: string) => `* Indicative estimate: ${basis}. To be refined together on your own figures.`,
    why: "Why this recommendation?",
    priority: (task: string) => `Your priority: ${task.toLowerCase()}.`,
    tools: (list: string) => `Your tools: ${list}.`,
    rules: "We take your business’s own rules into account.",
    duo: "Ideal paired with",
    talk: "Let’s talk about this result",
    restart: "Start again",
  },
};

export function MobileDiagnostic({
  onContact,
  onAgent,
}: {
  onContact: (intent: MobileContactIntent) => void;
  onAgent: (agent: AgentProfile) => void;
}) {
  const locale = useLocale();
  const t = TEXTS[locale];
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [result, setResult] = useState<DiagnosticResult | null>(null);
  const [changed, setChanged] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const card = useRef<HTMLDivElement>(null);
  const questions = activeQuestions(answers, locale);
  const question = questions[Math.min(step, questions.length - 1)];
  const options = optionsFor(question, answers);
  const selected = answers[question.id] ?? [];
  const recommended = result ? agentCard(result.agent, locale) : null;
  const value = result ? valueOf({ task: result.task.id, time: answers.time?.[0], hours: result.hours }, locale) : null;
  // The five of the 3D world have a profile window on mobile; the others are presented in the result itself.
  const profile = result
    ? teamOf(locale).find((person) => person.type === result.agent)
    : undefined;

  useEffect(() => {
    if (!changed) return;
    heading.current?.focus({ preventScroll: true });
    if (card.current && card.current.getBoundingClientRect().top < 82) {
      window.scrollTo({
        top: card.current.getBoundingClientRect().top + window.scrollY - 88,
        behavior: "auto",
      });
    }
  }, [step, result, changed]);

  const choose = (id: string) => {
    const values = question.multiple
      ? selected.includes(id)
        ? selected.filter((value) => value !== id)
        : [...selected, id]
      : [id];
    setAnswers((previous) => withAnswer(previous, question.id, values));
  };

  return (
    <section
      id="comment-choisir"
      tabIndex={-1}
      className={`${styles.section} ${styles.tinted}`}
      data-mobile-section
      aria-labelledby="mobile-diagnostic-title"
    >
      <div className={styles.inner}>
        <div data-reveal>
          <p className={styles.eyebrow}>{t.kicker}</p>
          <h2 id="mobile-diagnostic-title" className={styles.title}>
            {t.title[0]}
            <br />
            <span>{t.title[1]}</span>
          </h2>
          <p className={styles.lead}>{t.lead}</p>
        </div>
        <div ref={card} className={styles.quizCard} data-reveal>
          {!result ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!selected.length) return;
                setChanged(true);
                if (step < questions.length - 1) setStep(step + 1);
                else setResult(buildResult(answers, locale));
              }}
            >
              <div className={styles.quizProgress}>
                <span aria-live="polite">
                  {t.count(step + 1, questions.length)}
                </span>
                <div aria-hidden="true">
                  {questions.map((item, i) => (
                    <span key={item.id} data-done={i <= step} />
                  ))}
                </div>
              </div>
              <h3
                ref={heading}
                tabIndex={-1}
                className={styles.quizTitle}
                id="mobile-question-title"
              >
                {question.title}
              </h3>
              <p id="mobile-question-help" className={styles.quizHelp}>
                {question.help}
              </p>
              <fieldset
                className={styles.options}
                aria-labelledby="mobile-question-title"
                aria-describedby="mobile-question-help"
              >
                {options.map((option) => (
                  <label
                    key={option.id}
                    className={styles.option}
                    data-checked={selected.includes(option.id)}
                  >
                    <input
                      type={question.multiple ? "checkbox" : "radio"}
                      name={`mobile-${question.id}`}
                      value={option.id}
                      checked={selected.includes(option.id)}
                      onChange={() => choose(option.id)}
                    />
                    <span>
                      <strong>{option.label}</strong>
                      {option.hint && <small>{option.hint}</small>}
                    </span>
                  </label>
                ))}
              </fieldset>
              <div className={styles.quizActions}>
                {step > 0 && (
                  <button
                    type="button"
                    className={styles.secondary}
                    onClick={() => {
                      setChanged(true);
                      setStep(step - 1);
                    }}
                  >
                    <ChevronLeft size={18} />
                    {t.back}
                  </button>
                )}
                <button
                  type="submit"
                  className={styles.primary}
                  disabled={!selected.length}
                >
                  {step === questions.length - 1 ? t.see : t.next}
                  <ArrowRight size={18} />
                </button>
              </div>
              <p className={styles.privacyNote}>
                {t.privacy}
              </p>
            </form>
          ) : (
            <div className={styles.result}>
              <p className={styles.eyebrow}>{t.start}</p>
              {result.outcome === "custom" ? (
                <>
                  <span className={styles.resultIcon}>
                    <Sparkle size={30} />
                  </span>
                  <h3 ref={heading} tabIndex={-1}>
                    {t.customTitle}
                  </h3>
                  <p>{t.customText}</p>
                  <ol className={styles.customSteps}>
                    {customStepsOf(locale).map((item) => (
                      <li key={item.title}>
                        <strong>{item.title}</strong>
                        <p>{item.text}</p>
                      </li>
                    ))}
                  </ol>
                </>
              ) : (
                <>
                  <div className={styles.resultAgent}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={recommended!.avatar}
                      alt=""
                      width={72}
                      height={72}
                    />
                    <div>
                      <h3 ref={heading} tabIndex={-1}>
                        {recommended!.name},{" "}
                        {result.outcome === "adapted" ? t.adapted(recommended!.feminine) : t.ready}
                      </h3>
                      <p>{recommended!.role}</p>
                    </div>
                  </div>
                  <p>{recommended!.blurb}</p>
                  {!profile && (
                    <ul className={styles.resultMissions}>
                      {recommended!.missions.slice(0, 3).map((mission) => (
                        <li key={mission}>{mission}</li>
                      ))}
                    </ul>
                  )}
                  <p className={styles.resultControl}>{recommended!.control}</p>
                  {profile && (
                    <button
                      type="button"
                      className={styles.secondary}
                      onClick={() => onAgent(profile)}
                    >
                      {t.discover(recommended!.name)}
                      <ChevronRight size={18} />
                    </button>
                  )}
                </>
              )}
              <div className={styles.estimate}>
                <strong>{value!.headline}*</strong>
                {value!.time ? <p>{value!.time}*.</p> : value!.reframe ? <p>{value!.reframe}</p> : null}
                <p>{t.footnote(value!.basis)}</p>
              </div>
              <details className={styles.resultWhy}>
                <summary>{t.why}</summary>
                <ul>
                  <li>{t.priority(result.task.label)}</li>
                  {result.tools.length > 0 && <li>{t.tools(result.tools.map((tool) => tool.label).join(", "))}</li>}
                  <li>{t.rules}</li>
                </ul>
              </details>
              {result.duo && (
                <p>
                  {t.duo} {agentCard(result.duo, locale).name},{" "}
                  {locale === "en"
                    ? agentCard(result.duo, locale).role
                    : agentCard(result.duo, locale).role.charAt(0).toLowerCase() + agentCard(result.duo, locale).role.slice(1)}
                  .
                </p>
              )}
              <button
                type="button"
                className={styles.primary}
                onClick={() =>
                  onContact({
                    source: "mobile-diagnostic",
                    need: resultNeed(result),
                    diagnostic: diagnosticSummary(answers, result, locale),
                  })
                }
              >
                {t.talk}
                <ArrowRight size={18} />
              </button>
              <button
                type="button"
                className={styles.textButton}
                onClick={() => {
                  setAnswers({});
                  setResult(null);
                  setStep(0);
                  setChanged(true);
                }}
              >
                <Replay size={16} />
                {t.restart}
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
