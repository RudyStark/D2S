import { NextResponse } from "next/server";
import { bookSlot } from "@/lib/server/calendly";
import { ResendConfigurationError, sendContactEmails, type ContactLead } from "@/lib/server/resend";

/*
 * Contact requests ("Parlons de votre projet"). Resend is the primary delivery channel:
 * - one notification to D2S, with Reply-To set to the visitor;
 * - one confirmation signed by May to the visitor.
 * CONTACT_WEBHOOK_URL remains an optional secondary CRM/automation hand-off.
 */

const NEEDS = ["content", "support", "prospection", "automation", "data", "custom", "unsure"];
const CHANNELS = ["visio", "phone", "email"];
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MAX_BODY_BYTES = 16_000;
const RATE = { limit: 5, windowMs: 10 * 60_000 };
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

// eslint-disable-next-line no-control-regex -- stripping control characters is intentional.
const CONTROL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;
const text = (value: unknown, max: number) =>
  typeof value === "string" ? value.replace(CONTROL, "").trim().slice(0, max) : "";
const reject = (status: number, error: string) => NextResponse.json({ ok: false, error }, { status });

/** The visio slot picked in the form: a future start time and its Calendly page, nothing else accepted. */
function readSlot(value: unknown) {
  if (!value || typeof value !== "object") return null;
  const { start, url, meetingId } = value as Record<string, unknown>;
  if (typeof start !== "string" || typeof url !== "string" || typeof meetingId !== "string") return null;
  const when = Date.parse(start);
  if (!Number.isFinite(when) || when < Date.now() || when > Date.now() + 60 * 24 * 60 * 60_000) return null;
  if (!/^[a-zA-Z0-9_-]{1,64}$/.test(meetingId)) return null;
  try {
    const link = new URL(url);
    if (link.protocol !== "https:" || !/(^|\.)calendly\.com$/.test(link.hostname)) return null;
    return { start: new Date(when).toISOString(), url: link.toString(), meetingId };
  } catch {
    return null;
  }
}

function zone(value: unknown) {
  const candidate = typeof value === "string" ? value.trim().slice(0, 80) : "";
  try {
    if (candidate) new Intl.DateTimeFormat("fr-FR", { timeZone: candidate }).format();
    return candidate || "Europe/Paris";
  } catch {
    return "Europe/Paris";
  }
}

const slotLabel = (iso: string, timeZone: string) =>
  new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", timeZone }).format(new Date(iso));

async function forwardToWebhook(lead: ContactLead) {
  const hook = process.env.CONTACT_WEBHOOK_URL?.trim();
  if (!hook) return;
  try {
    const response = await fetch(hook, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(lead),
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) throw new Error(`webhook ${response.status}`);
  } catch (error) {
    // The Resend notification is already delivered; the optional CRM sync must not make the visitor resubmit.
    console.error("[contact] optional webhook failed:", error instanceof Error ? error.message : "unknown error");
  }
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (origin && host) {
    try {
      if (new URL(origin).host !== host) return reject(403, "forbidden");
    } catch {
      return reject(403, "forbidden");
    }
  }
  if (!request.headers.get("content-type")?.includes("application/json")) return reject(415, "unsupported");

  const ip =
    request.headers.get("cf-connecting-ip") ||
    (request.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() ||
    request.headers.get("x-real-ip") ||
    "local";
  if (rateLimited(ip)) return reject(429, "too_many_requests");

  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) return reject(413, "too_large");
  let body: Record<string, unknown>;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("invalid body");
    body = parsed as Record<string, unknown>;
  } catch {
    return reject(400, "invalid");
  }

  // Honeypot filled, or submitted implausibly fast: return a fake success without sending personal data.
  if (text(body.website, 200) || Number(body.elapsed) < 2_500) return NextResponse.json({ ok: true });

  const lead: ContactLead = {
    name: text(body.name, 120),
    email: text(body.email, 200),
    company: text(body.company, 160),
    phone: text(body.phone, 40),
    message: text(body.message, 4_000),
    need: NEEDS.includes(String(body.need)) ? String(body.need) : "unsure",
    channel: CHANNELS.includes(String(body.channel)) ? String(body.channel) : "visio",
    source: text(body.source, 40),
    diagnostic: Array.isArray(body.diagnostic) ? body.diagnostic.slice(0, 8).map((line) => text(line, 200)) : [],
    consent: body.consent === true,
    receivedAt: new Date().toISOString(),
  };
  const slot = readSlot(body.slot);
  const timeZone = zone(body.timezone);

  const errors: string[] = [];
  if (lead.name.length < 2) errors.push("name");
  if (!EMAIL.test(lead.email)) errors.push("email");
  if (lead.company.length < 2) errors.push("company");
  if (lead.message.length < 10) errors.push("message");
  if (!lead.consent) errors.push("consent");
  if (errors.length) return NextResponse.json({ ok: false, error: "invalid", fields: errors }, { status: 422 });

  // A visio slot chosen in the form: booked directly when the Calendly plan allows it, otherwise confirmed
  // by the visitor on the slot's own Calendly page (name and e-mail pre-filled).
  let booking: { booked: boolean; confirmUrl?: string; label?: string } | undefined;
  if (slot) {
    const label = slotLabel(slot.start, timeZone);
    const result = await bookSlot({ eventTypeId: slot.meetingId, startTime: slot.start, name: lead.name, email: lead.email, timezone: timeZone });
    if (result.booked) booking = { booked: true, label };
    else {
      const confirm = new URL(slot.url);
      confirm.searchParams.set("name", lead.name);
      confirm.searchParams.set("email", lead.email);
      booking = { booked: false, confirmUrl: confirm.toString(), label };
    }
    lead.slot = {
      label: slotLabel(slot.start, "Europe/Paris"),
      visitorLabel: label,
      booked: booking.booked,
      ...(result.booked ? { joinUrl: result.joinUrl, cancelUrl: result.cancelUrl, rescheduleUrl: result.rescheduleUrl } : { confirmUrl: booking.confirmUrl }),
    };
  }

  try {
    await sendContactEmails(lead);
  } catch (error) {
    if (error instanceof ResendConfigurationError) {
      console.error("[contact] RESEND_API_KEY is not configured");
      return reject(503, "not_configured");
    }
    console.error("[contact] Resend delivery failed:", error instanceof Error ? error.message : "unknown error");
    return reject(502, "delivery");
  }

  await forwardToWebhook(lead);
  return NextResponse.json({ ok: true, ...(booking ? { booking } : {}) });
}
