"use client";

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { ArrowRight, Calendar, ChatDots } from "@/components/ui/Icons";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { needLabelOf } from "@/lib/contact-content";
import type { Locale } from "@/lib/i18n";
import { privacyHrefOf } from "@/lib/legal";
import { MAY_LIMITS, mayStartersOf, type MayAction, type MayChoice, type MayDraft, type MayEvent, type MayRole } from "@/lib/may";
import { draftOf, emptyMemory, mayLocal, memorySummary, type BookingStep, type MayMemory, type SlotQuery } from "@/lib/may-local";
import { draftOfEn, mayLocalEn } from "@/lib/may-local-en";
import styles from "./MayChat.module.css";

interface UiMessage {
  id: number;
  role: MayRole;
  content: string;
  actions?: MayAction[];
  /** The times of one day: shown as a compact grid of hours. */
  compact?: boolean;
  /** Quick answers of a booking step (only on the latest message). */
  choices?: MayChoice[];
  draft?: MayDraft;
}

/* ---------- Words of the chat ---------- */

const WORDS = {
  fr: {
    lang: "fr-FR",
    parts: [
      { label: "Le matin", value: "Le matin" },
      { label: "L’après-midi", value: "L’après-midi" },
      { label: "Peu importe", value: "Peu importe" },
    ] as MayChoice[],
    morning: ", le matin",
    afternoon: ", l’après-midi",
    askPart: (period?: string) => (period ? `Très bien, ${period}. Vous préférez le matin ou l’après-midi ?` : "Avec plaisir ! Vous préférez le matin ou l’après-midi ?"),
    full: (when: string) => `L’agenda est complet sur les deux prochaines semaines${when}. Je prépare votre demande pour que l’équipe vous propose une date ?`,
    noMore: (period: string, when: string) => `Plus de disponibilité ${period}${when}. Voici les jours suivants où l’équipe est libre :`,
    days: (period: string, when: string) => `Voici les jours où l’équipe est disponible${period ? ` ${period}` : ""}${when.replace(",", "")}. Lequel vous arrange ?`,
    dayFull: (day: string, when: string) => `L’agenda est complet ${day}${when}. Dites-moi un autre jour, ou je prépare votre demande ?`,
    nothingThatDay: (day: string, when: string, next: string) => `Plus rien de libre ${day}${when}. Le plus proche : ${next}.`,
    times: (day: string, when: string) => `Voici les horaires libres pour ${day}${when}.`,
    pick: "Choisissez celui qui vous convient, vous confirmerez sur Calendly.",
    initial: "Dites-moi ce qui vous prend du temps aujourd’hui : je vous oriente vers le bon agent, puis je prépare votre demande ou un rendez-vous.",
    closed: "La réservation en ligne n’est pas encore ouverte. Je prépare votre demande pour que l’équipe vous propose un créneau ?",
    limit: "Nous avons fait le tour de ce que je peux faire ici : le mieux est maintenant d’échanger avec l’équipe. Votre demande est prête juste en dessous.",
    agenda: "May consulte l’agenda…",
    unavailable: "May est momentanément indisponible.",
    interrupted: "La réponse a été interrompue. Vous pouvez réessayer.",
    slow: "Ma réponse prend trop de temps. L’équipe peut reprendre votre demande via le formulaire.",
    offline: "Je n’arrive pas à joindre le serveur. Vérifiez votre connexion et réessayez, ou laissez votre demande à l’équipe.",
    trouble: "Je rencontre un problème temporaire. L’équipe peut reprendre votre demande.",
    me: "Moi",
    exchange: "Échange avec May :",
    callback: "Je souhaite être recontacté pour préciser mon besoin.",
    available: "Assistante IA disponible",
    hello: "Bonjour !",
    iam: "Je suis May.",
    badge: "Assistante D2S",
    log: "Conversation avec May",
    freeTimes: "Horaires libres",
    proposed: "Rendez-vous proposés",
    quick: "Réponses rapides",
    ready: "Votre demande est prête",
    review: "Relire et envoyer ma demande",
    preparing: "May prépare sa réponse",
    suggested: "Questions suggérées",
    yourMessage: "Votre message à May",
    placeholder: "Écrivez à May…",
    send: "Envoyer à May",
    handoff: "Être recontacté par l’équipe",
    disclaimer: "Assistante IA : vérifiez les informations importantes.",
    privacy: "Confidentialité",
  },
  en: {
    lang: "en-GB",
    parts: [
      { label: "Morning", value: "In the morning" },
      { label: "Afternoon", value: "In the afternoon" },
      { label: "No preference", value: "No preference" },
    ] as MayChoice[],
    morning: ", in the morning",
    afternoon: ", in the afternoon",
    askPart: (period?: string) => (period ? `Great, ${period}. Do you prefer the morning or the afternoon?` : "With pleasure! Do you prefer the morning or the afternoon?"),
    full: (when: string) => `The calendar is full for the next two weeks${when}. Shall I prepare your request so the team suggests a date?`,
    noMore: (period: string, when: string) => `Nothing left ${period}${when}. Here are the next days the team is free:`,
    days: (period: string, when: string) => `Here are the days the team is available${period ? ` ${period}` : ""}${when.replace(",", "")}. Which one suits you?`,
    dayFull: (day: string, when: string) => `The calendar is full on ${day}${when}. Tell me another day, or shall I prepare your request?`,
    nothingThatDay: (day: string, when: string, next: string) => `Nothing left on ${day}${when}. The closest: ${next}.`,
    times: (day: string, when: string) => `Here are the free times on ${day}${when}.`,
    pick: "Pick the one that suits you, you will confirm on Calendly.",
    initial: "Tell me what takes up your time today: I’ll point you to the right agent, then prepare your request or a meeting.",
    closed: "Online booking is not open yet. Shall I prepare your request so the team suggests a time?",
    limit: "We have covered what I can do here: the best next step is to talk with the team. Your request is ready just below.",
    agenda: "May is checking the calendar…",
    unavailable: "May is unavailable for a moment.",
    interrupted: "The answer was interrupted. You can try again.",
    slow: "My answer is taking too long. The team can pick up your request through the form.",
    offline: "I can’t reach the server. Check your connection and try again, or leave your request with the team.",
    trouble: "I’m having a temporary problem. The team can pick up your request.",
    me: "Me",
    exchange: "Conversation with May:",
    callback: "I would like to be contacted to clarify my need.",
    available: "AI assistant available",
    hello: "Hello!",
    iam: "I’m May.",
    badge: "D2S assistant",
    log: "Conversation with May",
    freeTimes: "Free times",
    proposed: "Suggested meetings",
    quick: "Quick answers",
    ready: "Your request is ready",
    review: "Review and send my request",
    preparing: "May is preparing her answer",
    suggested: "Suggested questions",
    yourMessage: "Your message to May",
    placeholder: "Write to May…",
    send: "Send to May",
    handoff: "Get a call back from the team",
    disclaimer: "AI assistant: check important information.",
    privacy: "Privacy",
  },
};

