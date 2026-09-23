"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { ArrowRight, Check, Close } from "@/components/ui/Icons";
import { DIRECT_TOPICS, type DirectTopicId } from "@/lib/contact-content";
import { PRIVACY_HREF } from "@/lib/legal";
import styles from "./ContactDialog.module.css";

/*
 * The menu's "Contact": a direct message to the team (topic + message), in a native <dialog> (top layer, page
 * inert, focus kept inside, Escape closes). Sent to /api/message → rudy.saksik@d2saigency.com, acknowledged by May.
 * No WebGL dependency: shared by the desktop header and the mobile menu. `onLock` freezes the page scroll
 * (desktop: the Lenis director); without it, the page's own overflow is locked.
 */

interface Values {
  topic: DirectTopicId;
  name: string;
  email: string;
  company: string;
  phone: string;
  message: string;
  consent: boolean;
}

type Field = "name" | "email" | "message" | "consent";
const INITIAL: Values = { topic: "project", name: "", email: "", company: "", phone: "", message: "", consent: false };
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const ORDER: Field[] = ["name", "email", "message", "consent"];

function validate(v: Values): Partial<Record<Field, string>> {
  const e: Partial<Record<Field, string>> = {};
  if (v.name.trim().length < 2) e.name = "Indiquez votre prénom et votre nom.";
  if (!EMAIL.test(v.email.trim())) e.email = "Cette adresse e-mail ne semble pas complète.";
  if (v.message.trim().length < 10) e.message = "Quelques mots de plus, s’il vous plaît (10 caractères minimum).";
  if (!v.consent) e.consent = "Votre accord est nécessaire pour vous répondre.";
  return e;
}

