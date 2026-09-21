import type { AgentType } from "@/components/experience/agents/agents.config";
import { TEAM } from "./team";

/*
 * "Comment choisir votre agent IA ?" — a four-question diagnostic. Every answer moves a live compatibility
 * score for the five agents and for a custom-built agent; the result is one of three outcomes:
 *  - ready:   one of our agents fits as is (plug & play),
 *  - adapted: one of our agents is the right base, trained on the company's own rules,
 *  - custom:  the process is specific enough to deserve an agent built around it.
 * Scores are a transparent heuristic (no data leaves the page); the time saved is an indicative estimate.
 */

export const DIAGNOSTIC_INTRO = {
  kicker: "Comment ça marche",
  title: ["Comment choisir", "votre agent IA ?"],
  lead: "Quatre questions sur votre activité, une minute. Nous vous disons quel agent de l’équipe peut prendre le relais, ou s’il vous faut un agent sur mesure, construit autour de votre métier.",
};

export type Candidate = AgentType | "custom";

export type OptionIcon =
  | "content"
  | "support"
  | "prospection"
  | "hr"
  | "data"
  | "custom"
  | "clock-low"
  | "clock-mid"
  | "clock-high"
  | "mail"
  | "chat"
  | "social"
  | "crm"
  | "sheet"
  | "calendar"
  | "software"
  | "standard"
  | "specific"
  | "unique";

export interface DiagnosticOption {
  id: string;
  label: string;
  hint?: string;
  /** In a sentence ("… avec l’e-mail et LinkedIn"). */
  phrase?: string;
  icon: OptionIcon;
  /** Points added to each candidate when chosen. */
  score: Partial<Record<Candidate, number>>;
}

export interface DiagnosticQuestion {
  id: "task" | "time" | "tools" | "process";
  title: string;
  help: string;
  multiple?: boolean;
  options: DiagnosticOption[];
}

const ALL_AGENTS = (n: number): Partial<Record<Candidate, number>> => ({ content: n, support: n, prospection: n, automation: n, data: n });

export const QUESTIONS: DiagnosticQuestion[] = [
  {
    id: "task",
    title: "Quelle tâche aimeriez-vous déléguer en priorité ?",
    help: "Choisissez celle qui vous coûte le plus de temps aujourd’hui.",
    options: [
      { id: "content", label: "Créer du contenu", hint: "Posts, newsletters, articles", icon: "content", score: { content: 60 } },
      { id: "support", label: "Répondre à vos clients", hint: "Questions, suivi de commande, SAV", icon: "support", score: { support: 60 } },
      { id: "prospection", label: "Trouver des clients", hint: "Prospection, relances, rendez-vous", icon: "prospection", score: { prospection: 60 } },
      { id: "hr", label: "Recruter, accompagner", hint: "CV, entretiens, onboarding", icon: "hr", score: { automation: 60 } },
      { id: "data", label: "Comprendre vos chiffres", hint: "Tableaux de bord, alertes, analyses", icon: "data", score: { data: 60 } },
      { id: "other", label: "Autre chose", hint: "Un processus propre à votre métier", icon: "custom", score: { custom: 60 } },
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
      { id: "mail", label: "E-mail", phrase: "l’e-mail", icon: "mail", score: { support: 8, prospection: 8, automation: 8, content: 5 } },
      { id: "chat", label: "WhatsApp, chat du site", phrase: "WhatsApp, le chat du site", icon: "chat", score: { support: 14, prospection: 5 } },
      { id: "social", label: "LinkedIn, réseaux sociaux", phrase: "LinkedIn", icon: "social", score: { content: 14, prospection: 10 } },
      { id: "crm", label: "CRM", phrase: "votre CRM", icon: "crm", score: { prospection: 12, data: 8, support: 5 } },
      { id: "sheet", label: "Tableurs, reporting", phrase: "vos tableurs", icon: "sheet", score: { data: 14, automation: 4 } },
      { id: "calendar", label: "Agenda", phrase: "votre agenda", icon: "calendar", score: { automation: 10, prospection: 8, content: 4 } },
      { id: "software", label: "Logiciel métier, outil interne", phrase: "votre logiciel métier", icon: "software", score: { custom: 22, data: 4 } },
    ],
  },
  {
    id: "process",
    title: "Comment décririez-vous ce processus ?",
    help: "C’est ce qui décide entre un agent prêt à l’emploi et un agent sur mesure.",
    options: [
      { id: "standard", label: "Classique", hint: "Il ressemble à ce que font la plupart des entreprises.", icon: "standard", score: { ...ALL_AGENTS(14), custom: -10 } },
      { id: "specific", label: "Quelques spécificités", hint: "Des règles à nous, mais le cœur reste standard.", icon: "specific", score: { ...ALL_AGENTS(6), custom: 12 } },
      { id: "unique", label: "Unique à notre métier", hint: "Des règles, des validations et des cas particuliers bien à nous.", icon: "unique", score: { custom: 36 } },
    ],
  },
];

export type Answers = Partial<Record<DiagnosticQuestion["id"], string[]>>;

export const CANDIDATES: Candidate[] = ["content", "support", "prospection", "automation", "data", "custom"];

/** Highest score a candidate can reach (for the live bars). */
const MAX_SCORE = 104;

