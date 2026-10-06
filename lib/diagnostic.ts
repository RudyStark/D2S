import { AGENT_CARDS, agentCard, type AgentKey } from "./agent-directory";
import type { Locale } from "./i18n";

/*
 * "Comment choisir votre agent IA ?" — a short diagnostic. The field of work, then the precise task (that is
 * what tells our sixteen agents apart), the time it takes, the tools and how standard the process is. Every
 * answer moves a live compatibility score for each agent and for a custom-built agent; the result is one of
 * three outcomes:
 *  - ready:   one of our agents fits as is (plug & play),
 *  - adapted: one of our agents is the right base, trained on the company's own rules,
 *  - custom:  the process is specific enough to deserve an agent built around it.
 * Scores are a transparent heuristic (no data leaves the page); the time saved is an indicative estimate.
 * Shared by the desktop section, the mobile version and May (lib/may-local.ts, lib/server/may-agent.ts).
 */

export const DIAGNOSTIC_INTRO = {
  kicker: "Comment ça marche",
  title: ["Comment choisir", "votre agent IA ?"],
  lead: "Quelques questions sur votre activité, une minute. Parmi nos seize agents, nous vous disons lequel peut prendre le relais, ou s’il vous faut un agent sur mesure, construit autour de votre métier.",
};

export type { AgentKey } from "./agent-directory";
export type Candidate = AgentKey | "custom";

export type OptionIcon =
  | "content"
  | "support"
  | "prospection"
  | "hr"
  | "data"
  | "custom"
  | "meetings"
  | "proposals"
  | "inbox"
  | "visuals"
  | "video"
  | "trends"
  | "strategy"
  | "billing"
  | "decks"
  | "knowledge"
  | "orchestration"
  | "clock-low"
  | "clock-mid"
  | "clock-high"
  | "mail"
  | "chat"
  | "social"
  | "crm"
  | "sheet"
  | "calendar"
  | "shop"
  | "docs"
  | "software"
  | "standard"
  | "specific"
  | "unique";

export type AreaId = "sales" | "clients" | "marketing" | "admin" | "team" | "other";

export interface DiagnosticOption {
  id: string;
  label: string;
  hint?: string;
  /** In a sentence ("… avec l’e-mail et LinkedIn"). */
  phrase?: string;
  icon: OptionIcon;
  /** Points added to each candidate when chosen. */
  score: Partial<Record<Candidate, number>>;
  /** Precise tasks: their field of work. */
  area?: AreaId;
  /** Precise tasks: the agent whose job it is. */
  agent?: AgentKey;
  /** Precise tasks: the agent that completes it best (« Idéal en duo avec… »). */
  pair?: AgentKey;
  /** Precise tasks: share of the work an agent typically takes over (low, high), see estimateHours. */
  share?: [number, number];
}

export interface DiagnosticQuestion {
  id: "area" | "task" | "time" | "tools" | "process";
  title: string;
  help: string;
  multiple?: boolean;
  options: DiagnosticOption[];
}

const AGENT_KEYS = AGENT_CARDS.map((a) => a.key);
const EVERY_AGENT = (n: number): Partial<Record<Candidate, number>> => Object.fromEntries(AGENT_KEYS.map((k) => [k, n]));

/* The field of work: 20 points to each of its agents (the precise task then adds 40 to the one whose job it is). */
const AREA_AGENTS: Record<AreaId, Candidate[]> = {
  sales: ["prospection", "fireflies", "proposition"],
  clients: ["support", "gmail"],
  marketing: ["content", "designer", "ecommerce", "veille", "strategiste"],
  admin: ["comptabilite", "data", "presentateur"],
  team: ["automation", "cerveau", "orchestrateur"],
  other: ["custom"],
};
const areaScore = (area: AreaId) => Object.fromEntries(AREA_AGENTS[area].map((c) => [c, 20]));

/*
 * The precise task: the agent whose job it is (+40), the colleagues who help on it (a few points), the agent
 * to pair it with, and the share of this kind of work an agent usually takes over.
 */
function task(
  id: string,
  area: AreaId,
  label: string,
  hint: string,
  icon: OptionIcon,
  agent: AgentKey,
  pair: AgentKey,
  share: [number, number],
  helpers: Partial<Record<AgentKey, number>> = {},
): DiagnosticOption {
  return { id, label, hint, icon, area, agent, pair, share, score: { ...helpers, [agent]: 40 } };
}

