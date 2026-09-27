"use client";

import { Bars, Calendar, ChatDots, Check, Doc, Mail, People, PlayBox, Search, Target, TrendUp } from "@/components/ui/Icons";
import { CountUp, Frame, narrate, Typewriter, Typing, useSequence, type DemoProps, type ProcessDef } from "./AgentDemos";
import base from "./AgentDemos.module.css";
import styles from "./AgentDemosMore.module.css";

/*
 * Live demos of the rest of the team (desktop « Toute l'équipe »): a believable product screen per agent, doing its
 * real job on a concrete case, with the process track and its clock under the screen. Fictional data, labelled as a
 * demo. Same mechanics as AgentDemos (a timed sequence of beats; `run` replays; reduced motion shows the end).
 */

const av = (slug: string) => `/images/agents/${slug}-avatar.webp`;
const on = (v: boolean) => ({ "data-on": v });

/* ——— Jules: a sales call → needs, objections, odds, follow-up ——— */

const JULES_STATUS: [number, string][] = [
  [0, "Jules récupère l’enregistrement…"],
  [1, "Jules lit la transcription…"],
  [3, "Jules qualifie le prospect…"],
  [4, "Jules relève les objections…"],
  [5, "Jules estime les chances de signature…"],
  [6, "Jules prépare la relance…"],
  [7, "Rendez-vous analysé · plan d’action partagé"],
];
const JULES_PROCESS: ProcessDef = {
  stages: [
    { label: "Transcription", at: 2, t: 6 },
    { label: "Besoins", at: 3, t: 14 },
    { label: "Objections", at: 4, t: 18 },
    { label: "Signature", at: 5, t: 21 },
    { label: "Relance", at: 6, t: 24 },
  ],
};
const QUOTES = [
  ["CM", "Claire", "On perd des clients faute de relancer à temps."],
  ["VS", "Vous", "Combien de devis restent sans suite chaque mois ?"],
  ["CM", "Claire", "Une vingtaine. Mais on a déjà essayé un chatbot…"],
];

function JulesDemo(props: DemoProps) {
  const { reduced } = props;
  const step = useSequence([300, 1300, 1300, 1300, 1300, 1500, 1100], props);
  return (
    <Frame app="Calls · Analyse du rendez-vous" icon={<ChatDots size={14} />} variant="doc" avatar={av("fireflies")} status={narrate(step, JULES_STATUS)} done={step >= 7} process={JULES_PROCESS} step={step} reduced={reduced}>
      <div className={styles.call} {...on(step >= 1)}>
        <span className={styles.callIcon}>
          <PlayBox size={15} />
        </span>
        <span>
          <strong>Visio · Atelier Nova</strong>
          <small>Aujourd’hui 10:00 · 45 min · 2 participants</small>
        </span>
        <span className={styles.wave} data-live={step >= 1 && step < 3} aria-hidden="true">
          {Array.from({ length: 14 }, (_, i) => (
            <i key={i} style={{ "--i": i } as React.CSSProperties} />
          ))}
        </span>
      </div>
      <ul className={styles.quotes}>
        {QUOTES.map(([ini, who, text], i) => (
          <li key={text} {...on(step >= 2)} style={{ transitionDelay: `${i * 180}ms` }}>
            <span className={base.avatar}>{ini}</span>
            <span>
              <small>{who}</small>
              {text}
            </span>
          </li>
        ))}
      </ul>
      <div className={styles.bant} {...on(step >= 3)}>
        {[
          ["Budget", "Validé en interne"],
          ["Décideur", "Claire, directrice"],
          ["Besoin", "Relances clients"],
          ["Délai", "Avant janvier"],
        ].map(([k, v]) => (
          <span key={k}>
            <Check size={11} />
            <strong>{k}</strong>
            {v}
          </span>
        ))}
      </div>
      <div className={styles.row2}>
        <div className={styles.objection} {...on(step >= 4)}>
          <span className={base.label}>Objection</span>
          <strong>« On a déjà essayé un chatbot »</strong>
          <small>→ Montrer un cas client comparable, résultats à l’appui.</small>
        </div>
        <div className={styles.gauge} {...on(step >= 5)} style={{ "--p": step >= 5 ? 0.72 : 0 } as React.CSSProperties}>
          <svg viewBox="0 0 64 64" aria-hidden="true">
            <circle cx="32" cy="32" r="26" />
            <circle cx="32" cy="32" r="26" pathLength={1} />
          </svg>
          <strong>
            <CountUp to={72} active={step >= 5} /> %
          </strong>
          <small>de chances de signer</small>
        </div>
      </div>
      <div className={base.toast} {...on(step >= 6)}>
        <Mail size={16} />
        <span>
          <strong>Relance prête : « Suite à notre échange de ce matin »</strong> · avec le cas client demandé
        </span>
      </div>
    </Frame>
  );
}

