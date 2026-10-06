import type { ChannelId } from "./contact-content";
import type { MayDraft } from "./may";
import { readWhenEn, type DayPart } from "./may-dates";
import type { LocalOutcome, MayMemory, SlotQuery } from "./may-local";
import { servicesText } from "./services";
import { lowerFirst, siteText } from "./site";
import { teamOf } from "./team";
import { moreTeamOf } from "./team-more";

/*
 * May's free first level for English visitors (lib/may-local.ts is the French one). Smaller on purpose: greetings,
 * the frequent questions, a callback and the meeting booked step by step are answered here at no cost; describing
 * a need (the qualification) goes to Claude, which reads English better than rules would. Same memory and outcome
 * shapes as the French level, so the chat runs both the same way.
 */

const norm = (s: string) =>
  ` ${s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[’']/g, " ")
    .replace(/[^a-z0-9%]+/g, " ")
    .trim()} `;

const faq = (start: string) => siteText("en").faq.find((f) => f.q.startsWith(start))!.a;

const YES = /^ ?(yes|yeah|yep|ok|okay|sure|please|go ahead|of course|sounds good|great|perfect|do it|why not)\b/;
const NO = /^ ?(no|no thanks|not now|later|not yet|maybe later|i ll think about it)( .{0,20})? $/;
const QUESTION = /^ ?(how|what|which|why|where|when|who|is|are|do|does|can|could|would|tell me|explain)\b/;
const GREETING = /^ ?(hi|hello|hey|good (morning|afternoon|evening)|hiya)( may)?( .{0,12})? $/;
const CALLBACK = /\b(call me( back)?|contact me|get in touch|be contacted|be called|talk to (a|someone|the team|a human)|a human|a person)\b/;
const BOOKING = /\b(book|booking|meeting|appointment|schedule|slot|slots|availability|available times|video call|call with you)\b/;
// "More meetings", "my sales meetings" describe the visitor's work, not a meeting with D2S.
const SALES_MEETINGS = /\b((get|land|book|generate|more) (more )?(sales )?meetings|(my|our|the) (sales|client|prospect) meetings|meetings with (my|our) (prospects|clients))\b/g;
const WHICH_AGENT = /\b(which agent|what agent|which one|help me choose|recommend|my need)\b/;
const TASK_QUESTION =
  "What takes up most of your time today: finding customers, writing proposals, answering your customers or your e-mails, creating content or visuals, tracking invoices or figures, hiring…?";
const READY = "Your request is ready just below: review it, add your e-mail and send it. The team replies within one business day.";

const INTENTS: { re: RegExp; answer: () => string }[] = [
  {
    re: /\b(price|prices|pricing|cost|costs|how much|budget|subscription|expensive)\b/,
    answer: () =>
      "The price depends on your project: the task handed over, the tools to connect and how much customisation it needs. The team quotes it in black and white after a first 30-minute call, free and with no commitment.",
  },
  {
    re: /\b(how (do you|does it) work|your method|the steps|process with you|how it works|get started)\b/,
    answer: () => {
      const { steps, promises } = servicesText("en");
      return `In four steps: ${steps.map((s) => `${lowerFirst(s.title)} (${lowerFirst(s.summary.replace(/\.$/, ""))})`).join(", ")}. ${promises[0]}, and ${lowerFirst(promises[1])}.`;
    },
  },
  {
    re: /\b(which agents|your agents|your team|the agents|who are|list of agents|what do you offer)\b/,
    answer: () =>
      `Sixteen agents, each an expert in its trade. Our five flagship agents: ${teamOf("en")
        .map((t) => `${t.name}, ${t.role}`)
        .join("; ")}. And eleven more: ${moreTeamOf("en")
        .map((m) => `${m.name} (${m.role})`)
        .join(", ")}. Plus a custom agent when your process is unique.`,
  },
  { re: /\b(stay in control|control|approve|approval|replace (my|our) (staff|employees|team))\b/, answer: () => faq("Do I stay") },
  { re: /\b(custom|tailor made|bespoke)\b/, answer: () => faq("When do I need") },
  { re: /\b(free|paid|commitment)\b/, answer: () => faq("Is the first meeting") },
  { re: /\bwhat (is|s) an? (ai )?agent\b/, answer: () => faq("What is an AI agent?") },
];

