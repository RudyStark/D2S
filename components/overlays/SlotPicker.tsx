"use client";

import { useLocale } from "@/components/i18n/LocaleProvider";
import { useEffect, useMemo, useState } from "react";
import styles from "./SlotPicker.module.css";

/*
 * Visio slot picker of the contact form: D2S's real free times from Calendly (/api/booking/slots), as a row of
 * days then the times of the chosen day. Optional: without a slot, the team proposes a date. Nothing from
 * Calendly is loaded in the page (no script, no cookie): only the list of times, through our own server.
 */

export interface PickedSlot {
  start: string;
  url: string;
  meetingId: string;
  /** "jeudi 24 septembre à 09:00", in the visitor's time zone. */
  label: string;
}

interface SlotsPayload {
  configured?: boolean;
  meeting?: { id: string; name: string; duration: number };
  slots?: { start: string; url: string }[];
}

const MAX_DAYS = 10;
const zone = () => Intl.DateTimeFormat().resolvedOptions().timeZone;
const dayKey = (iso: string, tz: string) => new Intl.DateTimeFormat("fr-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(iso));
const fmt = (lang: string, iso: string, tz: string, options: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat(lang, { timeZone: tz, ...options }).format(new Date(iso));

const TEXTS = {
  fr: {
    lang: "fr-FR",
    legend: "Choisissez votre créneau",
    optional: "· facultatif",
    meta: (duration: string, zone: string) => `Visio${duration ? ` · ${duration} min` : ""} · heure de ${zone}. Sans créneau, l’équipe vous propose une date.`,
    loading: "Chargement des créneaux",
    day: "Jour",
    times: (day: string) => `Horaires du ${day}`,
    at: "à",
    picked: "Visio le",
    clear: "Retirer",
  },
  en: {
    lang: "en-GB",
    legend: "Pick your time slot",
    optional: "· optional",
    meta: (duration: string, zone: string) => `Video call${duration ? ` · ${duration} min` : ""} · ${zone} time. Without a slot, the team will suggest a date.`,
    loading: "Loading the time slots",
    day: "Day",
    times: (day: string) => `Times on ${day}`,
    at: "at",
    picked: "Video call on",
    clear: "Remove",
  },
};

export function SlotPicker({
  active,
  value,
  onChange,
  variant = "desktop",
}: {
  active: boolean;
  value: PickedSlot | null;
  onChange: (slot: PickedSlot | null) => void;
  variant?: "desktop" | "mobile";
}) {
  const t = TEXTS[useLocale()];
  const lang = t.lang;
  const [data, setData] = useState<SlotsPayload | null>(null);
  const [failed, setFailed] = useState(false);
  const [day, setDay] = useState<string | null>(null);
  // Paris first, on the server and at hydration (the build runs in UTC: rendering the visitor's zone there made
  // "heure de UTC" vs "heure de Paris" — React error #418), then the visitor's real zone once mounted.
  const [tz, setTz] = useState("Europe/Paris");
  useEffect(() => setTz(zone()), []);

  // Fetched once, when the visio option is on screen.
  useEffect(() => {
    if (!active || data || failed) return;
    let live = true;
    fetch("/api/booking/slots")
      .then((r) => r.json() as Promise<SlotsPayload>)
      .then((payload) => live && setData(payload))
      .catch(() => live && setFailed(true));
    return () => {
      live = false;
    };
  }, [active, data, failed]);

  const days = useMemo(() => {
    const groups = new Map<string, { start: string; url: string }[]>();
    for (const slot of data?.slots ?? []) {
      const key = dayKey(slot.start, tz);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(slot);
    }
    return [...groups.entries()].slice(0, MAX_DAYS).map(([key, slots]) => ({ key, slots }));
  }, [data, tz]);

  const selectedDay = day ?? (value ? dayKey(value.start, tz) : null);
  const current = days.find((d) => d.key === selectedDay) ?? days[0];

  if (!active || failed || (data && (!data.configured || !days.length))) return null;

  const meeting = data?.meeting;
  return (
    <fieldset className={styles.picker} aria-busy={!data} data-variant={variant}>
      <legend className={styles.label}>
        {t.legend} <span className={styles.optional}>{t.optional}</span>
      </legend>
      <p className={styles.meta}>
        {t.meta(meeting ? String(meeting.duration) : "", tz === "Europe/Paris" ? "Paris" : (tz.split("/").at(-1)?.replace(/_/g, " ") ?? tz))}
      </p>

      {!data ? (
        <div className={styles.skeleton} aria-label={t.loading}>
          {Array.from({ length: 6 }, (_, i) => (
            <span key={i} />
          ))}
        </div>
      ) : (
        <>
          <div className={styles.days} role="radiogroup" aria-label={t.day}>
            {days.map((d) => {
              const checked = current?.key === d.key;
              const first = d.slots[0].start;
              return (
                <label key={d.key} className={styles.day} data-checked={checked}>
                  <input className={styles.hidden} type="radio" name="slot-day" checked={checked} onChange={() => setDay(d.key)} />
                  <span className={styles.weekday}>{fmt(lang, first, tz, { weekday: "short" }).replace(".", "")}</span>
                  <strong>{fmt(lang, first, tz, { day: "numeric" })}</strong>
                  <span className={styles.month}>{fmt(lang, first, tz, { month: "short" }).replace(".", "")}</span>
                </label>
              );
            })}
          </div>

          {current && (
            <div className={styles.times} role="radiogroup" aria-label={t.times(fmt(lang, current.slots[0].start, tz, { weekday: "long", day: "numeric", month: "long" }))}>
              {current.slots.map((s) => {
                const checked = value?.start === s.start;
                const label = `${fmt(lang, s.start, tz, { weekday: "long", day: "numeric", month: "long" })} ${t.at} ${fmt(lang, s.start, tz, { hour: "2-digit", minute: "2-digit" })}`;
                return (
                  <label key={s.start} className={styles.time} data-checked={checked}>
                    <input
                      className={styles.hidden}
                      type="radio"
                      name="slot-time"
                      checked={checked}
                      onChange={() => onChange({ start: s.start, url: s.url, meetingId: meeting!.id, label })}
                    />
                    {fmt(lang, s.start, tz, { hour: "2-digit", minute: "2-digit" })}
                  </label>
                );
              })}
            </div>
          )}

          {value && (
            <p className={styles.summary}>
              <span>
                {t.picked} <strong>{value.label}</strong>
              </span>
              <button type="button" className={styles.clear} onClick={() => onChange(null)}>
                {t.clear}
              </button>
            </p>
          )}
        </>
      )}
    </fieldset>
  );
}