/* ——— Victor: the call analysis → a structured proposal → PDF → opened ——— */

const VICTOR_STATUS: [number, string][] = [
  [0, "Victor lit l’analyse de Jules…"],
  [2, "Victor rédige la proposition…"],
  [4, "Victor construit les options…"],
  [5, "Victor anticipe les objections…"],
  [6, "Victor génère le PDF…"],
  [7, "Envoyée · vous êtes prévenu à l’ouverture"],
];
const VICTOR_PROCESS: ProcessDef = {
  stages: [
    { label: "Analyse lue", at: 2, t: 3 },
    { label: "Rédaction", at: 4, t: 19 },
    { label: "Options", at: 5, t: 24 },
    { label: "PDF", at: 6, t: 30 },
    { label: "Envoi", at: 7, t: 31 },
  ],
};
const SITUATION = "Atelier Nova perd une vingtaine de devis par mois faute de relance. L’équipe veut un suivi régulier, sans y passer ses soirées.";

function VictorDemo(props: DemoProps) {
  const { reduced } = props;
  const step = useSequence([300, 900, 1500, 1300, 1300, 1300, 1300, 1400], props);
  return (
    <Frame app="Propositions · Atelier Nova" icon={<Doc size={14} />} variant="doc" avatar={av("proposition")} status={narrate(step, VICTOR_STATUS)} done={step >= 7} process={VICTOR_PROCESS} step={step} reduced={reduced}>
      <p className={styles.source} {...on(step >= 1)}>
        <Check size={12} /> Source : analyse de Jules · rendez-vous de ce matin
      </p>
      <article className={styles.doc} {...on(step >= 1)}>
        <header>
          <strong>Proposition PR-2026-014</strong>
          <small>Atelier Nova · à l’attention de Claire Moreau</small>
        </header>
        <span className={base.label}>Votre situation</span>
        <p>{step >= 2 ? <Typewriter text={SITUATION} active speed={12} instant={reduced} /> : <span className={styles.lines} aria-hidden="true" />}</p>
        <div className={styles.options} {...on(step >= 4)}>
          {[
            ["Essentiel", "Relances automatiques"],
            ["Recommandée", "Relances + suivi des devis"],
            ["Complète", "Suivi + tableau de bord"],
          ].map(([name, what], i) => (
            <span key={name} data-best={i === 1} style={{ transitionDelay: `${i * 140}ms` }}>
              {i === 1 ? <em>Conseillée</em> : null}
              <strong>{name}</strong>
              <small>{what}</small>
            </span>
          ))}
        </div>
        <p className={styles.answered} {...on(step >= 5)}>
          <Check size={12} /> Objection traitée : « déjà essayé un chatbot » → cas client comparable en annexe
        </p>
      </article>
      <div className={styles.pdf} {...on(step >= 6)}>
        <span className={styles.pdfIcon}>PDF</span>
        <span>
          <strong>PR-2026-014.pdf</strong>
          <small>6 pages · lien suivi envoyé à Claire</small>
        </span>
      </div>
      <div className={base.toast} {...on(step >= 7)}>
        <TrendUp size={16} />
        <span>
          <strong>Claire a ouvert la proposition</strong> · 2 lectures, 3 min sur la page des options
        </span>
      </div>
    </Frame>
  );
}

/* ——— Antoine: a vague idea → diagnosis, market, target, message, briefs ——— */

const ANTOINE_STATUS: [number, string][] = [
  [0, "Antoine écoute votre idée…"],
  [2, "Antoine pose le diagnostic…"],
  [3, "Antoine analyse la concurrence…"],
  [4, "Antoine définit la cible…"],
  [5, "Antoine formule le message…"],
  [6, "Antoine rédige les briefs…"],
  [7, "Stratégie prête · briefs transmis à l’équipe"],
];
const ANTOINE_PROCESS: ProcessDef = {
  stages: [
    { label: "Diagnostic", at: 3, t: 8 },
    { label: "Marché", at: 4, t: 21 },
    { label: "Cible", at: 5, t: 28 },
    { label: "Message", at: 6, t: 35 },
    { label: "Briefs", at: 7, t: 40 },
  ],
};