export function ContactDialog({ open, onClose, onLock }: { open: boolean; onClose: () => void; onLock?: (locked: boolean) => void }) {
  const uid = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  const honeypot = useRef<HTMLInputElement>(null);
  const shownAt = useRef(0);
  const successTitle = useRef<HTMLHeadingElement>(null);
  const [values, setValues] = useState<Values>(INITIAL);
  const [touched, setTouched] = useState<Partial<Record<Field, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [failure, setFailure] = useState("");

  const lock = (locked: boolean) => {
    if (onLock) onLock(locked);
    else document.documentElement.style.overflow = locked ? "hidden" : "";
  };

  // Open / close follows the prop; the native close (Escape, backdrop, button) reports back through onClose.
  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (open && !d.open) {
      shownAt.current = Date.now();
      d.showModal();
      lock(true);
    } else if (!open && d.open) d.close();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- lock only follows `open`
  }, [open]);

  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    const onNativeClose = () => {
      lock(false);
      onClose();
      // A sent message is done: the next opening starts a fresh one.
      setStatus((s) => {
        if (s === "sent") {
          setValues((v) => ({ ...INITIAL, topic: v.topic }));
          setTouched({});
          setSubmitted(false);
          return "idle";
        }
        return s;
      });
    };
    d.addEventListener("close", onNativeClose);
    return () => d.removeEventListener("close", onNativeClose);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- stable handlers
  }, [onClose]);

  useEffect(() => {
    if (status === "sent") successTitle.current?.focus({ preventScroll: true });
  }, [status]);

  const errors = validate(values);
  const shown = (k: Field) => ((submitted || touched[k]) && errors[k]) || undefined;
  const set = <K extends keyof Values>(k: K, v: Values[K]) => setValues((s) => ({ ...s, [k]: v }));
  const blur = (k: Field) => () => setTouched((t) => ({ ...t, [k]: true }));
  const id = (k: string) => `${uid}-${k}`;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (status === "sending") return;
    setSubmitted(true);
    const first = ORDER.find((k) => errors[k]);
    if (first) {
      document.getElementById(id(first))?.focus();
      return;
    }
    setStatus("sending");
    setFailure("");
    const started = performance.now();
    try {
      const res = await fetch("/api/message", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...values, website: honeypot.current?.value ?? "", elapsed: Date.now() - shownAt.current }),
      });
      await new Promise((r) => setTimeout(r, Math.max(0, 600 - (performance.now() - started))));
      if (!res.ok) throw new Error(res.status === 429 ? "Trop de messages rapprochés : réessayez dans quelques minutes." : "L’envoi n’a pas abouti. Votre message est conservé : réessayez dans un instant.");
      setStatus("sent");
    } catch (error) {
      setStatus("error");
      setFailure(error instanceof Error && error.message && !(error instanceof TypeError) ? error.message : "Connexion impossible. Votre message est conservé : réessayez.");
    }
  };

  const firstName = values.name.trim().split(/\s+/)[0] ?? "";

  return (
    <dialog
      ref={dialog}
      className={styles.dialog}
      aria-labelledby={id("title")}
      onClick={(e) => {
        if (e.target === dialog.current) dialog.current?.close();
      }}
    >
      <div className={styles.panel} data-lenis-prevent>
        <button type="button" className={styles.close} aria-label="Fermer" onClick={() => dialog.current?.close()}>
          <Close size={18} />
        </button>

        {status === "sent" ? (
          <div className={styles.success} role="status">
            <svg className={styles.successMark} viewBox="0 0 64 64" aria-hidden="true">
              <circle cx="32" cy="32" r="29" pathLength={1} />
              <path d="M20 33.5 28.5 42 45 24" pathLength={1} />
            </svg>
            <h2 ref={successTitle} tabIndex={-1} className={styles.successTitle}>
              Merci{firstName ? ` ${firstName}` : ""} !
            </h2>
            <p className={styles.successText}>
              Votre message est bien arrivé. L’équipe vous répond sous 24 h ouvrées à <strong>{values.email.trim()}</strong>.
            </p>
            <button type="button" className={styles.submit} onClick={() => dialog.current?.close()}>
              Fermer
            </button>
          </div>
        ) : (
          <form className={styles.form} noValidate onSubmit={submit}>
            <header className={styles.head}>
              <p className={styles.kicker}>Contact direct</p>
              <h2 id={id("title")} className={styles.title}>
                Écrivez-<span>nous.</span>
              </h2>
              <p className={styles.lead}>Une question, un partenariat, la presse… Votre message arrive directement à l’équipe.</p>
            </header>

            <fieldset className={styles.topics}>
              <legend className={styles.label}>Votre sujet</legend>
              <div className={styles.topicList}>
                {DIRECT_TOPICS.map((t) => (
                  <label key={t.id} className={styles.topic} data-checked={values.topic === t.id}>
                    <input className={styles.hidden} type="radio" name="topic" value={t.id} checked={values.topic === t.id} onChange={() => set("topic", t.id)} />
                    {t.label}
                  </label>
                ))}
              </div>
            </fieldset>

            <div className={styles.grid}>
              <div className={styles.field} data-invalid={!!shown("name")}>
                <label htmlFor={id("name")}>Prénom et nom</label>
                <input
                  id={id("name")}
                  autoComplete="name"
                  value={values.name}
                  onChange={(e) => set("name", e.target.value)}
                  onBlur={blur("name")}
                  aria-invalid={!!shown("name")}
                  aria-describedby={`${id("name")}-error`}
                  maxLength={120}
                />
                <p id={`${id("name")}-error`} className={styles.error}>
                  {shown("name")}
                </p>
              </div>
              <div className={styles.field} data-invalid={!!shown("email")}>
                <label htmlFor={id("email")}>E-mail</label>
                <input
                  id={id("email")}
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  value={values.email}
                  onChange={(e) => set("email", e.target.value)}
                  onBlur={blur("email")}
                  aria-invalid={!!shown("email")}
                  aria-describedby={`${id("email")}-error`}
                  maxLength={200}
                />
                <p id={`${id("email")}-error`} className={styles.error}>
                  {shown("email")}
                </p>
              </div>
              <div className={styles.field}>
                <label htmlFor={id("company")}>
                  Entreprise <span>· facultatif</span>
                </label>
                <input id={id("company")} autoComplete="organization" value={values.company} onChange={(e) => set("company", e.target.value)} maxLength={160} />
              </div>
              <div className={styles.field}>
                <label htmlFor={id("phone")}>
                  Téléphone <span>· facultatif</span>
                </label>
                <input id={id("phone")} type="tel" autoComplete="tel" inputMode="tel" value={values.phone} onChange={(e) => set("phone", e.target.value)} maxLength={40} />
              </div>
              <div className={`${styles.field} ${styles.wide}`} data-invalid={!!shown("message")}>
                <label htmlFor={id("message")}>Votre message</label>
                <textarea
                  id={id("message")}
                  rows={5}
                  value={values.message}
                  onChange={(e) => set("message", e.target.value)}
                  onBlur={blur("message")}
                  aria-invalid={!!shown("message")}
                  aria-describedby={`${id("message")}-error`}
                  maxLength={4_000}
                />
                <p id={`${id("message")}-error`} className={styles.error}>
                  {shown("message")}
                </p>
              </div>
            </div>

            <div className={styles.consentWrap}>
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
                <span>
                  J’accepte que D2S AIgency utilise ces informations pour répondre à mon message. <Link href={PRIVACY_HREF}>Confidentialité</Link>
                </span>
              </label>
              <p id={`${id("consent")}-error`} className={styles.error}>
                {shown("consent")}
              </p>
            </div>

            {/* Honeypot: invisible to people, filled by bots. */}
            <input ref={honeypot} className={styles.honeypot} type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />

            <div className={styles.actions}>
              {status === "error" && (
                <p className={styles.failed} role="alert">
                  {failure}
                </p>
              )}
              <button type="submit" className={styles.submit} disabled={status === "sending"} data-sending={status === "sending"}>
                <span>{status === "sending" ? "Envoi en cours…" : "Envoyer le message"}</span>
                {status === "sending" ? <span className={styles.spinner} aria-hidden="true" /> : <ArrowRight size={18} />}
              </button>
            </div>
          </form>
        )}
      </div>
    </dialog>
  );
}