function readPart(t: string): DayPart | "any" | undefined {
  if (/\bafternoon\b/.test(t)) return "afternoon";
  if (/\bmorning\b/.test(t)) return "morning";
  if (/\b(no preference|either|whenever|anytime|any time|doesn t matter|does not matter|both|i m flexible|flexible)\b/.test(t)) return "any";
  return undefined;
}

function readChannel(t: string): ChannelId | undefined {
  if (/\b(video|zoom|teams|google meet|meet|visio)\b/.test(t)) return "visio";
  if (/\b(phone|call me|ring)\b/.test(t)) return "phone";
  if (/\b(by e ?mail|e ?mail is better|prefer e ?mail)\b/.test(t)) return "email";
  return undefined;
}

const STARTERS = new Set([" which agent for my need ", " how do you work ", " book a meeting "]);

/** The request prepared from the visitor's own words (nothing invented). */
export function draftOfEn(m: MayMemory): MayDraft {
  const words = m.said.filter((s) => s.length > 3 && !STARTERS.has(norm(s)) && !GREETING.test(norm(s))).join("\n");
  const message = [words ? `What I told May:\n${words}` : "I would like to be contacted to talk about my project.", m.recommended?.line].filter(Boolean).join("\n\n").slice(0, 3_800);
  const draft: MayDraft = { need: m.recommended?.need ?? "unsure", message };
  if (m.recommended?.agent) draft.agent = m.recommended.agent;
  if (m.channel) draft.channel = m.channel;
  return draft;
}

/** One visitor message: May's scripted reply, or { kind: "ai" } to let Claude take over. */
export function mayLocalEn(input: string, previous: MayMemory): LocalOutcome {
  const t = norm(input);
  const m: MayMemory = { ...previous, said: [...previous.said, input.trim()] };
  const ai = (): LocalOutcome => ({ kind: "ai", memory: m });
  if (input.length > 320 || (input.match(/\?/g)?.length ?? 0) > 1) return ai();

  if (m.asked === "confirm") {
    const channel = readChannel(t);
    if (channel) m.channel = channel;
    if (YES.test(t)) return { kind: "reply", text: READY, memory: { ...m, asked: undefined }, draft: draftOfEn(m) };
    if (NO.test(t)) return { kind: "reply", text: "No problem. I’m here if you have a question about our agents or our method.", memory: { ...m, asked: undefined } };
  }

  const channel = readChannel(t);
  if (channel) m.channel = channel;
  if (CALLBACK.test(t)) {
    return { kind: "reply", text: `I’m preparing your request so the team can ${m.channel === "phone" ? "call you back" : "get back to you"}. ${READY}`, memory: { ...m, asked: undefined }, draft: draftOfEn(m) };
  }

  // A meeting, step by step (the chat then asks the part of the day, shows the days, then the times).
  const when = readWhenEn(input);
  const part = when?.part ?? readPart(t);
  const inBooking = m.asked === "slot-part" || m.asked === "slot-day" || m.asked === "slot";
  const asksMeeting = BOOKING.test(t.replace(SALES_MEETINGS, " "));
  if (asksMeeting || (inBooking && (when !== null || part !== undefined))) {
    const meeting: SlotQuery = asksMeeting && !inBooking ? {} : { ...m.slot };
    if (when?.dated) Object.assign(meeting, { from: when.from, to: when.to, period: when.period });
    if (part) meeting.part = part;
    return { kind: "reply", text: "", memory: { ...m, slot: meeting, asked: "slot" }, booking: meeting };
  }

  const asking = /\?/.test(input) || QUESTION.test(t);
  const intents = asking ? INTENTS.filter((i) => i.re.test(t)) : [];
  const greeting = GREETING.test(t);
  const which = WHICH_AGENT.test(t);
  if (!intents.length && !greeting && !which) return ai();

  const parts: string[] = [];
  if (greeting) parts.push("Hello! I’m May, D2S AIgency’s receptionist.");
  for (const i of intents.slice(0, 2)) parts.push(i.answer());
  parts.push(TASK_QUESTION);
  // The visitor's answer describes their work: Claude reads it (with what is known so far).
  return { kind: "reply", text: parts.join("\n\n"), memory: { ...m, asked: "task" } };
}
