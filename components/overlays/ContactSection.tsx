"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { AGENTS } from "@/components/experience/agents/agents.config";
import { ArrowRight, Check, Close, Doc, Replay, Sparkle } from "@/components/ui/Icons";
import { Logo } from "@/components/ui/Logo";
import { useInView } from "@/hooks/useInView";
import {
  CHANNELS,
  CONTACT_ID,
  CONTACT_INTRO,
  MESSAGE_HINTS,
  NEEDS,
  NEXT_STEPS,
  useContactIntent,
  type ChannelId,
  type NeedId,
} from "@/lib/contact";
import { scrollToElement } from "@/lib/experience/director";
import { LEGAL_HREF, PRIVACY_HREF } from "@/lib/legal";
import { TEAM } from "@/lib/team";
import { AGENTS_ID } from "./AgentsSection";
import styles from "./ContactSection.module.css";
import glass from "./Glass.module.css";
import head from "./SectionHead.module.css";

interface Values {
  name: string;
  email: string;
  company: string;
  phone: string;
  message: string;
  need: NeedId;
  channel: ChannelId;
  consent: boolean;
}

type FieldKey = "name" | "email" | "company" | "message" | "consent";

const INITIAL: Values = { name: "", email: "", company: "", phone: "", message: "", need: "unsure", channel: "visio", consent: false };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function validate(v: Values): Partial<Record<FieldKey, string>> {
  const e: Partial<Record<FieldKey, string>> = {};
  if (v.name.trim().length < 2) e.name = "Indiquez votre prénom et votre nom.";
  if (!EMAIL.test(v.email.trim())) e.email = "Cette adresse e-mail ne semble pas complète.";
  if (v.company.trim().length < 2) e.company = "Indiquez le nom de votre entreprise.";
  if (v.message.trim().length < 10) e.message = "Quelques mots sur votre projet (10 caractères minimum).";
  if (!v.consent) e.consent = "Nous avons besoin de votre accord pour vous recontacter.";
  return e;
}

const ORDER: FieldKey[] = ["name", "email", "company", "message", "consent"];

function Field({
  id,
  label,
  optional,
  error,
  multiline,
  children,
}: {
  id: string;
  label: string;
  optional?: boolean;
  error?: string;
  multiline?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={styles.field} data-invalid={!!error} data-multiline={multiline}>
      {children}
      <label htmlFor={id} className={styles.label}>
        {label}
        {optional && <span className={styles.optional}> · facultatif</span>}
      </label>
      <p id={`${id}-error`} className={styles.error} aria-live="polite">
        {error}
      </p>
    </div>
  );
}

/**
 * "Parlons de votre projet" — end of the visit, over the blurred lobby like the sections above.
 * Arrives pre-filled from the call to action used (agent, diagnostic result: see lib/contact). Floating
 * labels, errors on blur and on submit (focus moves to the first one), honeypot + fill time against bots,
 * then an animated confirmation with what happens next.
 */
