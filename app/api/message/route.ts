import { NextResponse } from "next/server";
import { DIRECT_TOPICS } from "@/lib/contact-content";
import { ResendConfigurationError, sendDirectMessage } from "@/lib/server/resend";

/*
 * Direct contact (the menu's "Contact" dialog): a topic and a message to the team (rudy.saksik@d2saigency.com
 * by default, CONTACT_TO_EMAIL), acknowledged by May. Same defences as /api/contact: same origin, JSON only,
 * bounded body, per-IP rate limit, honeypot + minimum fill time, validated and bounded fields.
 */

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MAX_BODY_BYTES = 12_000;
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
const text = (value: unknown, max: number) => (typeof value === "string" ? value.replace(CONTROL, "").trim().slice(0, max) : "");
const reject = (status: number, error: string) => NextResponse.json({ ok: false, error }, { status });

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

  // Honeypot filled, or sent implausibly fast: pretend it worked.
  if (text(body.website, 200) || Number(body.elapsed) < 2_500) return NextResponse.json({ ok: true });

  const msg = {
    topic: DIRECT_TOPICS.some((t) => t.id === body.topic) ? String(body.topic) : "other",
    name: text(body.name, 120),
    email: text(body.email, 200),
    company: text(body.company, 160),
    phone: text(body.phone, 40),
    message: text(body.message, 4_000),
    receivedAt: new Date().toISOString(),
  };
  const errors: string[] = [];
  if (msg.name.length < 2) errors.push("name");
  if (!EMAIL.test(msg.email)) errors.push("email");
  if (msg.message.length < 10) errors.push("message");
  if (body.consent !== true) errors.push("consent");
  if (errors.length) return NextResponse.json({ ok: false, error: "invalid", fields: errors }, { status: 422 });

  try {
    await sendDirectMessage(msg);
  } catch (error) {
    if (error instanceof ResendConfigurationError) return reject(503, "not_configured");
    console.error("[message] delivery failed:", error instanceof Error ? error.message : "unknown error");
    return reject(502, "delivery");
  }
  return NextResponse.json({ ok: true });
}