/* ---------- Booking, step by step (free level): part of the day → day → times ---------- */

const localDay = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
};
/** "mardi 29 septembre" / "Mar. 29 sept." ("Tuesday 29 September" / "Tue 29 Sept") */
const dayName = (iso: string, lang: string) =>
  new Intl.DateTimeFormat(lang, { weekday: "long", day: "numeric", month: "long" })
    .format(localDay(iso))
    .replace(/ 1 (?=\p{L})/u, lang === "fr-FR" ? " 1er " : " 1 ")
    .replace(",", "");
const dayChip = (iso: string, lang: string) =>
  new Intl.DateTimeFormat(lang, { weekday: "short", day: "numeric", month: "short" })
    .format(localDay(iso))
    .replace(/ 1 (?=\p{L})/u, lang === "fr-FR" ? " 1er " : " 1 ")
    .replace(",", "")
    .replace(/^\p{L}/u, (c) => c.toUpperCase());
const capital = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

interface StepData {
  configured?: boolean;
  inWindow?: boolean;
  days?: { date: string; count: number }[];
  day?: string;
  actions?: MayAction[];
}

/**
 * The next booking step for what the visitor gave so far: no part of the day → "le matin ou l'après-midi ?";
 * no single day → the days that still have free times (in the asked period); one day → its free times.
 */
