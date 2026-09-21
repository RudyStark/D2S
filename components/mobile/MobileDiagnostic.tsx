"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Replay,
  Sparkle,
} from "@/components/ui/Icons";
import {
  buildResult,
  CUSTOM_STEPS,
  diagnosticSummary,
  FEMININE,
  hoursSentence,
  QUESTIONS,
  type Answers,
  type DiagnosticResult,
} from "@/lib/diagnostic";
import { TEAM, type AgentProfile } from "@/lib/team";
import type { MobileContactIntent } from "./mobile-navigation";
import styles from "./MobileHome.module.css";

export function MobileDiagnostic({
  onContact,
  onAgent,
}: {
  onContact: (intent: MobileContactIntent) => void;
  onAgent: (agent: AgentProfile) => void;
}) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [result, setResult] = useState<DiagnosticResult | null>(null);
  const [changed, setChanged] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const card = useRef<HTMLDivElement>(null);
  const question = QUESTIONS[step];
  const selected = answers[question.id] ?? [];
  const recommended = result
    ? TEAM.find((person) => person.type === result.agent)!
    : null;

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
    setAnswers((previous) => ({ ...previous, [question.id]: values }));
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
          <p className={styles.eyebrow}>Comment choisir</p>
          <h2 id="mobile-diagnostic-title" className={styles.title}>
            Quel agent IA
            <br />
            <span>pour vous ?</span>
          </h2>
          <p className={styles.lead}>
            4 questions pour trouver votre point de départ.
          </p>
        </div>
        <div ref={card} className={styles.quizCard} data-reveal>
          {!result ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!selected.length) return;
                setChanged(true);
                if (step < QUESTIONS.length - 1) setStep(step + 1);
                else setResult(buildResult(answers));
              }}
            >
              <div className={styles.quizProgress}>
                <span aria-live="polite">
                  Question <strong>{step + 1}</strong> sur {QUESTIONS.length}
                </span>
                <div aria-hidden="true">
                  {QUESTIONS.map((item, i) => (
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
                {question.options.map((option) => (
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
                    Retour
                  </button>
                )}
                <button
                  type="submit"
                  className={styles.primary}
                  disabled={!selected.length}
                >
                  {step === QUESTIONS.length - 1
                    ? "Voir mon résultat"
                    : "Continuer"}
                  <ArrowRight size={18} />
                </button>
              </div>
              <p className={styles.privacyNote}>
                Vos réponses restent dans cette page.
              </p>
            </form>
          ) : (
            <div className={styles.result}>
              <p className={styles.eyebrow}>Votre point de départ</p>
              {result.outcome === "custom" ? (
                <>
                  <span className={styles.resultIcon}>
                    <Sparkle size={30} />
                  </span>
                  <h3 ref={heading} tabIndex={-1}>
                    Un agent sur mesure, autour de votre métier.
                  </h3>
                  <p>
                    Vos règles et vos outils appellent une réponse spécifique.
                    Nous la construisons avec vous.
                  </p>
                  <ol className={styles.customSteps}>
                    {CUSTOM_STEPS.map((item) => (
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
                      src={`/images/agents/${recommended!.type}-avatar.webp`}
                      alt=""
                      width={72}
                      height={72}
                    />
                    <div>
                      <h3 ref={heading} tabIndex={-1}>
                        {recommended!.name},{" "}
                        {result.outcome === "adapted"
                          ? `adapté${FEMININE[result.agent] ? "e" : ""} à vos règles.`
                          : "à vos côtés."}
                      </h3>
                      <p>{recommended!.role}</p>
                    </div>
                  </div>
                  <p>{recommended!.blurb}</p>
                  <p className={styles.resultControl}>{recommended!.control}</p>
                  <button
                    type="button"
                    className={styles.secondary}
                    onClick={() => onAgent(recommended!)}
                  >
                    Découvrir {recommended!.name}
                    <ChevronRight size={18} />
                  </button>
                </>
              )}
              <div className={styles.estimate}>
                <strong>{hoursSentence(result.hours)}*</strong>
                <p>
                  * Estimation indicative fondée sur le temps déclaré et la part
                  automatisable de la tâche. À confirmer lors de notre échange.
                </p>
              </div>
              <details className={styles.resultWhy}>
                <summary>Pourquoi cette recommandation ?</summary>
                <ul>
                  <li>Votre priorité : {result.task.label.toLowerCase()}.</li>
                  {result.tools.length > 0 && (
                    <li>
                      Vos outils :{" "}
                      {result.tools.map((tool) => tool.label).join(", ")}.
                    </li>
                  )}
                  <li>
                    Nous tenons compte des règles propres à votre activité.
                  </li>
                </ul>
              </details>
              {result.duo && (
                <p>
                  En complément :{" "}
                  {TEAM.find((person) => person.type === result.duo)?.name} peut
                  prendre le relais sur d’autres tâches.
                </p>
              )}
              <button
                type="button"
                className={styles.primary}
                onClick={() =>
                  onContact({
                    source: "mobile-diagnostic",
                    need: result.outcome === "custom" ? "custom" : result.agent,
                    diagnostic: diagnosticSummary(answers, result),
                  })
                }
              >
                Parlons de ce résultat
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
                Recommencer
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
