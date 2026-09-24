"use client";

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { ArrowRight, Calendar, ChatDots } from "@/components/ui/Icons";
import { NEEDS } from "@/lib/contact-content";
import { PRIVACY_HREF } from "@/lib/legal";
import { MAY_LIMITS, MAY_STARTERS, type MayAction, type MayChoice, type MayDraft, type MayEvent, type MayRole } from "@/lib/may";
import { draftOf, emptyMemory, mayLocal, memorySummary, type BookingStep, type MayMemory, type SlotQuery } from "@/lib/may-local";
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

/* ---------- Booking, step by step (free level): part of the day → day → times ---------- */

const PART_CHOICES: MayChoice[] = [
  { label: "Le matin", value: "Le matin" },
  { label: "L’après-midi", value: "L’après-midi" },
  { label: "Peu importe", value: "Peu importe" },
];
const partWords = (part?: SlotQuery["part"]) => (part === "morning" ? ", le matin" : part === "afternoon" ? ", l’après-midi" : "");
const localDay = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
};
/** "mardi 29 septembre" / "Mar. 29 sept." */
const dayName = (iso: string) => new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long" }).format(localDay(iso)).replace(/ 1 (?=\p{L})/u, " 1er ");
const dayChip = (iso: string) =>
  new Intl.DateTimeFormat("fr-FR", { weekday: "short", day: "numeric", month: "short" })
    .format(localDay(iso))
    .replace(/ 1 (?=\p{L})/u, " 1er ")
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
async function bookingStep(q: SlotQuery): Promise<{ text: string; extra: Partial<UiMessage>; asked: BookingStep | "confirm" }> {
  if (!q.part) {
    return {
      text: q.period ? `Très bien, ${q.period}. Vous préférez le matin ou l’après-midi ?` : "Avec plaisir ! Vous préférez le matin ou l’après-midi ?",
      extra: { choices: PART_CHOICES },
      asked: "slot-part",
    };
  }
  const single = !!q.from && q.from === q.to;
  const query = new URLSearchParams({ tz: Intl.DateTimeFormat().resolvedOptions().timeZone, mode: single ? "times" : "days" });
  if (q.from && q.to) {
    query.set("from", q.from);
    query.set("to", q.to);
  }
  if (q.part !== "any") query.set("part", q.part);
  const data = (await fetch(`/api/may/meetings?${query}`)
    .then((r) => r.json())
    .catch(() => null)) as StepData | null;
  if (!data?.configured) return { text: BOOKING_CLOSED, extra: data?.actions?.length ? { actions: data.actions } : {}, asked: "confirm" };
  const when = partWords(q.part);

  if (!single) {
    const days = data.days ?? [];
    if (!days.length) return { text: `L’agenda est complet sur les deux prochaines semaines${when}. Je prépare votre demande pour que l’équipe vous propose une date ?`, extra: {}, asked: "confirm" };
    const intro =
      data.inWindow === false
        ? `Plus de disponibilité ${q.period ?? ""}${when}. Voici les jours suivants où l’équipe est libre :`
        : `Voici les jours où l’équipe est disponible${q.period ? ` ${q.period}` : ""}${when.replace(",", "")}. Lequel vous arrange ?`;
    return { text: intro.replace(/\s+/g, " "), extra: { choices: days.map((d) => ({ label: dayChip(d.date), value: capital(dayName(d.date)) })) }, asked: "slot-day" };
  }

  const actions = data.actions ?? [];
  if (!actions.length || !data.day) return { text: `L’agenda est complet ${dayName(q.from!)}${when}. Dites-moi un autre jour, ou je prépare votre demande ?`, extra: {}, asked: "slot" };
  const intro =
    data.inWindow === false || data.day !== q.from
      ? `Plus rien de libre ${dayName(q.from!)}${when}. Le plus proche : ${dayName(data.day)}.`
      : `Voici les horaires libres pour ${dayName(data.day)}${when}.`;
  return { text: `${intro} Choisissez celui qui vous convient, vous confirmerez sur Calendly.`, extra: { actions, compact: true }, asked: "slot" };
}

interface MayChatProps {
  variant: "desktop" | "mobile";
  showIntro?: boolean;
  /** Opens the contact form with a message (the conversation, when no request was prepared). */
  onContact: (conversation: string) => void;
  /** Opens the contact form pre-filled with the request May prepared. Falls back to onContact. */
  onDraft?: (draft: MayDraft) => void;
}

const INITIAL_MESSAGE = "Dites-moi ce qui vous prend du temps aujourd’hui : je vous oriente vers le bon agent, puis je prépare votre demande ou un rendez-vous.";
const needLabel = (need: MayDraft["need"]) => NEEDS.find((n) => n.id === need)?.label ?? "";

const BOOKING_CLOSED = "La réservation en ligne n’est pas encore ouverte. Je prépare votre demande pour que l’équipe vous propose un créneau ?";
const LIMIT_REACHED = "Nous avons fait le tour de ce que je peux faire ici : le mieux est maintenant d’échanger avec l’équipe. Votre demande est prête juste en dessous.";
const pause = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

/**
 * The chat with May, in two levels. First the free one (lib/may-local.ts, in the browser): the usual
 * messages are understood and answered from the site's content, at no cost. When it is not sure, Claude takes
 * over (/api/may/chat, streamed NDJSON events) and keeps the conversation. Booking goes straight to Calendly.
 */
