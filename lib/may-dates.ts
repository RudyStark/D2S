/*
 * When the visitor wants to meet, in their words ("la semaine prochaine", "mardi après-midi", "le 30",
 * "dans 15 jours"…), read as a window of calendar days + an optional part of the day. Pure and shared: the
 * browser reads it (May's free level, with the visitor's own "today"), the server turns the days into
 * instants in the visitor's time zone to ask Calendly for times inside that window only.
 */

export type DayPart = "morning" | "afternoon";

/** Calendar days in the visitor's calendar, `to` included. */
export interface SlotWindow {
  from: string;
  to: string;
  part?: DayPart;
  /** How May says it, after "Voici des créneaux…": "pour la semaine prochaine", "pour mardi 30 septembre, le matin"… */
  label: string;
  /** The period alone, without the part of the day ("pour la semaine prochaine"); empty when no day was named. */
  period: string;
  /** False when only a part of the day was given ("plutôt le matin"): the days are then still to choose. */
  dated: boolean;
}

/** A calendar day as a UTC midnight timestamp (no time zone, no DST: pure day arithmetic). */
type Day = number;
const DAY = 24 * 60 * 60_000;

const WEEKDAYS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
const MONTHS = ["janvier", "fevrier", "mars", "avril", "mai", "juin", "juillet", "aout", "septembre", "octobre", "novembre", "decembre"];
const MONTH_LABELS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
const NUMBERS: Record<string, number> = { un: 1, une: 1, deux: 2, trois: 3, quatre: 4 };

const norm = (s: string) =>
  ` ${s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’']/g, " ")
    .replace(/[^a-z0-9/]+/g, " ")
    .trim()} `;

export const dayOf = (date: Date): Day => Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
export const isoDay = (day: Day) => new Date(day).toISOString().slice(0, 10);
const weekday = (day: Day) => new Date(day).getUTCDay();
/** Monday of the week of `day` (weeks start on Monday in France). */
const monday = (day: Day) => day - ((weekday(day) + 6) % 7) * DAY;
const dayLabel = (day: Day) => {
  const d = new Date(day);
  return `${WEEKDAYS[d.getUTCDay()]} ${d.getUTCDate() === 1 ? "1er" : d.getUTCDate()} ${MONTH_LABELS[d.getUTCMonth()]}`;
};

/**
 * Reads the time window of a message, relative to `today` (the visitor's current date). Null when the message
 * names no period: the next free times are then proposed.
 */
export function readWhen(text: string, today: Date = new Date()): SlotWindow | null {
  const t = norm(text);
  const now = dayOf(today);
  const part: DayPart | undefined = /\b(apres midi|aprem|aprm|apm)\b/.test(t) ? "afternoon" : /\b(matin|matinee)\b/.test(t) ? "morning" : undefined;
  const partLabel = part === "morning" ? ", le matin" : part === "afternoon" ? ", l’après-midi" : "";
  const range = (from: Day, to: Day, label: string): SlotWindow => ({ from: isoDay(from), to: isoDay(to), part, label: label + partLabel, period: label, dated: true });
  const single = (day: Day, label = `pour ${dayLabel(day)}`): SlotWindow => range(day, day, label);

  const nextWeek = monday(now) + 7 * DAY;
  const inWeeks = t.match(/\bdans (\d|un|une|deux|trois|quatre) semaines?\b/);
  const weekOffset = inWeeks ? (Number(inWeeks[1]) || NUMBERS[inWeeks[1]]) : /\bdans (quinze|15) jours\b/.test(t) ? 2 : 0;
  const nextWeekAsked = /\bsemaine (prochaine|pro|d apres|suivante)\b/.test(t);

  // An explicit date first: "le 30", "30 septembre", "1er octobre", "30/09", "lundi 5 octobre".
  const numeric = t.match(/\b(\d{1,2})\/(\d{1,2})\b/);
  const written = t.match(new RegExp(`\\b(\\d{1,2})(?: ?er)? (${MONTHS.join("|")})\\b`));
  const bare = t.match(/\ble (\d{1,2})(?: ?er)?\b/);
  if (numeric || written || bare) {
    const dayNumber = Number((numeric ?? written ?? bare)![1]);
    const month = numeric ? Number(numeric[2]) - 1 : written ? MONTHS.indexOf(written[2]) : new Date(now).getUTCMonth();
    if (dayNumber >= 1 && dayNumber <= 31 && month >= 0 && month <= 11) {
      const year = new Date(now).getUTCFullYear();
      let day = Date.UTC(year, month, dayNumber);
      if (day < now) day = numeric || written ? Date.UTC(year + 1, month, dayNumber) : Date.UTC(year, month + 1, dayNumber);
      if (new Date(day).getUTCDate() === dayNumber) return single(day);
    }
  }

  // A named weekday ("mardi", "mardi prochain", "le mardi de la semaine prochaine").
  const named = WEEKDAYS.findIndex((name) => new RegExp(`\\b${name}\\b`).test(t));
  if (named >= 0) {
    const offset = (named + 6) % 7; // days after Monday
    let day: Day;
    if (nextWeekAsked) day = nextWeek + offset * DAY;
    else if (weekOffset) day = monday(now) + weekOffset * 7 * DAY + offset * DAY;
    else {
      day = monday(now) + offset * DAY;
      if (day <= now) day += 7 * DAY; // "mardi" or "mardi prochain" = the next Tuesday, never today
    }
    return single(day);
  }

  if (/\bapres demain\b/.test(t)) return single(now + 2 * DAY, "pour après-demain");
  if (/\bdemain\b/.test(t)) return single(now + DAY, "pour demain");
  if (/\baujourd hui\b|\bce (matin|soir)\b|\bcet apres midi\b/.test(t)) return single(now, "pour aujourd’hui");

  if (/\bdebut de (la )?semaine prochaine\b/.test(t)) return range(nextWeek, nextWeek + DAY, "en début de semaine prochaine");
  if (/\bfin de (la )?semaine prochaine\b/.test(t)) return range(nextWeek + 3 * DAY, nextWeek + 4 * DAY, "en fin de semaine prochaine");
  if (nextWeekAsked) return range(nextWeek, nextWeek + 6 * DAY, "pour la semaine prochaine");
  if (weekOffset) {
    const start = monday(now) + weekOffset * 7 * DAY;
    return range(start, start + 6 * DAY, `dans ${weekOffset} semaines`);
  }
  if (/\bfin de (la )?semaine\b/.test(t)) {
    const thursday = monday(now) + 3 * DAY;
    return thursday + DAY >= now ? range(Math.max(thursday, now), thursday + DAY, "en fin de semaine") : range(nextWeek + 3 * DAY, nextWeek + 4 * DAY, "en fin de semaine prochaine");
  }
  if (/\bcette semaine\b/.test(t)) return range(now, monday(now) + 6 * DAY, "pour cette semaine");
  if (/\bmois prochain\b/.test(t)) {
    const d = new Date(now);
    const first = Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1);
    return range(first, first + 13 * DAY, "pour le début du mois prochain");
  }
  // Only a part of the day ("plutôt le matin"): the coming days.
  if (part) return { from: isoDay(now), to: isoDay(now + 13 * DAY), part, label: part === "morning" ? "le matin" : "l’après-midi", period: "", dated: false };
  return null;
}