export const QUESTIONS: DiagnosticQuestion[] = [
  {
    id: "area",
    title: "Où aimeriez-vous être épaulé en priorité ?",
    help: "Choisissez le domaine qui vous coûte le plus de temps. On précise juste après.",
    options: [
      { id: "sales", label: "Vendre", hint: "Prospection, rendez-vous, propositions", icon: "prospection", score: areaScore("sales") },
      { id: "clients", label: "Vos clients et vos e-mails", hint: "Questions, SAV, boîte de réception", icon: "support", score: areaScore("clients") },
      { id: "marketing", label: "Contenu et marketing", hint: "Posts, visuels, vidéos, stratégie", icon: "content", score: areaScore("marketing") },
      { id: "admin", label: "Gestion et chiffres", hint: "Factures, tableaux de bord, présentations", icon: "data", score: areaScore("admin") },
      { id: "team", label: "Équipe et organisation", hint: "Recrutement, savoir interne, coordination", icon: "hr", score: areaScore("team") },
      { id: "other", label: "Autre chose", hint: "Un processus propre à votre métier", icon: "custom", score: areaScore("other") },
    ],
  },
  {
    id: "task",
    title: "Plus précisément, que voulez-vous déléguer ?",
    help: "La tâche qui vous prend le plus de temps aujourd’hui.",
    options: [
      task("prospection", "sales", "Trouver de nouveaux clients", "Cibler, contacter, relancer, décrocher des rendez-vous", "prospection", "prospection", "fireflies", [0.4, 0.6]),
      task("meetings", "sales", "Exploiter vos rendez-vous commerciaux", "Comptes rendus, objections, relance après chaque rendez-vous", "meetings", "fireflies", "proposition", [0.5, 0.7], { proposition: 8 }),
      task("proposals", "sales", "Rédiger vos propositions commerciales", "Des offres argumentées, envoyées le jour même", "proposals", "proposition", "fireflies", [0.45, 0.65], { fireflies: 8 }),
      task("support", "clients", "Répondre à vos clients", "WhatsApp, chat du site, suivi de commande, SAV", "support", "support", "gmail", [0.55, 0.75], { gmail: 6 }),
      task("inbox", "clients", "Tenir votre boîte mail", "Tri, priorités du jour, réponses préparées, relances", "inbox", "gmail", "support", [0.4, 0.6], { support: 6 }),
      task("content", "marketing", "Écrire vos posts et newsletters", "LinkedIn, newsletters, articles", "content", "content", "designer", [0.45, 0.65], { veille: 8 }),
      task("visuals", "marketing", "Créer vos visuels", "Posts, bannières, miniatures YouTube", "visuals", "designer", "content", [0.4, 0.6], { content: 8 }),
      task("video", "marketing", "Produire des vidéos produit", "E-commerce, publicités, sans tournage", "video", "ecommerce", "designer", [0.45, 0.65], { designer: 8 }),
      task("trends", "marketing", "Savoir ce qui marche dans votre secteur", "Tendances, concurrents, idées de contenu", "trends", "veille", "content", [0.5, 0.7], { content: 8, strategiste: 6 }),
      task("strategy", "marketing", "Définir votre stratégie marketing", "Cible, positionnement, message, campagnes", "strategy", "strategiste", "content", [0.3, 0.5], { veille: 8 }),
      task("billing", "admin", "Suivre vos factures et vos impayés", "Factures, relances, trésorerie, marge", "billing", "comptabilite", "data", [0.45, 0.65], { data: 8 }),
      task("data", "admin", "Comprendre vos chiffres", "Tableaux de bord, indicateurs, alertes", "data", "data", "presentateur", [0.5, 0.7], { comptabilite: 6, presentateur: 6 }),
      task("decks", "admin", "Préparer vos présentations", "Decks clients, comités, rapports", "decks", "presentateur", "data", [0.5, 0.7], { data: 8 }),
      task("hr", "team", "Recruter et intégrer", "CV, entretiens, onboarding", "hr", "automation", "cerveau", [0.4, 0.6], { cerveau: 6 }),
      task("knowledge", "team", "Retrouver l’information interne", "Documents, historique, réponses sourcées", "knowledge", "cerveau", "orchestrateur", [0.4, 0.6], { orchestrateur: 6 }),
      task("orchestration", "team", "Déléguer un peu de tout", "Un seul interlocuteur qui répartit le travail entre les agents", "orchestration", "orchestrateur", "cerveau", [0.3, 0.5], { cerveau: 8 }),
      { id: "other", area: "other", label: "Un processus propre à votre métier", icon: "custom", share: [0.3, 0.5], score: { custom: 40 } },
    ],
  },
  {
    id: "time",
    title: "Combien de temps y passez-vous chaque semaine ?",
    help: "Toute l’équipe comprise, à la louche.",
    options: [
      { id: "low", label: "Moins de 2 h", hint: "Une tâche d’appoint", icon: "clock-low", score: {} },
      { id: "mid", label: "2 à 10 h", hint: "Une vraie part de la semaine", icon: "clock-mid", score: {} },
      { id: "high", label: "Plus de 10 h", hint: "Un poste à part entière", icon: "clock-high", score: { custom: 4 } },
    ],
  },
  {
    id: "tools",
    title: "Où se passe ce travail aujourd’hui ?",
    help: "Plusieurs réponses possibles.",
    multiple: true,
    options: [
      { id: "mail", label: "E-mail", phrase: "l’e-mail", icon: "mail", score: { gmail: 14, support: 8, prospection: 8, automation: 8, proposition: 6, comptabilite: 6, content: 5, fireflies: 4 } },
      { id: "chat", label: "WhatsApp, chat du site", phrase: "WhatsApp, le chat du site", icon: "chat", score: { support: 14, prospection: 5 } },
      { id: "social", label: "LinkedIn, réseaux sociaux", phrase: "les réseaux sociaux", icon: "social", score: { content: 14, designer: 12, veille: 12, prospection: 10, ecommerce: 8, strategiste: 8 } },
      { id: "crm", label: "CRM", phrase: "votre CRM", icon: "crm", score: { prospection: 12, data: 8, fireflies: 8, proposition: 8, support: 5, cerveau: 4 } },
      { id: "sheet", label: "Tableurs, reporting", phrase: "vos tableurs", icon: "sheet", score: { data: 14, comptabilite: 12, presentateur: 6, automation: 4 } },
      { id: "calendar", label: "Agenda, visio", phrase: "votre agenda", icon: "calendar", score: { automation: 10, fireflies: 10, prospection: 8, content: 4 } },
      { id: "shop", label: "Boutique en ligne", phrase: "votre boutique en ligne", icon: "shop", score: { ecommerce: 14, support: 8, data: 4 } },
      { id: "docs", label: "Documents, Drive", phrase: "vos documents", icon: "docs", score: { cerveau: 12, presentateur: 10, proposition: 6, automation: 4 } },
      { id: "software", label: "Logiciel métier, outil interne", phrase: "votre logiciel métier", icon: "software", score: { custom: 22, cerveau: 6, data: 4 } },
    ],
  },
  {
    id: "process",
    title: "Comment décririez-vous ce processus ?",
    help: "C’est ce qui décide entre un agent prêt à l’emploi et un agent sur mesure.",
    options: [
      { id: "standard", label: "Classique", hint: "Il ressemble à ce que font la plupart des entreprises.", icon: "standard", score: { ...EVERY_AGENT(14), custom: -10 } },
      { id: "specific", label: "Quelques spécificités", hint: "Des règles à nous, mais le cœur reste standard.", icon: "specific", score: { ...EVERY_AGENT(6), custom: 12 } },
      { id: "unique", label: "Unique à notre métier", hint: "Des règles, des validations et des cas particuliers bien à nous.", icon: "unique", score: { custom: 36 } },
    ],
  },
];