export function scoreAnswers(answers: Answers): Record<Candidate, number> {
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

/** 0–1 fill of a live bar. */
export const barFill = (score: number) => Math.max(0, Math.min(1, score / MAX_SCORE));

/** Displayed compatibility (same scale as the bar), 0–99 %: it grows as the diagnostic learns more. */
export const matchPercent = (score: number) => Math.round(Math.min(99, barFill(score) * 100));

/** "a", "a et b", "a, b et c". */
export const joinFr = (items: string[]) => (items.length < 2 ? (items[0] ?? "") : `${items.slice(0, -1).join(", ")} et ${items.at(-1)}`);

export type Outcome = "ready" | "adapted" | "custom";

export interface DiagnosticResult {
  outcome: Outcome;
  /** Recommended agent (ready / adapted), or the closest agent to start from (custom). */
  agent: AgentType;
  percent: number;
  /** Time given back per month, indicative (see estimateHours). */
  hours: HoursEstimate;
  /** Chosen tools (options of the "tools" question). */
  tools: DiagnosticOption[];
  task: DiagnosticOption;
  /** Second agent worth pairing with the recommendation, if it scored well enough. */
  duo: AgentType | null;
}

/*
 * Time given back, indicative: declared weekly time × weeks per month × the share of this kind of task an
 * agent typically takes over, reduced when the process has its own rules (validations and special cases
 * stay with people). Shown as a range, rounded, never as a promise.
 */
const WEEKLY_HOURS: Record<string, number> = { low: 1.5, mid: 6, high: 14 };
const WEEKS_PER_MONTH = 4.33;
/** Share of the task an agent typically takes over (low, high), by priority task. */
const AGENT_SHARE: Record<string, [number, number]> = {
  content: [0.45, 0.65],
  support: [0.55, 0.75],
  prospection: [0.4, 0.6],
  hr: [0.4, 0.6],
  data: [0.5, 0.7],
  other: [0.3, 0.5],
};
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

export function estimateHours(answers: Answers): HoursEstimate {
  const weekly = WEEKLY_HOURS[answers.time?.[0] ?? "mid"];
  const share = AGENT_SHARE[answers.task?.[0] ?? "other"] ?? AGENT_SHARE.other;
  const factor = PROCESS_FACTOR[answers.process?.[0] ?? "standard"] ?? 1;
  const base = weekly * WEEKS_PER_MONTH * factor;
  const min = roundHours(base * share[0]);
  const max = Math.max(min, roundHours(base * share[1]));
  return { min, max, days: Math.floor(max / 7), share: [Math.round(share[0] * 100), Math.round(share[1] * 100)] };
}

/** "Entre 10 et 15 h récupérées chaque mois, soit jusqu’à 2 jours de travail". */
export function hoursSentence({ min, max, days }: HoursEstimate) {
  const range = min === max ? `Environ ${min} h` : `Entre ${min} et ${max} h`;
  return `${range} récupérées chaque mois${days >= 1 ? `, soit jusqu’à ${days} jour${days > 1 ? "s" : ""} de travail` : ""}`;
}

export function buildResult(answers: Answers): DiagnosticResult {
  const scores = scoreAnswers(answers);
  const agents = CANDIDATES.filter((c): c is AgentType => c !== "custom").sort((a, b) => scores[b] - scores[a]);
  const best = agents[0];
  const custom = scores.custom;
  const outcome: Outcome = custom >= scores[best] ? "custom" : custom >= 30 ? "adapted" : "ready";
  const task = QUESTIONS[0].options.find((o) => o.id === answers.task?.[0]) ?? QUESTIONS[0].options[0];
  const toolIds = answers.tools ?? [];
  const tools = QUESTIONS[2].options.filter((o) => toolIds.includes(o.id));
  return {
    outcome,
    agent: best,
    percent: matchPercent(outcome === "custom" ? custom : scores[best]),
    hours: estimateHours(answers),
    tools,
    task,
    duo: outcome !== "custom" && scores[agents[1]] >= 25 ? agents[1] : null,
  };
}

/** Tools each agent already works with (option ids of the "tools" question). */
export const AGENT_TOOLS: Record<AgentType, string[]> = {
  content: ["social", "mail", "calendar"],
  support: ["chat", "mail", "crm"],
  prospection: ["mail", "social", "crm", "calendar", "chat"],
  automation: ["mail", "calendar", "sheet"],
  data: ["sheet", "crm", "software"],
};

/** Grammatical gender of each agent's name, for the result sentence. */
export const FEMININE: Record<AgentType, boolean> = {
  content: true,
  support: false,
  prospection: true,
  automation: true,
  data: false,
};

export const CUSTOM_STEPS = [
  { title: "Atelier de cadrage", text: "Une heure avec vous pour cartographier vos règles et vos cas particuliers." },
  { title: "Prototype sur vos cas réels", text: "Un premier agent testé sur vos propres exemples, ajusté avec vous." },
  { title: "Mise en service et suivi", text: "Connecté à vos outils, mesuré, et amélioré en continu." },
];

/** The diagnostic in a few lines, attached to the contact request. */
export function diagnosticSummary(answers: Answers, result: DiagnosticResult) {
  const labels = (id: DiagnosticQuestion["id"]) =>
    QUESTIONS.find((q) => q.id === id)!
      .options.filter((o) => answers[id]?.includes(o.id))
      .map((o) => o.label)
      .join(", ");
  const name = TEAM.find((t) => t.type === result.agent)?.name ?? "";
  const reco =
    result.outcome === "custom"
      ? "Recommandation : agent sur mesure"
      : `Recommandation : ${name} (${result.percent} %)${result.outcome === "adapted" ? ", adapté à vos règles" : ""}`;
  return [
    reco,
    `Priorité : ${labels("task")}`,
    `${labels("time")} par semaine`,
    answers.tools?.length ? `Outils : ${labels("tools")}` : "",
    `Processus : ${labels("process").toLowerCase()}`,
    `Gain estimé : ${result.hours.min === result.hours.max ? `≈ ${result.hours.min}` : `${result.hours.min} à ${result.hours.max}`} h par mois`,
  ].filter(Boolean);
}
