"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { ArrowRight, Check, Close } from "@/components/ui/Icons";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { directTopicsOf, type DirectTopicId } from "@/lib/contact-content";
import type { Locale } from "@/lib/i18n";
import { privacyHrefOf } from "@/lib/legal";
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

const TEXTS = {
  fr: {
    errors: {
      name: "Indiquez votre prénom et votre nom.",
      email: "Cette adresse e-mail ne semble pas complète.",
      message: "Quelques mots de plus, s’il vous plaît (10 caractères minimum).",
      consent: "Votre accord est nécessaire pour vous répondre.",
    },
    tooMany: "Trop de messages rapprochés : réessayez dans quelques minutes.",
    failed: "L’envoi n’a pas abouti. Votre message est conservé : réessayez dans un instant.",
    offline: "Connexion impossible. Votre message est conservé : réessayez.",
    close: "Fermer",
    thanks: (n: string) => `Merci${n ? ` ${n}` : ""} !`,
    sent: "Votre message est bien arrivé. L’équipe vous répond sous 24 h ouvrées à",
    kicker: "Contact direct",
    title: ["Écrivez-", "nous."],
    lead: "Une question, un partenariat, la presse… Votre message arrive directement à l’équipe.",
    topic: "Votre sujet",
    name: "Prénom et nom",
    email: "E-mail",
    company: "Entreprise",
    phone: "Téléphone",
    optional: "· facultatif",
    message: "Votre message",
    consent: "J’accepte que D2S AIgency utilise ces informations pour répondre à mon message.",
    privacy: "Confidentialité",
    sending: "Envoi en cours…",
    send: "Envoyer le message",
  },
  en: {
    errors: {
      name: "Please enter your first and last name.",
      email: "This e-mail address does not look complete.",
      message: "A few more words, please (10 characters minimum).",
      consent: "We need your consent to reply to you.",
    },
    tooMany: "Too many messages in a row: try again in a few minutes.",
    failed: "Sending failed. Your message is kept: try again in a moment.",
    offline: "No connection. Your message is kept: try again.",
    close: "Close",
    thanks: (n: string) => `Thank you${n ? ` ${n}` : ""}!`,
    sent: "Your message has arrived. The team will reply within one business day at",
    kicker: "Direct contact",
    title: ["Write to ", "us."],
    lead: "A question, a partnership, the press… Your message goes straight to the team.",
    topic: "Your topic",
    name: "First and last name",
    email: "E-mail",
    company: "Company",
    phone: "Phone",
    optional: "· optional",
    message: "Your message",
    consent: "I agree that D2S AIgency may use this information to reply to my message.",
    privacy: "Privacy",
    sending: "Sending…",
    send: "Send the message",
  },
};

function validate(v: Values, locale: Locale): Partial<Record<Field, string>> {
  const e: Partial<Record<Field, string>> = {};
  const m = TEXTS[locale].errors;
  if (v.name.trim().length < 2) e.name = m.name;
  if (!EMAIL.test(v.email.trim())) e.email = m.email;
  if (v.message.trim().length < 10) e.message = m.message;
  if (!v.consent) e.consent = m.consent;
  return e;
}

export function ContactDialog({ open, onClose, onLock }: { open: boolean; onClose: () => void; onLock?: (locked: boolean) => void }) {
  const locale = useLocale();
  const t = TEXTS[locale];
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

  const errors = validate(values, locale);
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
        body: JSON.stringify({ ...values, locale, website: honeypot.current?.value ?? "", elapsed: Date.now() - shownAt.current }),
      });
      await new Promise((r) => setTimeout(r, Math.max(0, 600 - (performance.now() - started))));
      if (!res.ok) throw new Error(res.status === 429 ? t.tooMany : t.failed);
      setStatus("sent");
    } catch (error) {
      setStatus("error");
      setFailure(error instanceof Error && error.message && !(error instanceof TypeError) ? error.message : t.offline);
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
        <button type="button" className={styles.close} aria-label={t.close} onClick={() => dialog.current?.close()}>
          <Close size={18} />
        </button>

        {status === "sent" ? (
          <div className={styles.success} role="status">
            <svg className={styles.successMark} viewBox="0 0 64 64" aria-hidden="true">
              <circle cx="32" cy="32" r="29" pathLength={1} />
              <path d="M20 33.5 28.5 42 45 24" pathLength={1} />
            </svg>
            <h2 ref={successTitle} tabIndex={-1} className={styles.successTitle}>
              {t.thanks(firstName)}
            </h2>
            <p className={styles.successText}>
              {t.sent} <strong>{values.email.trim()}</strong>.
            </p>
            <button type="button" className={styles.submit} onClick={() => dialog.current?.close()}>
              {t.close}
            </button>
          </div>
        ) : (
          <form className={styles.form} noValidate onSubmit={submit}>
            <header className={styles.head}>
              <p className={styles.kicker}>{t.kicker}</p>
              <h2 id={id("title")} className={styles.title}>
                {t.title[0]}
                <span>{t.title[1]}</span>
              </h2>
              <p className={styles.lead}>{t.lead}</p>
            </header>

            <fieldset className={styles.topics}>
              <legend className={styles.label}>{t.topic}</legend>
              <div className={styles.topicList}>
                {directTopicsOf(locale).map((tp) => (
                  <label key={tp.id} className={styles.topic} data-checked={values.topic === tp.id}>
                    <input className={styles.hidden} type="radio" name="topic" value={tp.id} checked={values.topic === tp.id} onChange={() => set("topic", tp.id)} />
                    {tp.label}
                  </label>
                ))}
              </div>
            </fieldset>

            <div className={styles.grid}>
              <div className={styles.field} data-invalid={!!shown("name")}>
                <label htmlFor={id("name")}>{t.name}</label>
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
                <label htmlFor={id("email")}>{t.email}</label>
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
                  {t.company} <span>{t.optional}</span>
                </label>
                <input id={id("company")} autoComplete="organization" value={values.company} onChange={(e) => set("company", e.target.value)} maxLength={160} />
              </div>
              <div className={styles.field}>
                <label htmlFor={id("phone")}>
                  {t.phone} <span>{t.optional}</span>
                </label>
                <input id={id("phone")} type="tel" autoComplete="tel" inputMode="tel" value={values.phone} onChange={(e) => set("phone", e.target.value)} maxLength={40} />
              </div>
              <div className={`${styles.field} ${styles.wide}`} data-invalid={!!shown("message")}>
                <label htmlFor={id("message")}>{t.message}</label>
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
                  {t.consent} <Link href={privacyHrefOf(locale)}>{t.privacy}</Link>
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
                <span>{status === "sending" ? t.sending : t.send}</span>
                {status === "sending" ? <span className={styles.spinner} aria-hidden="true" /> : <ArrowRight size={18} />}
              </button>
            </div>
          </form>
        )}
      </div>
    </dialog>
  );
}
