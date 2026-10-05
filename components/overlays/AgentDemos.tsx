"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { AGENTS, type AgentType } from "@/components/experience/agents/agents.config";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { Alert, Bars, Calendar, ChatDots, Check, Clock, ContactCard, Package, PlayBox, Star, Users } from "@/components/ui/Icons";
import styles from "./AgentDemos.module.css";

/*
 * Live demos of the agents at work, one small product UI each (fictional data, labelled as a demo).
 * A demo is a timed sequence: `step` grows from 0 to its number of beats; elements appear at their beat.
 * `run` changes → replay from the start; nothing advances until `play` (the stage is on screen).
 * Reduced motion → final state at once. The agent bar at the bottom narrates what the agent is doing.
 */

export function useSequence(beats: number[], { run, reduced, play }: DemoProps) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    setStep(reduced ? beats.length : 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- restart only on replay / motion preference
  }, [run, reduced]);
  useEffect(() => {
    if (reduced || !play || step >= beats.length) return;
    const id = window.setTimeout(() => setStep((s) => s + 1), beats[step]);
    return () => window.clearTimeout(id);
  }, [step, beats, reduced, play]);
  return step;
}

/** Text typed character by character once `active`. */
export function Typewriter({ text, active, speed = 22, instant = false }: { text: string; active: boolean; speed?: number; instant?: boolean }) {
  const [n, setN] = useState(instant ? text.length : 0);
  useEffect(() => {
    if (instant) {
      setN(text.length);
      return;
    }
    if (!active) {
      setN(0);
      return;
    }
    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      setN(i);
      if (i >= text.length) window.clearInterval(id);
    }, speed);
    return () => window.clearInterval(id);
  }, [text, active, speed, instant]);
  const typing = active && n < text.length;
  return (
    <>
      {text.slice(0, n)}
      {typing && <span className={styles.caret} aria-hidden="true" />}
    </>
  );
}

export function CountUp({ to, active, format, duration = 900 }: { to: number; active: boolean; format?: (v: number) => string; duration?: number }) {
  const locale = useLocale();
  const show = format ?? ((n: number) => new Intl.NumberFormat(locale === "en" ? "en-GB" : "fr-FR").format(Math.round(n)));
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!active) {
      setV(0);
      return;
    }
    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const k = Math.min(1, (now - t0) / duration);
      setV(to * (1 - Math.pow(1 - k, 3)));
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to, active, duration]);
  return <>{show(v)}</>;
}

/** Last label whose beat has been reached. */
export function narrate(step: number, lines: [number, string][]) {
  let label = lines[0][1];
  for (const [at, text] of lines) if (step >= at) label = text;
  return label;
}

/*
 * The process under the screen (desktop): the agent's steps with their time, and a clock that runs while the agent
 * works, until « Terminé en … ». Times are the simulated duration of the agent's work (illustrative demo).
 */
export interface ProcessDef {
  /** `at`: the step at which the stage is completed; `t`: the clock (seconds) when it is. */
  stages: { label: string; at: number; t: number }[];
}

const clock = (sec: number) => {
  const s = Math.round(sec);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};
const duration = (sec: number) => {
  const s = Math.round(sec);
  return s < 60 ? `${s} s` : `${Math.floor(s / 60)} min${s % 60 ? ` ${String(s % 60).padStart(2, "0")} s` : ""}`;
};

