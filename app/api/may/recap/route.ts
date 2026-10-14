import { NextResponse } from "next/server";
import { MAY_LIMITS, type MayMessage } from "@/lib/may";
import { mayConfigured, writeRecap } from "@/lib/server/may-agent";

/*
 * POST { messages, recommended?, locale } → { message }: the request the visitor sends the team, written from their
 * conversation with May (a factual summary of the need, not the transcript). Same defences as /api/may/chat: same
 * origin, JSON only, bounded body, per-IP rate limit, control characters stripped. Nothing is stored. When it cannot
 * be written, the page falls back to its own summary (lib/may-local.ts).
 */

const MAX_BODY_BYTES = 40_000;
const RATE = { limit: 12, windowMs: 10 * 60_000 };
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
const clean = (value: unknown, max: number) => (typeof value === "string" ? value.replace(CONTROL, "").trim().slice(0, max) : "");

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
  const ip = request.headers.get("cf-connecting-ip") || (request.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || request.headers.get("x-real-ip") || "local";
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
  // The whole conversation, May's messages included (they give the context of the visitor's answers).
  const messages: MayMessage[] = (Array.isArray(body.messages) ? body.messages : [])
    .slice(-MAY_LIMITS.visitorMessages * 2 - 2)
    .map((m) => (m && typeof m === "object" ? (m as Record<string, unknown>) : {}))
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({ role: m.role as MayMessage["role"], content: clean(m.content, MAY_LIMITS.messageLength * 2) }))
    .filter((m) => m.content);
  if (!messages.some((m) => m.role === "user")) return reject(422, "invalid_messages");
  if (!mayConfigured()) return reject(503, "not_configured");

  try {
    const message = await writeRecap(messages, clean(body.recommended, 300) || undefined, body.locale === "en" ? "en" : "fr");
    return NextResponse.json({ ok: true, message }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    console.error("[may] recap failed:", error instanceof Error ? error.message : "unknown error");
    return reject(502, "recap_failed");
  }
}
