import { NextResponse } from "next/server";

/*
 * Contact requests ("Parlons de votre projet").
 * Delivery: POST of the lead as JSON to CONTACT_WEBHOOK_URL (Make, Zapier, n8n, a CRM, a Slack workflow…).
 * Without it: logged in development; refused in production so that no request is ever silently lost.
 * Bots: a hidden honeypot field and a minimum fill time — they get a fake success.
 */

const NEEDS = ["content", "support", "prospection", "automation", "data", "custom", "unsure"];
const CHANNELS = ["visio", "phone", "email"];
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const text = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });
  }

  // Honeypot filled, or sent faster than a human can type: pretend it worked.
  if (text(body.website, 200) || Number(body.elapsed) < 2500) return NextResponse.json({ ok: true });

  const lead = {
    name: text(body.name, 120),
    email: text(body.email, 200),
    company: text(body.company, 160),
    phone: text(body.phone, 40),
    message: text(body.message, 4000),
    need: NEEDS.includes(String(body.need)) ? String(body.need) : "unsure",
    channel: CHANNELS.includes(String(body.channel)) ? String(body.channel) : "visio",
    source: text(body.source, 40),
    diagnostic: Array.isArray(body.diagnostic) ? body.diagnostic.slice(0, 8).map((l) => text(l, 200)) : [],
    receivedAt: new Date().toISOString(),
  };

  const errors: string[] = [];
  if (lead.name.length < 2) errors.push("name");
  if (!EMAIL.test(lead.email)) errors.push("email");
  if (lead.company.length < 2) errors.push("company");
  if (lead.message.length < 10) errors.push("message");
  if (body.consent !== true) errors.push("consent");
  if (errors.length) return NextResponse.json({ ok: false, error: "invalid", fields: errors }, { status: 422 });

  const hook = process.env.CONTACT_WEBHOOK_URL;
  if (hook) {
    try {
      const res = await fetch(hook, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(lead) });
      if (!res.ok) throw new Error(`webhook ${res.status}`);
    } catch (err) {
      console.error("[contact] delivery failed", err);
      return NextResponse.json({ ok: false, error: "delivery" }, { status: 502 });
    }
  } else if (process.env.NODE_ENV === "production") {
    console.error("[contact] CONTACT_WEBHOOK_URL is not set: request not delivered");
    return NextResponse.json({ ok: false, error: "not_configured" }, { status: 503 });
  } else {
    console.info("[contact] (development, no CONTACT_WEBHOOK_URL)", lead);
  }

  return NextResponse.json({ ok: true });
}