function AntoineDemo(props: DemoProps) {
  const { reduced } = props;
  const step = useSequence([300, 1200, 1300, 1400, 1300, 1500, 1200], props);
  return (
    <Frame app="Stratégie · Nouvelle offre" icon={<Target size={14} />} variant="doc" avatar={av("strategiste")} status={narrate(step, ANTOINE_STATUS)} done={step >= 7} process={ANTOINE_PROCESS} step={step} reduced={reduced}>
      <div className={`${base.msg} ${base.in} ${styles.ask}`} {...on(step >= 1)}>
        On veut lancer une offre d’entretien pour les syndics de copropriété.
      </div>
      <div className={styles.goal} {...on(step >= 2)}>
        <span className={base.label}>Objectif</span>
        <strong>Signer 15 syndics indépendants d’ici juin</strong>
      </div>
      <table className={styles.market} data-on={step >= 3}>
        <thead>
          <tr>
            <th>Concurrent</th>
            <th>Promesse</th>
            <th>Faille</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Réseau national</td>
            <td>Prix bas</td>
            <td>Délais d’intervention</td>
          </tr>
          <tr>
            <td>Artisan local</td>
            <td>Proximité</td>
            <td>Aucun suivi écrit</td>
          </tr>
        </tbody>
      </table>
      <div className={styles.target} {...on(step >= 4)}>
        <span className={base.label}>Client idéal</span>
        <span>
          Syndics indépendants · 50 à 300 lots · <strong>déclencheur : l’assemblée générale</strong>
        </span>
      </div>
      <p className={styles.promise} {...on(step >= 5)}>
        « {step >= 5 ? <Typewriter text="L’entretien de vos immeubles, sans relance ni mauvaise surprise." active speed={20} instant={reduced} /> : null} »
      </p>
      <div className={styles.briefs} {...on(step >= 6)}>
        {[
          ["content", "Déa", "Contenus"],
          ["designer", "Mia", "Visuels"],
          ["prospection", "May", "Prospection"],
        ].map(([slug, name, what], i) => (
          <span key={slug} style={{ transitionDelay: `${i * 160}ms` }}>
            {/* eslint-disable-next-line @next/next/no-img-element -- avatar */}
            <img src={av(slug)} alt="" width={22} height={22} />
            <strong>{name}</strong>
            <small>{what}</small>
            {step >= 7 ? <Check size={11} /> : null}
          </span>
        ))}
      </div>
    </Frame>
  );
}

/* ——— Mia: a YouTube title → concepts → three thumbnails → the chosen one ——— */

const MIA_STATUS: [number, string][] = [
  [0, "Mia lit votre brief…"],
  [2, "Mia imagine les concepts…"],
  [3, "Mia génère les miniatures…"],
  [4, "Mia soigne le contraste et le texte…"],
  [5, "Miniature choisie · déclinée en Short"],
];
const MIA_PROCESS: ProcessDef = {
  stages: [
    { label: "Brief", at: 2, t: 2 },
    { label: "Concepts", at: 3, t: 9 },
    { label: "Génération", at: 4, t: 41 },
    { label: "Choix", at: 5, t: 44 },
    { label: "Export", at: 6, t: 46 },
  ],
};
const THUMBS = [
  { text: "30 JOURS SANS RÉUNION", tone: "a" },
  { text: "J’AI TOUT ARRÊTÉ ?!", tone: "b" },
  { text: "−12 H / SEMAINE", tone: "c" },
];

function MiaDemo(props: DemoProps) {
  const { reduced } = props;
  const step = useSequence([300, 1200, 1300, 2500, 1300, 1100], props);
  return (
    <Frame app="Studio créa · Miniatures YouTube" icon={<PlayBox size={14} />} variant="doc" avatar={av("designer")} status={narrate(step, MIA_STATUS)} done={step >= 6} process={MIA_PROCESS} step={step} reduced={reduced}>
      <div className={styles.inputs} {...on(step >= 1)}>
        <span>
          <small>Titre de la vidéo</small>
          <strong>J’ai testé 30 jours sans réunion</strong>
        </span>
        <span>
          <small>Émotion</small>
          <strong className={styles.chipOn}>Surprise</strong>
        </span>
        <span>
          <small>Photo de référence</small>
          <strong className={styles.face}>VO</strong>
        </span>
      </div>
      <div className={styles.concepts} {...on(step >= 2)}>
        {["Avant / après", "Réaction", "Chiffre choc"].map((c) => (
          <span key={c}>{c}</span>
        ))}
      </div>
      <div className={styles.thumbs}>
        {THUMBS.map((t, i) => (
          <figure key={t.text} className={styles.thumb} data-tone={t.tone} data-state={step < 3 ? "idle" : step < 4 ? "gen" : "ready"} data-picked={step >= 5 && i === 1} style={{ "--i": i } as React.CSSProperties}>
            <span className={styles.thumbFace} aria-hidden="true">
              VO
            </span>
            <figcaption>{t.text}</figcaption>
            {step >= 5 && i === 1 ? (
              <span className={styles.picked}>
                <Check size={11} /> Choisie
              </span>
            ) : null}
          </figure>
        ))}
      </div>
      <div className={base.toast} {...on(step >= 6)}>
        <Check size={16} />
        <span>
          <strong>Téléchargée en 1280 × 720</strong> · déclinée en format Short 9:16
        </span>
      </div>
    </Frame>
  );
}

