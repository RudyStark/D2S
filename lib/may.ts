export type MayRole = "user" | "assistant";

export interface MayMessage {
  role: MayRole;
  content: string;
}

export interface MayAction {
  kind: "meeting";
  label: string;
  href: string;
  detail?: string;
}

export interface MayReply {
  message: string;
  actions?: MayAction[];
}

export const MAY_STARTERS = [
  "Quel agent pour mon besoin ?",
  "Comment travaillez-vous ?",
  "Prendre rendez-vous",
] as const;

