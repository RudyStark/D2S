import "server-only";

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