export function MayChat({ variant, showIntro = true, onContact, onDraft }: MayChatProps) {
  const sequence = useRef(1);
  const pending = useRef<AbortController | null>(null);
  const log = useRef<HTMLDivElement>(null);
  const field = useRef<HTMLTextAreaElement>(null);
  const [messages, setMessages] = useState<UiMessage[]>([{ id: 0, role: "assistant", content: INITIAL_MESSAGE }]);
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
      reply(LIMIT_REACHED, { draft: draftOf({ ...memory.current, said: [...memory.current.said, content] }) });
      setSending(false);
      return;
    }

    // First level: free, instant, from the site's content.
    if (!claude.current) {
      const local = mayLocal(content, memory.current);
      memory.current = local.memory;
      if (local.kind === "reply") {
        await pause(450);
        if (!local.booking) {
          reply(local.text, local.draft ? { draft: local.draft } : {});
          setSending(false);
          return;
        }
        setStatus("May consulte l’agenda…");
        const step = await bookingStep(local.booking);
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
        }),
      });
      if (!response.ok || !response.body) {
        const payload = (await response.json().catch(() => null)) as { message?: string } | null;
        throw new Error(payload?.message || "May est momentanément indisponible.");
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
      if (!finished) fail("La réponse a été interrompue. Vous pouvez réessayer.");
    } catch (error) {
      const aborted = error instanceof Error && error.name === "AbortError";
      // fetch() rejects with a TypeError when the network or the server is unreachable: never show its raw text.
      const offline = error instanceof TypeError;
      fail(
        aborted
          ? "Ma réponse prend trop de temps. L’équipe peut reprendre votre demande via le formulaire."
          : offline
            ? "Je n’arrive pas à joindre le serveur. Vérifiez votre connexion et réessayez, ou laissez votre demande à l’équipe."
            : error instanceof Error && error.message
              ? error.message
              : "Je rencontre un problème temporaire. L’équipe peut reprendre votre demande.",
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
      ...messages.filter((message) => message.id !== 0 && message.content).map((message) => `${message.role === "user" ? "Moi" : "May"} : ${message.content}`),
      ...(unsent ? [`Moi : ${unsent}`] : []),
    ]
      .join("\n\n")
      .slice(0, 3_850);
    onContact(transcript ? `Échange avec May :\n\n${transcript}` : "Je souhaite être recontacté pour préciser mon besoin.");
  };

  const last = messages.at(-1);
  const waiting = sending && (last?.role === "user" || !last?.content);

  return (
    <div className={styles.root} data-variant={variant} data-active={active}>
      {showIntro ? (
        <header className={styles.header}>
          <div>
            <span className={styles.status} aria-label="Assistante IA disponible" />
            <p className={styles.title}>
              Bonjour ! <span aria-hidden="true">👋</span>
              <br />
              Je suis May.
            </p>
          </div>
          <span className={styles.badge}>Assistante D2S</span>
        </header>
      ) : null}

      {/* data-lenis-prevent: the site's smooth scroll (Lenis) captures the wheel page-wide; the log scrolls itself. */}
      <div ref={log} className={styles.log} role="log" aria-live="polite" aria-busy={sending} aria-label="Conversation avec May" data-lenis-prevent>
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
                  <div className={styles.actions} data-compact={message.compact ? "true" : undefined} aria-label={message.compact ? "Horaires libres" : "Rendez-vous proposés"}>
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
                  <div className={styles.choices} role="group" aria-label="Réponses rapides">
                    {message.choices.map((choice) => (
                      <button key={choice.value} type="button" onClick={() => void send(choice.value)} disabled={sending}>
                        {choice.label}
                      </button>
                    ))}
                  </div>
                ) : null}
                {message.draft ? (
                  <div className={styles.draft}>
                    <p className={styles.draftTitle}>Votre demande est prête</p>
                    <p className={styles.draftMeta}>
                      {[needLabel(message.draft.need), message.draft.company, message.draft.name].filter(Boolean).join(" · ")}
                    </p>
                    <p className={styles.draftText}>{message.draft.message}</p>
                    <button type="button" className={styles.draftButton} onClick={() => openDraft(message.draft!)}>
                      Relire et envoyer ma demande
                      <ArrowRight size={15} />
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null,
        )}
        {waiting || (sending && status) ? (
          <div className={styles.messageRow} data-role="assistant" aria-label={status || "May prépare sa réponse"}>
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
        <div className={styles.starters} aria-label="Questions suggérées">
          {MAY_STARTERS.map((starter) => (
            <button key={starter} type="button" onClick={() => void send(starter)} disabled={sending}>
              {starter}
            </button>
          ))}
        </div>
      ) : null}

      <form className={styles.form} onSubmit={submit}>
        <label className="visually-hidden" htmlFor={`may-question-${variant}`}>
          Votre message à May
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
          placeholder="Écrivez à May…"
          autoComplete="off"
          disabled={sending}
        />
        <button type="submit" className={styles.send} disabled={sending || !draft.trim()} aria-label="Envoyer à May">
          <ArrowRight size={18} />
        </button>
      </form>

      <div className={styles.footer}>
        <button type="button" className={styles.handoff} onClick={handoff}>
          Être recontacté par l’équipe
        </button>
        <p>
          Assistante IA : vérifiez les informations importantes. <a href={PRIVACY_HREF}>Confidentialité</a>
        </p>
      </div>
    </div>
  );
}