/* ——— Nina: a topic → the reels that outperform → why → ideas for Déa ——— */

const NINA_STATUS: [number, string][] = [
  [0, "Nina lance la recherche…"],
  [2, "Nina trie les vidéos qui surperforment…"],
  [3, "Nina retranscrit la meilleure…"],
  [4, "Nina décortique ce qui marche…"],
  [5, "Nina transmet les idées à Déa…"],
  [6, "Veille prête · 3 idées envoyées à Déa"],
];
const NINA_PROCESS: ProcessDef = {
  stages: [
    { label: "Collecte", at: 2, t: 52 },
    { label: "Tri", at: 3, t: 58 },
    { label: "Transcription", at: 4, t: 84 },
    { label: "Analyse", at: 5, t: 93 },
    { label: "Idées", at: 6, t: 98 },
  ],
};
const REELS = [
  { views: 182000, badge: "×6 sa moyenne", tone: "a" },
  { views: 96000, badge: "×3", tone: "b" },
  { views: 61000, badge: "", tone: "c" },
  { views: 44000, badge: "", tone: "d" },
];
const k = (v: number) => `${Math.round(v / 1000)} k`;

function NinaDemo(props: DemoProps) {
  const { reduced } = props;
  const step = useSequence([300, 1500, 1400, 1600, 1300, 1300], props);
  return (
    <Frame app="Veille · Instagram" icon={<TrendUp size={14} />} variant="doc" avatar={av("veille")} status={narrate(step, NINA_STATUS)} done={step >= 6} process={NINA_PROCESS} step={step} reduced={reduced}>
      <div className={styles.search} {...on(step >= 1)}>
        <Search size={14} />
        <span>
          <Typewriter text="achat immobilier neuf" active={step >= 1} speed={40} instant={reduced} />
        </span>
        <small>FR + EN · 30 derniers jours</small>
      </div>
      <div className={styles.reels}>
        {REELS.map((r, i) => (
          <span key={r.views} className={styles.reel} data-tone={r.tone} data-top={step >= 2 && i === 0} {...on(step >= 2)} style={{ transitionDelay: `${i * 120}ms` }}>
            <PlayBox size={14} />
            <strong>
              <CountUp to={r.views} active={step >= 2} format={k} duration={1100} />
            </strong>
            <small>vues</small>
            {r.badge ? <em>{r.badge}</em> : null}
          </span>
        ))}
      </div>
      <div className={styles.transcript} {...on(step >= 3)}>
        <span className={base.label}>Ce qui est dit dans la vidéo n° 1</span>
        <p>« {step >= 3 ? <Typewriter text="3 erreurs qui coûtent cher quand on achète sur plan. La deuxième, presque tout le monde la fait…" active speed={14} instant={reduced} /> : null} »</p>
      </div>
      <div className={styles.why} {...on(step >= 4)}>
        {["Un chiffre dans l’accroche", "Une liste en 3 points", "Moins de 30 secondes"].map((w) => (
          <span key={w}>
            <Check size={11} /> {w}
          </span>
        ))}
      </div>
      <div className={base.toast} {...on(step >= 5)}>
        {/* eslint-disable-next-line @next/next/no-img-element -- avatar */}
        <img className={styles.toastAvatar} src={av("content")} alt="" width={20} height={20} />
        <span>
          <strong>3 idées envoyées à Déa</strong> · « 3 pièges de l’achat sur plan », « Ce que le promoteur ne dit pas », « Neuf ou ancien : le vrai coût »
        </span>
      </div>
    </Frame>
  );
}

/* ——— Emma: a product → angle and script → avatar → the video ——— */

