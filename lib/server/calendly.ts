import "server-only";

import { hourIn, spreadByDay, zonedMidnight } from "@/lib/may-dates";

const CALENDLY_API = "https://api.calendly.com";

interface CalendlyUserResponse {
  resource?: { uri?: string };
}

interface CalendlyEventTypeResource {
  uri?: string;
  name?: string;
  active?: boolean;
  duration?: number;
  scheduling_url?: string;
  description_plain?: string | null;
}

interface CalendlyEventTypesResponse {
  collection?: CalendlyEventTypeResource[];
}

interface CalendlyAvailableTimeResource {
  status?: string;
  start_time?: string;
  scheduling_url?: string;
}

interface CalendlyAvailableTimesResponse {
  collection?: CalendlyAvailableTimeResource[];
}

export interface MeetingType {
  id: string;
  name: string;
  duration: number;
  description: string;
  schedulingUrl: string;
}

export interface MeetingSlot {
  startTime: string;
  schedulingUrl: string;
}

export class CalendlyConfigurationError extends Error {
  constructor() {
    super("Calendly is not configured");
    this.name = "CalendlyConfigurationError";
  }
}

function token() {
  const value = process.env.CALENDLY_API_TOKEN?.trim();
  if (!value) throw new CalendlyConfigurationError();
  return value;
}

