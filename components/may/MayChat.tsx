"use client";

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { ArrowRight, Calendar, ChatDots } from "@/components/ui/Icons";
import { PRIVACY_HREF } from "@/lib/legal";
import { MAY_STARTERS, type MayAction, type MayReply, type MayRole } from "@/lib/may";
import styles from "./MayChat.module.css";

interface UiMessage {
  id: number;
  role: MayRole;
  content: string;
  actions?: MayAction[];
}

interface MayChatProps {
  variant: "desktop" | "mobile";
  showIntro?: boolean;
  onContact: (conversation: string) => void;
}

const INITIAL_MESSAGE = "Expliquez-moi votre besoin : je peux vous orienter vers le bon agent ou vous proposer un rendez-vous.";

export function MayChat({ variant, showIntro = true, onContact }: MayChatProps) {
  const sequence = useRef(1);
  const pending = useRef<AbortController | null>(null);
  const log = useRef<HTMLDivElement>(null);
  const field = useRef<HTMLTextAreaElement>(null);
  const [messages, setMessages] = useState<UiMessage[]>([
    { id: 0, role: "assistant", content: INITIAL_MESSAGE },
  ]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const active = messages.some((message) => message.role === "user");

  useEffect(() => () => pending.current?.abort(), []);
  useEffect(() => {
    if (!active) return;
    const element = log.current;
    if (element) element.scrollTop = element.scrollHeight;
  }, [active, messages, sending]);

  const send = async (suggestion?: string) => {
    const content = (suggestion ?? draft).trim().slice(0, 1_000);
    if (!content || sending) {
      if (!content) field.current?.focus();
      return;
    }

    const userMessage: UiMessage = { id: sequence.current++, role: "user", content };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setDraft("");
    setSending(true);

    const controller = new AbortController();
    pending.current = controller;
    const timeout = window.setTimeout(() => controller.abort(), 30_000);
    try {
      const response = await fetch("/api/may/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          messages: nextMessages.map(({ role, content: messageContent }) => ({ role, content: messageContent })),
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        }),
      });
      const payload = (await response.json().catch(() => null)) as (MayReply & { message?: string }) | null;
      if (!response.ok || !payload?.message) throw new Error(payload?.message || "May est momentanément indisponible.");
      setMessages((current) => [
        ...current,
        {
          id: sequence.current++,
          role: "assistant",
          content: payload.message,
          actions: Array.isArray(payload.actions) ? payload.actions : undefined,
        },
      ]);
    } catch (error) {
      const timeoutError = error instanceof Error && error.name === "AbortError";
      setMessages((current) => [
        ...current,
        {
          id: sequence.current++,
          role: "assistant",
          content: timeoutError
            ? "Ma réponse prend trop de temps. L’équipe peut reprendre votre demande via le formulaire."
            : error instanceof Error
              ? error.message
              : "Je rencontre un problème temporaire. L’équipe peut reprendre votre demande.",
        },
      ]);
    } finally {
      window.clearTimeout(timeout);
      pending.current = null;
      setSending(false);
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

  const handoff = () => {
    const transcript = messages
      .filter((message) => message.id !== 0)
      .map((message) => `${message.role === "user" ? "Client" : "May"} : ${message.content}`)
      .join("\n\n")
      .slice(0, 3_850);
    onContact(transcript ? `Échange avec May :\n\n${transcript}` : "Je souhaite être recontacté pour préciser mon besoin.");
  };

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

      <div ref={log} className={styles.log} role="log" aria-live="polite" aria-label="Conversation avec May">
        {messages.map((message) => (
          <div key={message.id} className={styles.messageRow} data-role={message.role}>
            {message.role === "assistant" ? (
              <span className={styles.avatar} aria-hidden="true">
                M
              </span>
            ) : null}
            <div className={styles.messageBody}>
              <p className={styles.message}>{message.content}</p>
              {message.actions?.length ? (
                <div className={styles.actions} aria-label="Créneaux et rendez-vous proposés">
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
            </div>
          </div>
        ))}
        {sending ? (
          <div className={styles.messageRow} data-role="assistant" aria-label="May prépare sa réponse">
            <span className={styles.avatar} aria-hidden="true">
              M
            </span>
            <span className={styles.typing} aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
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
          maxLength={1_000}
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
          Assistant IA : vérifiez les informations importantes. <a href={PRIVACY_HREF}>Confidentialité</a>
        </p>
      </div>
    </div>
  );
}