const EMMA_STATUS: [number, string][] = [
  [0, "Emma lit la fiche produit…"],
  [2, "Emma écrit l’accroche et le script…"],
  [3, "Emma choisit l’avatar…"],
  [4, "Emma génère la vidéo…"],
  [5, "Vidéo prête · rangée avec le produit"],
];
const EMMA_PROCESS: ProcessDef = {
  stages: [
    { label: "Fiche", at: 2, t: 3 },
    { label: "Script", at: 3, t: 16 },
    { label: "Avatar", at: 4, t: 19 },
    { label: "Rendu", at: 5, t: 214 },
    { label: "Prête", at: 6, t: 218 },
  ],
};

function EmmaDemo(props: DemoProps) {
  const { reduced } = props;
  const step = useSequence([300, 1300, 1600, 1200, 2600, 1100], props);
  return (
    <Frame app="Studio vidéo · Produits" icon={<PlayBox size={14} />} variant="doc" avatar={av("ecommerce")} status={narrate(step, EMMA_STATUS)} done={step >= 6} process={EMMA_PROCESS} step={step} reduced={reduced}>
      <div className={styles.emma}>
        <div className={styles.emmaLeft}>
          <div className={styles.product} {...on(step >= 1)}>
            <span className={styles.bottle} aria-hidden="true" />
            <span>
              <strong>Gourde isotherme 750 ml</strong>
              <small>Garde au frais 24 h · 3 coloris</small>
            </span>
          </div>
          <div className={styles.script} {...on(step >= 2)}>
            <span className={base.label}>Angle · problème → solution</span>
            <p>
              <b>Accroche</b> « {step >= 2 ? <Typewriter text="Ta boisson tiède à 15 h ? Plus jamais." active speed={24} instant={reduced} /> : null} »
            </p>
            <p>
              <b>Démo</b> Glaçons encore là après une journée au soleil.
            </p>
            <p>
              <b>Appel</b> -15 % sur la première commande.
            </p>
          </div>
          <div className={styles.avatars} {...on(step >= 3)}>
            {["LÉ", "KA", "TO"].map((a, i) => (
              <span key={a} data-picked={i === 0}>
                {a}
              </span>
            ))}
            <small>Léa, 28 ans · ton complice</small>
          </div>
        </div>
        <div className={styles.phone} data-state={step < 4 ? "idle" : step < 5 ? "render" : "ready"}>
          <span className={styles.render} aria-hidden="true">
            <i />
          </span>
          <span className={styles.phoneFace} aria-hidden="true">
            LÉ
          </span>
          <span className={styles.caption}>Ta boisson tiède à 15 h ?</span>
          <span className={styles.play} aria-hidden="true">
            ▶
          </span>
          <small className={styles.length}>0:24</small>
        </div>
      </div>
      <div className={base.toast} {...on(step >= 6)}>
        <Check size={16} />
        <span>
          <strong>Prête pour Instagram et TikTok</strong> · rangée dans « Gourde 750 ml »
        </span>
      </div>
    </Frame>
  );
}

/* ——— Inès: a full inbox → sorted → priorities → drafts ——— */

const INES_STATUS: [number, string][] = [
  [0, "Inès lit vos e-mails…"],
  [2, "Inès classe chaque message…"],
  [3, "Inès établit les priorités…"],
  [4, "Inès rédige les réponses…"],
  [6, "Boîte triée · 3 brouillons prêts"],
];
const INES_PROCESS: ProcessDef = {
  stages: [
    { label: "Lecture", at: 2, t: 5 },
    { label: "Tri", at: 3, t: 11 },
    { label: "Priorités", at: 4, t: 13 },
    { label: "Brouillons", at: 6, t: 31 },
  ],
};
const MAILS = [
  { from: "Julie · Boulangerie Pain d’Or", subject: "Commande 482 : livrée avant vendredi ?", tag: "Client", prio: 1 },
  { from: "Marc Dupont", subject: "Suite à votre présentation", tag: "Prospect", prio: 2 },
  { from: "Imprimerie Lemaire", subject: "Devis flyers : validation", tag: "Fournisseur", prio: 3 },
  { from: "URSSAF", subject: "Votre échéance du 15", tag: "Administratif", prio: 4 },
  { from: "Newsletter Marketing+", subject: "10 tendances pour 2027", tag: "Newsletter", prio: 0 },
];