export type Answers = Partial<Record<DiagnosticQuestion["id"], string[]>>;

/* ——— English: same ids, same scores, only the words change ——— */

type Words = { label: string; hint?: string; phrase?: string };

const DIAGNOSTIC_INTRO_EN: typeof DIAGNOSTIC_INTRO = {
  kicker: "How it works",
  title: ["How to choose", "your AI agent?"],
  lead: "A few questions about your business, one minute. Among our sixteen agents, we tell you which one can take over, or whether you need a custom agent, built around your trade.",
};

const QUESTION_WORDS_EN: Record<DiagnosticQuestion["id"], { title: string; help: string; options: Record<string, Words> }> = {
  area: {
    title: "Where would you like help first?",
    help: "Pick the area that costs you the most time. We narrow it down right after.",
    options: {
      sales: { label: "Selling", hint: "Prospecting, meetings, proposals" },
      clients: { label: "Your customers and your e-mails", hint: "Questions, after-sales, inbox" },
      marketing: { label: "Content and marketing", hint: "Posts, visuals, videos, strategy" },
      admin: { label: "Admin and figures", hint: "Invoices, dashboards, presentations" },
      team: { label: "Team and organisation", hint: "Hiring, internal knowledge, coordination" },
      other: { label: "Something else", hint: "A process specific to your trade" },
    },
  },
  task: {
    title: "More precisely, what do you want to hand over?",
    help: "The task that takes you the most time today.",
    options: {
      prospection: { label: "Find new customers", hint: "Target, reach out, follow up, land meetings" },
      meetings: { label: "Make the most of your sales meetings", hint: "Notes, objections, follow-up after every meeting" },
      proposals: { label: "Write your sales proposals", hint: "Well-argued offers, sent the same day" },
      support: { label: "Answer your customers", hint: "WhatsApp, website chat, order tracking, after-sales" },
      inbox: { label: "Keep your inbox under control", hint: "Sorting, today’s priorities, drafted replies, follow-ups" },
      content: { label: "Write your posts and newsletters", hint: "LinkedIn, newsletters, articles" },
      visuals: { label: "Create your visuals", hint: "Posts, banners, YouTube thumbnails" },
      video: { label: "Produce product videos", hint: "E-commerce, ads, with no shoot" },
      trends: { label: "Know what works in your industry", hint: "Trends, competitors, content ideas" },
      strategy: { label: "Define your marketing strategy", hint: "Audience, positioning, message, campaigns" },
      billing: { label: "Track your invoices and unpaid bills", hint: "Invoices, reminders, cash flow, margin" },
      data: { label: "Understand your figures", hint: "Dashboards, metrics, alerts" },
      decks: { label: "Prepare your presentations", hint: "Client decks, board meetings, reports" },
      hr: { label: "Hire and onboard", hint: "CVs, interviews, onboarding" },
      knowledge: { label: "Find internal information", hint: "Documents, history, sourced answers" },
      orchestration: { label: "Hand over a bit of everything", hint: "A single point of contact who shares the work between the agents" },
      other: { label: "A process specific to your trade" },
    },
  },
  time: {
    title: "How much time do you spend on it each week?",
    help: "The whole team included, roughly.",
    options: {
      low: { label: "Under 2 h", hint: "A side task" },
      mid: { label: "2 to 10 h", hint: "A real part of the week" },
      high: { label: "Over 10 h", hint: "A full-time job" },
    },
  },
  tools: {
    title: "Where does this work happen today?",
    help: "Several answers possible.",
    options: {
      mail: { label: "E-mail", phrase: "e-mail" },
      chat: { label: "WhatsApp, website chat", phrase: "WhatsApp, the website chat" },
      social: { label: "LinkedIn, social media", phrase: "social media" },
      crm: { label: "CRM", phrase: "your CRM" },
      sheet: { label: "Spreadsheets, reporting", phrase: "your spreadsheets" },
      calendar: { label: "Calendar, video calls", phrase: "your calendar" },
      shop: { label: "Online shop", phrase: "your online shop" },
      docs: { label: "Documents, Drive", phrase: "your documents" },
      software: { label: "Business software, internal tool", phrase: "your business software" },
    },
  },
  process: {
    title: "How would you describe this process?",
    help: "This is what decides between a ready-to-use agent and a custom one.",
    options: {
      standard: { label: "Standard", hint: "It looks like what most companies do." },
      specific: { label: "A few specifics", hint: "Some rules of our own, but the core is standard." },
      unique: { label: "Unique to our trade", hint: "Rules, approvals and special cases that are ours alone." },
    },
  },
};

