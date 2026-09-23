import { NextResponse } from "next/server";
import type { MayAction } from "@/lib/may";
import { CalendlyConfigurationError, calendlyFallbackUrl, listMeetingSlots, listMeetingTypes } from "@/lib/server/calendly";

/*
 * May's booking shortcut, without AI: the real meeting types of D2S and their next free slots from Calendly,
 * as buttons (the visitor confirms on Calendly). Used by the free first level of the chat.
 */

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
  new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", timeZone }).format(new Date(iso));

export async function GET(request: Request) {
  const ip = request.headers.get("cf-connecting-ip") || (request.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "local";
  if (rateLimited(ip)) return NextResponse.json({ ok: false, error: "too_many_requests" }, { status: 429 });
  const timeZone = zone(new URL(request.url).searchParams.get("tz"));
  const noStore = { headers: { "cache-control": "no-store" } };

  try {
    const types = (await listMeetingTypes()).slice(0, 3);
    const actions: MayAction[] = [];
    for (const type of types) {
      const slots = (await listMeetingSlots(type.id)).slice(0, types.length > 1 ? 2 : 3);
      const detail = `${type.name} · ${type.duration} min`;
      for (const slot of slots) {
        const href = safeLink(slot.schedulingUrl);
        if (href) actions.push({ kind: "meeting", label: label(slot.startTime, timeZone), href, detail });
      }
      if (!slots.length && safeLink(type.schedulingUrl)) actions.push({ kind: "meeting", label: detail, href: safeLink(type.schedulingUrl), detail: "Voir l’agenda" });
    }
    return NextResponse.json({ ok: true, configured: true, actions: actions.slice(0, 6) }, noStore);
  } catch (error) {
    if (!(error instanceof CalendlyConfigurationError)) console.error("[may] meetings:", error instanceof Error ? error.message : "unknown");
    const href = safeLink(calendlyFallbackUrl());
    return NextResponse.json(
      { ok: true, configured: false, actions: href ? [{ kind: "meeting", label: "Voir l’agenda de D2S", href }] : [] },
      noStore,
    );
  }
}
