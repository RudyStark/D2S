"use client";

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { ArrowRight, Calendar, ChatDots } from "@/components/ui/Icons";
import { NEEDS } from "@/lib/contact-content";
import { PRIVACY_HREF } from "@/lib/legal";
import { MAY_LIMITS, MAY_STARTERS, type MayAction, type MayDraft, type MayEvent, type MayRole } from "@/lib/may";
import { draftOf, emptyMemory, mayLocal, memorySummary, type MayMemory } from "@/lib/may-local";
import styles from "./MayChat.module.css";

interface UiMessage {
  id: number;
  role: MayRole;
  content: string;
  actions?: MayAction[];
  draft?: MayDraft;
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
        const meetings = (await fetch(`/api/may/meetings?tz=${encodeURIComponent(Intl.DateTimeFormat().resolvedOptions().timeZone)}`)
          .then((r) => r.json())
          .catch(() => null)) as { actions?: MayAction[] } | null;
        const actions = meetings?.actions ?? [];
        setStatus("");
        if (actions.length) reply(`${local.text}\n\nVoici les prochains créneaux : choisissez celui qui vous convient, vous confirmerez sur Calendly.`, { actions });
        else {
          memory.current = { ...memory.current, asked: "confirm" };
          reply(BOOKING_CLOSED);
        }
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
          message.content || message.actions?.length || message.draft ? (
            <div key={message.id} className={styles.messageRow} data-role={message.role}>
              {message.role === "assistant" ? (
                <span className={styles.avatar} aria-hidden="true">
                  M
                </span>
              ) : null}
              <div className={styles.messageBody}>
                {message.content ? <p className={styles.message}>{message.content}</p> : null}
                {message.actions?.length ? (
                  <div className={styles.actions} aria-label="Rendez-vous proposés">
                    {message.actions.map((action) => (
                      <a key={`${message.id}-${action.href}`} href={action.href} target="_blank" rel="noopener noreferrer" className={styles.meeting}>
                        <Calendar size={16} />
                        <span>
                          <strong>{action.label}</strong>
                          {action.detail ? <small>{action.detail}</small> : null}
                        </span>
                      </a>
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