const QUESTIONS_EN: DiagnosticQuestion[] = QUESTIONS.map((q) => {
  const w = QUESTION_WORDS_EN[q.id];
  return { ...q, title: w.title, help: w.help, options: q.options.map((o) => ({ ...o, ...w.options[o.id] })) };
});

/** The questions in a language (same ids and scores). */
export const questionsOf = (locale: Locale = "fr") => (locale === "en" ? QUESTIONS_EN : QUESTIONS);
export const diagnosticIntroOf = (locale: Locale = "fr") => (locale === "en" ? DIAGNOSTIC_INTRO_EN : DIAGNOSTIC_INTRO);

const question = (id: DiagnosticQuestion["id"], locale: Locale = "fr") => questionsOf(locale).find((q) => q.id === id)!;
const TASKS = question("task").options;

/** A precise task (option of the "task" question). */
export const taskOption = (id: string | undefined, locale: Locale = "fr") => (locale === "en" ? question("task", "en").options : TASKS).find((o) => o.id === id);

/**
 * The answers made whole: the field of work follows from the precise task (May only knows the task), and
 * « Autre chose » has a single task. Every calculation below starts from here.
 */
export function completeAnswers(answers: Answers): Answers {
  const task = taskOption(answers.task?.[0]);
  const area = task?.area ?? answers.area?.[0];
  const out: Answers = { ...answers };
  if (area) out.area = [area];
  if (area === "other") out.task = ["other"];
  return out;
}