/* ---------- Server side: days → instants in the visitor's time zone ---------- */

/** Offset (ms) of `timeZone` from UTC at `instant`. */
function offsetAt(instant: number, timeZone: string) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", { timeZone, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" })
      .formatToParts(new Date(instant))
      .map((p) => [p.type, p.value]),
  );
  const asUtc = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute, +parts.second);
  return asUtc - instant;
}

/** Midnight of the calendar day `iso` ("2026-09-30") in `timeZone`, as an instant. */
export function zonedMidnight(iso: string, timeZone: string) {
  const [y, m, d] = iso.split("-").map(Number);
  const guess = Date.UTC(y, m - 1, d);
  const first = guess - offsetAt(guess, timeZone);
  return guess - offsetAt(first, timeZone);
}

/** Hour (0–23) of an instant in `timeZone`. */
export const hourIn = (iso: string, timeZone: string) =>
  Number(new Intl.DateTimeFormat("en-US", { timeZone, hourCycle: "h23", hour: "2-digit" }).format(new Date(iso)));

/** Calendar day of an instant in `timeZone` ("2026-09-30"). */
export const dayIn = (iso: string, timeZone: string) =>
  new Intl.DateTimeFormat("fr-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(iso));

export const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Keeps `count` times spread out: over different days first (one per day, alternating morning and afternoon
 * from one day to the next), and evenly across a day when several are taken from it (13:00, 14:00, 15:00…
 * rather than four half-hours in a row).
 */
export function spreadByDay<T extends { startTime: string }>(slots: T[], count: number, timeZone: string): T[] {
  const byDay = new Map<string, T[]>();
  for (const slot of slots) {
    const key = dayIn(slot.startTime, timeZone);
    if (!byDay.has(key)) byDay.set(key, []);
    byDay.get(key)!.push(slot);
  }
  const days = [...byDay.values()].slice(0, count);
  // How many times each day gives (the first days give one more when count does not divide evenly).
  const quota = days.map((day, i) => Math.min(day.length, Math.floor(count / days.length) + (i < count % days.length ? 1 : 0)));
  const picked: T[] = [];
  days.forEach((day, i) => {
    const n = quota[i];
    if (n === 1) {
      // One per day: morning one day, afternoon the next (when the day has both).
      const afternoon = day.findIndex((s) => hourIn(s.startTime, timeZone) >= 13);
      picked.push(i % 2 === 1 && afternoon > 0 ? day[afternoon] : day[0]);
      return;
    }
    for (let k = 0; k < n; k++) picked.push(day[Math.round((k * (day.length - 1)) / Math.max(1, n - 1))]);
  });
  return [...new Set(picked)].sort((a, b) => a.startTime.localeCompare(b.startTime));
}