async function bookingStep(q: SlotQuery, locale: Locale): Promise<{ text: string; extra: Partial<UiMessage>; asked: BookingStep | "confirm" }> {
  const w = WORDS[locale];
  const day = (iso: string) => dayName(iso, w.lang);
  if (!q.part) {
    return {
      text: w.askPart(q.period),
      extra: { choices: w.parts },
      asked: "slot-part",
    };
  }
  const single = !!q.from && q.from === q.to;
  const query = new URLSearchParams({ tz: Intl.DateTimeFormat().resolvedOptions().timeZone, mode: single ? "times" : "days", lang: locale });
  if (q.from && q.to) {
    query.set("from", q.from);
    query.set("to", q.to);
  }
  if (q.part !== "any") query.set("part", q.part);
  const data = (await fetch(`/api/may/meetings?${query}`)
    .then((r) => r.json())
    .catch(() => null)) as StepData | null;
  if (!data?.configured) return { text: w.closed, extra: data?.actions?.length ? { actions: data.actions } : {}, asked: "confirm" };
  const when = q.part === "morning" ? w.morning : q.part === "afternoon" ? w.afternoon : "";

  if (!single) {
    const days = data.days ?? [];
    if (!days.length) return { text: w.full(when), extra: {}, asked: "confirm" };
    const intro = data.inWindow === false ? w.noMore(q.period ?? "", when) : w.days(q.period ?? "", when);
    return { text: intro.replace(/\s+/g, " "), extra: { choices: days.map((d) => ({ label: dayChip(d.date, w.lang), value: capital(day(d.date)) })) }, asked: "slot-day" };
  }

  const actions = data.actions ?? [];
  if (!actions.length || !data.day) return { text: w.dayFull(day(q.from!), when), extra: {}, asked: "slot" };
  const intro = data.inWindow === false || data.day !== q.from ? w.nothingThatDay(day(q.from!), when, day(data.day)) : w.times(day(data.day), when);
  return { text: `${intro} ${w.pick}`, extra: { actions, compact: true }, asked: "slot" };
}

interface MayChatProps {
  variant: "desktop" | "mobile";
  showIntro?: boolean;
  /** Opens the contact form with a message (the conversation, when no request was prepared). */
  onContact: (conversation: string) => void;
  /** Opens the contact form pre-filled with the request May prepared. Falls back to onContact. */
  onDraft?: (draft: MayDraft) => void;
}

const pause = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

/**
 * The chat with May, in two levels. First the free one (lib/may-local.ts, in the browser): the usual
 * messages are understood and answered from the site's content, at no cost. When it is not sure, Claude takes
 * over (/api/may/chat, streamed NDJSON events) and keeps the conversation. Booking goes straight to Calendly.
 */