/** The questions to ask for these answers: the precise task is skipped for « Autre chose ». */
export function activeQuestions(answers: Answers, locale: Locale = "fr") {
  return questionsOf(locale).filter((q) => !(q.id === "task" && answers.area?.[0] === "other"));
}

/** Options shown for a question: the precise tasks of the chosen field only. */
export function optionsFor(q: DiagnosticQuestion, answers: Answers) {
  if (q.id !== "task") return q.options;
  const area = answers.area?.[0];
  return q.options.filter((o) => o.area === area && o.id !== "other");
}

/** New answers after a choice, keeping the task coherent with the field (a new field clears the task). */
export function withAnswer(answers: Answers, id: DiagnosticQuestion["id"], values: string[]): Answers {
  const next: Answers = { ...answers, [id]: values };
  if (id === "area") {
    const area = values[0];
    if (area === "other") next.task = ["other"];
    else if (taskOption(answers.task?.[0])?.area !== area) delete next.task;
  }
  return next;
}

/** Every candidate, in display order: the five of the 3D world, the eleven others, then the custom agent. */
export const CANDIDATES: Candidate[] = [...AGENT_KEYS, "custom"];

/** Highest score a candidate can reach (for the live bars). */
const MAX_SCORE = 104;

export function scoreAnswers(input: Answers): Record<Candidate, number> {
  const answers = completeAnswers(input);
  const scores = Object.fromEntries(CANDIDATES.map((c) => [c, 0])) as Record<Candidate, number>;
  for (const q of QUESTIONS) {
    for (const id of answers[q.id] ?? []) {
      const option = q.options.find((o) => o.id === id);
      if (!option) continue;
      for (const [c, v] of Object.entries(option.score) as [Candidate, number][]) scores[c] += v;
    }
  }
  return scores;
}

/** Candidates from best to worst (ties keep the display order). */
export function rankCandidates(scores: Record<Candidate, number>) {
  return [...CANDIDATES].sort((a, b) => scores[b] - scores[a] || CANDIDATES.indexOf(a) - CANDIDATES.indexOf(b));
}

/** 0–1 fill of a live bar. */
export const barFill = (score: number) => Math.max(0, Math.min(1, score / MAX_SCORE));

/** Displayed compatibility (same scale as the bar), 0–99 %: it grows as the diagnostic learns more. */
export const matchPercent = (score: number) => Math.round(Math.min(99, barFill(score) * 100));

/** "a", "a et b", "a, b et c". */
export const joinFr = (items: string[]) => (items.length < 2 ? (items[0] ?? "") : `${items.slice(0, -1).join(", ")} et ${items.at(-1)}`);
/** "a", "a and b", "a, b and c". */
export const joinEn = (items: string[]) => (items.length < 2 ? (items[0] ?? "") : `${items.slice(0, -1).join(", ")} and ${items.at(-1)}`);
export const joinIn = (items: string[], locale: Locale = "fr") => (locale === "en" ? joinEn(items) : joinFr(items));

export type Outcome = "ready" | "adapted" | "custom";

