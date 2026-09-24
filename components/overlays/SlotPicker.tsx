"use client";

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
const fmt = (iso: string, tz: string, options: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("fr-FR", { timeZone: tz, ...options }).format(new Date(iso));

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
        Choisissez votre créneau <span className={styles.optional}>· facultatif</span>
      </legend>
      <p className={styles.meta}>
        Visio{meeting ? ` · ${meeting.duration} min` : ""} · heure de {tz === "Europe/Paris" ? "Paris" : tz.split("/").at(-1)?.replace(/_/g, " ")}. Sans créneau, l’équipe vous propose une date.
      </p>

      {!data ? (
        <div className={styles.skeleton} aria-label="Chargement des créneaux">
          {Array.from({ length: 6 }, (_, i) => (
            <span key={i} />
          ))}
        </div>
      ) : (
        <>
          <div className={styles.days} role="radiogroup" aria-label="Jour">
            {days.map((d) => {
              const checked = current?.key === d.key;
              const first = d.slots[0].start;
              return (
                <label key={d.key} className={styles.day} data-checked={checked}>
                  <input className={styles.hidden} type="radio" name="slot-day" checked={checked} onChange={() => setDay(d.key)} />
                  <span className={styles.weekday}>{fmt(first, tz, { weekday: "short" }).replace(".", "")}</span>
                  <strong>{fmt(first, tz, { day: "numeric" })}</strong>
                  <span className={styles.month}>{fmt(first, tz, { month: "short" }).replace(".", "")}</span>
                </label>
              );
            })}
          </div>

          {current && (
            <div className={styles.times} role="radiogroup" aria-label={`Horaires du ${fmt(current.slots[0].start, tz, { weekday: "long", day: "numeric", month: "long" })}`}>
              {current.slots.map((s) => {
                const checked = value?.start === s.start;
                const label = `${fmt(s.start, tz, { weekday: "long", day: "numeric", month: "long" })} à ${fmt(s.start, tz, { hour: "2-digit", minute: "2-digit" })}`;
                return (
                  <label key={s.start} className={styles.time} data-checked={checked}>
                    <input
                      className={styles.hidden}
                      type="radio"
                      name="slot-time"
                      checked={checked}
                      onChange={() => onChange({ start: s.start, url: s.url, meetingId: meeting!.id, label })}
                    />
                    {fmt(s.start, tz, { hour: "2-digit", minute: "2-digit" })}
                  </label>
                );
              })}
            </div>
          )}

          {value && (
            <p className={styles.summary}>
              <span>
                Visio le <strong>{value.label}</strong>
              </span>
              <button type="button" className={styles.clear} onClick={() => onChange(null)}>
                Retirer
              </button>
            </p>
          )}
        </>
      )}
    </fieldset>
  );
}
