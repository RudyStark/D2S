"use client";

import { Bars, Calendar, ChatDots, Check, Doc, Mail, People, PlayBox, Search, Target, TrendUp } from "@/components/ui/Icons";
import { useLocale } from "@/components/i18n/LocaleProvider";
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

/* The words of the demos are written in French here; EN (end of file) gives their English. */
type T = ((s: string) => string) & { en: boolean };
function useT(): T {
  const en = useLocale() === "en";
  return Object.assign((s: string) => (en ? (EN[s] ?? s) : s), { en });
}
const lines = (t: T, l: [number, string][]) => l.map(([at, s]) => [at, t(s)] as [number, string]);
const stages = (t: T, p: ProcessDef): ProcessDef => ({ stages: p.stages.map((s) => ({ ...s, label: t(s.label) })) });
/** « 1 200 € » / « €1,200 ». */
const euros = (t: T, v: number) => (t.en ? `€${new Intl.NumberFormat("en-GB").format(v)}` : `${new Intl.NumberFormat("fr-FR").format(v)} €`);

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
  const t = useT();
  const step = useSequence([300, 1300, 1300, 1300, 1300, 1500, 1100], props);
  return (
    <Frame app={t("Calls · Analyse du rendez-vous")} icon={<ChatDots size={14} />} variant="doc" avatar={av("fireflies")} status={narrate(step, lines(t, JULES_STATUS))} done={step >= 7} process={stages(t, JULES_PROCESS)} step={step} reduced={reduced}>
      <div className={styles.call} {...on(step >= 1)}>
        <span className={styles.callIcon}>
          <PlayBox size={15} />
        </span>
        <span>
          <strong>{t("Visio · Atelier Nova")}</strong>
          <small>{t("Aujourd’hui 10:00 · 45 min · 2 participants")}</small>
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
              <small>{t(who)}</small>
              {t(text)}
            </span>
          </li>
        ))}
      </ul>
      <div className={styles.bant} {...on(step >= 3)}>
        {[
          [t("Budget"), t("Validé en interne")],
          [t("Décideur"), t("Claire, directrice")],
          [t("Besoin"), t("Relances clients")],
          [t("Délai"), t("Avant janvier")],
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
          <span className={base.label}>{t("Objection")}</span>
          <strong>{t("« On a déjà essayé un chatbot »")}</strong>
          <small>{t("→ Montrer un cas client comparable, résultats à l’appui.")}</small>
        </div>
        <div className={styles.gauge} {...on(step >= 5)} style={{ "--p": step >= 5 ? 0.72 : 0 } as React.CSSProperties}>
          <svg viewBox="0 0 64 64" aria-hidden="true">
            <circle cx="32" cy="32" r="26" />
            <circle cx="32" cy="32" r="26" pathLength={1} />
          </svg>
          <strong>
            <CountUp to={72} active={step >= 5} />
            {t.en ? "%" : " %"}
          </strong>
          <small>{t("de chances de signer")}</small>
        </div>
      </div>
      <div className={base.toast} {...on(step >= 6)}>
        <Mail size={16} />
        <span>
          <strong>{t("Relance prête : « Suite à notre échange de ce matin »")}</strong> {t("· avec le cas client demandé")}
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
  const t = useT();
  const step = useSequence([300, 900, 1500, 1300, 1300, 1300, 1300, 1400], props);
  return (
    <Frame app={t("Propositions · Atelier Nova")} icon={<Doc size={14} />} variant="doc" avatar={av("proposition")} status={narrate(step, lines(t, VICTOR_STATUS))} done={step >= 7} process={stages(t, VICTOR_PROCESS)} step={step} reduced={reduced}>
      <p className={styles.source} {...on(step >= 1)}>
        <Check size={12} /> {t("Source : analyse de Jules · rendez-vous de ce matin")}
      </p>
      <article className={styles.doc} {...on(step >= 1)}>
        <header>
          <strong>{t("Proposition PR-2026-014")}</strong>
          <small>{t("Atelier Nova · à l’attention de Claire Moreau")}</small>
        </header>
        <span className={base.label}>{t("Votre situation")}</span>
        <p>{step >= 2 ? <Typewriter text={t(SITUATION)} active speed={12} instant={reduced} /> : <span className={styles.lines} aria-hidden="true" />}</p>
        <div className={styles.options} {...on(step >= 4)}>
          {[
            [t("Essentiel"), t("Relances automatiques")],
            [t("Recommandée"), t("Relances + suivi des devis")],
            [t("Complète"), t("Suivi + tableau de bord")],
          ].map(([name, what], i) => (
            <span key={name} data-best={i === 1} style={{ transitionDelay: `${i * 140}ms` }}>
              {i === 1 ? <em>{t("Conseillée")}</em> : null}
              <strong>{name}</strong>
              <small>{what}</small>
            </span>
          ))}
        </div>
        <p className={styles.answered} {...on(step >= 5)}>
          <Check size={12} /> {t("Objection traitée : « déjà essayé un chatbot » → cas client comparable en annexe")}
        </p>
      </article>
      <div className={styles.pdf} {...on(step >= 6)}>
        <span className={styles.pdfIcon}>PDF</span>
        <span>
          <strong>PR-2026-014.pdf</strong>
          <small>{t("6 pages · lien suivi envoyé à Claire")}</small>
        </span>
      </div>
      <div className={base.toast} {...on(step >= 7)}>
        <TrendUp size={16} />
        <span>
          <strong>{t("Claire a ouvert la proposition")}</strong> {t("· 2 lectures, 3 min sur la page des options")}
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
  const t = useT();
  const step = useSequence([300, 1200, 1300, 1400, 1300, 1500, 1200], props);
  return (
    <Frame app={t("Stratégie · Nouvelle offre")} icon={<Target size={14} />} variant="doc" avatar={av("strategiste")} status={narrate(step, lines(t, ANTOINE_STATUS))} done={step >= 7} process={stages(t, ANTOINE_PROCESS)} step={step} reduced={reduced}>
      <div className={`${base.msg} ${base.in} ${styles.ask}`} {...on(step >= 1)}>
        {t("On veut lancer une offre d’entretien pour les syndics de copropriété.")}
      </div>
      <div className={styles.goal} {...on(step >= 2)}>
        <span className={base.label}>{t("Objectif")}</span>
        <strong>{t("Signer 15 syndics indépendants d’ici juin")}</strong>
      </div>
      <table className={styles.market} data-on={step >= 3}>
        <thead>
          <tr>
            <th>{t("Concurrent")}</th>
            <th>{t("Promesse")}</th>
            <th>{t("Faille")}</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{t("Réseau national")}</td>
            <td>{t("Prix bas")}</td>
            <td>{t("Délais d’intervention")}</td>
          </tr>
          <tr>
            <td>{t("Artisan local")}</td>
            <td>{t("Proximité")}</td>
            <td>{t("Aucun suivi écrit")}</td>
          </tr>
        </tbody>
      </table>
      <div className={styles.target} {...on(step >= 4)}>
        <span className={base.label}>{t("Client idéal")}</span>
        <span>
          {t("Syndics indépendants · 50 à 300 lots ·")} <strong>{t("déclencheur : l’assemblée générale")}</strong>
        </span>
      </div>
      <p className={styles.promise} {...on(step >= 5)}>
{t.en ? "“" : "« "}{step >= 5 ? <Typewriter text={t("L’entretien de vos immeubles, sans relance ni mauvaise surprise.")} active speed={20} instant={reduced} /> : null}{t.en ? "”" : " »"}
      </p>
      <div className={styles.briefs} {...on(step >= 6)}>
        {[
          ["content", "Déa", t("Contenus")],
          ["designer", "Mia", t("Visuels")],
          ["prospection", "May", t("Prospection")],
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
  const t = useT();
  const step = useSequence([300, 1200, 1300, 2500, 1300, 1100], props);
  return (
    <Frame app={t("Studio créa · Miniatures YouTube")} icon={<PlayBox size={14} />} variant="doc" avatar={av("designer")} status={narrate(step, lines(t, MIA_STATUS))} done={step >= 6} process={stages(t, MIA_PROCESS)} step={step} reduced={reduced}>
      <div className={styles.inputs} {...on(step >= 1)}>
        <span>
          <small>{t("Titre de la vidéo")}</small>
          <strong>{t("J’ai testé 30 jours sans réunion")}</strong>
        </span>
        <span>
          <small>{t("Émotion")}</small>
          <strong className={styles.chipOn}>{t("Surprise")}</strong>
        </span>
        <span>
          <small>{t("Photo de référence")}</small>
          <strong className={styles.face}>VO</strong>
        </span>
      </div>
      <div className={styles.concepts} {...on(step >= 2)}>
        {[t("Avant / après"), t("Réaction"), t("Chiffre choc")].map((c) => (
          <span key={c}>{c}</span>
        ))}
      </div>
      <div className={styles.thumbs}>
        {THUMBS.map((th, i) => (
          <figure key={th.text} className={styles.thumb} data-tone={th.tone} data-state={step < 3 ? "idle" : step < 4 ? "gen" : "ready"} data-picked={step >= 5 && i === 1} style={{ "--i": i } as React.CSSProperties}>
            <span className={styles.thumbFace} aria-hidden="true">
              VO
            </span>
            <figcaption>{t(th.text)}</figcaption>
            {step >= 5 && i === 1 ? (
              <span className={styles.picked}>
                <Check size={11} /> {t("Choisie")}
              </span>
            ) : null}
          </figure>
        ))}
      </div>
      <div className={base.toast} {...on(step >= 6)}>
        <Check size={16} />
        <span>
          <strong>{t("Téléchargée en 1280 × 720")}</strong> {t("· déclinée en format Short 9:16")}
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
  const t = useT();
  const step = useSequence([300, 1500, 1400, 1600, 1300, 1300], props);
  return (
    <Frame app={t("Veille · Instagram")} icon={<TrendUp size={14} />} variant="doc" avatar={av("veille")} status={narrate(step, lines(t, NINA_STATUS))} done={step >= 6} process={stages(t, NINA_PROCESS)} step={step} reduced={reduced}>
      <div className={styles.search} {...on(step >= 1)}>
        <Search size={14} />
        <span>
          <Typewriter text={t("achat immobilier neuf")} active={step >= 1} speed={40} instant={reduced} />
        </span>
        <small>{t("FR + EN · 30 derniers jours")}</small>
      </div>
      <div className={styles.reels}>
        {REELS.map((r, i) => (
          <span key={r.views} className={styles.reel} data-tone={r.tone} data-top={step >= 2 && i === 0} {...on(step >= 2)} style={{ transitionDelay: `${i * 120}ms` }}>
            <PlayBox size={14} />
            <strong>
              <CountUp to={r.views} active={step >= 2} format={t.en ? (v) => `${Math.round(v / 1000)}k` : k} duration={1100} />
            </strong>
            <small>{t("vues")}</small>
            {r.badge ? <em>{t(r.badge)}</em> : null}
          </span>
        ))}
      </div>
      <div className={styles.transcript} {...on(step >= 3)}>
        <span className={base.label}>{t("Ce qui est dit dans la vidéo n° 1")}</span>
        <p>{t.en ? "“" : "« "}{step >= 3 ? <Typewriter text={t("3 erreurs qui coûtent cher quand on achète sur plan. La deuxième, presque tout le monde la fait…")} active speed={14} instant={reduced} /> : null}{t.en ? "”" : " »"}</p>
      </div>
      <div className={styles.why} {...on(step >= 4)}>
        {[t("Un chiffre dans l’accroche"), t("Une liste en 3 points"), t("Moins de 30 secondes")].map((w) => (
          <span key={w}>
            <Check size={11} /> {w}
          </span>
        ))}
      </div>
      <div className={base.toast} {...on(step >= 5)}>
        {/* eslint-disable-next-line @next/next/no-img-element -- avatar */}
        <img className={styles.toastAvatar} src={av("content")} alt="" width={20} height={20} />
        <span>
          <strong>{t("3 idées envoyées à Déa")}</strong> {t("· « 3 pièges de l’achat sur plan », « Ce que le promoteur ne dit pas », « Neuf ou ancien : le vrai coût »")}
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
  const t = useT();
  const step = useSequence([300, 1300, 1600, 1200, 2600, 1100], props);
  return (
    <Frame app={t("Studio vidéo · Produits")} icon={<PlayBox size={14} />} variant="doc" avatar={av("ecommerce")} status={narrate(step, lines(t, EMMA_STATUS))} done={step >= 6} process={stages(t, EMMA_PROCESS)} step={step} reduced={reduced}>
      <div className={styles.emma}>
        <div className={styles.emmaLeft}>
          <div className={styles.product} {...on(step >= 1)}>
            <span className={styles.bottle} aria-hidden="true" />
            <span>
              <strong>{t("Gourde isotherme 750 ml")}</strong>
              <small>{t("Garde au frais 24 h · 3 coloris")}</small>
            </span>
          </div>
          <div className={styles.script} {...on(step >= 2)}>
            <span className={base.label}>{t("Angle · problème → solution")}</span>
            <p>
              <b>{t("Accroche")}</b> {t.en ? "“" : "« "}{step >= 2 ? <Typewriter text={t("Ta boisson tiède à 15 h ? Plus jamais.")} active speed={24} instant={reduced} /> : null}{t.en ? "”" : " »"}
            </p>
            <p>
              <b>{t("Démo")}</b> {t("Glaçons encore là après une journée au soleil.")}
            </p>
            <p>
              <b>{t("Appel")}</b> {t("-15 % sur la première commande.")}
            </p>
          </div>
          <div className={styles.avatars} {...on(step >= 3)}>
            {["LÉ", "KA", "TO"].map((a, i) => (
              <span key={a} data-picked={i === 0}>
                {a}
              </span>
            ))}
            <small>{t("Léa, 28 ans · ton complice")}</small>
          </div>
        </div>
        <div className={styles.phone} data-state={step < 4 ? "idle" : step < 5 ? "render" : "ready"}>
          <span className={styles.render} aria-hidden="true">
            <i />
          </span>
          <span className={styles.phoneFace} aria-hidden="true">
            LÉ
          </span>
          <span className={styles.caption}>{t("Ta boisson tiède à 15 h ?")}</span>
          <span className={styles.play} aria-hidden="true">
            ▶
          </span>
          <small className={styles.length}>0:24</small>
        </div>
      </div>
      <div className={base.toast} {...on(step >= 6)}>
        <Check size={16} />
        <span>
          <strong>{t("Prête pour Instagram et TikTok")}</strong> {t("· rangée dans « Gourde 750 ml »")}
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
  const t = useT();
  const step = useSequence([300, 1200, 1300, 1100, 1900, 1100], props);
  const sorted = step >= 3 ? [...MAILS].sort((a, b) => (a.prio || 9) - (b.prio || 9)) : MAILS;
  return (
    <Frame app={t("Boîte de réception · 38 non lus")} icon={<Mail size={14} />} variant="doc" avatar={av("gmail")} status={narrate(step, lines(t, INES_STATUS))} done={step >= 6} process={stages(t, INES_PROCESS)} step={step} reduced={reduced}>
      <ul className={styles.inbox}>
        {sorted.map((m, i) => (
          <li key={m.subject} {...on(step >= 1)} data-first={step >= 4 && m.prio === 1} data-muted={step >= 3 && m.prio === 0} style={{ transitionDelay: `${i * 90}ms` }}>
            {step >= 3 && m.prio ? <span className={styles.prio}>{m.prio}</span> : <span className={styles.dotUnread} />}
            <span className={styles.mailText}>
              <strong>{t(m.from)}</strong>
              <small>{t(m.subject)}</small>
            </span>
            <span className={styles.tag} data-tag={m.tag} {...on(step >= 2)}>
              {step >= 3 && m.prio === 0 ? t("À archiver") : t(m.tag)}
            </span>
          </li>
        ))}
      </ul>
      <div className={styles.draft} {...on(step >= 4)}>
        <span className={base.label}>{t("Brouillon · réponse à Julie")}</span>
        <p>{step >= 4 ? <Typewriter text={t("Bonjour Julie, bonne nouvelle : votre commande 482 part demain et sera livrée jeudi avant 12 h. Belle journée !")} active speed={13} instant={reduced} /> : null}</p>
      </div>
      <div className={base.toast} {...on(step >= 6)}>
        <Check size={16} />
        <span>
          <strong>{t("3 brouillons prêts")}</strong> {t("· 1 newsletter à archiver · rien ne part sans vous")}
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
  { client: "Studio Kalo", ref: "F-2026-041", amount: 1200, days: 12, level: "Rappel courtois" },
  { client: "Maison Verdier", ref: "F-2026-038", amount: 1850, days: 34, level: "2ᵉ relance" },
  { client: "Garage Moreau", ref: "F-2026-029", amount: 850, days: 61, level: "Relance ferme" },
];

function ChloeDemo(props: DemoProps) {
  const { reduced } = props;
  const t = useT();
  const step = useSequence([300, 1300, 1200, 1300, 1800, 1100], props);
  return (
    <Frame app={t("Finances · Factures")} icon={<Bars size={14} />} variant="doc" avatar={av("comptabilite")} status={narrate(step, lines(t, CHLOE_STATUS))} done={step >= 6} process={stages(t, CHLOE_PROCESS)} step={step} reduced={reduced}>
      <div className={base.kpis}>
        {[
          [t("Encaissé"), 18400, "ok"],
          [t("En attente"), 6250, ""],
          [t("En retard"), 3900, "late"],
        ].map(([label, value, tone], i) => (
          <div key={label as string} className={base.kpi} {...on(step >= 1)} data-alert={tone === "late"} style={{ "--i": i } as React.CSSProperties}>
            <small>{label}</small>
            <strong>
              <CountUp to={value as number} active={step >= 1} format={(v) => euros(t, Math.round(v))} />
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
                {l.ref} · {euros(t, l.amount)}
              </small>
            </span>
            <span className={styles.days} data-level={i}>
              {t.en ? "D+" : "J+"}
              {l.days}
            </span>
            <span className={styles.level} {...on(step >= 3)}>
              {step >= 6 ? t("Envoyée ✓") : t(l.level)}
            </span>
          </li>
        ))}
      </ul>
      <div className={styles.mailPreview} {...on(step >= 4)}>
        <span className={base.label}>{t("Relance · Maison Verdier")}</span>
        <strong>{t("Facture F-2026-038 : deuxième relance")}</strong>
        <p>{step >= 4 ? <Typewriter text={t("Bonjour, sauf erreur de notre part, la facture F-2026-038 reste impayée à ce jour. Pourriez-vous nous indiquer la date de règlement prévue ?")} active speed={11} instant={reduced} /> : null}</p>
        <span className={styles.attach}>{t("PDF · F-2026-038.pdf")}</span>
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
  const t = useT();
  const step = useSequence([300, 1200, 1300, 1300, 1300, 1300, 1000], props);
  const built = step < 3 ? 0 : step === 3 ? 2 : step === 4 ? 4 : 6;
  return (
    <Frame app={t("Présentations · Comité de direction")} icon={<Doc size={14} />} variant="doc" avatar={av("presentateur")} status={narrate(step, lines(t, HUGO_STATUS))} done={step >= 7} process={stages(t, HUGO_PROCESS)} step={step} reduced={reduced}>
      <div className={base.brief} {...on(step >= 1)}>
        <span className={base.label}>{t("Votre brief")}</span>
        <p>
          <Typewriter text={t("Présenter les résultats du trimestre au comité, en 6 slides.")} active={step >= 1} speed={22} instant={reduced} />
        </p>
      </div>
      <div className={styles.slide} {...on(step >= 3)}>
        <span className={styles.slideKicker}>{t("Chiffres clés · T3")}</span>
        <div className={styles.slideKpis}>
          <span>
            <strong>
              {t.en ? "€" : ""}
              <CountUp to={1.24} active={step >= 4} format={(v) => (t.en ? v.toFixed(2) : v.toFixed(2).replace(".", ","))} />
              {t.en ? "M" : " M€"}
            </strong>
            <small>{t("Chiffre d’affaires")}</small>
          </span>
          <span>
            <strong>{t.en ? "+18%" : "+18 %"}</strong>
            <small>{t("vs T2")}</small>
          </span>
          <span>
            <strong>312</strong>
            <small>{t("nouveaux clients")}</small>
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
            {t(s)}
          </li>
        ))}
      </ol>
      <div className={base.toast} {...on(step >= 7)}>
        <Calendar size={16} />
        <span>
          <strong>{t("Prête pour le comité de jeudi")}</strong> {t("· mode présentation et PDF de 6 pages")}
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
  const t = useT();
  const step = useSequence([300, 1300, 1500, 1400, 1300], props);
  return (
    <Frame app={t("Cerveau de l’entreprise")} icon={<Search size={14} />} variant="doc" avatar={av("cerveau")} status={narrate(step, lines(t, CLEMENT_STATUS))} done={step >= 5} process={stages(t, CLEMENT_PROCESS)} step={step} reduced={reduced}>
      <div className={`${base.msg} ${base.in} ${styles.ask}`} {...on(step >= 1)}>
        {t("Qu’a-t-on promis à Atelier Nova sur les délais ?")}
      </div>
      <div className={styles.graph} {...on(step >= 2)} data-lit={step >= 3}>
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          {NODES.slice(1).map((n) => (
            <line key={n.label} x1={50} y1={50} x2={n.x} y2={n.y} data-hit={n.hit ?? false} />
          ))}
        </svg>
        {NODES.map((n) => (
          <span key={n.label} className={styles.node} data-core={n.core ?? false} data-hit={n.hit ?? false} style={{ left: `${n.x}%`, top: `${n.y}%` }}>
            {t(n.label)}
          </span>
        ))}
      </div>
      <div className={styles.answer} {...on(step >= 4)}>
        <p>{step >= 4 ? <Typewriter text={t("Mise en service sous 3 semaines après signature, avec un point d’étape chaque vendredi.")} active speed={16} instant={reduced} /> : null}</p>
        <span className={styles.sources}>
          <span>{t("Proposition PR-2026-014 · §4")}</span>
          <span>{t("Call du 12/09 · 32:10")}</span>
          <span>{t("Process d’onboarding")}</span>
        </span>
      </div>
      <div className={styles.actionsRow} {...on(step >= 5)}>
        <span>{t("Envoyer par e-mail")}</span>
        <span>{t("Créer une note")}</span>
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
  const t = useT();
  const step = useSequence([300, 1100, 1300, 1000, 1000, 1000, 1000, 1000], props);
  return (
    <Frame app={t("Équipe D2S · Noam")} icon={<People size={14} />} variant="chat" avatar={av("orchestrateur")} status={narrate(step, lines(t, NOAM_STATUS))} done={step >= 7} process={stages(t, NOAM_PROCESS)} step={step} reduced={reduced}>
      {step >= 1 && <div className={`${base.msg} ${base.in}`}>{t("Remplis mon agenda commercial du mois.")}</div>}
      {step === 1 && <Typing />}
      {step >= 2 && <div className={`${base.msg} ${base.out}`}>{t("C’est parti. Voici l’enchaînement, chacun passe le relais au suivant :")}</div>}
      {step >= 2 && (
        <ol className={`${base.card} ${base.out} ${styles.chain}`}>
          {CHAIN.map((c, i) => (
            <li key={c.slug} data-state={step >= 3 + i + 1 ? "done" : step === 3 + i ? "now" : "todo"}>
              {/* eslint-disable-next-line @next/next/no-img-element -- avatar */}
              <img src={av(c.slug)} alt="" width={28} height={28} />
              <span>
                <strong>{c.name}</strong>
                <small>{t(c.what)}</small>
              </span>
              <em>{step >= 3 + i + 1 ? t("Transmis ✓") : step === 3 + i ? t("En cours…") : t("En attente")}</em>
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

/* ——— English of the demos (keys: the French above; a missing key shows the French) ——— */

const EN: Record<string, string> = {
  // Jules
  "Calls · Analyse du rendez-vous": "Calls · Meeting analysis",
  "Visio · Atelier Nova": "Video call · Atelier Nova",
  "Aujourd’hui 10:00 · 45 min · 2 participants": "Today 10:00 am · 45 min · 2 participants",
  Budget: "Budget",
  "Validé en interne": "Approved internally",
  Décideur: "Decision-maker",
  "Claire, directrice": "Claire, director",
  Besoin: "Need",
  "Relances clients": "Customer follow-ups",
  Délai: "Timing",
  "Avant janvier": "Before January",
  Objection: "Objection",
  "« On a déjà essayé un chatbot »": "“We already tried a chatbot”",
  "→ Montrer un cas client comparable, résultats à l’appui.": "→ Show a comparable client case, with results.",
  "de chances de signer": "chance of signing",
  "Relance prête : « Suite à notre échange de ce matin »": "Follow-up ready: “Following our call this morning”",
  "· avec le cas client demandé": "· with the client case they asked for",
  Claire: "Claire",
  Vous: "You",
  "On perd des clients faute de relancer à temps.": "We lose customers because we don’t follow up in time.",
  "Combien de devis restent sans suite chaque mois ?": "How many quotes go unanswered each month?",
  "Une vingtaine. Mais on a déjà essayé un chatbot…": "About twenty. But we already tried a chatbot…",
  "Jules récupère l’enregistrement…": "Jules is fetching the recording…",
  "Jules lit la transcription…": "Jules is reading the transcript…",
  "Jules qualifie le prospect…": "Jules is qualifying the prospect…",
  "Jules relève les objections…": "Jules is noting the objections…",
  "Jules estime les chances de signature…": "Jules is estimating the chance of signing…",
  "Jules prépare la relance…": "Jules is preparing the follow-up…",
  "Rendez-vous analysé · plan d’action partagé": "Meeting analysed · action plan shared",
  Transcription: "Transcript",
  Besoins: "Needs",
  Objections: "Objections",
  Signature: "Signing",
  Relance: "Follow-up",

  // Victor
  "Propositions · Atelier Nova": "Proposals · Atelier Nova",
  "Source : analyse de Jules · rendez-vous de ce matin": "Source: Jules’s analysis · this morning’s meeting",
  "Proposition PR-2026-014": "Proposal PR-2026-014",
  "Atelier Nova · à l’attention de Claire Moreau": "Atelier Nova · for the attention of Claire Moreau",
  "Votre situation": "Your situation",
  "Atelier Nova perd une vingtaine de devis par mois faute de relance. L’équipe veut un suivi régulier, sans y passer ses soirées.":
    "Atelier Nova loses about twenty quotes a month for lack of follow-up. The team wants regular follow-up, without spending its evenings on it.",
  Essentiel: "Essential",
  "Relances automatiques": "Automatic follow-ups",
  Recommandée: "Recommended",
  "Relances + suivi des devis": "Follow-ups + quote tracking",
  Complète: "Complete",
  "Suivi + tableau de bord": "Tracking + dashboard",
  Conseillée: "Advised",
  "Objection traitée : « déjà essayé un chatbot » → cas client comparable en annexe": "Objection handled: “already tried a chatbot” → comparable client case in the appendix",
  "6 pages · lien suivi envoyé à Claire": "6 pages · tracked link sent to Claire",
  "Claire a ouvert la proposition": "Claire opened the proposal",
  "· 2 lectures, 3 min sur la page des options": "· read twice, 3 min on the options page",
  "Victor lit l’analyse de Jules…": "Victor is reading Jules’s analysis…",
  "Victor rédige la proposition…": "Victor is writing the proposal…",
  "Victor construit les options…": "Victor is building the options…",
  "Victor anticipe les objections…": "Victor is anticipating the objections…",
  "Victor génère le PDF…": "Victor is generating the PDF…",
  "Envoyée · vous êtes prévenu à l’ouverture": "Sent · you are notified when it is opened",
  "Analyse lue": "Analysis read",
  Rédaction: "Writing",
  Options: "Options",
  Envoi: "Sending",

  // Antoine
  "Stratégie · Nouvelle offre": "Strategy · New offer",
  "On veut lancer une offre d’entretien pour les syndics de copropriété.": "We want to launch a maintenance offer for property managers.",
  Objectif: "Goal",
  "Signer 15 syndics indépendants d’ici juin": "Sign 15 independent property managers by June",
  Concurrent: "Competitor",
  Promesse: "Promise",
  Faille: "Weak spot",
  "Réseau national": "National network",
  "Prix bas": "Low prices",
  "Délais d’intervention": "Response times",
  "Artisan local": "Local tradesman",
  Proximité: "Close by",
  "Aucun suivi écrit": "No written follow-up",
  "Client idéal": "Ideal customer",
  "Syndics indépendants · 50 à 300 lots ·": "Independent property managers · 50 to 300 units ·",
  "déclencheur : l’assemblée générale": "trigger: the annual general meeting",
  "L’entretien de vos immeubles, sans relance ni mauvaise surprise.": "Your buildings maintained, with no chasing and no nasty surprises.",
  Contenus: "Content",
  Visuels: "Visuals",
  Prospection: "Prospecting",
  "Antoine écoute votre idée…": "Antoine is listening to your idea…",
  "Antoine pose le diagnostic…": "Antoine is making the diagnosis…",
  "Antoine analyse la concurrence…": "Antoine is analysing the competition…",
  "Antoine définit la cible…": "Antoine is defining the target…",
  "Antoine formule le message…": "Antoine is wording the message…",
  "Antoine rédige les briefs…": "Antoine is writing the briefs…",
  "Stratégie prête · briefs transmis à l’équipe": "Strategy ready · briefs passed to the team",
  Diagnostic: "Diagnosis",
  Marché: "Market",
  Cible: "Target",
  Message: "Message",
  Briefs: "Briefs",

  // Mia
  "Studio créa · Miniatures YouTube": "Creative studio · YouTube thumbnails",
  "Titre de la vidéo": "Video title",
  "J’ai testé 30 jours sans réunion": "I tried 30 days without meetings",
  Émotion: "Emotion",
  Surprise: "Surprise",
  "Photo de référence": "Reference photo",
  "Avant / après": "Before / after",
  Réaction: "Reaction",
  "Chiffre choc": "Shock figure",
  Choisie: "Chosen",
  "Téléchargée en 1280 × 720": "Downloaded at 1280 × 720",
  "· déclinée en format Short 9:16": "· adapted to a 9:16 Short",
  "30 JOURS SANS RÉUNION": "30 DAYS, NO MEETINGS",
  "J’AI TOUT ARRÊTÉ ?!": "I QUIT IT ALL?!",
  "−12 H / SEMAINE": "−12 H / WEEK",
  "Mia lit votre brief…": "Mia is reading your brief…",
  "Mia imagine les concepts…": "Mia is coming up with concepts…",
  "Mia génère les miniatures…": "Mia is generating the thumbnails…",
  "Mia soigne le contraste et le texte…": "Mia is polishing the contrast and the text…",
  "Miniature choisie · déclinée en Short": "Thumbnail chosen · adapted to a Short",
  Brief: "Brief",
  Concepts: "Concepts",
  Génération: "Generation",
  Choix: "Choice",
  Export: "Export",

  // Nina
  "Veille · Instagram": "Trend watch · Instagram",
  "achat immobilier neuf": "buying a new-build home",
  "FR + EN · 30 derniers jours": "FR + EN · last 30 days",
  vues: "views",
  "×6 sa moyenne": "×6 its average",
  "Ce qui est dit dans la vidéo n° 1": "What is said in video no. 1",
  "3 erreurs qui coûtent cher quand on achète sur plan. La deuxième, presque tout le monde la fait…": "3 costly mistakes when buying off-plan. The second one, almost everyone makes…",
  "Un chiffre dans l’accroche": "A number in the hook",
  "Une liste en 3 points": "A 3-point list",
  "Moins de 30 secondes": "Under 30 seconds",
  "3 idées envoyées à Déa": "3 ideas sent to Déa",
  "· « 3 pièges de l’achat sur plan », « Ce que le promoteur ne dit pas », « Neuf ou ancien : le vrai coût »": "· “3 off-plan traps”, “What the developer doesn’t tell you”, “New-build or old: the real cost”",
  "Nina lance la recherche…": "Nina is starting the search…",
  "Nina trie les vidéos qui surperforment…": "Nina is sorting the videos that outperform…",
  "Nina retranscrit la meilleure…": "Nina is transcribing the best one…",
  "Nina décortique ce qui marche…": "Nina is breaking down what works…",
  "Nina transmet les idées à Déa…": "Nina is passing the ideas to Déa…",
  "Veille prête · 3 idées envoyées à Déa": "Trend watch ready · 3 ideas sent to Déa",
  Collecte: "Collection",
  Tri: "Sorting",
  Analyse: "Analysis",
  Idées: "Ideas",

  // Emma
  "Studio vidéo · Produits": "Video studio · Products",
  "Gourde isotherme 750 ml": "Insulated bottle 750 ml",
  "Garde au frais 24 h · 3 coloris": "Keeps cold for 24 h · 3 colours",
  "Angle · problème → solution": "Angle · problem → solution",
  Accroche: "Hook",
  "Ta boisson tiède à 15 h ? Plus jamais.": "Warm drink by 3 pm? Never again.",
  Démo: "Demo",
  "Glaçons encore là après une journée au soleil.": "Ice still there after a day in the sun.",
  Appel: "Call to action",
  "-15 % sur la première commande.": "15% off the first order.",
  "Léa, 28 ans · ton complice": "Léa, 28 · friendly tone",
  "Ta boisson tiède à 15 h ?": "Warm drink by 3 pm?",
  "Prête pour Instagram et TikTok": "Ready for Instagram and TikTok",
  "· rangée dans « Gourde 750 ml »": "· filed under “Bottle 750 ml”",
  "Emma lit la fiche produit…": "Emma is reading the product page…",
  "Emma écrit l’accroche et le script…": "Emma is writing the hook and the script…",
  "Emma choisit l’avatar…": "Emma is choosing the avatar…",
  "Emma génère la vidéo…": "Emma is generating the video…",
  "Vidéo prête · rangée avec le produit": "Video ready · filed with the product",
  Fiche: "Product page",
  Script: "Script",
  Avatar: "Avatar",
  Rendu: "Rendering",
  Prête: "Ready",

  // Inès
  "Boîte de réception · 38 non lus": "Inbox · 38 unread",
  "À archiver": "To archive",
  "Brouillon · réponse à Julie": "Draft · reply to Julie",
  "Bonjour Julie, bonne nouvelle : votre commande 482 part demain et sera livrée jeudi avant 12 h. Belle journée !": "Hi Julie, good news: your order 482 ships tomorrow and will be delivered on Thursday before noon. Have a great day!",
  "3 brouillons prêts": "3 drafts ready",
  "· 1 newsletter à archiver · rien ne part sans vous": "· 1 newsletter to archive · nothing goes out without you",
  "Julie · Boulangerie Pain d’Or": "Julie · Pain d’Or Bakery",
  "Commande 482 : livrée avant vendredi ?": "Order 482: delivered before Friday?",
  Client: "Customer",
  "Marc Dupont": "Marc Dupont",
  "Suite à votre présentation": "Following your presentation",
  Prospect: "Prospect",
  "Imprimerie Lemaire": "Lemaire Printing",
  "Devis flyers : validation": "Flyer quote: approval",
  Fournisseur: "Supplier",
  URSSAF: "Social security office",
  "Votre échéance du 15": "Your payment due on the 15th",
  Administratif: "Admin",
  "Newsletter Marketing+": "Marketing+ newsletter",
  "10 tendances pour 2027": "10 trends for 2027",
  Newsletter: "Newsletter",
  "Inès lit vos e-mails…": "Inès is reading your e-mails…",
  "Inès classe chaque message…": "Inès is filing each message…",
  "Inès établit les priorités…": "Inès is setting the priorities…",
  "Inès rédige les réponses…": "Inès is drafting the replies…",
  "Boîte triée · 3 brouillons prêts": "Inbox sorted · 3 drafts ready",
  Lecture: "Reading",
  Priorités: "Priorities",
  Brouillons: "Drafts",

  // Chloé
  "Finances · Factures": "Finance · Invoices",
  Encaissé: "Paid",
  "En attente": "Pending",
  "En retard": "Overdue",
  "Envoyée ✓": "Sent ✓",
  "Relance · Maison Verdier": "Reminder · Maison Verdier",
  "Facture F-2026-038 : deuxième relance": "Invoice F-2026-038: second reminder",
  "Bonjour, sauf erreur de notre part, la facture F-2026-038 reste impayée à ce jour. Pourriez-vous nous indiquer la date de règlement prévue ?":
    "Hello, unless we are mistaken, invoice F-2026-038 is still unpaid to date. Could you let us know when payment is planned?",
  "PDF · F-2026-038.pdf": "PDF · F-2026-038.pdf",
  "Rappel courtois": "Polite reminder",
  "2ᵉ relance": "2nd reminder",
  "Relance ferme": "Firm reminder",
  "Chloé lit votre base de factures…": "Chloé is reading your invoice records…",
  "Chloé repère les retards…": "Chloé is spotting late payments…",
  "Chloé choisit le ton de chaque relance…": "Chloé is choosing the tone of each reminder…",
  "Chloé rédige la relance…": "Chloé is writing the reminder…",
  "Relances envoyées après votre validation": "Reminders sent after your approval",
  "Factures lues": "Invoices read",
  Retards: "Late payments",
  Relances: "Reminders",

  // Hugo
  "Présentations · Comité de direction": "Presentations · Management meeting",
  "Votre brief": "Your brief",
  "Présenter les résultats du trimestre au comité, en 6 slides.": "Present the quarter’s results to the management team, in 6 slides.",
  "Chiffres clés · T3": "Key figures · Q3",
  "Chiffre d’affaires": "Revenue",
  "vs T2": "vs Q2",
  "nouveaux clients": "new customers",
  "Prête pour le comité de jeudi": "Ready for Thursday’s meeting",
  "· mode présentation et PDF de 6 pages": "· presenter mode and a 6-page PDF",
  Titre: "Title",
  "Chiffres clés": "Key figures",
  Ventes: "Sales",
  "3 priorités": "3 priorities",
  "Feuille de route": "Roadmap",
  Merci: "Thank you",
  "Hugo lit votre brief…": "Hugo is reading your brief…",
  "Hugo construit le plan…": "Hugo is building the outline…",
  "Hugo met en page les slides…": "Hugo is laying out the slides…",
  "Hugo soigne les schémas…": "Hugo is polishing the diagrams…",
  "Présentation prête · PDF exporté": "Presentation ready · PDF exported",
  Plan: "Outline",
  Slides: "Slides",
  "Mise en page": "Layout",

  // Clément
  "Cerveau de l’entreprise": "Company brain",
  "Qu’a-t-on promis à Atelier Nova sur les délais ?": "What did we promise Atelier Nova on timing?",
  "Mise en service sous 3 semaines après signature, avec un point d’étape chaque vendredi.": "Live within 3 weeks of signing, with a progress update every Friday.",
  "Proposition PR-2026-014 · §4": "Proposal PR-2026-014 · §4",
  "Call du 12/09 · 32:10": "Call of 12/09 · 32:10",
  "Process d’onboarding": "Onboarding process",
  "Envoyer par e-mail": "Send by e-mail",
  "Créer une note": "Create a note",
  "Atelier Nova": "Atelier Nova",
  Proposition: "Proposal",
  "Call du 12/09": "Call of 12/09",
  Marque: "Brand",
  Onboarding: "Onboarding",
  Prospects: "Prospects",
  "Clément lit la question…": "Clément is reading the question…",
  "Clément parcourt la mémoire de l’entreprise…": "Clément is searching the company’s memory…",
  "Clément croise les sources…": "Clément is cross-checking the sources…",
  "Clément rédige la réponse…": "Clément is writing the answer…",
  "Réponse sourcée · prête à partager": "Sourced answer · ready to share",
  Recherche: "Search",
  Sources: "Sources",
  Réponse: "Answer",

  // Noam
  "Équipe D2S · Noam": "D2S team · Noam",
  "Remplis mon agenda commercial du mois.": "Fill my sales calendar for the month.",
  "C’est parti. Voici l’enchaînement, chacun passe le relais au suivant :": "On it. Here is the sequence, each one hands over to the next:",
  "Transmis ✓": "Handed over ✓",
  "En cours…": "In progress…",
  "Cible et message": "Target and message",
  "40 entreprises contactées": "40 companies contacted",
  "Rendez-vous analysés": "Meetings analysed",
  "Propositions envoyées": "Proposals sent",
  "Noam lit votre objectif…": "Noam is reading your goal…",
  "Noam compose l’équipe…": "Noam is putting the team together…",
  "Noam passe le relais…": "Noam is handing over…",
  "4 agents mobilisés · vous validez chaque étape": "4 agents on it · you approve every step",
  Relais: "Handover",
};
