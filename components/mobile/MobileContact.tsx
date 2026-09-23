"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowRight, Check, Close } from "@/components/ui/Icons";
import {
  CHANNELS,
  CONTACT_INTRO,
  MESSAGE_HINTS,
  NEEDS,
  NEXT_STEPS,
  type ChannelId,
  type NeedId,
} from "@/lib/contact-content";
import { PRIVACY_HREF } from "@/lib/legal";
import { TEAM } from "@/lib/team";
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
function validate(values: Values): Partial<Record<Field, string>> {
  const errors: Partial<Record<Field, string>> = {};
  if (values.name.trim().length < 2)
    errors.name = "Indiquez votre prénom et votre nom.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(values.email.trim()))
    errors.email = "Indiquez une adresse e-mail complète.";
  if (values.company.trim().length < 2)
    errors.company = "Indiquez le nom de votre entreprise.";
  if (values.message.trim().length < 10)
    errors.message = "Décrivez votre besoin en 10 caractères minimum.";
  if (!values.consent)
    errors.consent = "Votre accord est nécessaire pour vous recontacter.";
  return errors;
}

export function MobileContact({
  intent,
  onClearDiagnostic,
}: {
  intent: MobileContactIntent | null;
  onClearDiagnostic: () => void;
}) {
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
  const errors = validate(values);
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
          website: honeypot.current?.value ?? "",
          elapsed: Date.now() - started.current,
        }),
      });
      if (!response.ok)
        throw new Error(
          response.status === 429
            ? "Trop de demandes rapprochées. Réessayez dans quelques minutes."
            : "Votre demande n’a pas pu être transmise. Vos informations sont conservées ici : réessayez dans un instant.",
        );
      const payload = (await response.json().catch(() => null)) as { booking?: { booked: boolean; confirmUrl?: string; label?: string } } | null;
      setBooking(payload?.booking ?? null);
      setStatus("sent");
    } catch (caught) {
      setStatus("error");
      setFailure(
        caught instanceof Error && caught.name !== "AbortError"
          ? caught.message
          : "La connexion a pris trop de temps. Vos informations sont conservées ici : réessayez.",
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
          <p className={styles.eyebrow}>Parlons de votre projet</p>
          <h2 id="mobile-contact-title" className={styles.title}>
            Faisons avancer
            <br />
            <span>votre projet.</span>
          </h2>
          <p className={styles.lead}>{CONTACT_INTRO.lead}</p>
        </div>
        {status === "sent" ? (
          <div className={styles.success} role="status">
            <span className={styles.roundIcon}>
              <Check size={30} />
            </span>
            <h3 ref={success} tabIndex={-1}>
              Merci {values.name.trim().split(/\s+/)[0]}, votre demande est
              envoyée.
            </h3>
            {booking?.booked ? (
              <p>
                Votre visio est réservée le <strong>{booking.label}</strong>. Vous recevez l’invitation et le lien de connexion par e-mail.
              </p>
            ) : booking?.confirmUrl ? (
              <>
                <p>
                  Dernière étape : confirmez votre visio du <strong>{booking.label}</strong>, vos informations sont déjà remplies.
                </p>
                <a className={styles.primary} href={booking.confirmUrl} target="_blank" rel="noopener noreferrer">
                  Confirmer mon créneau
                  <ArrowRight size={18} />
                </a>
              </>
            ) : (
              <p>Notre équipe revient vers vous sous 24 h ouvrées.</p>
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
              Une autre demande
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
                  <strong>Votre diagnostic est joint</strong>
                  <button
                    type="button"
                    aria-label="Retirer le diagnostic de la demande"
                    className={styles.iconButton}
                    onClick={onClearDiagnostic}
                  >
                    <Close size={18} />
                  </button>
                </div>
                <details>
                  <summary>Voir le résumé</summary>
                  <ul>
                    {intent.diagnostic.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                </details>
              </div>
            ) : null}
            <div className={styles.field}>
              <label htmlFor="mobile-contact-need">Votre besoin</label>
              <select
                id="mobile-contact-need"
                name="need"
                value={values.need}
                onChange={(e) => update("need", e.target.value as NeedId)}
              >
                {NEEDS.map((need) => (
                  <option key={need.id} value={need.id}>
                    {need.label}
                    {need.agent
                      ? ` · ${TEAM.find((person) => person.type === need.agent)?.name}`
                      : ""}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.field}>
              <label htmlFor="mobile-contact-name">Nom et prénom</label>
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
              <label htmlFor="mobile-contact-email">E-mail professionnel</label>
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
              <label htmlFor="mobile-contact-company">Entreprise</label>
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
              <label htmlFor="mobile-contact-message">Votre projet</label>
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
              <legend>Comment préférez-vous échanger ?</legend>
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
                Téléphone <span>· facultatif</span>
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
                Site web
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
                <span>
                  J’accepte que D2S AIgency me recontacte pour répondre à ma
                  demande.
                </span>
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
              {status === "sending" ? "Envoi en cours…" : "Envoyer ma demande"}
              <ArrowRight size={18} />
            </button>
            <p className={styles.privacyNote}>
              Vos données servent à traiter votre demande.{" "}
              <a href={PRIVACY_HREF}>En savoir plus sur leur utilisation.</a>
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
            <strong>Un échange humain,</strong>gratuit et sans engagement.
          </p>
        </div>
      </div>
    </section>
  );
}