/** The clock eases towards its target (the end time of the stage in progress). */
function useClock(target: number, reduced: boolean) {
  const [v, setV] = useState(reduced ? target : 0);
  useEffect(() => {
    if (reduced) {
      setV(target);
      return;
    }
    let raf = 0;
    const from = v;
    const t0 = performance.now();
    const ms = Math.min(2200, 600 + Math.abs(target - from) * 25);
    const tick = (now: number) => {
      const k = Math.min(1, (now - t0) / ms);
      setV(from + (target - from) * k);
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- animate from the value shown
  }, [target, reduced]);
  return v;
}

function ProcessTrack({ process, step, done, reduced }: { process: ProcessDef; step: number; done: boolean; reduced: boolean }) {
  const finished = `${useLocale() === "en" ? "Done in" : "Terminé en"} ${duration(process.stages[process.stages.length - 1].t)}`;
  const completed = process.stages.filter((s) => step >= s.at).length;
  const last = process.stages[process.stages.length - 1];
  // While a stage is in progress, the clock runs towards its end time; nothing runs before the demo starts.
  const target = step === 0 ? 0 : done ? last.t : (process.stages[completed]?.t ?? last.t);
  const shown = useClock(target, reduced);
  return (
    <div className={styles.process} data-done={done}>
      <ol className={styles.stages}>
        {process.stages.map((s, i) => (
          <li key={s.label} data-state={i < completed ? "done" : i === completed && step > 0 && !done ? "now" : "todo"}>
            <span className={styles.stageDot}>{i < completed ? <Check size={10} /> : null}</span>
            <span className={styles.stageLabel}>{s.label}</span>
            <span className={styles.stageTime}>{i < completed ? clock(s.t) : ""}</span>
          </li>
        ))}
      </ol>
      <span className={styles.clock} aria-label={done ? finished : undefined}>
        <Clock size={13} />
        {done ? finished : clock(shown)}
      </span>
    </div>
  );
}

interface FrameProps {
  app: string;
  icon: ReactNode;
  children: ReactNode;
  variant?: "chat" | "doc";
  /** One of the five (its avatar), or any avatar image (the rest of the team). */
  agent?: AgentType;
  avatar?: string;
  status: string;
  done: boolean;
  /** Desktop: the process track under the screen. */
  process?: ProcessDef;
  step?: number;
  reduced?: boolean;
}

export function Frame({ app, icon, children, variant, agent, avatar, status, done, process, step = 0, reduced = false }: FrameProps) {
  const en = useLocale() === "en";
  const screen = useRef<HTMLDivElement>(null);
  // Desktop (with the process track): on a short screen, follow the newest element as it appears.
  useEffect(() => {
    const el = screen.current;
    if (!process || !el || el.scrollHeight <= el.clientHeight) return;
    const t = window.setTimeout(() => el.scrollTo({ top: el.scrollHeight, behavior: reduced ? "auto" : "smooth" }), 180);
    return () => window.clearTimeout(t);
  }, [step, process, reduced]);
  return (
    <div className={styles.frame} data-variant={variant}>
      <div className={styles.bar}>
        <span className={styles.appIcon}>{icon}</span>
        <span className={styles.appName}>{app}</span>
        <span className={styles.live}>
          <span className={styles.liveDot} />
          {en ? "Demo" : "Démo"}
        </span>
      </div>
      <div ref={screen} className={styles.screen}>
        {children}
      </div>
      {process ? <ProcessTrack process={process} step={step} done={done} reduced={reduced} /> : null}
      <div className={styles.agentBar} data-done={done}>
        {/* eslint-disable-next-line @next/next/no-img-element -- avatar */}
        <img src={avatar ?? (agent ? AGENTS[agent].avatar : "")} alt="" width={24} height={24} />
        <span key={status} className={styles.agentText}>
          {status}
        </span>
        {done ? (
          <span className={styles.done}>
            <Check size={12} />
            {en ? "Done" : "Terminé"}
          </span>
        ) : (
          <span className={styles.working} aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
        )}
      </div>
    </div>
  );
}

export const Typing = () => (
  <div className={`${styles.msg} ${styles.out} ${styles.typing}`} aria-hidden="true">
    <span />
    <span />
    <span />
  </div>
);

/* ——— Déa: brief → post → hooks → scheduled ——— */

const DEA = {
  fr: {
    app: "Studio de contenu · LinkedIn",
    brief: "Annonce de notre nouvelle offre IA sur LinkedIn. Ton pro, mais chaleureux.",
    post: "On a arrêté de vendre des heures. 💡\nNotre nouvelle offre IA libère vos équipes des tâches répétitives. Elles se concentrent enfin sur l’essentiel : vos clients.\n👉 On vous explique tout en commentaire.",
    status: [
      [0, "Déa lit votre brief…"],
      [2, "Déa rédige dans votre ton…"],
      [4, "Déa optimise la portée du post…"],
      [5, "Déa cherche d’autres angles…"],
      [6, "Prêt en 38 s · publié après votre validation"],
    ] as [number, string][],
    process: ["Brief", "Rédaction", "Accroches", "Programmation"],
    yourBrief: "Votre brief",
    company: "Votre entreprise",
    scheduled: "Programmé · mardi 9 h 00",
    draft: "Brouillon rédigé par Déa",
    tags: "#IntelligenceArtificielle #Productivité #PME",
    hooks: "Autres accroches",
    hook1: "« Et si vos équipes récupéraient 10 h par semaine ? »",
    hook2: "« Le jour où on a testé l’IA sur nous-mêmes… »",
    toast: "Programmé mardi à 9 h 00",
    toastNote: "le créneau où votre audience est la plus active",
  },
  en: {
    app: "Content studio · LinkedIn",
    brief: "Announce our new AI offer on LinkedIn. Professional, but warm.",
    post: "We stopped selling hours. 💡\nOur new AI offer frees your teams from repetitive tasks. They can finally focus on what matters: your customers.\n👉 We explain everything in the comments.",
    status: [
      [0, "Déa is reading your brief…"],
      [2, "Déa is writing in your tone…"],
      [4, "Déa is optimising the post’s reach…"],
      [5, "Déa is looking for other angles…"],
      [6, "Ready in 38 s · published once you approve"],
    ] as [number, string][],
    process: ["Brief", "Writing", "Hooks", "Scheduling"],
    yourBrief: "Your brief",
    company: "Your company",
    scheduled: "Scheduled · Tuesday 9:00 am",
    draft: "Draft written by Déa",
    tags: "#ArtificialIntelligence #Productivity #SMB",
    hooks: "Other hooks",
    hook1: "“What if your teams got 10 hours a week back?”",
    hook2: "“The day we tested AI on ourselves…”",
    toast: "Scheduled for Tuesday at 9:00 am",
    toastNote: "the time your audience is most active",
  },
};

const stagesOf = (labels: string[], at: number[], t: number[]): ProcessDef => ({ stages: labels.map((label, i) => ({ label, at: at[i], t: t[i] })) });

function DeaDemo(props: DemoProps) {
  const { reduced } = props;
  const w = DEA[useLocale()];
  const step = useSequence([350, 2300, 1100, 3900, 900, 900], props);
  return (
    <Frame app={w.app} icon={<PlayBox size={14} />} variant="doc" agent="content" status={narrate(step, w.status)} done={step >= 6} process={props.timeline ? stagesOf(w.process, [2, 4, 5, 6], [3, 24, 33, 38]) : undefined} step={step} reduced={props.reduced}>
      <div className={styles.brief} data-on={step >= 1}>
        <span className={styles.label}>{w.yourBrief}</span>
        <p>
          <Typewriter text={w.brief} active={step >= 1} speed={24} instant={reduced} />
        </p>
      </div>

      <article className={styles.post} data-on={step >= 2}>
        <header className={styles.postHead}>
          <span className={styles.logo}>{w.company.charAt(0)}</span>
          <span>
            <strong>{w.company}</strong>
            <small>{step >= 6 ? w.scheduled : w.draft}</small>
          </span>
        </header>
        {step < 3 ? (
          <div className={styles.skeleton} aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
        ) : (
          <p className={styles.postText}>
            <Typewriter text={w.post} active speed={16} instant={reduced} />
          </p>
        )}
        <p className={styles.tags} data-on={step >= 4}>
          {w.tags}
        </p>
      </article>

      <div className={styles.hooks} data-on={step >= 5}>
        <span className={styles.label}>{w.hooks}</span>
        <span className={styles.hook}>{w.hook1}</span>
        <span className={styles.hook}>{w.hook2}</span>
      </div>

      <div className={styles.toast} data-on={step >= 6}>
        <Calendar size={16} />
        <span>
          <strong>{w.toast}</strong> · {w.toastNote}
        </span>
      </div>
    </Frame>
  );
}

/* ——— Loic: after-hours WhatsApp request → tracking → rating ——— */

const LOIC = {
  fr: {
    app: "WhatsApp · Service client",
    track: ["Préparée", "Expédiée", "En livraison", "Livrée"],
    status: [
      [0, "Loic veille sur vos messages…"],
      [2, "Loic analyse la demande…"],
      [3, "Loic consulte le suivi de commande…"],
      [5, "Loic suit la conversation…"],
      [7, "Loic recueille l’avis du client…"],
      [8, "Résolu en 1 min, sans mobiliser votre équipe"],
    ] as [number, string][],
    process: ["Demande comprise", "Suivi de commande", "Échange", "Avis et résumé"],
    day: "Aujourd’hui · 21:47 · hors horaires d’ouverture",
    m1: "Bonsoir, ma commande n’est toujours pas arrivée 😕",
    m2: "Bonsoir Julie ! Je vérifie tout de suite 🔎",
    order: "Commande n° 4821",
    eta: "Livraison prévue demain avant 13 h",
    m3: "Parfait, merci beaucoup !",
    m4: "Avec plaisir ! Comment s’est passé notre échange ?",
    stars: "5 étoiles sur 5",
    done: "Avis 5/5 enregistré · résumé transmis à votre équipe",
    t: ["21:47", "21:47", "21:48"],
  },
  en: {
    app: "WhatsApp · Customer service",
    track: ["Packed", "Shipped", "Out for delivery", "Delivered"],
    status: [
      [0, "Loic is watching your messages…"],
      [2, "Loic is reading the request…"],
      [3, "Loic is checking the order tracking…"],
      [5, "Loic is following the conversation…"],
      [7, "Loic is collecting the customer’s feedback…"],
      [8, "Solved in 1 min, without calling on your team"],
    ] as [number, string][],
    process: ["Request understood", "Order tracking", "Conversation", "Rating and summary"],
    day: "Today · 9:47 pm · outside opening hours",
    m1: "Hi, my order still hasn’t arrived 😕",
    m2: "Good evening Julie! Let me check right away 🔎",
    order: "Order no. 4821",
    eta: "Delivery expected tomorrow before 1 pm",
    m3: "Perfect, thanks a lot!",
    m4: "My pleasure! How was our conversation?",
    stars: "5 stars out of 5",
    done: "5/5 rating saved · summary sent to your team",
    t: ["9:47 pm", "9:47 pm", "9:48 pm"],
  },
};

function LoicDemo(props: DemoProps) {
  const w = LOIC[useLocale()];
  const step = useSequence([300, 1000, 1100, 1300, 1500, 1100, 1300, 1300], props);
  return (
    <Frame app={w.app} icon={<ChatDots size={14} />} variant="chat" agent="support" status={narrate(step, w.status)} done={step >= 8} process={props.timeline ? stagesOf(w.process, [3, 4, 7, 8], [4, 11, 52, 60]) : undefined} step={step} reduced={props.reduced}>
      <p className={styles.day}>{w.day}</p>
      {step >= 1 && (
        <div className={`${styles.msg} ${styles.in}`}>
          {w.m1}
          <span className={styles.time}>{w.t[0]}</span>
        </div>
      )}
      {step === 2 && <Typing />}
      {step >= 3 && (
        <div className={`${styles.msg} ${styles.out}`}>
          {w.m2}
          <span className={styles.time}>{w.t[1]}</span>
        </div>
      )}
      {step >= 4 && (
        <div className={`${styles.card} ${styles.out}`}>
          <div className={styles.cardHead}>
            <Package size={16} />
            <strong>{w.order}</strong>
          </div>
          <ol className={styles.track}>
            {w.track.map((t, i) => (
              <li key={t} data-state={i < 2 ? "done" : i === 2 ? "now" : "todo"}>
                <span />
                {t}
              </li>
            ))}
          </ol>
          <p className={styles.cardNote}>{w.eta}</p>
        </div>
      )}
      {step >= 5 && (
        <div className={`${styles.msg} ${styles.in}`}>
          {w.m3}
          <span className={styles.time}>{w.t[2]}</span>
        </div>
      )}
      {step === 6 && <Typing />}
      {step >= 7 && (
        <div className={`${styles.msg} ${styles.out}`}>
          {w.m4}
          <span className={styles.stars} aria-label={w.stars}>
            {[0, 1, 2, 3, 4].map((i) => (
              <Star key={i} size={16} style={{ animationDelay: `${0.15 + i * 0.09}s` }} />
            ))}
          </span>
        </div>
      )}
      {step >= 8 && (
        <p className={styles.system}>
          <Check size={13} /> {w.done}
        </p>
      )}
    </Frame>
  );
}

/* ——— May: personalised outreach → objection → meeting booked → CRM ——— */

const MAY = {
  fr: {
    app: "Prospection · LinkedIn",
    first: "Bonjour Claire, bravo pour votre nouvelle collection ! On aide des marques comme Atelier Nova à gagner 10 h par semaine sur leur prospection. Un échange rapide ?",
    status: [
      [0, "May qualifie le lead…"],
      [2, "May personnalise l’approche…"],
      [3, "May traite l’objection…"],
      [6, "May réserve le créneau…"],
      [8, "Rendez-vous calé · CRM à jour"],
    ] as [number, string][],
    process: ["Qualification", "Message", "Objection", "Rendez-vous", "CRM"],
    title: "Directrice marketing · Atelier Nova",
    score: "Lead chaud · 86",
    objection: "Intéressant, mais pas de budget ce trimestre.",
    reply: "Je comprends ! Beaucoup de nos clients ont démarré petit. 15 minutes pour voir ce qui est possible : jeudi 14 h ou vendredi 10 h ?",
    yes: "Jeudi 14 h, parfait.",
    day: "JEU.",
    confirmed: "Rendez-vous confirmé",
    when: "14:00 – 14:15 · Visio · invitation envoyée",
    crm: "CRM mis à jour · Atelier Nova → Rendez-vous planifié",
  },
  en: {
    app: "Prospecting · LinkedIn",
    first: "Hi Claire, congratulations on your new collection! We help brands like Atelier Nova save 10 hours a week on prospecting. Open to a quick chat?",
    status: [
      [0, "May is qualifying the lead…"],
      [2, "May is personalising the approach…"],
      [3, "May is handling the objection…"],
      [6, "May is booking the slot…"],
      [8, "Meeting booked · CRM up to date"],
    ] as [number, string][],
    process: ["Qualification", "Message", "Objection", "Meeting", "CRM"],
    title: "Marketing director · Atelier Nova",
    score: "Hot lead · 86",
    objection: "Interesting, but no budget this quarter.",
    reply: "I understand! Many of our clients started small. 15 minutes to see what’s possible: Thursday 2 pm or Friday 10 am?",
    yes: "Thursday 2 pm, perfect.",
    day: "THU",
    confirmed: "Meeting confirmed",
    when: "2:00 – 2:15 pm · Video call · invitation sent",
    crm: "CRM updated · Atelier Nova → Meeting scheduled",
  },
};

function MayDemo(props: DemoProps) {
  const { reduced } = props;
  const w = MAY[useLocale()];
  const step = useSequence([300, 900, 2700, 1200, 1100, 1300, 1200, 1000], props);
  return (
    <Frame app={w.app} icon={<ContactCard size={14} />} variant="chat" agent="prospection" status={narrate(step, w.status)} done={step >= 8} process={props.timeline ? stagesOf(w.process, [2, 3, 5, 7, 8], [6, 21, 29, 36, 40]) : undefined} step={step} reduced={props.reduced}>
      {step >= 1 && (
        <div className={styles.lead}>
          <span className={styles.avatar}>CM</span>
          <span>
            <strong>Claire Moreau</strong>
            <small>{w.title}</small>
          </span>
          <span className={styles.score}>{w.score}</span>
        </div>
      )}
      {step >= 2 && (
        <div className={`${styles.msg} ${styles.out}`}>
          <Typewriter text={w.first} active speed={11} instant={reduced} />
        </div>
      )}
      {step >= 3 && <div className={`${styles.msg} ${styles.in}`}>{w.objection}</div>}
      {step === 4 && <Typing />}
      {step >= 5 && <div className={`${styles.msg} ${styles.out}`}>{w.reply}</div>}
      {step >= 6 && <div className={`${styles.msg} ${styles.in}`}>{w.yes}</div>}
      {step >= 7 && (
        <div className={`${styles.card} ${styles.out} ${styles.meeting}`}>
          <span className={styles.meetingDate}>
            <small>{w.day}</small>
            <strong>18</strong>
          </span>
          <span>
            <strong>{w.confirmed}</strong>
            <small>{w.when}</small>
          </span>
          <Check size={18} />
        </div>
      )}
      {step >= 8 && (
        <p className={styles.system}>
          <Check size={13} /> {w.crm}
        </p>
      )}
    </Frame>
  );
}

/* ——— Diva: 48 applications screened → shortlist → invitations ——— */

const DIVA = {
  fr: {
    app: "Recrutement · Candidatures",
    candidates: [
      { initials: "IB", name: "Inès Bernard", note: "5 ans en agence · portfolio solide", score: 94 },
      { initials: "TL", name: "Thomas Leroy", note: "Réseaux sociaux B2B · anglais courant", score: 89 },
      { initials: "SK", name: "Sarah Klein", note: "Rédaction web · SEO", score: 86 },
      { initials: "HM", name: "Hugo Martin", note: "Profil junior · alternance", score: 71 },
    ],
    status: [
      [0, "Diva lit les 48 CV…"],
      [2, "Diva classe les profils…"],
      [3, "Diva présélectionne les meilleurs…"],
      [4, "Diva envoie les invitations…"],
      [5, "Shortlist prête en 12 s · la décision reste la vôtre"],
    ] as [number, string][],
    process: ["48 CV lus", "Classement", "Invitations"],
    job: "Chargé·e de communication",
    contract: "CDI · Lyon",
    applications: "candidatures",
    scanned: "48 CV analysés",
    scanning: "Diva analyse les CV…",
    shortlist: "Présélection",
    invited: "Invitations envoyées aux 3 présélectionnés",
    slots: ["Mar. 10 h", "Mer. 15 h", "Jeu. 11 h"],
    pct: " %",
  },
  en: {
    app: "Recruiting · Applications",
    candidates: [
      { initials: "IB", name: "Inès Bernard", note: "5 years in an agency · strong portfolio", score: 94 },
      { initials: "TL", name: "Thomas Leroy", note: "B2B social media · fluent English", score: 89 },
      { initials: "SK", name: "Sarah Klein", note: "Web copywriting · SEO", score: 86 },
      { initials: "HM", name: "Hugo Martin", note: "Junior profile · work-study", score: 71 },
    ],
    status: [
      [0, "Diva is reading the 48 CVs…"],
      [2, "Diva is ranking the profiles…"],
      [3, "Diva is shortlisting the best…"],
      [4, "Diva is sending the invitations…"],
      [5, "Shortlist ready in 12 s · the decision stays yours"],
    ] as [number, string][],
    process: ["48 CVs read", "Ranking", "Invitations"],
    job: "Communications officer",
    contract: "Permanent · Lyon",
    applications: "applications",
    scanned: "48 CVs analysed",
    scanning: "Diva is analysing the CVs…",
    shortlist: "Shortlisted",
    invited: "Invitations sent to the 3 shortlisted candidates",
    slots: ["Tue 10 am", "Wed 3 pm", "Thu 11 am"],
    pct: "%",
  },
};

function DivaDemo(props: DemoProps) {
  const w = DIVA[useLocale()];
  const step = useSequence([300, 2000, 1500, 900, 1100], props);
  return (
    <Frame app={w.app} icon={<Users size={14} />} variant="doc" agent="automation" status={narrate(step, w.status)} done={step >= 5} process={props.timeline ? stagesOf(w.process, [2, 3, 5], [7, 10, 12]) : undefined} step={step} reduced={props.reduced}>
      <div className={styles.job} data-on={step >= 1}>
        <span>
          <strong>{w.job}</strong>
          <small>{w.contract}</small>
        </span>
        <span className={styles.jobCount}>
          <CountUp to={48} active={step >= 1} duration={1800} /> {w.applications}
        </span>
      </div>

      <div className={styles.scan} data-on={step >= 1} data-done={step >= 2}>
        <span className={styles.scanLabel}>{step >= 2 ? w.scanned : w.scanning}</span>
        <span className={styles.scanBar}>
          <span />
        </span>
      </div>

      <ol className={styles.ranking}>
        {w.candidates.map((c, i) => (
          <li key={c.name} data-on={step >= 2} style={{ "--i": i, "--score": `${c.score}%` } as React.CSSProperties}>
            <span className={styles.avatar}>{c.initials}</span>
            <span className={styles.who}>
              <strong>{c.name}</strong>
              <small>{c.note}</small>
            </span>
            <span className={styles.match}>
              <span className={styles.matchBar}>
                <span />
              </span>
              {c.score}
              {w.pct}
            </span>
            <span className={styles.shortlist} data-on={step >= 3 && i < 3}>
              {w.shortlist}
            </span>
          </li>
        ))}
      </ol>

      <div className={styles.toast} data-on={step >= 4}>
        <Calendar size={16} />
        <span>
          <strong>{w.invited}</strong>
          <span className={styles.slots} data-on={step >= 5}>
            {w.slots.map((s) => (
              <span key={s}>{s}</span>
            ))}
          </span>
        </span>
      </div>
    </Frame>
  );
}

/* ——— Morgan: question → KPIs → chart → insight ——— */

const BASKET = [70, 71.5, 72, 71, 73, 72.5, 69.5, 67.5];

function chartPath(values: number[], w: number, h: number, pad = 6) {
  const min = Math.min(...values) - 1;
  const max = Math.max(...values) + 1;
  const pts = values.map((v, i) => [pad + (i * (w - pad * 2)) / (values.length - 1), pad + ((max - v) / (max - min)) * (h - pad * 2)]);
  return pts;
}

const MORGAN = {
  fr: {
    app: "Tableau de bord · Ventes",
    status: [
      [0, "Morgan interroge vos données…"],
      [2, "Morgan calcule vos indicateurs…"],
      [3, "Morgan analyse les tendances…"],
      [4, "Morgan rédige la synthèse…"],
      [5, "Synthèse prête · sources : CRM, boutique, Analytics"],
    ] as [number, string][],
    process: ["Données", "Tendances", "Synthèse"],
    question: "Comment se sont passées les ventes ce mois-ci ?",
    revenue: "Chiffre d’affaires",
    orders: "Commandes",
    basket: "Panier moyen",
    money: (v: string) => `${v} €`,
    pct: (n: number) => `${n} %`,
    decimal: (v: number) => v.toFixed(1).replace(".", ","),
    chart: "Panier moyen · 8 dernières semaines",
    insight: "Ventes en hausse, portées par la région Ouest.",
    watch: "À surveiller : le panier moyen baisse depuis 2 semaines, surtout sur mobile.",
    see: "Voir l’analyse",
    alert: "M’alerter chaque lundi",
  },
  en: {
    app: "Dashboard · Sales",
    status: [
      [0, "Morgan is querying your data…"],
      [2, "Morgan is computing your metrics…"],
      [3, "Morgan is analysing the trends…"],
      [4, "Morgan is writing the summary…"],
      [5, "Summary ready · sources: CRM, shop, Analytics"],
    ] as [number, string][],
    process: ["Data", "Trends", "Summary"],
    question: "How did sales go this month?",
    revenue: "Revenue",
    orders: "Orders",
    basket: "Average basket",
    money: (v: string) => `€${v}`,
    pct: (n: number) => `${n}%`,
    decimal: (v: number) => v.toFixed(1),
    chart: "Average basket · last 8 weeks",
    insight: "Sales are up, driven by the West region.",
    watch: "To watch: the average basket has been falling for 2 weeks, mostly on mobile.",
    see: "See the analysis",
    alert: "Alert me every Monday",
  },
};

function MorganDemo(props: DemoProps) {
  const w = MORGAN[useLocale()];
  const step = useSequence([300, 1200, 1300, 1800, 1200], props);
  const pts = chartPath(BASKET, 320, 92);
  const line = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const area = `${line} L${pts[pts.length - 1][0].toFixed(1)} 92 L${pts[0][0].toFixed(1)} 92 Z`;
  const drop = pts.slice(5).map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const last = pts[pts.length - 1];
  const [moneyBefore, moneyAfter] = w.money("|").split("|");
  return (
    <Frame app={w.app} icon={<Bars size={14} />} variant="doc" agent="data" status={narrate(step, w.status)} done={step >= 5} process={props.timeline ? stagesOf(w.process, [2, 3, 5], [5, 11, 18]) : undefined} step={step} reduced={props.reduced}>
      <div className={`${styles.msg} ${styles.in} ${styles.question}`} data-on={step >= 1}>
        {w.question}
      </div>

      <div className={styles.kpis}>
        <div className={styles.kpi} data-on={step >= 2} style={{ "--i": 0 } as React.CSSProperties}>
          <small>{w.revenue}</small>
          <strong>
            {moneyBefore}
            <CountUp to={84200} active={step >= 2} />
            {moneyAfter}
          </strong>
          <span data-trend="up">▲ {w.pct(12)}</span>
        </div>
        <div className={styles.kpi} data-on={step >= 2} style={{ "--i": 1 } as React.CSSProperties}>
          <small>{w.orders}</small>
          <strong>
            <CountUp to={1236} active={step >= 2} />
          </strong>
          <span data-trend="up">▲ {w.pct(8)}</span>
        </div>
        <div className={styles.kpi} data-on={step >= 2} data-alert="true" style={{ "--i": 2 } as React.CSSProperties}>
          <small>{w.basket}</small>
          <strong>
            {moneyBefore}
            <CountUp to={67.5} active={step >= 2} format={w.decimal} />
            {moneyAfter}
          </strong>
          <span data-trend="down">▼ {w.pct(4)}</span>
        </div>
      </div>

      <figure className={styles.chart} data-on={step >= 3} data-alert={step >= 4}>
        <figcaption>{w.chart}</figcaption>
        <div className={styles.plot}>
        <svg viewBox="0 0 320 92" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <linearGradient id="morgan-area" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="#1570f0" stopOpacity="0.22" />
              <stop offset="1" stopColor="#1570f0" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={area} className={styles.area} />
          <path d={line} className={styles.line} pathLength={1} />
          <path d={drop} className={styles.drop} pathLength={1} />
        </svg>
        <span className={styles.marker} style={{ left: `${(last[0] / 320) * 100}%`, top: `${(last[1] / 92) * 100}%` }} aria-hidden="true" />
        </div>
      </figure>

      <div className={styles.insight} data-on={step >= 4}>
        <Alert size={16} />
        <p>
          <strong>{w.insight}</strong> {w.watch}
        </p>
        <span className={styles.actions} data-on={step >= 5}>
          <span className={styles.primary}>{w.see}</span>
          <span>{w.alert}</span>
        </span>
      </div>
    </Frame>
  );
}

export interface DemoProps {
  run: number;
  reduced: boolean;
  play: boolean;
  /** Desktop: show the process track (the mobile version keeps its demos as they are). */
  timeline?: boolean;
}

const DEMOS: Record<AgentType, (p: DemoProps) => React.ReactElement> = {
  content: DeaDemo,
  support: LoicDemo,
  prospection: MayDemo,
  automation: DivaDemo,
  data: MorganDemo,
};

export function AgentDemo({ type, ...props }: { type: AgentType } & DemoProps) {
  const Demo = DEMOS[type];
  return <Demo {...props} />;
}
