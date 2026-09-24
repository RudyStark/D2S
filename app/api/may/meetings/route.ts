import { NextResponse } from "next/server";
import type { MayAction } from "@/lib/may";
import { dayIn, hourIn, ISO_DAY, zonedMidnight } from "@/lib/may-dates";
import { CalendlyConfigurationError, calendlyFallbackUrl, findSlots, listMeetingTypes, listSlotsBetween, type MeetingSlot } from "@/lib/server/calendly";

/*
 * May's booking shortcut, without AI: the real meeting types of D2S and their free slots from Calendly, as
 * buttons (the visitor confirms on Calendly). Used by the free first level of the chat. `from`/`to`/`part`
 * = the period the visitor asked for (lib/may-dates.ts), read in their time zone; without it, the next days.
 */

/** The requested window, when valid: calendar days, at most 31 days long and 60 days ahead. */
function readWindow(params: URLSearchParams) {
  const from = params.get("from") ?? "";
  const to = params.get("to") ?? "";
  if (!ISO_DAY.test(from) || !ISO_DAY.test(to)) return null;
  const start = Date.parse(from);
  const end = Date.parse(to);
  const today = Date.now() - 36 * 60 * 60_000;
  if (!(end >= start) || end - start > 31 * 86_400_000 || start < today || start > Date.now() + 60 * 86_400_000) return null;
  const part = params.get("part");
  return { from, to, part: part === "morning" || part === "afternoon" ? part : undefined } as const;
}

const RATE = { limit: 20, windowMs: 10 * 60_000 };
const hits = new Map<string, { count: number; reset: number }>();
function rateLimited(ip: string) {
  const now = Date.now();
  // Expired entries are dropped at once: an IP is only kept for its rate-limit window (privacy policy).
  for (const [key, value] of hits) if (value.reset < now) hits.delete(key);
  const entry = hits.get(ip);
  if (!entry || entry.reset < now) {
    hits.set(ip, { count: 1, reset: now + RATE.windowMs });
    return false;
  }
  entry.count += 1;
  return entry.count > RATE.limit;
}

function safeLink(value: string | null | undefined) {
  try {
    const url = new URL(value ?? "");
    return url.protocol === "https:" && /(^|\.)calendly\.com$/.test(url.hostname) ? url.toString() : "";
  } catch {
    return "";
  }
}

function zone(value: string | null) {
  try {
    if (value) new Intl.DateTimeFormat("fr-FR", { timeZone: value }).format();
    return value || "Europe/Paris";
  } catch {
    return "Europe/Paris";
  }
}

const label = (iso: string, timeZone: string) =>
  new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", timeZone }).format(new Date(iso)).replace(/ 1 (?=\p{L})/u, " 1er ");

const DAY_MS = 86_400_000;

/**
 * The step-by-step booking of the free level (MayChat):
 * - `mode=days`: the days that still have free times in the window (and part of the day), for "which day?";
 * - `mode=times`: every free time of one day (and part of the day), as Calendly buttons.
 */
async function bookingStep(mode: "days" | "times", window: ReturnType<typeof readWindow>, part: "morning" | "afternoon" | undefined, timeZone: string) {
  const type = (await listMeetingTypes())[0];
  if (!type) throw new CalendlyConfigurationError();
  const today = dayIn(new Date().toISOString(), timeZone);
  const from = window?.from ?? today;
  const start = zonedMidnight(from, timeZone);
  const end = window ? zonedMidnight(window.to, timeZone) + DAY_MS : start + 14 * DAY_MS;
  const inPart = (slot: MeetingSlot) => !part || (part === "morning" ? hourIn(slot.startTime, timeZone) < 12 : hourIn(slot.startTime, timeZone) >= 13);
  let slots = (await listSlotsBetween(type.id, start, end)).filter(inPart);
  let inWindow = true;
  if (!slots.length && window) {
    // Nothing left in the asked window: the nearest days after it.
    slots = (await listSlotsBetween(type.id, end, end + 14 * DAY_MS)).filter(inPart);
    inWindow = false;
  }
  const meeting = { name: type.name, duration: type.duration };
  if (mode === "days") {
    const counts = new Map<string, number>();
    for (const slot of slots) counts.set(dayIn(slot.startTime, timeZone), (counts.get(dayIn(slot.startTime, timeZone)) ?? 0) + 1);
    return { meeting, inWindow, days: [...counts].slice(0, 6).map(([date, count]) => ({ date, count })) };
  }
  // One day: all its times (the first day that has some, when the asked one is full).
  const day = slots.length ? dayIn(slots[0].startTime, timeZone) : "";
  const actions: MayAction[] = slots
    .filter((slot) => dayIn(slot.startTime, timeZone) === day)
    .slice(0, 16)
    .map((slot) => ({
      kind: "meeting" as const,
      label: new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone }).format(new Date(slot.startTime)),
      href: safeLink(slot.schedulingUrl),
      detail: `${meeting.name} · ${meeting.duration} min`,
    }))
    .filter((action) => action.href);
  return { meeting, inWindow, day, actions };
}

export async function GET(request: Request) {
  const ip = request.headers.get("cf-connecting-ip") || (request.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "local";
  if (rateLimited(ip)) return NextResponse.json({ ok: false, error: "too_many_requests" }, { status: 429 });
  const params = new URL(request.url).searchParams;
  const timeZone = zone(params.get("tz"));
  const window = readWindow(params);
  const noStore = { headers: { "cache-control": "no-store" } };
  const mode = params.get("mode");

  if (mode === "days" || mode === "times") {
    try {
      const partParam = params.get("part");
      const part = partParam === "morning" || partParam === "afternoon" ? partParam : undefined;
      const step = await bookingStep(mode, window, part, timeZone);
      return NextResponse.json({ ok: true, configured: true, ...step }, noStore);
    } catch (error) {
      if (!(error instanceof CalendlyConfigurationError)) console.error("[may] booking step:", error instanceof Error ? error.message : "unknown");
      const href = safeLink(calendlyFallbackUrl());
      return NextResponse.json({ ok: true, configured: false, days: [], actions: href ? [{ kind: "meeting", label: "Voir l’agenda de D2S", href }] : [] }, noStore);
    }
  }

  try {
    const types = (await listMeetingTypes()).slice(0, 3);
    const actions: MayAction[] = [];
    let inWindow = true;
    for (const type of types) {
      const found = await findSlots(type.id, window, timeZone, types.length > 1 ? 2 : 4);
      if (!found.inWindow) inWindow = false;
      const detail = `${type.name} · ${type.duration} min`;
      for (const slot of found.slots) {
        const href = safeLink(slot.schedulingUrl);
        if (href) actions.push({ kind: "meeting", label: label(slot.startTime, timeZone), href, detail });
      }
      if (!found.slots.length && safeLink(type.schedulingUrl)) actions.push({ kind: "meeting", label: detail, href: safeLink(type.schedulingUrl), detail: "Voir l’agenda" });
    }
    return NextResponse.json({ ok: true, configured: true, inWindow: !window || inWindow, actions: actions.slice(0, 6) }, noStore);
  } catch (error) {
    if (!(error instanceof CalendlyConfigurationError)) console.error("[may] meetings:", error instanceof Error ? error.message : "unknown");
    const href = safeLink(calendlyFallbackUrl());
    return NextResponse.json(
      { ok: true, configured: false, actions: href ? [{ kind: "meeting", label: "Voir l’agenda de D2S", href }] : [] },
      noStore,
    );
  }
}
