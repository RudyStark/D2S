"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { ArrowRight, Check, Close } from "@/components/ui/Icons";
import {
  channelsOf,
  contactIntroOf,
  messageHintsOf,
  needsOf,
  nextStepsOf,
  type ChannelId,
  type NeedId,
} from "@/lib/contact-content";
import type { Locale } from "@/lib/i18n";
import { privacyHrefOf } from "@/lib/legal";
import { SlotPicker, type PickedSlot } from "@/components/overlays/SlotPicker";
import type { MobileContactIntent } from "./mobile-navigation";
import styles from "./MobileHome.module.css";

type Values = {
  need: NeedId;
  name: string;
  email: string;
  company: string;
  phone: string;
  message: string;
  channel: ChannelId;
  consent: boolean;
};
type Field = "name" | "email" | "company" | "message" | "consent";
const INITIAL: Values = {
  need: "unsure",
  name: "",
  email: "",
  company: "",
  phone: "",
  message: "",
  channel: "visio",
  consent: false,
};
const ORDER: Field[] = ["name", "email", "company", "message", "consent"];
const TEXTS = {
  fr: {
    errors: {
      name: "Indiquez votre prénom et votre nom.",
      email: "Indiquez une adresse e-mail complète.",
      company: "Indiquez le nom de votre entreprise.",
      message: "Décrivez votre besoin en 10 caractères minimum.",
      consent: "Votre accord est nécessaire pour vous recontacter.",
    },
    tooMany: "Trop de demandes rapprochées. Réessayez dans quelques minutes.",
    failed: "Votre demande n’a pas pu être transmise. Vos informations sont conservées ici : réessayez dans un instant.",
    slow: "La connexion a pris trop de temps. Vos informations sont conservées ici : réessayez.",
    kicker: "Parlons de votre projet",
    title: ["Faisons avancer", "votre projet."],
    thanks: (n: string) => `Merci ${n}, votre demande est envoyée.`,
    booked: (label: string) => (
      <>
        Votre visio est réservée le <strong>{label}</strong>. Vous recevez l’invitation et le lien de connexion par e-mail.
      </>
    ),
    toConfirm: (label: string) => (
      <>
        Dernière étape : confirmez votre visio du <strong>{label}</strong>, vos informations sont déjà remplies.
      </>
    ),
    confirm: "Confirmer mon créneau",
    received: "Notre équipe revient vers vous sous 24 h ouvrées.",
    another: "Une autre demande",
    attached: "Votre diagnostic est joint",
    detach: "Retirer le diagnostic de la demande",
    summary: "Voir le résumé",
    need: "Votre besoin",
    team: "Toute l’équipe",
    name: "Nom et prénom",
    email: "E-mail professionnel",
    company: "Entreprise",
    project: "Votre projet",
    channel: "Comment préférez-vous échanger ?",
    phone: "Téléphone",
    optional: "· facultatif",
    website: "Site web",
    consent: "J’accepte que D2S AIgency me recontacte pour répondre à ma demande.",
    sending: "Envoi en cours…",
    send: "Envoyer ma demande",
    privacy: "Vos données servent à traiter votre demande.",
    more: "En savoir plus sur leur utilisation.",
    human: "Un échange humain,",
    free: "gratuit et sans engagement.",
  },
  en: {
    errors: {
      name: "Please enter your first and last name.",
      email: "Please enter a complete e-mail address.",
      company: "Please enter your company name.",
      message: "Describe your need in 10 characters minimum.",
      consent: "We need your consent to get back to you.",
    },
    tooMany: "Too many requests in a row. Try again in a few minutes.",
    failed: "Your request could not be sent. Your details are kept here: try again in a moment.",
    slow: "The connection took too long. Your details are kept here: try again.",
    kicker: "Let’s talk about your project",
    title: ["Let’s move", "your project forward."],
    thanks: (n: string) => `Thank you ${n}, your request has been sent.`,
    booked: (label: string) => (
      <>
        Your video call is booked for <strong>{label}</strong>. You will receive the invitation and the joining link by e-mail.
      </>
    ),
    toConfirm: (label: string) => (
      <>
        One last step: confirm your video call on <strong>{label}</strong>, your details are already filled in.
      </>
    ),
    confirm: "Confirm my slot",
    received: "Our team will get back to you within one business day.",
    another: "Another request",
    attached: "Your diagnostic is attached",
    detach: "Remove the diagnostic from the request",
    summary: "See the summary",
    need: "Your need",
    team: "The whole team",
    name: "Full name",
    email: "Work e-mail",
    company: "Company",
    project: "Your project",
    channel: "How do you prefer to talk?",
    phone: "Phone",
    optional: "· optional",
    website: "Website",
    consent: "I agree that D2S AIgency may contact me to reply to my request.",
    sending: "Sending…",
    send: "Send my request",
    privacy: "Your data is used to handle your request.",
    more: "Learn more about how it is used.",
    human: "A human conversation,",
    free: "free and with no commitment.",
  },
};

