"use client";

import { useEffect, useState, type ReactNode } from "react";
import { AGENTS, type AgentType } from "@/components/experience/agents/agents.config";
import { Alert, Bars, Calendar, ChatDots, Check, ContactCard, Package, PlayBox, Star, Users } from "@/components/ui/Icons";
import styles from "./AgentDemos.module.css";

/*
 * Live demos of the agents at work, one small product UI each (fictional data, labelled as a demo).
 * A demo is a timed sequence: `step` grows from 0 to its number of beats; elements appear at their beat.
 * `run` changes → replay from the start; nothing advances until `play` (the stage is on screen).
 * Reduced motion → final state at once. The agent bar at the bottom narrates what the agent is doing.
 */

function useSequence(beats: number[], { run, reduced, play }: DemoProps) {
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
function Typewriter({ text, active, speed = 22, instant = false }: { text: string; active: boolean; speed?: number; instant?: boolean }) {
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

function CountUp({ to, active, format = (v) => new Intl.NumberFormat("fr-FR").format(Math.round(v)), duration = 900 }: { to: number; active: boolean; format?: (v: number) => string; duration?: number }) {
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
  return <>{format(v)}</>;
}

/** Last label whose beat has been reached. */
function narrate(step: number, lines: [number, string][]) {
  let label = lines[0][1];
  for (const [at, text] of lines) if (step >= at) label = text;
  return label;
}

interface FrameProps {
  app: string;
  icon: ReactNode;
  children: ReactNode;
  variant?: "chat" | "doc";
  agent: AgentType;
  status: string;
  done: boolean;
}

function Frame({ app, icon, children, variant, agent, status, done }: FrameProps) {
  return (
    <div className={styles.frame} data-variant={variant}>
      <div className={styles.bar}>
        <span className={styles.appIcon}>{icon}</span>
        <span className={styles.appName}>{app}</span>
        <span className={styles.live}>
          <span className={styles.liveDot} />
          Démo
        </span>
      </div>
      <div className={styles.screen}>{children}</div>
      <div className={styles.agentBar} data-done={done}>
        {/* eslint-disable-next-line @next/next/no-img-element -- avatar */}
        <img src={AGENTS[agent].avatar} alt="" width={24} height={24} />
        <span key={status} className={styles.agentText}>
          {status}
        </span>
        {done ? (
          <span className={styles.done}>
            <Check size={12} />
            Terminé
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

const Typing = () => (
  <div className={`${styles.msg} ${styles.out} ${styles.typing}`} aria-hidden="true">
    <span />
    <span />
    <span />
  </div>
);

/* ——— Déa: brief → post → hooks → scheduled ——— */

const DEA_BRIEF = "Annonce de notre nouvelle offre IA sur LinkedIn. Ton pro, mais chaleureux.";
const DEA_POST =
  "On a arrêté de vendre des heures. 💡\nNotre nouvelle offre IA libère vos équipes des tâches répétitives. Elles se concentrent enfin sur l’essentiel : vos clients.\n👉 On vous explique tout en commentaire.";

const DEA_STATUS: [number, string][] = [
  [0, "Déa lit votre brief…"],
  [2, "Déa rédige dans votre ton…"],
  [4, "Déa optimise la portée du post…"],
  [5, "Déa cherche d’autres angles…"],
  [6, "Prêt en 38 s · publié après votre validation"],
];

function DeaDemo(props: DemoProps) {
  const { reduced } = props;
  const step = useSequence([350, 2300, 1100, 3900, 900, 900], props);
  return (
    <Frame app="Studio de contenu · LinkedIn" icon={<PlayBox size={14} />} variant="doc" agent="content" status={narrate(step, DEA_STATUS)} done={step >= 6}>
      <div className={styles.brief} data-on={step >= 1}>
        <span className={styles.label}>Votre brief</span>
        <p>
          <Typewriter text={DEA_BRIEF} active={step >= 1} speed={24} instant={reduced} />
        </p>
      </div>

      <article className={styles.post} data-on={step >= 2}>
        <header className={styles.postHead}>
          <span className={styles.logo}>V</span>
          <span>
            <strong>Votre entreprise</strong>
            <small>{step >= 6 ? "Programmé · mardi 9 h 00" : "Brouillon rédigé par Déa"}</small>
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
            <Typewriter text={DEA_POST} active speed={16} instant={reduced} />
          </p>
        )}
        <p className={styles.tags} data-on={step >= 4}>
          #IntelligenceArtificielle #Productivité #PME
        </p>
      </article>

      <div className={styles.hooks} data-on={step >= 5}>
        <span className={styles.label}>Autres accroches</span>
        <span className={styles.hook}>« Et si vos équipes récupéraient 10 h par semaine ? »</span>
        <span className={styles.hook}>« Le jour où on a testé l’IA sur nous-mêmes… »</span>
      </div>

      <div className={styles.toast} data-on={step >= 6}>
        <Calendar size={16} />
        <span>
          <strong>Programmé mardi à 9 h 00</strong> · le créneau où votre audience est la plus active
        </span>
      </div>
    </Frame>
  );
}

/* ——— Loic: after-hours WhatsApp request → tracking → rating ——— */

const TRACK = ["Préparée", "Expédiée", "En livraison", "Livrée"];

const LOIC_STATUS: [number, string][] = [
  [0, "Loic veille sur vos messages…"],
  [2, "Loic analyse la demande…"],
  [3, "Loic consulte le suivi de commande…"],
  [5, "Loic suit la conversation…"],
  [7, "Loic recueille l’avis du client…"],
  [8, "Résolu en 1 min, sans mobiliser votre équipe"],
];

function LoicDemo(props: DemoProps) {
  const step = useSequence([300, 1000, 1100, 1300, 1500, 1100, 1300, 1300], props);
  return (
    <Frame app="WhatsApp · Service client" icon={<ChatDots size={14} />} variant="chat" agent="support" status={narrate(step, LOIC_STATUS)} done={step >= 8}>
      <p className={styles.day}>Aujourd’hui · 21:47 · hors horaires d’ouverture</p>
      {step >= 1 && (
        <div className={`${styles.msg} ${styles.in}`}>
          Bonsoir, ma commande n’est toujours pas arrivée 😕
          <span className={styles.time}>21:47</span>
        </div>
      )}
      {step === 2 && <Typing />}
      {step >= 3 && (
        <div className={`${styles.msg} ${styles.out}`}>
          Bonsoir Julie ! Je vérifie tout de suite 🔎
          <span className={styles.time}>21:47</span>
        </div>
      )}
      {step >= 4 && (
        <div className={`${styles.card} ${styles.out}`}>
          <div className={styles.cardHead}>
            <Package size={16} />
            <strong>Commande n° 4821</strong>
          </div>
          <ol className={styles.track}>
            {TRACK.map((t, i) => (
              <li key={t} data-state={i < 2 ? "done" : i === 2 ? "now" : "todo"}>
                <span />
                {t}
              </li>
            ))}
          </ol>
          <p className={styles.cardNote}>Livraison prévue demain avant 13 h</p>
        </div>
      )}
      {step >= 5 && (
        <div className={`${styles.msg} ${styles.in}`}>
          Parfait, merci beaucoup !<span className={styles.time}>21:48</span>
        </div>
      )}
      {step === 6 && <Typing />}
      {step >= 7 && (
        <div className={`${styles.msg} ${styles.out}`}>
          Avec plaisir ! Comment s’est passé notre échange ?
          <span className={styles.stars} aria-label="5 étoiles sur 5">
            {[0, 1, 2, 3, 4].map((i) => (
              <Star key={i} size={16} style={{ animationDelay: `${0.15 + i * 0.09}s` }} />
            ))}
          </span>
        </div>
      )}
      {step >= 8 && (
        <p className={styles.system}>
          <Check size={13} /> Avis 5/5 enregistré · résumé transmis à votre équipe
        </p>
      )}
    </Frame>
  );
}

/* ——— May: personalised outreach → objection → meeting booked → CRM ——— */

const MAY_FIRST =
  "Bonjour Claire, bravo pour votre nouvelle collection ! On aide des marques comme Atelier Nova à gagner 10 h par semaine sur leur prospection. Un échange rapide ?";

const MAY_STATUS: [number, string][] = [
  [0, "May qualifie le lead…"],
  [2, "May personnalise l’approche…"],
  [3, "May traite l’objection…"],
  [6, "May réserve le créneau…"],
  [8, "Rendez-vous calé · CRM à jour"],
];

function MayDemo(props: DemoProps) {
  const { reduced } = props;
  const step = useSequence([300, 900, 2700, 1200, 1100, 1300, 1200, 1000], props);
  return (
    <Frame app="Prospection · LinkedIn" icon={<ContactCard size={14} />} variant="chat" agent="prospection" status={narrate(step, MAY_STATUS)} done={step >= 8}>
      {step >= 1 && (
        <div className={styles.lead}>
          <span className={styles.avatar}>CM</span>
          <span>
            <strong>Claire Moreau</strong>
            <small>Directrice marketing · Atelier Nova</small>
          </span>
          <span className={styles.score}>Lead chaud · 86</span>
        </div>
      )}
      {step >= 2 && (
        <div className={`${styles.msg} ${styles.out}`}>
          <Typewriter text={MAY_FIRST} active speed={11} instant={reduced} />
        </div>
      )}
      {step >= 3 && <div className={`${styles.msg} ${styles.in}`}>Intéressant, mais pas de budget ce trimestre.</div>}
      {step === 4 && <Typing />}
      {step >= 5 && (
        <div className={`${styles.msg} ${styles.out}`}>
          Je comprends ! Beaucoup de nos clients ont démarré petit. 15 minutes pour voir ce qui est possible : jeudi 14 h ou vendredi 10 h ?
        </div>
      )}
      {step >= 6 && <div className={`${styles.msg} ${styles.in}`}>Jeudi 14 h, parfait.</div>}
      {step >= 7 && (
        <div className={`${styles.card} ${styles.out} ${styles.meeting}`}>
          <span className={styles.meetingDate}>
            <small>JEU.</small>
            <strong>18</strong>
          </span>
          <span>
            <strong>Rendez-vous confirmé</strong>
            <small>14:00 – 14:15 · Visio · invitation envoyée</small>
          </span>
          <Check size={18} />
        </div>
      )}
      {step >= 8 && (
        <p className={styles.system}>
          <Check size={13} /> CRM mis à jour · Atelier Nova → Rendez-vous planifié
        </p>
      )}
    </Frame>
  );
}

/* ——— Diva: 48 applications screened → shortlist → invitations ——— */

const CANDIDATES = [
  { initials: "IB", name: "Inès Bernard", note: "5 ans en agence · portfolio solide", score: 94 },
  { initials: "TL", name: "Thomas Leroy", note: "Réseaux sociaux B2B · anglais courant", score: 89 },
  { initials: "SK", name: "Sarah Klein", note: "Rédaction web · SEO", score: 86 },
  { initials: "HM", name: "Hugo Martin", note: "Profil junior · alternance", score: 71 },
];

const DIVA_STATUS: [number, string][] = [
  [0, "Diva lit les 48 CV…"],
  [2, "Diva classe les profils…"],
  [3, "Diva présélectionne les meilleurs…"],
  [4, "Diva envoie les invitations…"],
  [5, "Shortlist prête en 12 s · la décision reste la vôtre"],
];

function DivaDemo(props: DemoProps) {
  const step = useSequence([300, 2000, 1500, 900, 1100], props);
  return (
    <Frame app="Recrutement · Candidatures" icon={<Users size={14} />} variant="doc" agent="automation" status={narrate(step, DIVA_STATUS)} done={step >= 5}>
      <div className={styles.job} data-on={step >= 1}>
        <span>
          <strong>Chargé·e de communication</strong>
          <small>CDI · Lyon</small>
        </span>
        <span className={styles.jobCount}>
          <CountUp to={48} active={step >= 1} duration={1800} /> candidatures
        </span>
      </div>

      <div className={styles.scan} data-on={step >= 1} data-done={step >= 2}>
        <span className={styles.scanLabel}>{step >= 2 ? "48 CV analysés" : "Diva analyse les CV…"}</span>
        <span className={styles.scanBar}>
          <span />
        </span>
      </div>

      <ol className={styles.ranking}>
        {CANDIDATES.map((c, i) => (
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
              {c.score} %
            </span>
            <span className={styles.shortlist} data-on={step >= 3 && i < 3}>
              Présélection
            </span>
          </li>
        ))}
      </ol>

      <div className={styles.toast} data-on={step >= 4}>
        <Calendar size={16} />
        <span>
          <strong>Invitations envoyées aux 3 présélectionnés</strong>
          <span className={styles.slots} data-on={step >= 5}>
            <span>Mar. 10 h</span>
            <span>Mer. 15 h</span>
            <span>Jeu. 11 h</span>
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

const MORGAN_STATUS: [number, string][] = [
  [0, "Morgan interroge vos données…"],
  [2, "Morgan calcule vos indicateurs…"],
  [3, "Morgan analyse les tendances…"],
  [4, "Morgan rédige la synthèse…"],
  [5, "Synthèse prête · sources : CRM, boutique, Analytics"],
];

function MorganDemo(props: DemoProps) {
  const step = useSequence([300, 1200, 1300, 1800, 1200], props);
  const pts = chartPath(BASKET, 320, 92);
  const line = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const area = `${line} L${pts[pts.length - 1][0].toFixed(1)} 92 L${pts[0][0].toFixed(1)} 92 Z`;
  const drop = pts.slice(5).map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const last = pts[pts.length - 1];
  return (
    <Frame app="Tableau de bord · Ventes" icon={<Bars size={14} />} variant="doc" agent="data" status={narrate(step, MORGAN_STATUS)} done={step >= 5}>
      <div className={`${styles.msg} ${styles.in} ${styles.question}`} data-on={step >= 1}>
        Comment se sont passées les ventes ce mois-ci ?
      </div>

      <div className={styles.kpis}>
        <div className={styles.kpi} data-on={step >= 2} style={{ "--i": 0 } as React.CSSProperties}>
          <small>Chiffre d’affaires</small>
          <strong>
            <CountUp to={84200} active={step >= 2} /> €
          </strong>
          <span data-trend="up">▲ 12 %</span>
        </div>
        <div className={styles.kpi} data-on={step >= 2} style={{ "--i": 1 } as React.CSSProperties}>
          <small>Commandes</small>
          <strong>
            <CountUp to={1236} active={step >= 2} />
          </strong>
          <span data-trend="up">▲ 8 %</span>
        </div>
        <div className={styles.kpi} data-on={step >= 2} data-alert="true" style={{ "--i": 2 } as React.CSSProperties}>
          <small>Panier moyen</small>
          <strong>
            <CountUp to={67.5} active={step >= 2} format={(v) => v.toFixed(1).replace(".", ",")} /> €
          </strong>
          <span data-trend="down">▼ 4 %</span>
        </div>
      </div>

      <figure className={styles.chart} data-on={step >= 3} data-alert={step >= 4}>
        <figcaption>Panier moyen · 8 dernières semaines</figcaption>
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
          <strong>Ventes en hausse, portées par la région Ouest.</strong> À surveiller : le panier moyen baisse depuis 2 semaines, surtout
          sur mobile.
        </p>
        <span className={styles.actions} data-on={step >= 5}>
          <span className={styles.primary}>Voir l’analyse</span>
          <span>M’alerter chaque lundi</span>
        </span>
      </div>
    </Frame>
  );
}

interface DemoProps {
  run: number;
  reduced: boolean;
  play: boolean;
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
