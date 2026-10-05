import type { Locale } from "./i18n";

/*
 * What an agent brings, in results rather than hours: the selling side of a recommendation (May, the diagnostic).
 * Hours handed back depend on the time the visitor already spends — tiny when they barely do the task, which is
 * exactly when an agent matters most (the prospecting nobody has time for). So each precise task has its own
 * outcome: what the agent produces every month, and, for sales, what it turns into (meetings, customers, revenue).
 *
 * Every figure below is an ASSUMPTION written in one place, conservative and shown as a range, always presented
 * as an indicative estimate with its basis. To be validated by D2S and refined with real client results.
 */

export interface ValueInput {
  /** Precise task id of the diagnostic (lib/diagnostic.ts). */
  task: string;
  /** Weekly time: low (< 2 h), mid (2–10 h), high (> 10 h). */
  time?: string;
  /** Average value of a new customer (€), when the visitor gave it. */
  dealValue?: number;
  /** Hours handed back per month (estimateHours). */
  hours?: { min: number; max: number };
}

export interface ValuePitch {
  /** The outcome, figures first: "4 à 12 rendez-vous qualifiés de plus par mois". */
  headline: string;
  /** What the agent produces to get there. */
  capacity: string;
  /** Sales tasks with a customer value: what the meetings are worth. */
  money?: string;
  /** When the visitor barely does the task today: the opportunity, not a small saving. */
  reframe?: string;
  /** Hours handed back, when they are worth saying. */
  time?: string;
  /** What the free first call shows on their own case. */
  hook: string;
  /** The assumptions behind the figures (always shown with them). */
  basis: string;
  /** Sales tasks: May may ask the value of a customer to put the outcome in euros. */
  asksDealValue: boolean;
}

/* ---------- Assumptions (monthly, ranges) ---------- */

/** Prospecting: personalised multi-step sequences (e-mail, LinkedIn), ~12 to 20 new prospects a working day. */
const PROSPECTS = [250, 400] as const;
/** Share of prospects contacted who accept a meeting (usual range for personalised B2B outreach). */
const MEETING_RATE = [0.015, 0.03] as const;
/** Share of qualified meetings that sign. */
const CLOSE_RATE = [0.2, 0.3] as const;
/** Sales meetings: deals that close better when the follow-up leaves the same day (Jules + Victor). */
const FOLLOW_UP_GAIN = [0.1, 0.2] as const;

const fmt = (n: number, locale: Locale) => new Intl.NumberFormat(locale === "en" ? "en-GB" : "fr-FR", { maximumFractionDigits: 0 }).format(n);
/** 0.015 → "1,5" / "1.5". */
const pct = (v: number, locale: Locale) => new Intl.NumberFormat(locale === "en" ? "en-GB" : "fr-FR", { maximumFractionDigits: 1 }).format(v * 100);
const range = (a: number, b: number, locale: Locale) => (Math.round(a) === Math.round(b) ? fmt(a, locale) : `${fmt(a, locale)} ${locale === "en" ? "to" : "à"} ${fmt(b, locale)}`);
const euros = (a: number, b: number, locale: Locale) => {
  const round = (v: number) => (v >= 10_000 ? Math.round(v / 1_000) * 1_000 : Math.round(v / 100) * 100);
  return locale === "en" ? `€${range(round(a), round(b), locale)}` : `${range(round(a), round(b), locale)} €`;
};

type Words = { headline: string; capacity: string; hook: string; basis: string };