function validate(values: Values, locale: Locale): Partial<Record<Field, string>> {
  const errors: Partial<Record<Field, string>> = {};
  const m = TEXTS[locale].errors;
  if (values.name.trim().length < 2) errors.name = m.name;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(values.email.trim())) errors.email = m.email;
  if (values.company.trim().length < 2) errors.company = m.company;
  if (values.message.trim().length < 10) errors.message = m.message;
  if (!values.consent) errors.consent = m.consent;
  return errors;
}

export function MobileContact({
  intent,
  onClearDiagnostic,
}: {
  intent: MobileContactIntent | null;
  onClearDiagnostic: () => void;
}) {
  const locale = useLocale();
  const t = TEXTS[locale];
  const NEEDS = needsOf(locale);
  const CHANNELS = channelsOf(locale);
  const MESSAGE_HINTS = messageHintsOf(locale);
  const NEXT_STEPS = nextStepsOf(locale);
  const CONTACT_INTRO = contactIntroOf(locale);
  const [values, setValues] = useState<Values>(INITIAL);
  const [touched, setTouched] = useState<Partial<Record<Field, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );
  const [failure, setFailure] = useState("");
  // Visio slot picked in the form (same Calendly booking as on desktop), and what happened to it.
  const [slot, setSlot] = useState<PickedSlot | null>(null);
  const [booking, setBooking] = useState<{ booked: boolean; confirmUrl?: string; label?: string } | null>(null);
  const started = useRef(0);
  const honeypot = useRef<HTMLInputElement>(null);
  const success = useRef<HTMLHeadingElement>(null);
  const pending = useRef<AbortController | null>(null);
  const errors = validate(values, locale);
  const update = <K extends keyof Values>(key: K, value: Values[K]) =>
    setValues((current) => ({ ...current, [key]: value }));
  const error = (key: Field) =>
    submitted || touched[key] ? errors[key] : undefined;
  const fieldProps = (key: Field) => ({
    id: `mobile-contact-${key}`,
    "aria-invalid": !!error(key),
    "aria-describedby": error(key) ? `mobile-contact-${key}-error` : undefined,
    onBlur: () => setTouched((current) => ({ ...current, [key]: true })),
  });

  useEffect(() => {
    started.current = Date.now();
    return () => pending.current?.abort();
  }, []);
  useEffect(() => {
    if (!intent) return;
    setValues((current) => ({
      ...current,
      ...(intent.need ? { need: intent.need } : {}),
      ...(intent.message ? { message: intent.message } : {}),
    }));
    setSubmitted(false);
    setTouched({});
    setStatus((current) => (current === "sent" ? current : "idle"));
    // Removing a diagnostic does not overwrite fields the visitor has already edited.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intent?.stamp]);
  useEffect(() => {
    if (status === "sent") success.current?.focus({ preventScroll: true });
  }, [status]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (status === "sending" || pending.current) return;
    setSubmitted(true);
    const first = ORDER.find((key) => errors[key]);
    if (first) {
      document.getElementById(`mobile-contact-${first}`)?.focus();
      return;
    }
    setStatus("sending");
    setFailure("");
    const controller = new AbortController();
    pending.current = controller;
    const timeout = window.setTimeout(() => controller.abort(), 15_000);
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          ...values,
          source: intent?.source ?? "mobile-direct",
          diagnostic: intent?.diagnostic ?? [],
          slot: values.channel === "visio" && slot ? { start: slot.start, url: slot.url, meetingId: slot.meetingId } : undefined,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          locale,
          website: honeypot.current?.value ?? "",
          elapsed: Date.now() - started.current,
        }),
      });
      if (!response.ok)
        throw new Error(
          response.status === 429
            ? t.tooMany
            : t.failed,
        );
      const payload = (await response.json().catch(() => null)) as { booking?: { booked: boolean; confirmUrl?: string; label?: string } } | null;
      setBooking(payload?.booking ?? null);
      setStatus("sent");
    } catch (caught) {
      setStatus("error");
      setFailure(
        caught instanceof Error && caught.name !== "AbortError"
          ? caught.message
          : t.slow,
      );
    } finally {
      window.clearTimeout(timeout);
      pending.current = null;
    }
  };

  return (
    <section
      id="contact"
      tabIndex={-1}
      className={`${styles.section} ${styles.tinted}`}
      data-mobile-section
      aria-labelledby="mobile-contact-title"
    >
      <div className={styles.inner}>
        <div data-reveal>
          <p className={styles.eyebrow}>{t.kicker}</p>
          <h2 id="mobile-contact-title" className={styles.title}>
            {t.title[0]}
            <br />
            <span>{t.title[1]}</span>
          </h2>
          <p className={styles.lead}>{CONTACT_INTRO.lead}</p>
        </div>
        {status === "sent" ? (
          <div className={styles.success} role="status">
            <span className={styles.roundIcon}>
              <Check size={30} />
            </span>
            <h3 ref={success} tabIndex={-1}>
              {t.thanks(values.name.trim().split(/\s+/)[0])}
            </h3>
            {booking?.booked ? (
              <p>{t.booked(booking.label ?? "")}</p>
            ) : booking?.confirmUrl ? (
              <>
                <p>{t.toConfirm(booking.label ?? "")}</p>
                <a className={styles.primary} href={booking.confirmUrl} target="_blank" rel="noopener noreferrer">
                  {t.confirm}
                  <ArrowRight size={18} />
                </a>
              </>
            ) : (
              <p>{t.received}</p>
            )}
            <ol>
              {NEXT_STEPS.map((step) => (
                <li key={step.title}>
                  <strong>{step.title}</strong>
                  <p>{step.text}</p>
                </li>
              ))}
            </ol>
            <button
              type="button"
              className={styles.secondary}
              onClick={() => {
                setValues(INITIAL);
                setSlot(null);
                setBooking(null);
                setStatus("idle");
                setSubmitted(false);
                setTouched({});
                onClearDiagnostic();
                started.current = Date.now();
              }}
            >
              {t.another}
            </button>
          </div>
        ) : (
          <form
            className={styles.contactForm}
            onSubmit={submit}
            noValidate
            aria-busy={status === "sending"}
          >
            {intent?.diagnostic?.length ? (
              <div className={styles.diagnosticAttachment}>
                <div>
                  <strong>{t.attached}</strong>
                  <button
                    type="button"
                    aria-label={t.detach}
                    className={styles.iconButton}
                    onClick={onClearDiagnostic}
                  >
                    <Close size={18} />
                  </button>
                </div>
                <details>
                  <summary>{t.summary}</summary>
                  <ul>
                    {intent.diagnostic.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                </details>
              </div>
            ) : null}
            <div className={styles.field}>
              <label htmlFor="mobile-contact-need">{t.need}</label>
              <select
                id="mobile-contact-need"
                name="need"
                value={values.need}
                onChange={(e) => update("need", e.target.value as NeedId)}
              >
                {NEEDS.filter((need) => !need.team).map((need) => (
                  <option key={need.id} value={need.id}>
                    {need.label}
                    {need.name ? ` · ${need.name}` : ""}
                  </option>
                ))}
                <optgroup label={t.team}>
                  {NEEDS.filter((need) => need.team).map((need) => (
                    <option key={need.id} value={need.id}>
                      {need.label} · {need.name}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>
            <div className={styles.field}>
              <label htmlFor="mobile-contact-name">{t.name}</label>
              <input
                {...fieldProps("name")}
                name="name"
                autoComplete="name"
                required
                maxLength={120}
                value={values.name}
                onChange={(e) => update("name", e.target.value)}
              />
              {error("name") && (
                <p id="mobile-contact-name-error" className={styles.error}>
                  {error("name")}
                </p>
              )}
            </div>
            <div className={styles.field}>
              <label htmlFor="mobile-contact-email">{t.email}</label>
              <input
                {...fieldProps("email")}
                name="email"
                type="email"
                autoComplete="email"
                inputMode="email"
                required
                maxLength={200}
                value={values.email}
                onChange={(e) => update("email", e.target.value)}
              />
              {error("email") && (
                <p id="mobile-contact-email-error" className={styles.error}>
                  {error("email")}
                </p>
              )}
            </div>
            <div className={styles.field}>
              <label htmlFor="mobile-contact-company">{t.company}</label>
              <input
                {...fieldProps("company")}
                name="company"
                autoComplete="organization"
                required
                maxLength={160}
                value={values.company}
                onChange={(e) => update("company", e.target.value)}
              />
              {error("company") && (
                <p id="mobile-contact-company-error" className={styles.error}>
                  {error("company")}
                </p>
              )}
            </div>
            <div className={styles.field}>
              <label htmlFor="mobile-contact-message">{t.project}</label>
              <textarea
                {...fieldProps("message")}
                name="message"
                rows={4}
                required
                maxLength={4000}
                placeholder={MESSAGE_HINTS[values.need]}
                value={values.message}
                onChange={(e) => update("message", e.target.value)}
              />
              {error("message") && (
                <p id="mobile-contact-message-error" className={styles.error}>
                  {error("message")}
                </p>
              )}
            </div>
            <fieldset className={styles.channelField}>
              <legend>{t.channel}</legend>
              <div>
                {CHANNELS.map((channel) => (
                  <label
                    key={channel.id}
                    data-checked={values.channel === channel.id}
                  >
                    <input
                      type="radio"
                      name="channel"
                      value={channel.id}
                      checked={values.channel === channel.id}
                      onChange={() => update("channel", channel.id)}
                    />
                    {channel.label}
                  </label>
                ))}
              </div>
            </fieldset>
            <SlotPicker variant="mobile" active={values.channel === "visio"} value={slot} onChange={setSlot} />
            <div className={styles.field}>
              <label htmlFor="mobile-contact-phone">
                {t.phone} <span>{t.optional}</span>
              </label>
              <input
                id="mobile-contact-phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                inputMode="tel"
                maxLength={40}
                value={values.phone}
                onChange={(e) => update("phone", e.target.value)}
              />
            </div>
            <div className={styles.honeypot} aria-hidden="true">
              <label htmlFor="mobile-contact-website">
                {t.website}
                <input
                  ref={honeypot}
                  id="mobile-contact-website"
                  name="website"
                  tabIndex={-1}
                  autoComplete="off"
                />
              </label>
            </div>
            <div>
              <label className={styles.consent}>
                <input
                  {...fieldProps("consent")}
                  name="consent"
                  type="checkbox"
                  required
                  checked={values.consent}
                  onChange={(e) => update("consent", e.target.checked)}
                />
                <span>{t.consent}</span>
              </label>
              {error("consent") && (
                <p id="mobile-contact-consent-error" className={styles.error}>
                  {error("consent")}
                </p>
              )}
            </div>
            {status === "error" && (
              <p className={styles.submitError} role="alert">
                {failure}
              </p>
            )}
            <button
              type="submit"
              className={styles.primary}
              disabled={status === "sending"}
            >
              {status === "sending" ? t.sending : t.send}
              <ArrowRight size={18} />
            </button>
            <p className={styles.privacyNote}>
              {t.privacy} <a href={privacyHrefOf(locale)}>{t.more}</a>
            </p>
          </form>
        )}
        <div className={styles.contactHuman}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/agents/prospection-avatar.webp"
            width={52}
            height={52}
            alt="May"
            loading="lazy"
          />
          <p>
            <strong>{t.human}</strong> {t.free}
          </p>
        </div>
      </div>
    </section>
  );
}