export function ContactSection() {
  const uid = useId();
  const section = useRef<HTMLElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const inView = useInView(panel, 0.25);
  const intent = useContactIntent((s) => s.intent);
  const stamp = useContactIntent((s) => s.stamp);
  const clearDiagnostic = useContactIntent((s) => s.clearDiagnostic);
  const [values, setValues] = useState<Values>(INITIAL);
  const [touched, setTouched] = useState<Partial<Record<FieldKey, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [flash, setFlash] = useState(false);
  const shownAt = useRef(0);
  const honeypot = useRef<HTMLInputElement>(null);
  const successTitle = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    shownAt.current = Date.now();
  }, []);

  // A call to action brought the visitor here: pre-select their need and briefly highlight it.
  useEffect(() => {
    if (!intent) return;
    if (intent.need) setValues((v) => ({ ...v, need: intent.need! }));
    if (intent.message) setValues((v) => ({ ...v, message: intent.message! }));
    setStatus((s) => (s === "sent" ? s : "idle"));
    setSubmitted(false);
    setTouched({});
    setFlash(true);
    const t = window.setTimeout(() => setFlash(false), 1800);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- a new call to action = a new stamp
  }, [stamp]);

  // Deep link (/#contact, or /contact redirected here): jump once the agency has opened.
  useEffect(() => {
    if (window.location.hash !== `#${CONTACT_ID}`) return;
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

  useEffect(() => {
    if (status === "sent") successTitle.current?.focus({ preventScroll: true });
  }, [status]);

  const errors = validate(values);
  const shown = (k: FieldKey) => ((submitted || touched[k]) && errors[k]) || undefined;
  const set = <K extends keyof Values>(k: K, v: Values[K]) => setValues((s) => ({ ...s, [k]: v }));
  const blur = (k: FieldKey) => () => setTouched((t) => ({ ...t, [k]: true }));
  const id = (k: string) => `${uid}-${k}`;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    const first = ORDER.find((k) => errors[k]);
    if (first) {
      document.getElementById(id(first))?.focus();
      return;
    }
    setStatus("sending");
    const started = performance.now();
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...values,
          source: intent?.source ?? "direct",
          diagnostic: intent?.diagnostic ?? [],
          website: honeypot.current?.value ?? "",
          elapsed: Date.now() - shownAt.current,
        }),
      });
      // Let the sending state read as an action, not a flicker.
      await new Promise((r) => setTimeout(r, Math.max(0, 700 - (performance.now() - started))));
      setStatus(res.ok ? "sent" : "error");
    } catch {
      setStatus("error");
    }
  };

  const reset = () => {
    setValues((v) => ({ ...INITIAL, need: v.need }));
    setTouched({});
    setSubmitted(false);
    setStatus("idle");
    shownAt.current = Date.now();
  };

  const firstName = values.name.trim().split(/\s+/)[0] ?? "";
  // May welcomes visitors at the reception desk: she is the one who takes the request.
  const host = AGENTS.prospection;

  return (
    <section ref={section} id={CONTACT_ID} className={styles.contact} aria-labelledby="contact-title">
      <div className={styles.frame}>
        <header className={head.head}>
          <p className={head.kicker}>{CONTACT_INTRO.kicker}</p>
          <h2 id="contact-title" className={head.title}>
            <span className={head.line}>{CONTACT_INTRO.title[0]}</span>{" "}
            <span className={`${head.line} ${head.accent}`}>{CONTACT_INTRO.title[1]}</span>
          </h2>
          <p className={head.lead}>{CONTACT_INTRO.lead}</p>
        </header>

        <div ref={panel} className={`${styles.panel} ${glass.glass}`} data-glass={inView ? "in" : "out"} data-status={status}>
          {/* ——— Left: what happens next ——— */}
          <aside className={styles.aside} aria-labelledby={id("next")}>
            <p id={id("next")} className={styles.asideKicker}>
              Ce qui se passe ensuite
            </p>
            <ol className={styles.timeline} data-sent={status === "sent"}>
              {NEXT_STEPS.map((s, i) => (
                <li key={s.title} style={{ "--i": i } as React.CSSProperties} data-state={status === "sent" ? (i === 0 ? "done" : i === 1 ? "next" : "todo") : "todo"}>
                  <span className={styles.stepDot} aria-hidden="true">
                    {status === "sent" && i === 0 ? <Check size={14} /> : i + 1}
                  </span>
                  <span>
                    <strong>{s.title}</strong>
                    {s.text}
                  </span>
                </li>
              ))}
            </ol>
            <div className={styles.diva}>
              {/* eslint-disable-next-line @next/next/no-img-element -- avatar */}
              <img src={host.avatar} alt="" width={46} height={46} />
              <p>
                <strong>May, à l’accueil</strong>
                {status === "sent"
                  ? "C’est noté dans notre CRM ! L’équipe revient vers vous très vite."
                  : "Je transmets votre demande à l’équipe et je vous propose un créneau."}
              </p>
            </div>
          </aside>

          {/* ——— Right: the form, then the confirmation ——— */}
          <div className={styles.body}>
            {status === "sent" ? (
              <div className={styles.success}>
                <svg className={styles.successMark} viewBox="0 0 64 64" aria-hidden="true">
                  <circle cx="32" cy="32" r="29" pathLength={1} />
                  <path d="M20 33.5 28.5 42 45 24" pathLength={1} />
                </svg>
                <h3 ref={successTitle} tabIndex={-1} className={styles.successTitle}>
                  Merci{firstName ? ` ${firstName}` : ""} !
                </h3>
                <p className={styles.successText}>
                  Votre demande est bien arrivée. Nous vous répondons sous 24 h ouvrées à <strong>{values.email.trim()}</strong>
                  {values.channel === "visio" ? " pour caler notre visio." : values.channel === "phone" ? " pour convenir d’un appel." : "."}
                </p>
                <div className={styles.successActions}>
                  <button
                    type="button"
                    className={styles.secondary}
                    onClick={() => {
                      const agents = document.getElementById(AGENTS_ID);
                      if (agents) scrollToElement(agents);
                    }}
                  >
                    Revoir nos agents
                  </button>
                  <button type="button" className={styles.linkButton} onClick={reset}>
                    <Replay size={15} />
                    Envoyer une autre demande
                  </button>
                </div>
              </div>
            ) : (
              <form className={styles.form} noValidate onSubmit={submit}>
                <fieldset className={styles.needs} data-flash={flash}>
                  <legend className={styles.groupLabel}>Votre projet</legend>
                  <div className={styles.needList}>
                    {NEEDS.map((n) => {
                      const agent = n.agent ? TEAM.find((t) => t.type === n.agent)! : null;
                      const checked = values.need === n.id;
                      return (
                        <label key={n.id} className={styles.need} data-checked={checked}>
                          <input className={styles.hiddenInput} type="radio" name="need" value={n.id} checked={checked} onChange={() => set("need", n.id)} />
                          {agent ? (
                            // eslint-disable-next-line @next/next/no-img-element -- avatar
                            <img src={AGENTS[agent.type].avatar} alt="" width={26} height={26} />
                          ) : n.id === "custom" ? (
                            <span className={styles.needIcon} aria-hidden="true">
                              <Sparkle size={14} />
                            </span>
                          ) : null}
                          <span>
                            {agent && <strong>{agent.name} · </strong>}
                            {n.label}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </fieldset>

                {intent?.diagnostic?.length ? (
                  <div className={styles.attachment}>
                    <span className={styles.attachIcon} aria-hidden="true">
                      <Doc size={18} />
                    </span>
                    <div>
                      <strong>Votre diagnostic est joint à la demande</strong>
                      <ul>
                        {intent.diagnostic.map((l) => (
                          <li key={l}>{l}</li>
                        ))}
                      </ul>
                    </div>
                    <button type="button" className={styles.detach} onClick={clearDiagnostic} aria-label="Retirer le diagnostic de la demande">
                      <Close size={16} />
                    </button>
                  </div>
                ) : null}

                <div className={styles.grid}>
                  <Field id={id("name")} label="Prénom et nom" error={shown("name")}>
                    <input
                      id={id("name")}
                      className={styles.control}
                      type="text"
                      autoComplete="name"
                      placeholder=" "
                      value={values.name}
                      onChange={(e) => set("name", e.target.value)}
                      onBlur={blur("name")}
                      aria-invalid={!!shown("name")}
                      aria-describedby={`${id("name")}-error`}
                      required
                    />
                  </Field>
                  <Field id={id("email")} label="E-mail professionnel" error={shown("email")}>
                    <input
                      id={id("email")}
                      className={styles.control}
                      type="email"
                      autoComplete="email"
                      inputMode="email"
                      placeholder=" "
                      value={values.email}
                      onChange={(e) => set("email", e.target.value)}
                      onBlur={blur("email")}
                      aria-invalid={!!shown("email")}
                      aria-describedby={`${id("email")}-error`}
                      required
                    />
                  </Field>
                  <Field id={id("company")} label="Entreprise" error={shown("company")}>
                    <input
                      id={id("company")}
                      className={styles.control}
                      type="text"
                      autoComplete="organization"
                      placeholder=" "
                      value={values.company}
                      onChange={(e) => set("company", e.target.value)}
                      onBlur={blur("company")}
                      aria-invalid={!!shown("company")}
                      aria-describedby={`${id("company")}-error`}
                      required
                    />
                  </Field>
                  <Field id={id("phone")} label="Téléphone" optional>
                    <input
                      id={id("phone")}
                      className={styles.control}
                      type="tel"
                      autoComplete="tel"
                      placeholder=" "
                      value={values.phone}
                      onChange={(e) => set("phone", e.target.value)}
                    />
                  </Field>
                  <Field id={id("message")} label="Parlez-nous de votre projet" error={shown("message")} multiline>
                    <textarea
                      id={id("message")}
                      className={styles.control}
                      rows={4}
                      placeholder=" "
                      value={values.message}
                      onChange={(e) => set("message", e.target.value)}
                      onBlur={blur("message")}
                      aria-invalid={!!shown("message")}
                      aria-describedby={`${id("message")}-error ${id("hint")}`}
                      required
                    />
                    <span id={id("hint")} className={styles.hint} data-empty={!values.message}>
                      {MESSAGE_HINTS[values.need]}
                    </span>
                  </Field>
                </div>

                <div className={styles.bottom}>
                  <fieldset className={styles.channels}>
                    <legend className={styles.groupLabel}>Pour échanger, vous préférez</legend>
                    <div className={styles.segmented} style={{ "--active": CHANNELS.findIndex((c) => c.id === values.channel) } as React.CSSProperties}>
                      <span className={styles.thumb} aria-hidden="true" />
                      {CHANNELS.map((c) => (
                        <label key={c.id} data-checked={values.channel === c.id}>
                          <input className={styles.hiddenInput} type="radio" name="channel" value={c.id} checked={values.channel === c.id} onChange={() => set("channel", c.id)} />
                          {c.label}
                        </label>
                      ))}
                    </div>
                  </fieldset>

                  <div className={styles.consentWrap} data-invalid={!!shown("consent")}>
                    <label className={styles.consent}>
                      <input
                        id={id("consent")}
                        type="checkbox"
                        checked={values.consent}
                        onChange={(e) => {
                          set("consent", e.target.checked);
                          setTouched((t) => ({ ...t, consent: true }));
                        }}
                        aria-invalid={!!shown("consent")}
                        aria-describedby={`${id("consent")}-error`}
                      />
                      <span className={styles.box} aria-hidden="true">
                        <Check size={12} />
                      </span>
                      J’accepte que D2S AIgency utilise ces informations pour répondre à ma demande.
                    </label>
                    <p id={`${id("consent")}-error`} className={styles.error} aria-live="polite">
                      {shown("consent")}
                    </p>
                  </div>
                </div>

                {/* Honeypot: invisible to people, filled by bots. */}
                <input ref={honeypot} className={styles.honeypot} type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />

                <div className={styles.submitRow}>
                  <p className={styles.reassure}>
                    Gratuit · Sans engagement. Vos données servent uniquement à vous répondre et sont conservées 3 ans au plus.{" "}
                    <Link href={PRIVACY_HREF}>Vos droits et notre politique de confidentialité</Link>
                  </p>
                  {status === "error" && (
                    <p className={styles.failed} role="alert">
                      L’envoi n’a pas abouti. Vérifiez votre connexion et réessayez.
                    </p>
                  )}
                  <button type="submit" className={styles.submit} data-sending={status === "sending"} disabled={status === "sending"}>
                    <span>{status === "sending" ? "Envoi en cours…" : status === "error" ? "Réessayer" : "Envoyer ma demande"}</span>
                    {status === "sending" ? <span className={styles.spinner} aria-hidden="true" /> : <ArrowRight size={18} />}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        <footer className={styles.footer}>
          <Logo width={88} className={styles.footerLogo} />
          <nav className={styles.footerLinks} aria-label="Informations légales">
            <Link href={LEGAL_HREF}>Mentions légales</Link>
            <Link href={PRIVACY_HREF}>Confidentialité</Link>
          </nav>
          <p>© {new Date().getFullYear()} D2S AIgency · Agence d’agents IA</p>
        </footer>
      </div>
    </section>
  );
}