/** Fixed outcomes per task (no visitor figure needed). Sales tasks are computed below. */
const FIXED: Record<Locale, Record<string, Words>> = {
  fr: {
    support: {
      headline: "60 à 80 % de vos demandes clients traitées seules, 24 h/24, en moins d’une minute",
      capacity: "Loic répond sur WhatsApp, le chat du site et l’e-mail, suit les commandes et ne passe à votre équipe que les cas qui le méritent",
      hook: "En 30 minutes, l’équipe vous montre Loic répondant à vos vraies questions clients",
      basis: "part habituelle des demandes répétitives (suivi, horaires, retours, questions produit) dans un service client",
    },
    inbox: {
      headline: "Une boîte triée chaque matin et des réponses déjà rédigées pour la plupart de vos e-mails courants",
      capacity: "Inès classe chaque message, établit les priorités du jour, prépare les réponses et repère ce qui attend une relance",
      hook: "En 30 minutes, l’équipe vous montre Inès sur une journée type de votre boîte",
      basis: "e-mails courants (clients, fournisseurs, administratif) ; rien ne part sans votre validation",
    },
    content: {
      headline: "12 à 20 posts et 1 à 2 newsletters par mois, dans votre ton, sans y passer vos soirées",
      capacity: "Déa tient votre calendrier éditorial, rédige, propose plusieurs accroches et programme après votre feu vert",
      hook: "En 30 minutes, l’équipe vous montre Déa écrivant vos 3 prochains posts",
      basis: "rythme de publication régulier d’une PME active sur LinkedIn",
    },
    visuals: {
      headline: "30 à 60 visuels par mois à vos couleurs, déclinés dans tous les formats",
      capacity: "Mia part de votre charte, propose des concepts et livre posts, stories, bannières et miniatures",
      hook: "En 30 minutes, l’équipe vous montre Mia créant vos visuels de la semaine",
      basis: "besoins visuels d’une marque qui publie plusieurs fois par semaine",
    },
    video: {
      headline: "10 à 30 vidéos produit par mois, sans tournage, sans acteur, sans studio",
      capacity: "Emma écrit le script et l’accroche, choisit l’angle de vente et produit la vidéo, prête pour Instagram, TikTok et vos publicités",
      hook: "En 30 minutes, l’équipe vous montre Emma produisant la vidéo d’un de vos produits",
      basis: "une à plusieurs vidéos par produit phare, renouvelées chaque mois",
    },
    trends: {
      headline: "Chaque semaine, les 20 vidéos qui marchent le mieux dans votre secteur et 10 idées prêtes à produire",
      capacity: "Nina suit votre niche et vos concurrents, retranscrit les meilleures vidéos et explique pourquoi elles marchent",
      hook: "En 30 minutes, l’équipe vous montre la veille de Nina sur votre propre secteur",
      basis: "veille hebdomadaire sur Instagram et les Reels de votre niche",
    },
    strategy: {
      headline: "Votre cible, votre message et vos premières campagnes cadrés en quelques jours au lieu de plusieurs semaines",
      capacity: "Antoine analyse vos concurrents, définit votre client idéal, construit votre positionnement et rédige les briefs pour le reste de l’équipe",
      hook: "En 30 minutes, l’équipe vous montre Antoine posant le diagnostic de votre offre",
      basis: "méthodes de stratégie éprouvées appliquées à votre marché ; la décision reste la vôtre",
    },
    billing: {
      headline: "100 % de vos factures en retard relancées au bon moment, sans oubli ni relance gênante",
      capacity: "Chloé suit l’encaissé, l’attente et le retard, relance par paliers et vous dit chaque semaine où en est votre trésorerie",
      hook: "En 30 minutes, l’équipe vous montre Chloé sur vos factures en attente",
      basis: "relances par paliers (rappel courtois, deuxième relance, relance ferme) validées par vous",
    },
    data: {
      headline: "Votre tableau de bord à jour chaque lundi matin, et une alerte dès qu’un indicateur décroche",
      capacity: "Morgan réunit ventes, CRM et marketing, explique les tendances en clair et répond à vos questions",
      hook: "En 30 minutes, l’équipe vous montre Morgan expliquant vos chiffres du mois",
      basis: "vos données existantes (CRM, tableurs, outils de vente), sans saisie en plus",
    },
    decks: {
      headline: "Une présentation complète en une dizaine de minutes au lieu de 3 à 4 heures",
      capacity: "Hugo transforme un brief ou un rapport en slides mises en page, avec vos chiffres en schémas lisibles",
      hook: "En 30 minutes, l’équipe vous montre Hugo montant votre prochaine présentation",
      basis: "temps habituel de préparation d’un deck client ou d’un point d’équipe",
    },
    hr: {
      headline: "100 candidatures triées en quelques minutes et une présélection prête le jour même",
      capacity: "Diva classe les CV selon votre fiche de poste, invite les meilleurs profils et accueille les nouvelles recrues",
      hook: "En 30 minutes, l’équipe vous montre Diva sur l’un de vos recrutements",
      basis: "tri sur vos propres critères ; la décision d’embauche reste la vôtre",
    },
    knowledge: {
      headline: "La bonne information en quelques secondes, avec sa source, au lieu de 20 à 30 minutes de recherche",
      capacity: "Clément relie documents, rendez-vous et propositions, répond à toute l’équipe et accueille les nouvelles recrues",
      hook: "En 30 minutes, l’équipe vous montre Clément répondant à partir de vos documents",
      basis: "temps habituel passé à retrouver une information dans les e-mails, le Drive et les comptes rendus",
    },
    orchestration: {
      headline: "Un seul message pour mettre toute une équipe d’agents au travail",
      capacity: "Noam confie chaque demande au bon agent et fait circuler le travail de l’un à l’autre",
      hook: "En 30 minutes, l’équipe vous montre l’enchaînement d’agents adapté à votre objectif",
      basis: "les seize agents de l’équipe, coordonnés par un seul interlocuteur",
    },
    other: {
      headline: "Un agent construit autour de votre processus, testé sur vos propres cas avant toute mise en service",
      capacity: "Atelier de cadrage, prototype sur vos exemples réels, puis mise en service, mesure et amélioration continue",
      hook: "En 30 minutes, l’équipe cartographie avec vous ce que l’agent prendrait en charge",
      basis: "estimation affinée lors du brief, à partir de vos volumes réels",
    },
  },
  en: {
    support: {
      headline: "60 to 80% of your customer requests handled on their own, 24/7, in under a minute",
      capacity: "Loic answers on WhatsApp, the website chat and e-mail, tracks orders and only passes your team the cases that deserve it",
      hook: "In 30 minutes, the team shows you Loic answering your real customer questions",
      basis: "usual share of repetitive requests (tracking, opening hours, returns, product questions) in customer service",
    },
    inbox: {
      headline: "An inbox sorted every morning and replies already drafted for most of your routine e-mails",
      capacity: "Inès files every message, sets the day’s priorities, drafts the replies and spots what needs a follow-up",
      hook: "In 30 minutes, the team shows you Inès on a typical day of your inbox",
      basis: "routine e-mails (customers, suppliers, admin); nothing goes out without your approval",
    },
    content: {
      headline: "12 to 20 posts and 1 to 2 newsletters a month, in your tone, without spending your evenings on it",
      capacity: "Déa keeps your editorial calendar, writes, suggests several hooks and schedules once you approve",
      hook: "In 30 minutes, the team shows you Déa writing your next 3 posts",
      basis: "regular publishing pace of an SMB active on LinkedIn",
    },
    visuals: {
      headline: "30 to 60 on-brand visuals a month, in every format",
      capacity: "Mia starts from your brand guidelines, suggests concepts and delivers posts, stories, banners and thumbnails",
      hook: "In 30 minutes, the team shows you Mia creating this week’s visuals",
      basis: "visual needs of a brand that publishes several times a week",
    },
    video: {
      headline: "10 to 30 product videos a month, with no shoot, no actor and no studio",
      capacity: "Emma writes the script and the hook, picks the sales angle and produces the video, ready for Instagram, TikTok and your ads",
      hook: "In 30 minutes, the team shows you Emma producing a video of one of your products",
      basis: "one or more videos per flagship product, renewed every month",
    },
    trends: {
      headline: "Every week, the 20 best-performing videos in your industry and 10 ideas ready to produce",
      capacity: "Nina follows your niche and your competitors, transcribes the best videos and explains why they work",
      hook: "In 30 minutes, the team shows you Nina’s trend watch on your own industry",
      basis: "weekly watch of Instagram and the Reels of your niche",
    },
    strategy: {
      headline: "Your audience, your message and your first campaigns defined in days instead of weeks",
      capacity: "Antoine analyses your competitors, defines your ideal customer, builds your positioning and writes the briefs for the rest of the team",
      hook: "In 30 minutes, the team shows you Antoine diagnosing your offer",
      basis: "proven strategy methods applied to your market; the decision stays yours",
    },
    billing: {
      headline: "100% of your overdue invoices chased at the right time, never forgotten, never awkward",
      capacity: "Chloé tracks paid, pending and overdue, chases in stages and tells you every week where your cash stands",
      hook: "In 30 minutes, the team shows you Chloé on your pending invoices",
      basis: "staged reminders (polite reminder, second reminder, firm reminder) approved by you",
    },
    data: {
      headline: "Your dashboard up to date every Monday morning, and an alert as soon as a metric drops",
      capacity: "Morgan brings sales, CRM and marketing together, explains the trends in plain words and answers your questions",
      hook: "In 30 minutes, the team shows you Morgan explaining your month’s figures",
      basis: "your existing data (CRM, spreadsheets, sales tools), with no extra input",
    },
    decks: {
      headline: "A complete presentation in about ten minutes instead of 3 to 4 hours",
      capacity: "Hugo turns a brief or a report into laid-out slides, with your figures as readable diagrams",
      hook: "In 30 minutes, the team shows you Hugo building your next presentation",
      basis: "usual time to prepare a client deck or a team update",
    },
    hr: {
      headline: "100 applications sorted in minutes and a shortlist ready the same day",
      capacity: "Diva ranks CVs against your job description, invites the best profiles and welcomes new hires",
      hook: "In 30 minutes, the team shows you Diva on one of your openings",
      basis: "sorting on your own criteria; the hiring decision stays yours",
    },
    knowledge: {
      headline: "The right information in seconds, with its source, instead of 20 to 30 minutes of searching",
      capacity: "Clément links documents, meetings and proposals, answers the whole team and welcomes new hires",
      hook: "In 30 minutes, the team shows you Clément answering from your documents",
      basis: "usual time spent finding information in e-mails, Drive and meeting notes",
    },
    orchestration: {
      headline: "One message to put a whole team of agents to work",
      capacity: "Noam hands each request to the right agent and passes the work from one to the next",
      hook: "In 30 minutes, the team shows you the chain of agents suited to your goal",
      basis: "the sixteen agents of the team, coordinated by a single point of contact",
    },
    other: {
      headline: "An agent built around your process, tested on your own cases before going live",
      capacity: "Scoping workshop, prototype on your real examples, then go-live, measurement and continuous improvement",
      hook: "In 30 minutes, the team maps out with you what the agent would take over",
      basis: "estimate refined during the brief, from your real volumes",
    },
  },
};