export interface DiagnosticResult {
  outcome: Outcome;
  /** Recommended agent (ready / adapted), or the closest agent to start from (custom). */
  agent: AgentKey;
  percent: number;
  /** Time given back per month, indicative (see estimateHours). */
  hours: HoursEstimate;
  /** Chosen tools (options of the "tools" question). */
  tools: DiagnosticOption[];
  /** The precise task (« Autre chose » = the custom task). */
  task: DiagnosticOption;
  /** The agent that completes the recommendation best, on the same job. */
  duo: AgentKey | null;
}

/*
 * Time given back, indicative: declared weekly time × weeks per month × the share of this kind of task an
 * agent typically takes over, reduced when the process has its own rules (validations and special cases
 * stay with people). Shown as a range, rounded, never as a promise.
 */
const WEEKLY_HOURS: Record<string, number> = { low: 1.5, mid: 6, high: 14 };
const WEEKS_PER_MONTH = 4.33;
const DEFAULT_SHARE: [number, number] = [0.3, 0.5];
const PROCESS_FACTOR: Record<string, number> = { standard: 1, specific: 0.85, unique: 0.7 };

export interface HoursEstimate {
  min: number;
  max: number;
  /** Working days (7 h) the upper bound represents, when it reaches one. */
  days: number;
  /** Share range used, in % (for the footnote). */
  share: [number, number];
}

const roundHours = (h: number) => (h < 10 ? Math.max(1, Math.round(h)) : Math.round(h / 5) * 5);

/** `weeklyHours`: the visitor's own figure, when they gave one (May), instead of the middle of the bracket. */
export function estimateHours(input: Answers, weeklyHours?: number): HoursEstimate {
  const answers = completeAnswers(input);
  const weekly = weeklyHours ?? WEEKLY_HOURS[answers.time?.[0] ?? "mid"] ?? WEEKLY_HOURS.mid;
  const share = taskOption(answers.task?.[0])?.share ?? DEFAULT_SHARE;
  const factor = PROCESS_FACTOR[answers.process?.[0] ?? "standard"] ?? 1;
  const base = weekly * WEEKS_PER_MONTH * factor;
  const min = roundHours(base * share[0]);
  const max = Math.max(min, roundHours(base * share[1]));
  return { min, max, days: Math.floor(max / 7), share: [Math.round(share[0] * 100), Math.round(share[1] * 100)] };
}

/** "Entre 10 et 15 h récupérées chaque mois, soit jusqu’à 2 jours de travail". */
export function hoursSentence({ min, max, days }: HoursEstimate, locale: Locale = "fr") {
  if (locale === "en") {
    const range = min === max ? `About ${min} h` : `Between ${min} and ${max} h`;
    return `${range} saved every month${days >= 1 ? `, up to ${days} working day${days > 1 ? "s" : ""}` : ""}`;
  }
  const range = min === max ? `Environ ${min} h` : `Entre ${min} et ${max} h`;
  return `${range} récupérées chaque mois${days >= 1 ? `, soit jusqu’à ${days} jour${days > 1 ? "s" : ""} de travail` : ""}`;
}

export function buildResult(input: Answers, locale: Locale = "fr"): DiagnosticResult {
  const answers = completeAnswers(input);
  const scores = scoreAnswers(answers);
  const ranked = rankCandidates(scores).filter((c): c is AgentKey => c !== "custom");
  const best = ranked[0];
  const custom = scores.custom;
  const outcome: Outcome = custom >= scores[best] ? "custom" : custom >= 30 ? "adapted" : "ready";
  const task = taskOption(answers.task?.[0], locale) ?? taskOption("other", locale)!;
  const toolIds = answers.tools ?? [];
  const tools = question("tools", locale).options.filter((o) => toolIds.includes(o.id));
  // The partner on the same job: the task's pair, or the task's own agent if the tools put someone else first.
  const partner = task.pair && task.pair !== best ? task.pair : task.agent && task.agent !== best ? task.agent : null;
  return {
    outcome,
    agent: best,
    percent: matchPercent(outcome === "custom" ? custom : scores[best]),
    hours: estimateHours(answers),
    tools,
    task,
    duo: outcome === "custom" ? null : partner,
  };
}

