import type { ChannelId, NeedId } from "./contact-content";

/*
 * May, the reception agent of the site: types shared by the chat (components/may) and its server
 * (app/api/may/chat, lib/server/may-agent). Pure data, importable on both sides.
 */

export type MayRole = "user" | "assistant";

export interface MayMessage {
  role: MayRole;
  content: string;
}

/** A booking button (a real Calendly link returned by the server, never written by the model). */
export interface MayAction {
  kind: "meeting";
  label: string;
  href: string;
  detail?: string;
}

/** The contact request May prepared with the visitor: pre-fills the form, the visitor reviews and sends it. */
export interface MayDraft {
  need: NeedId;
  message: string;
  name?: string;
  company?: string;
  channel?: ChannelId;
}

/** One line of the streamed answer (NDJSON). */
export type MayEvent =
  | { type: "text"; text: string }
  | { type: "status"; text: string }
  | { type: "actions"; actions: MayAction[] }
  | { type: "draft"; draft: MayDraft }
  | { type: "done" }
  | { type: "error"; message: string };

export const MAY_STARTERS = [
  "Quel agent pour mon besoin ?",
  "Comment travaillez-vous ?",
  "Prendre rendez-vous",
] as const;

/** History sent to Claude, message length, and visitor messages per conversation (then: the form). */
export const MAY_LIMITS = { messages: 12, messageLength: 1_000, visitorMessages: 14 } as const;
