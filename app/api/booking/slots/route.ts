import { NextResponse } from "next/server";
import { CalendlyConfigurationError, listMeetingTypes, listSlotsAhead } from "@/lib/server/calendly";

/*
 * Free slots for the contact form's visio picker: D2S's first active Calendly appointment type
 * (CALENDLY_EVENT_TYPE_ID to pick another one) and its start times over the next two weeks.
 * Kept for a minute in memory: every visitor opening the form does not query Calendly.
 */

const TTL = 60_000;
let cache: { at: number; body: unknown } | null = null;

export async function GET() {
  if (cache && Date.now() - cache.at < TTL) return NextResponse.json(cache.body, { headers: { "cache-control": "no-store" } });
  try {
    const types = await listMeetingTypes();
    const wanted = process.env.CALENDLY_EVENT_TYPE_ID?.trim();
    const meeting = types.find((t) => t.id === wanted) ?? types[0];
    if (!meeting) return NextResponse.json({ ok: true, configured: false }, { headers: { "cache-control": "no-store" } });
    const slots = (await listSlotsAhead(meeting.id, 14)).map((s) => ({ start: s.startTime, url: s.schedulingUrl }));
    const body = { ok: true, configured: true, meeting: { id: meeting.id, name: meeting.name, duration: meeting.duration }, slots };
    cache = { at: Date.now(), body };
    return NextResponse.json(body, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    if (!(error instanceof CalendlyConfigurationError)) console.error("[booking] slots:", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ ok: true, configured: false }, { headers: { "cache-control": "no-store" } });
  }
}