/** Tools each agent already works with (option ids of the "tools" question). */
export const AGENT_TOOLS: Record<AgentKey, string[]> = {
  content: ["social", "mail", "calendar"],
  support: ["chat", "mail", "crm", "shop"],
  prospection: ["mail", "social", "crm", "calendar", "chat"],
  automation: ["mail", "calendar", "sheet", "docs"],
  data: ["sheet", "crm", "software", "shop"],
  fireflies: ["calendar", "crm", "mail"],
  proposition: ["crm", "mail", "docs"],
  strategiste: ["social"],
  designer: ["social"],
  veille: ["social"],
  ecommerce: ["shop", "social"],
  gmail: ["mail"],
  comptabilite: ["sheet", "mail"],
  presentateur: ["docs", "sheet"],
  cerveau: ["docs", "crm", "software"],
  orchestrateur: [],
};

/** Grammatical gender of each agent's name, for the result sentence. */
export const FEMININE = Object.fromEntries(AGENT_CARDS.map((a) => [a.key, a.feminine])) as Record<AgentKey, boolean>;

export const CUSTOM_STEPS = [
  { title: "Atelier de cadrage", text: "Une heure avec vous pour cartographier vos règles et vos cas particuliers." },
  { title: "Prototype sur vos cas réels", text: "Un premier agent testé sur vos propres exemples, ajusté avec vous." },
  { title: "Mise en service et suivi", text: "Connecté à vos outils, mesuré, et amélioré en continu." },
];

const CUSTOM_STEPS_EN: typeof CUSTOM_STEPS = [
  { title: "Scoping workshop", text: "One hour with you to map your rules and your special cases." },
  { title: "Prototype on your real cases", text: "A first agent tested on your own examples, adjusted with you." },
  { title: "Go-live and follow-up", text: "Connected to your tools, measured, and improved continuously." },
];
export const customStepsOf = (locale: Locale = "fr") => (locale === "en" ? CUSTOM_STEPS_EN : CUSTOM_STEPS);

/** The contact form's need for a result: the recommended agent, or the custom agent. */
export const resultNeed = (result: DiagnosticResult) => (result.outcome === "custom" ? ("custom" as const) : agentCard(result.agent).need);

/** The diagnostic in a few lines, attached to the contact request. */
export function diagnosticSummary(input: Answers, result: DiagnosticResult, locale: Locale = "fr") {
  const answers = completeAnswers(input);
  const labels = (id: DiagnosticQuestion["id"]) =>
    question(id, locale)
      .options.filter((o) => answers[id]?.includes(o.id))
      .map((o) => o.label)
      .join(", ");
  const agent = agentCard(result.agent, locale);
  if (locale === "en") {
    const task = taskOption(result.task.id, "en") ?? result.task;
    return [
      result.outcome === "custom"
        ? "Recommendation: custom agent"
        : `Recommendation: ${agent.name}, ${agent.role.charAt(0).toLowerCase()}${agent.role.slice(1)} (${result.percent}%)${result.outcome === "adapted" ? ", adapted to your rules" : ""}`,
      `Priority: ${task.label}${task.area !== "other" ? ` (${labels("area").toLowerCase()})` : ""}`,
      `${labels("time")} a week`,
      answers.tools?.length ? `Tools: ${labels("tools")}` : "",
      `Process: ${labels("process").toLowerCase()}`,
      `Estimated gain: ${result.hours.min === result.hours.max ? `≈ ${result.hours.min}` : `${result.hours.min} to ${result.hours.max}`} h a month`,
    ].filter(Boolean);
  }
  const reco =
    result.outcome === "custom"
      ? "Recommandation : agent sur mesure"
      : `Recommandation : ${agent.name}, ${agent.role.charAt(0).toLowerCase()}${agent.role.slice(1)} (${result.percent} %)${result.outcome === "adapted" ? ", adapté à vos règles" : ""}`;
  return [
    reco,
    `Priorité : ${result.task.label}${result.task.area !== "other" ? ` (${labels("area").toLowerCase()})` : ""}`,
    `${labels("time")} par semaine`,
    answers.tools?.length ? `Outils : ${labels("tools")}` : "",
    `Processus : ${labels("process").toLowerCase()}`,
    `Gain estimé : ${result.hours.min === result.hours.max ? `≈ ${result.hours.min}` : `${result.hours.min} à ${result.hours.max}`} h par mois`,
  ].filter(Boolean);
}