function InesDemo(props: DemoProps) {
  const { reduced } = props;
  const step = useSequence([300, 1200, 1300, 1100, 1900, 1100], props);
  const sorted = step >= 3 ? [...MAILS].sort((a, b) => (a.prio || 9) - (b.prio || 9)) : MAILS;
  return (
    <Frame app="Boîte de réception · 38 non lus" icon={<Mail size={14} />} variant="doc" avatar={av("gmail")} status={narrate(step, INES_STATUS)} done={step >= 6} process={INES_PROCESS} step={step} reduced={reduced}>
      <ul className={styles.inbox}>
        {sorted.map((m, i) => (
          <li key={m.subject} {...on(step >= 1)} data-first={step >= 4 && m.prio === 1} data-muted={step >= 3 && m.prio === 0} style={{ transitionDelay: `${i * 90}ms` }}>
            {step >= 3 && m.prio ? <span className={styles.prio}>{m.prio}</span> : <span className={styles.dotUnread} />}
            <span className={styles.mailText}>
              <strong>{m.from}</strong>
              <small>{m.subject}</small>
            </span>
            <span className={styles.tag} data-tag={m.tag} {...on(step >= 2)}>
              {step >= 3 && m.prio === 0 ? "À archiver" : m.tag}
            </span>
          </li>
        ))}
      </ul>
      <div className={styles.draft} {...on(step >= 4)}>
        <span className={base.label}>Brouillon · réponse à Julie</span>
        <p>{step >= 4 ? <Typewriter text="Bonjour Julie, bonne nouvelle : votre commande 482 part demain et sera livrée jeudi avant 12 h. Belle journée !" active speed={13} instant={reduced} /> : null}</p>
      </div>
      <div className={base.toast} {...on(step >= 6)}>
        <Check size={16} />
        <span>
          <strong>3 brouillons prêts</strong> · 1 newsletter à archiver · rien ne part sans vous
        </span>
      </div>
    </Frame>
  );
}

/* ——— Chloé: the dashboard → late invoices → the right reminder → sent ——— */

const CHLOE_STATUS: [number, string][] = [
  [0, "Chloé lit votre base de factures…"],
  [2, "Chloé repère les retards…"],
  [3, "Chloé choisit le ton de chaque relance…"],
  [4, "Chloé rédige la relance…"],
  [5, "Relances envoyées après votre validation"],
];
const CHLOE_PROCESS: ProcessDef = {
  stages: [
    { label: "Factures lues", at: 2, t: 3 },
    { label: "Retards", at: 3, t: 5 },
    { label: "Relances", at: 5, t: 17 },
    { label: "Envoi", at: 6, t: 20 },
  ],
};
const LATE = [
  { client: "Studio Kalo", ref: "F-2026-041", amount: "1 200 €", days: 12, level: "Rappel courtois" },
  { client: "Maison Verdier", ref: "F-2026-038", amount: "1 850 €", days: 34, level: "2ᵉ relance" },
  { client: "Garage Moreau", ref: "F-2026-029", amount: "850 €", days: 61, level: "Relance ferme" },
];

function ChloeDemo(props: DemoProps) {
  const { reduced } = props;
  const step = useSequence([300, 1300, 1200, 1300, 1800, 1100], props);
  return (
    <Frame app="Finances · Factures" icon={<Bars size={14} />} variant="doc" avatar={av("comptabilite")} status={narrate(step, CHLOE_STATUS)} done={step >= 6} process={CHLOE_PROCESS} step={step} reduced={reduced}>
      <div className={base.kpis}>
        {[
          ["Encaissé", 18400, "ok"],
          ["En attente", 6250, ""],
          ["En retard", 3900, "late"],
        ].map(([label, value, tone], i) => (
          <div key={label as string} className={base.kpi} {...on(step >= 1)} data-alert={tone === "late"} style={{ "--i": i } as React.CSSProperties}>
            <small>{label}</small>
            <strong>
              <CountUp to={value as number} active={step >= 1} /> €
            </strong>
          </div>
        ))}
      </div>
      <ul className={styles.late}>
        {LATE.map((l, i) => (
          <li key={l.ref} {...on(step >= 2)} style={{ transitionDelay: `${i * 120}ms` }} data-sent={step >= 6}>
            <span>
              <strong>{l.client}</strong>
              <small>
                {l.ref} · {l.amount}
              </small>
            </span>
            <span className={styles.days} data-level={i}>
              J+{l.days}
            </span>
            <span className={styles.level} {...on(step >= 3)}>
              {step >= 6 ? "Envoyée ✓" : l.level}
            </span>
          </li>
        ))}
      </ul>
      <div className={styles.mailPreview} {...on(step >= 4)}>
        <span className={base.label}>Relance · Maison Verdier</span>
        <strong>Facture F-2026-038 : deuxième relance</strong>
        <p>{step >= 4 ? <Typewriter text="Bonjour, sauf erreur de notre part, la facture F-2026-038 reste impayée à ce jour. Pourriez-vous nous indiquer la date de règlement prévue ?" active speed={11} instant={reduced} /> : null}</p>
        <span className={styles.attach}>PDF · F-2026-038.pdf</span>
      </div>
    </Frame>
  );
}