export function MayChat({ variant, showIntro = true, onContact, onDraft }: MayChatProps) {
  const locale = useLocale();
  const w = WORDS[locale];
  const en = locale === "en";
  const sequence = useRef(1);
  const pending = useRef<AbortController | null>(null);
  const log = useRef<HTMLDivElement>(null);
  const field = useRef<HTMLTextAreaElement>(null);
  const [messages, setMessages] = useState<UiMessage[]>([{ id: 0, role: "assistant", content: w.initial }]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState("");
  // What the free level understood so far, and whether Claude has taken over the conversation.
  const memory = useRef<MayMemory>(emptyMemory());
  const claude = useRef(false);
  const active = messages.some((message) => message.role === "user");

  useEffect(() => () => pending.current?.abort(), []);
  useEffect(() => {
    if (!active) return;
    const element = log.current;
    if (element) element.scrollTop = element.scrollHeight;
  }, [active, messages, sending, status]);

  const openDraft = (value: MayDraft) => (onDraft ? onDraft(value) : onContact(value.message));

  const send = async (suggestion?: string) => {
    const content = (suggestion ?? draft).trim().slice(0, MAY_LIMITS.messageLength);
    if (!content || sending) {
      if (!content) field.current?.focus();
      return;
    }

    const history = [...messages, { id: sequence.current++, role: "user" as const, content }];
    const replyId = sequence.current++;
    setMessages(history);
    setDraft("");
    setSending(true);
    setStatus("");
    const reply = (text: string, extra: Partial<UiMessage> = {}) =>
      setMessages((current) => [...current, { id: replyId, role: "assistant", content: text, ...extra }]);

    // Past the limit: the form takes over (and the API bill stays bounded).
    if (history.filter((m) => m.role === "user").length > MAY_LIMITS.visitorMessages) {
      await pause(350);
      const final = { ...memory.current, said: [...memory.current.said, content] };
      reply(w.limit, { draft: en ? draftOfEn(final) : draftOf(final) });
      setSending(false);
      return;
    }

    // First level: free, instant, from the site's content.
    if (!claude.current) {
      const local = en ? mayLocalEn(content, memory.current) : mayLocal(content, memory.current);
      memory.current = local.memory;
      if (local.kind === "reply") {
        await pause(450);
        if (!local.booking) {
          reply(local.text, local.draft ? { draft: local.draft } : {});
          setSending(false);
          return;
        }
        setStatus(w.agenda);
        const step = await bookingStep(local.booking, locale);
        setStatus("");
        memory.current = { ...memory.current, asked: step.asked };
        reply([local.text, step.text].filter(Boolean).join("\n\n"), step.extra);
        setSending(false);
        return;
      }
      claude.current = true;
    }

    // The answer grows in place as events arrive.
    const update = (change: (message: UiMessage) => UiMessage) =>
      setMessages((current) => {
        const exists = current.some((m) => m.id === replyId);
        const base = exists ? current : [...current, { id: replyId, role: "assistant" as const, content: "" }];
        return base.map((m) => (m.id === replyId ? change(m) : m));
      });
    const fail = (text: string) => update((m) => ({ ...m, content: m.content ? `${m.content}\n\n${text}` : text }));

    const controller = new AbortController();
    pending.current = controller;
    const timeout = window.setTimeout(() => controller.abort(), 60_000);
    try {
      const response = await fetch("/api/may/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          messages: history.filter((m) => m.id !== 0 && m.content).map(({ role, content: text }) => ({ role, content: text })),
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          known: memorySummary(memory.current),
          locale,
        }),
      });
      if (!response.ok || !response.body) {
        const payload = (await response.json().catch(() => null)) as { message?: string } | null;
        throw new Error(payload?.message || w.unavailable);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let finished = false;
      const handle = (event: MayEvent) => {
        if (event.type === "text") {
          setStatus("");
          update((m) => ({ ...m, content: m.content + event.text }));
        } else if (event.type === "status") setStatus(event.text);
        else if (event.type === "actions") update((m) => ({ ...m, actions: [...(m.actions ?? []), ...event.actions].slice(0, 6) }));
        else if (event.type === "draft") update((m) => ({ ...m, draft: event.draft }));
        else if (event.type === "error") fail(event.message);
        if (event.type === "done" || event.type === "error") finished = true;
      };
      for (;;) {
        const { value, done } = await reader.read();
        buffer += decoder.decode(value, { stream: !done });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            handle(JSON.parse(line) as MayEvent);
          } catch {
            // A malformed line is skipped; the rest of the answer still arrives.
          }
        }
        if (done) break;
      }
      if (!finished) fail(w.interrupted);
    } catch (error) {
      const aborted = error instanceof Error && error.name === "AbortError";
      // fetch() rejects with a TypeError when the network or the server is unreachable: never show its raw text.
      const offline = error instanceof TypeError;
      fail(
        aborted
          ? w.slow
          : offline
            ? w.offline
            : error instanceof Error && error.message
              ? error.message
              : w.trouble,
      );
    } finally {
      window.clearTimeout(timeout);
      pending.current = null;
      setSending(false);
      setStatus("");
    }
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    void send();
  };

  const keyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void send();
    }
  };

  // "Être recontacté": the request May prepared if there is one, otherwise the conversation itself.
  const handoff = () => {
    const prepared = [...messages].reverse().find((m) => m.draft)?.draft;
    if (prepared) return openDraft(prepared);
    // A question typed but not sent yet counts too: the visitor expects it to reach the team.
    const unsent = draft.trim();
    const transcript = [
      ...messages.filter((message) => message.id !== 0 && message.content).map((message) => `${message.role === "user" ? w.me : "May"}${en ? ":" : " :"} ${message.content}`),
      ...(unsent ? [`${w.me}${en ? ":" : " :"} ${unsent}`] : []),
    ]
      .join("\n\n")
      .slice(0, 3_850);
    onContact(transcript ? `${w.exchange}\n\n${transcript}` : w.callback);
  };

  const last = messages.at(-1);
  const waiting = sending && (last?.role === "user" || !last?.content);

  return (
    <div className={styles.root} data-variant={variant} data-active={active}>
      {showIntro ? (
        <header className={styles.header}>
          <div>
            <span className={styles.status} aria-label={w.available} />
            <p className={styles.title}>
              {w.hello} <span aria-hidden="true">👋</span>
              <br />
              {w.iam}
            </p>
          </div>
          <span className={styles.badge}>{w.badge}</span>
        </header>
      ) : null}

      {/* data-lenis-prevent: the site's smooth scroll (Lenis) captures the wheel page-wide; the log scrolls itself. */}
      <div ref={log} className={styles.log} role="log" aria-live="polite" aria-busy={sending} aria-label={w.log} data-lenis-prevent>
        {messages.map((message) =>
          message.content || message.actions?.length || message.draft || message.choices?.length ? (
            <div key={message.id} className={styles.messageRow} data-role={message.role}>
              {message.role === "assistant" ? (
                <span className={styles.avatar} aria-hidden="true">
                  M
                </span>
              ) : null}
              <div className={styles.messageBody}>
                {message.content ? <p className={styles.message}>{message.content}</p> : null}
                {message.actions?.length ? (
                  <div className={styles.actions} data-compact={message.compact ? "true" : undefined} aria-label={message.compact ? w.freeTimes : w.proposed}>
                    {message.actions.map((action) => (
                      <a key={`${message.id}-${action.href}`} href={action.href} target="_blank" rel="noopener noreferrer" className={styles.meeting}>
                        {message.compact ? null : <Calendar size={16} />}
                        <span>
                          <strong>{action.label}</strong>
                          {action.detail && !message.compact ? <small>{action.detail}</small> : null}
                        </span>
                      </a>
                    ))}
                  </div>
                ) : null}
                {/* Quick answers of a booking step: only while it is the latest message. */}
                {message.choices?.length && message.id === messages.at(-1)?.id ? (
                  <div className={styles.choices} role="group" aria-label={w.quick}>
                    {message.choices.map((choice) => (
                      <button key={choice.value} type="button" onClick={() => void send(choice.value)} disabled={sending}>
                        {choice.label}
                      </button>
                    ))}
                  </div>
                ) : null}
                {message.draft ? (
                  <div className={styles.draft}>
                    <p className={styles.draftTitle}>{w.ready}</p>
                    <p className={styles.draftMeta}>
                      {[message.draft.agent ?? (message.draft.need !== "unsure" ? needLabelOf(message.draft.need, locale) : ""), message.draft.company, message.draft.name]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                    <p className={styles.draftText}>{message.draft.message}</p>
                    <button type="button" className={styles.draftButton} onClick={() => openDraft(message.draft!)}>
                      {w.review}
                      <ArrowRight size={15} />
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null,
        )}
        {waiting || (sending && status) ? (
          <div className={styles.messageRow} data-role="assistant" aria-label={status || w.preparing}>
            <span className={styles.avatar} aria-hidden="true">
              M
            </span>
            {status ? (
              <span className={styles.statusLine}>{status}</span>
            ) : (
              <span className={styles.typing} aria-hidden="true">
                <i />
                <i />
                <i />
              </span>
            )}
          </div>
        ) : null}
      </div>

      {!active ? (
        <div className={styles.starters} aria-label={w.suggested}>
          {mayStartersOf(locale).map((starter) => (
            <button key={starter} type="button" onClick={() => void send(starter)} disabled={sending}>
              {starter}
            </button>
          ))}
        </div>
      ) : null}

      <form className={styles.form} onSubmit={submit}>
        <label className="visually-hidden" htmlFor={`may-question-${variant}`}>
          {w.yourMessage}
        </label>
        <ChatDots size={18} />
        <textarea
          ref={field}
          id={`may-question-${variant}`}
          rows={1}
          maxLength={MAY_LIMITS.messageLength}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={keyDown}
          placeholder={w.placeholder}
          autoComplete="off"
          disabled={sending}
        />
        <button type="submit" className={styles.send} disabled={sending || !draft.trim()} aria-label={w.send}>
          <ArrowRight size={18} />
        </button>
      </form>

      <div className={styles.footer}>
        <button type="button" className={styles.handoff} onClick={handoff}>
          {w.handoff}
        </button>
        <p>
          {w.disclaimer} <a href={privacyHrefOf(locale)}>{w.privacy}</a>
        </p>
      </div>
    </div>
  );
}