const REFRAME: Record<Locale, Record<string, string>> = {
  fr: {
    prospection: "Moins de 2 h par semaine de prospection, c’est justement là que des clients vous échappent : May, elle, prospecte tous les jours, sans y passer une minute de votre temps.",
    default: "Aujourd’hui vous n’y consacrez que peu de temps : votre agent, lui, s’en occupe chaque jour, et fait ce que vous n’avez pas le temps de faire.",
  },
  en: {
    prospection: "Under 2 hours of prospecting a week is exactly where customers slip away: May prospects every single day, without taking a minute of your time.",
    default: "You spend little time on it today: your agent works on it every day, and does what you don’t have time to do.",
  },
};

/** The selling side of a recommendation, in the visitor's language. */
export function valueOf({ task, time, dealValue, hours }: ValueInput, locale: Locale = "fr"): ValuePitch {
  const en = locale === "en";
  const deal = dealValue && dealValue > 0 ? dealValue : undefined;
  const low = time === "low";
  const timeLine = hours && hours.max >= 8 ? (en ? `On top of that, ${range(hours.min, hours.max, locale)} hours a month back for your team` : `En plus, ${range(hours.min, hours.max, locale)} h par mois rendues à votre équipe`) : undefined;

  if (task === "prospection") {
    const meetings = [PROSPECTS[0] * MEETING_RATE[0], PROSPECTS[1] * MEETING_RATE[1]];
    const customers = [meetings[0] * CLOSE_RATE[0], meetings[1] * CLOSE_RATE[1]];
    return {
      headline: en
        ? `${range(meetings[0], meetings[1], locale)} extra qualified meetings a month in your calendar`
        : `${range(meetings[0], meetings[1], locale)} rendez-vous qualifiés de plus par mois dans votre agenda`,
      capacity: en
        ? `May contacts ${range(PROSPECTS[0], PROSPECTS[1], locale)} targeted prospects a month in your name, personalises every message, follows up and books the meetings`
        : `May contacte ${range(PROSPECTS[0], PROSPECTS[1], locale)} prospects ciblés par mois en votre nom, personnalise chaque message, relance et cale les rendez-vous`,
      money: deal
        ? en
          ? `That is ${range(Math.max(1, customers[0]), customers[1], locale)} new customers a month, around ${euros(Math.max(1, customers[0]) * deal, customers[1] * deal, locale)} of potential revenue`
          : `Soit ${range(Math.max(1, customers[0]), customers[1], locale)} nouveaux clients par mois, environ ${euros(Math.max(1, customers[0]) * deal, customers[1] * deal, locale)} de chiffre d’affaires potentiel`
        : undefined,
      reframe: low ? REFRAME[locale].prospection : undefined,
      time: timeLine,
      hook: en ? "In 30 minutes, the team shows you May writing to 3 of your real prospects" : "En 30 minutes, l’équipe vous montre May écrivant à 3 de vos vrais prospects",
      basis: en
        ? `${range(PROSPECTS[0], PROSPECTS[1], locale)} prospects a month, ${pct(MEETING_RATE[0], locale)} to ${pct(MEETING_RATE[1], locale)}% accepting a meeting (usual range for personalised B2B outreach)${deal ? `, ${pct(CLOSE_RATE[0], locale)} to ${pct(CLOSE_RATE[1], locale)}% of meetings signing` : ""}`
        : `${range(PROSPECTS[0], PROSPECTS[1], locale)} prospects par mois, ${pct(MEETING_RATE[0], locale)} à ${pct(MEETING_RATE[1], locale)} % qui acceptent un rendez-vous (fourchette usuelle en prospection B2B personnalisée)${deal ? `, ${pct(CLOSE_RATE[0], locale)} à ${pct(CLOSE_RATE[1], locale)} % des rendez-vous qui signent` : ""}`,
      asksDealValue: !deal,
    };
  }

  if (task === "meetings" || task === "proposals") {
    const jules = task === "meetings";
    const headline = jules
      ? en
        ? "Every sales meeting followed up the same day, with the notes, the objections and the next step ready"
        : "Chaque rendez-vous commercial relancé le jour même, avec le compte rendu, les objections et la suite prête"
      : en
        ? "Your proposals sent the same day as the meeting instead of 3 to 5 days later"
        : "Vos propositions envoyées le jour même du rendez-vous au lieu de 3 à 5 jours après";
    return {
      headline,
      capacity: jules
        ? en
          ? "Jules records and analyses each call, scores the chance of signing and drafts the follow-up e-mail; Victor turns it into a proposal"
          : "Jules enregistre et analyse chaque rendez-vous, estime les chances de signature et rédige la relance ; Victor en fait la proposition"
        : en
          ? "Victor writes a structured proposal from the meeting, answers the objections in advance and tells you when the prospect opens it"
          : "Victor rédige une proposition structurée à partir du rendez-vous, répond d’avance aux objections et vous prévient quand le prospect l’ouvre",
      money: deal
        ? en
          ? `Deals that no longer cool down: 1 to 2 deals saved every 10 meetings, that is ${euros(deal * 10 * FOLLOW_UP_GAIN[0], deal * 10 * FOLLOW_UP_GAIN[1], locale)}`
          : `Des affaires qui ne refroidissent plus : 1 à 2 affaires sauvées tous les 10 rendez-vous, soit ${euros(deal * 10 * FOLLOW_UP_GAIN[0], deal * 10 * FOLLOW_UP_GAIN[1], locale)}`
        : undefined,
      reframe: low ? REFRAME[locale].default : undefined,
      time: timeLine,
      hook: jules
        ? en
          ? "In 30 minutes, the team shows you Jules analysing one of your own meetings"
          : "En 30 minutes, l’équipe vous montre Jules analysant l’un de vos propres rendez-vous"
        : en
          ? "In 30 minutes, the team shows you Victor writing a proposal for one of your prospects"
          : "En 30 minutes, l’équipe vous montre Victor rédigeant une proposition pour l’un de vos prospects",
      basis: en
        ? `deals close more often when the follow-up leaves the same day (we count ${pct(FOLLOW_UP_GAIN[0], locale)} to ${pct(FOLLOW_UP_GAIN[1], locale)}% of deals saved)`
        : `une affaire se signe plus souvent quand la relance part le jour même (nous comptons ${pct(FOLLOW_UP_GAIN[0], locale)} à ${pct(FOLLOW_UP_GAIN[1], locale)} % d’affaires sauvées)`,
      asksDealValue: !deal,
    };
  }

  const words = FIXED[locale][task] ?? FIXED[locale].other;
  return { ...words, reframe: low ? REFRAME[locale].default : undefined, time: timeLine, asksDealValue: false };
}