/* ——— Hugo: a brief → the outline → slides built one by one → present ——— */

const HUGO_STATUS: [number, string][] = [
  [0, "Hugo lit votre brief…"],
  [2, "Hugo construit le plan…"],
  [3, "Hugo met en page les slides…"],
  [5, "Hugo soigne les schémas…"],
  [6, "Présentation prête · PDF exporté"],
];
const HUGO_PROCESS: ProcessDef = {
  stages: [
    { label: "Plan", at: 3, t: 6 },
    { label: "Slides", at: 5, t: 24 },
    { label: "Mise en page", at: 6, t: 31 },
    { label: "PDF", at: 7, t: 34 },
  ],
};
const SLIDES = ["Titre", "Chiffres clés", "Ventes", "3 priorités", "Feuille de route", "Merci"];

function HugoDemo(props: DemoProps) {
  const { reduced } = props;
  const step = useSequence([300, 1200, 1300, 1300, 1300, 1300, 1000], props);
  const built = step < 3 ? 0 : step === 3 ? 2 : step === 4 ? 4 : 6;
  return (
    <Frame app="Présentations · Comité de direction" icon={<Doc size={14} />} variant="doc" avatar={av("presentateur")} status={narrate(step, HUGO_STATUS)} done={step >= 7} process={HUGO_PROCESS} step={step} reduced={reduced}>
      <div className={base.brief} {...on(step >= 1)}>
        <span className={base.label}>Votre brief</span>
        <p>
          <Typewriter text="Présenter les résultats du trimestre au comité, en 6 slides." active={step >= 1} speed={22} instant={reduced} />
        </p>
      </div>
      <div className={styles.slide} {...on(step >= 3)}>
        <span className={styles.slideKicker}>Chiffres clés · T3</span>
        <div className={styles.slideKpis}>
          <span>
            <strong>
              <CountUp to={1.24} active={step >= 4} format={(v) => v.toFixed(2).replace(".", ",")} /> M€
            </strong>
            <small>Chiffre d’affaires</small>
          </span>
          <span>
            <strong>+18 %</strong>
            <small>vs T2</small>
          </span>
          <span>
            <strong>312</strong>
            <small>nouveaux clients</small>
          </span>
        </div>
        <div className={styles.slideBars} aria-hidden="true">
          {[42, 58, 51, 74, 88].map((h, i) => (
            <i key={i} style={{ "--h": `${step >= 5 ? h : 6}%`, "--i": i } as React.CSSProperties} />
          ))}
        </div>
      </div>
      <ol className={styles.filmstrip}>
        {SLIDES.map((s, i) => (
          <li key={s} data-built={i < built} data-current={i === 1 && step >= 3}>
            <span>{i + 1}</span>
            {s}
          </li>
        ))}
      </ol>
      <div className={base.toast} {...on(step >= 7)}>
        <Calendar size={16} />
        <span>
          <strong>Prête pour le comité de jeudi</strong> · mode présentation et PDF de 6 pages
        </span>
      </div>
    </Frame>
  );
}

/* ——— Clément: a question → the company's knowledge → a sourced answer ——— */

const CLEMENT_STATUS: [number, string][] = [
  [0, "Clément lit la question…"],
  [2, "Clément parcourt la mémoire de l’entreprise…"],
  [3, "Clément croise les sources…"],
  [4, "Clément rédige la réponse…"],
  [5, "Réponse sourcée · prête à partager"],
];
const CLEMENT_PROCESS: ProcessDef = {
  stages: [
    { label: "Recherche", at: 3, t: 2 },
    { label: "Sources", at: 4, t: 5 },
    { label: "Réponse", at: 5, t: 9 },
  ],
};
const NODES = [
  { x: 50, y: 50, label: "Atelier Nova", core: true },
  { x: 16, y: 22, label: "Proposition", hit: true },
  { x: 84, y: 20, label: "Call du 12/09", hit: true },
  { x: 12, y: 78, label: "Marque" },
  { x: 86, y: 80, label: "Onboarding", hit: true },
  { x: 50, y: 90, label: "Prospects" },
];