async function calendlyFetch<T>(path: string): Promise<T> {
  const response = await fetch(`${CALENDLY_API}${path}`, {
    headers: {
      authorization: `Bearer ${token()}`,
      "content-type": "application/json",
    },
    signal: AbortSignal.timeout(10_000),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Calendly API ${response.status}`);
  return (await response.json()) as T;
}

async function getUserUri() {
  const configured = process.env.CALENDLY_USER_URI?.trim();
  if (configured) return configured;
  const response = await calendlyFetch<CalendlyUserResponse>("/users/me");
  if (!response.resource?.uri) throw new Error("Calendly user URI is missing");
  return response.resource.uri;
}

function resourceId(uri: string) {
  const id = uri.split("/").filter(Boolean).at(-1);
  return id && /^[a-zA-Z0-9_-]+$/.test(id) ? id : "";
}

/** Active Calendly appointment types owned by the configured D2S user. */
export async function listMeetingTypes(): Promise<MeetingType[]> {
  const user = await getUserUri();
  const query = new URLSearchParams({ user, active: "true", count: "100" });
  const response = await calendlyFetch<CalendlyEventTypesResponse>(`/event_types?${query}`);
  return (response.collection ?? [])
    .filter((item) => item.active !== false && item.uri && item.name && item.scheduling_url)
    .map((item) => ({
      id: resourceId(item.uri!),
      name: item.name!,
      duration: Number.isFinite(item.duration) ? Number(item.duration) : 30,
      description: item.description_plain?.trim().slice(0, 280) ?? "",
      schedulingUrl: item.scheduling_url!,
    }))
    .filter((item) => item.id)
    .slice(0, 12);
}

/** Available times for one appointment type. Calendly limits a query window to 31 days. */
export async function listMeetingSlots(eventTypeId: string): Promise<MeetingSlot[]> {
  if (!/^[a-zA-Z0-9_-]+$/.test(eventTypeId)) return [];
  const start = new Date(Date.now() + 15 * 60_000);
  const end = new Date(start.getTime() + 14 * 24 * 60 * 60_000);
  const query = new URLSearchParams({
    event_type: `${CALENDLY_API}/event_types/${eventTypeId}`,
    start_time: start.toISOString(),
    end_time: end.toISOString(),
  });
  const response = await calendlyFetch<CalendlyAvailableTimesResponse>(`/event_type_available_times?${query}`);
  return (response.collection ?? [])
    .filter((slot) => slot.status !== "unavailable" && slot.start_time && slot.scheduling_url)
    .map((slot) => ({ startTime: slot.start_time!, schedulingUrl: slot.scheduling_url! }))
    .slice(0, 6);
}

export function calendlyFallbackUrl() {
  const value = process.env.CALENDLY_FALLBACK_URL?.trim();
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}


/* ---------- Booking from the contact form ---------- */

const DAY = 24 * 60 * 60_000;

/** Every free start time of an appointment type over the next `days` days (Calendly caps a query at 7 days). */
export async function listSlotsAhead(eventTypeId: string, days = 14): Promise<MeetingSlot[]> {
  const first = Date.now() + 30 * 60_000;
  return listSlotsBetween(eventTypeId, first, first + days * DAY);
}

/** Free times between two instants (Calendly answers at most 7 days per query: the range is split). */
export async function listSlotsBetween(eventTypeId: string, startMs: number, endMs: number): Promise<MeetingSlot[]> {
  if (!/^[a-zA-Z0-9_-]+$/.test(eventTypeId)) return [];
  const first = Math.max(startMs, Date.now() + 15 * 60_000);
  const last = Math.min(endMs, Date.now() + 62 * DAY);
  if (last <= first) return [];
  const windows = Array.from({ length: Math.ceil((last - first) / (7 * DAY)) }, (_, i) => first + i * 7 * DAY);
  const pages = await Promise.all(
    windows.map((start) => {
      const query = new URLSearchParams({
        event_type: `${CALENDLY_API}/event_types/${eventTypeId}`,
        start_time: new Date(start).toISOString(),
        end_time: new Date(Math.min(start + 7 * DAY, last) - 60_000).toISOString(),
      });
      return calendlyFetch<CalendlyAvailableTimesResponse>(`/event_type_available_times?${query}`);
    }),
  );
  return pages
    .flatMap((page) => page.collection ?? [])
    .filter((slot) => slot.status !== "unavailable" && slot.start_time && slot.scheduling_url)
    .map((slot) => ({ startTime: slot.start_time!, schedulingUrl: slot.scheduling_url! }))
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
}

/**
 * The times to propose for a requested window (calendar days + part of the day, in the visitor's zone),
 * spread over different days. Nothing free in the window: the nearest times after its start instead
 * (`inWindow: false`, May says so). Without a window: the next free times, spread the same way.
 */
export async function findSlots(
  eventTypeId: string,
  window: { from: string; to: string; part?: "morning" | "afternoon" } | null,
  timeZone: string,
  count: number,
): Promise<{ slots: MeetingSlot[]; inWindow: boolean }> {
  const inPart = (slot: MeetingSlot) => {
    if (!window?.part) return true;
    const hour = hourIn(slot.startTime, timeZone);
    return window.part === "morning" ? hour < 12 : hour >= 13;
  };
  if (window) {
    const start = zonedMidnight(window.from, timeZone);
    const end = zonedMidnight(window.to, timeZone) + DAY + 2 * 60 * 60_000 >= start ? zonedMidnight(window.to, timeZone) + DAY : start + DAY;
    const inside = (await listSlotsBetween(eventTypeId, start, end)).filter(inPart);
    if (inside.length) return { slots: spreadByDay(inside, count, timeZone), inWindow: true };
    const after = (await listSlotsBetween(eventTypeId, start, start + 14 * DAY)).filter(inPart);
    return { slots: spreadByDay(after, count, timeZone), inWindow: false };
  }
  const next = await listSlotsAhead(eventTypeId, 14);
  return { slots: spreadByDay(next, count, timeZone), inWindow: true };
}

export type BookingResult =
  | { booked: true; joinUrl?: string; cancelUrl?: string; rescheduleUrl?: string }
  | { booked: false; reason: "plan" | "taken" | "error" };

const httpsOnly = (value: unknown) => {
  try {
    const url = new URL(String(value ?? ""));
    return url.protocol === "https:" ? url.toString() : undefined;
  } catch {
    return undefined;
  }
};

/**
 * Books the slot directly (Calendly Scheduling API). Only paid Calendly plans (Standard and above) allow it:
 * the Free plan answers 403, and the visitor then confirms on the slot's own Calendly page instead.
 * Calendly sends the invitation, the video link and the reminders exactly as for a booking on its own page.
 */
export async function bookSlot(input: { eventTypeId: string; startTime: string; name: string; email: string; timezone: string }): Promise<BookingResult> {
  if (!/^[a-zA-Z0-9_-]+$/.test(input.eventTypeId)) return { booked: false, reason: "error" };
  try {
    // The location must match the event type's (a video tool needs only its kind: Calendly creates the link).
    const eventType = await calendlyFetch<{ resource?: { locations?: { kind?: string }[] | null } }>(`/event_types/${input.eventTypeId}`);
    const kind = eventType.resource?.locations?.[0]?.kind;
    const location = kind && /_conference$/.test(kind) ? { kind } : undefined;
    const response = await fetch(`${CALENDLY_API}/invitees`, {
      method: "POST",
      headers: { authorization: `Bearer ${token()}`, "content-type": "application/json" },
      body: JSON.stringify({
        event_type: `${CALENDLY_API}/event_types/${input.eventTypeId}`,
        start_time: input.startTime,
        invitee: { name: input.name, email: input.email, timezone: input.timezone },
        ...(location ? { location } : {}),
      }),
      signal: AbortSignal.timeout(10_000),
      cache: "no-store",
    });
    if (response.ok) {
      // The invitee gives the cancel / reschedule pages; the event gives the video link Calendly created.
      const invitee = ((await response.json().catch(() => null)) as { resource?: { event?: string; cancel_url?: string; reschedule_url?: string } } | null)?.resource;
      let joinUrl: string | undefined;
      const eventId = invitee?.event ? resourceId(invitee.event) : "";
      // Calendly creates the video link a few seconds after the booking: wait for it, briefly.
      for (let attempt = 0; eventId && !joinUrl && attempt < 4; attempt++) {
        if (attempt) await new Promise((resolve) => setTimeout(resolve, 1_200));
        const event = await calendlyFetch<{ resource?: { location?: { join_url?: string } } }>(`/scheduled_events/${eventId}`).catch(() => null);
        joinUrl = httpsOnly(event?.resource?.location?.join_url);
      }
      return { booked: true, joinUrl, cancelUrl: httpsOnly(invitee?.cancel_url), rescheduleUrl: httpsOnly(invitee?.reschedule_url) };
    }
    if (response.status === 403) {
      console.error("[booking] Calendly 403 : réservation directe refusée (plan ou droits du jeton)");
      return { booked: false, reason: "plan" };
    }
    // 400 on a slot taken in the meantime, or anything else: the visitor still has the Calendly page.
    // Which parameters Calendly refused (names only, never the visitor's data).
    const detail = ((await response.json().catch(() => null)) as { details?: { parameter?: string; message?: string }[] } | null)?.details
      ?.map((d) => `${d.parameter} ${d.message}`)
      .join(", ");
    console.error(`[booking] Calendly ${response.status}${detail ? ` : ${detail}` : ""}`);
    return { booked: false, reason: response.status === 400 || response.status === 409 ? "taken" : "error" };
  } catch (error) {
    console.error("[booking] Calendly request failed:", error instanceof Error ? error.message : "unknown");
    return { booked: false, reason: "error" };
  }
}
