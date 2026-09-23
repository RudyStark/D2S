import { NextResponse } from "next/server";
import { MAY_LIMITS, type MayEvent, type MayMessage } from "@/lib/may";
import { mayConfigured, MayConfigurationError, runMay } from "@/lib/server/may-agent";

/*
 * May's chat, second level (Claude). POST { messages, timezone, known? } → a stream of NDJSON events
 * (lib/may.ts MayEvent). `known` = what the free first level (lib/may-local.ts) already understood.
 * Same defences as /api/contact: same origin, JSON only, bounded body and history, per-IP rate limit,
 * control characters stripped. Nothing is stored: the conversation lives in the visitor's page.
 */

const MAX_BODY_BYTES = 24_000;
const RATE = { limit: 30, windowMs: 10 * 60_000 };
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
const clean = (value: unknown) =>
  typeof value === "string" ? value.replace(CONTROL, "").trim().slice(0, MAY_LIMITS.messageLength) : "";

/** Text-only history, alternating, starting and ending with the visitor. */
function normalizeMessages(value: unknown): MayMessage[] | null {
  if (!Array.isArray(value)) return null;
  const messages: MayMessage[] = [];
  for (const item of value.slice(-MAY_LIMITS.messages)) {
    if (!item || typeof item !== "object") continue;
    const { role, content } = item as Record<string, unknown>;
    if (role !== "user" && role !== "assistant") continue;
    const text = clean(content);
    if (!text) continue;
    const last = messages.at(-1);
    if (last?.role === role) last.content = `${last.content}\n\n${text}`.slice(0, MAY_LIMITS.messageLength * 2);
    else messages.push({ role, content: text });
  }
  while (messages[0]?.role === "assistant") messages.shift();
  return messages.length && messages.at(-1)!.role === "user" ? messages : null;
}

function timezone(value: unknown) {
  const candidate = typeof value === "string" ? value.trim().slice(0, 80) : "";
  if (candidate) {
    try {
      new Intl.DateTimeFormat("fr-FR", { timeZone: candidate }).format();
      return candidate;
    } catch {
      // Unknown zone: D2S's own below.
    }
  }
  return "Europe/Paris";
}

const reject = (status: number, error: string, message?: string) =>
  NextResponse.json({ ok: false, error, ...(message ? { message } : {}) }, { status });

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
  if (rateLimited(ip)) return reject(429, "too_many_requests", "May a reçu beaucoup de messages. Réessayez dans quelques minutes.");

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
  const messages = normalizeMessages(body.messages);
  if (!messages) return reject(422, "invalid_messages");

  if (!mayConfigured()) {
    console.error("[may] ANTHROPIC_API_KEY is not configured");
    return reject(503, "not_configured", "May termine sa configuration. En attendant, l’équipe vous répond via le formulaire de contact.");
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const emit = (event: MayEvent) => controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
      try {
        await runMay(messages, timezone(body.timezone), emit, clean(body.known).slice(0, 700) || undefined);
        emit({ type: "done" });
      } catch (error) {
        if (!(error instanceof MayConfigurationError)) console.error("[may] answer failed:", error instanceof Error ? error.message : "unknown error");
        emit({ type: "error", message: "Je rencontre un problème temporaire. Réessayez dans un instant, ou laissez votre demande à l’équipe." });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "application/x-ndjson; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
    },
  });
}