function ClementDemo(props: DemoProps) {
  const { reduced } = props;
  const step = useSequence([300, 1300, 1500, 1400, 1300], props);
  return (
    <Frame app="Cerveau de l’entreprise" icon={<Search size={14} />} variant="doc" avatar={av("cerveau")} status={narrate(step, CLEMENT_STATUS)} done={step >= 5} process={CLEMENT_PROCESS} step={step} reduced={reduced}>
      <div className={`${base.msg} ${base.in} ${styles.ask}`} {...on(step >= 1)}>
        Qu’a-t-on promis à Atelier Nova sur les délais ?
      </div>
      <div className={styles.graph} {...on(step >= 2)} data-lit={step >= 3}>
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          {NODES.slice(1).map((n) => (
            <line key={n.label} x1={50} y1={50} x2={n.x} y2={n.y} data-hit={n.hit ?? false} />
          ))}
        </svg>
        {NODES.map((n) => (
          <span key={n.label} className={styles.node} data-core={n.core ?? false} data-hit={n.hit ?? false} style={{ left: `${n.x}%`, top: `${n.y}%` }}>
            {n.label}
          </span>
        ))}
      </div>
      <div className={styles.answer} {...on(step >= 4)}>
        <p>{step >= 4 ? <Typewriter text="Mise en service sous 3 semaines après signature, avec un point d’étape chaque vendredi." active speed={16} instant={reduced} /> : null}</p>
        <span className={styles.sources}>
          <span>Proposition PR-2026-014 · §4</span>
          <span>Call du 12/09 · 32:10</span>
          <span>Process d’onboarding</span>
        </span>
      </div>
      <div className={styles.actionsRow} {...on(step >= 5)}>
        <span>Envoyer par e-mail</span>
        <span>Créer une note</span>
      </div>
    </Frame>
  );
}

/* ——— Noam: one goal → the chain of agents → each takes over ——— */

const NOAM_STATUS: [number, string][] = [
  [0, "Noam lit votre objectif…"],
  [2, "Noam compose l’équipe…"],
  [3, "Noam passe le relais…"],
  [7, "4 agents mobilisés · vous validez chaque étape"],
];
const NOAM_PROCESS: ProcessDef = {
  stages: [
    { label: "Objectif", at: 2, t: 2 },
    { label: "Plan", at: 3, t: 6 },
    { label: "Relais", at: 7, t: 9 },
  ],
};
const CHAIN = [
  { slug: "strategiste", name: "Antoine", what: "Cible et message" },
  { slug: "prospection", name: "May", what: "40 entreprises contactées" },
  { slug: "fireflies", name: "Jules", what: "Rendez-vous analysés" },
  { slug: "proposition", name: "Victor", what: "Propositions envoyées" },
];

function NoamDemo(props: DemoProps) {
  const { reduced } = props;
  const step = useSequence([300, 1100, 1300, 1000, 1000, 1000, 1000, 1000], props);
  return (
    <Frame app="Équipe D2S · Noam" icon={<People size={14} />} variant="chat" avatar={av("orchestrateur")} status={narrate(step, NOAM_STATUS)} done={step >= 7} process={NOAM_PROCESS} step={step} reduced={reduced}>
      {step >= 1 && <div className={`${base.msg} ${base.in}`}>Remplis mon agenda commercial du mois.</div>}
      {step === 1 && <Typing />}
      {step >= 2 && <div className={`${base.msg} ${base.out}`}>C’est parti. Voici l’enchaînement, chacun passe le relais au suivant :</div>}
      {step >= 2 && (
        <ol className={`${base.card} ${base.out} ${styles.chain}`}>
          {CHAIN.map((c, i) => (
            <li key={c.slug} data-state={step >= 3 + i + 1 ? "done" : step === 3 + i ? "now" : "todo"}>
              {/* eslint-disable-next-line @next/next/no-img-element -- avatar */}
              <img src={av(c.slug)} alt="" width={28} height={28} />
              <span>
                <strong>{c.name}</strong>
                <small>{c.what}</small>
              </span>
              <em>{step >= 3 + i + 1 ? "Transmis ✓" : step === 3 + i ? "En cours…" : "En attente"}</em>
            </li>
          ))}
        </ol>
      )}
    </Frame>
  );
}

const DEMOS: Record<string, (p: DemoProps) => React.ReactElement> = {
  fireflies: JulesDemo,
  proposition: VictorDemo,
  strategiste: AntoineDemo,
  designer: MiaDemo,
  veille: NinaDemo,
  ecommerce: EmmaDemo,
  gmail: InesDemo,
  comptabilite: ChloeDemo,
  presentateur: HugoDemo,
  cerveau: ClementDemo,
  orchestrateur: NoamDemo,
};

export function MoreAgentDemo({ slug, ...props }: { slug: string } & DemoProps) {
  const Demo = DEMOS[slug];
  return Demo ? <Demo {...props} /> : null;
}
