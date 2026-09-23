import type { AgentType } from "@/components/experience/agents/agents.config";
import { CHANNELS, type ChannelId, type NeedId } from "./contact-content";
import { buildResult, FEMININE, hoursSentence, type Answers } from "./diagnostic";
import type { MayDraft } from "./may";
import { METHOD_PROMISES, METHOD_STEPS } from "./services";
import { FAQ, lowerFirst } from "./site";
import { TEAM } from "./team";

/*
 * May's free first level, run in the visitor's browser: it understands the usual messages (the four
 * diagnostic answers, a callback, the frequent questions) and answers with texts written from the site's
 * own content. Anything it is not sure about goes to Claude (lib/server/may-agent.ts), which then keeps the
 * conversation. Rule: when in doubt, hand over — a wrong free answer costs more than an API call.
 */

export type Slot = "task" | "time" | "tools" | "process";

export interface MayMemory {
  task?: string;
  time?: string;
  tools?: string[];
  /** The tools question was asked once: an unclear answer then means "none in particular". */
  toolsAsked?: boolean;
  process?: string;
  channel?: ChannelId;
  /** Question May is waiting an answer to. */
  asked?: Slot | "confirm";
  recommended?: { need: NeedId; line: string };
  /** What the visitor told May, in their words (the draft is made of them, nothing invented). */
  said: string[];
}

export type LocalOutcome =
  | { kind: "reply"; text: string; memory: MayMemory; draft?: MayDraft; booking?: boolean }
  | { kind: "ai"; memory: MayMemory };

export const emptyMemory = (): MayMemory => ({ said: [] });

/* ---------- Reading ---------- */

const norm = (s: string) =>
  ` ${s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’']/g, " ")
    .replace(/[^a-z0-9%]+/g, " ")
    .trim()} `;

/** True when the pattern appears without a negation just before it ("pas de prospection"). */
function has(text: string, pattern: RegExp) {
  const re = new RegExp(pattern.source, "g");
  for (const m of text.matchAll(re)) {
    const before = text.slice(Math.max(0, m.index - 24), m.index);
    if (!/\b(pas|sans|ni|plus|jamais)\b[^.]*$/.test(before)) return true;
  }
  return false;
}

const TASKS: [string, RegExp][] = [
  ["content", /\b(contenus?|posts?|publications?|reseaux sociaux|linkedin|instagram|facebook|tiktok|newsletters?|articles?|blog|redaction|rediger|community)\b/],
  ["support", /\b(sav|service client|support|repondre (aux|a nos|a mes) (clients?|demandes|questions|acheteurs|locataires|patients)|demandes? (des |de nos |de mes )?(clients?|acheteurs|locataires)|questions? (des |de nos )?clients?|suivi de commandes?|reclamations?)\b/],
  ["prospection", /\b(prospect\w*|leads?|trouver (des |de nouveaux )?clients|nouveaux clients|relances? commerciales?|rendez vous commerciaux|pipeline|demarchage)\b/],
  ["hr", /\b(recrut\w*|cv|candidat\w*|onboarding|entretiens? d embauche|embauches?|ressources humaines|rh)\b/],
  ["data", /\b(chiffres|reporting|tableaux? de bord|dashboards?|kpi|indicateurs|analyses? de donnees|donnees de vente|statistiques)\b/],
];

const TOOLS: [string, RegExp][] = [
  ["mail", /\b(e ?mails?|mails?|courriels?|boite mail|gmail|outlook)\b/],
  ["chat", /\b(whatsapp|chat|messenger|tchat|site web|notre site|mon site|formulaire du site)\b/],
  ["social", /\b(linkedin|instagram|facebook|reseaux sociaux|tiktok)\b/],
  ["crm", /\b(crm|hubspot|salesforce|pipedrive)\b/],
  ["sheet", /\b(excel|tableurs?|google sheets?|sheets|tableaux?)\b/],
  ["calendar", /\b(agendas?|calendriers?|calendly)\b/],
  ["software", /\b(logiciels?|erp|outils? interne|outils? metier|intranet)\b/],
];

function readTime(t: string): string | undefined {
  const hours = t.match(/\b(\d{1,3})(?:[ ,.]\d)?\s?(?:h|heures?)\b/);
  const days = t.match(/\b(\d|une|un|deux|trois)\s(?:jours?|journees?)\b/);
  let h: number | undefined;
  if (hours) h = Number(hours[1]);
  else if (days) h = ({ une: 1, un: 1, deux: 2, trois: 3 } as Record<string, number>)[days[1]] ?? Number(days[1]);
  if (days && !hours && h !== undefined) h *= 7;
  if (h !== undefined) {
    if (/\b(par|chaque|la|une) (jour|journee)\b/.test(t) && hours) h *= 5;
    if (/\b(par|chaque|le|au) mois\b/.test(t)) h /= 4.33;
    return h < 2 ? "low" : h <= 10 ? "mid" : "high";
  }
  if (/\b(peu|pas beaucoup|pas grand chose|un peu|quelques minutes|rarement)\b/.test(t)) return "low";
  if (/\b(plein temps|temps plein|un poste|toute la journee|toute la semaine|enormement)\b/.test(t)) return "high";
  return undefined;
}

function readProcess(t: string): string | undefined {
  if (/\b(unique|tres specifique|propre a (notre|mon) metier|sur mesure|tres particulier|complexe)\b/.test(t)) return "unique";
  if (/\b(quelques (specificites|regles|particularites)|des regles a (nous|moi)|un peu specifique|quelques exceptions)\b/.test(t)) return "specific";
  if (/\b(classique|standard|rien de (special|particulier|specifique)|comme (tout le monde|les autres)|simple|basique)\b/.test(t)) return "standard";
  return undefined;
}

function readChannel(t: string): ChannelId | undefined {
  if (/\b(visio|zoom|teams|google meet|meet|video)\b/.test(t)) return "visio";
  if (/\b(telephone|appel|appelez|rappelez|tel|portable)\b/.test(t)) return "phone";
  if (/\b(par (e ?)?mail|plutot (e ?)?mail|prefere (le |l )?(e ?)?mail)\b/.test(t)) return "email";
  return undefined;
}

const YES = /^ ?(oui|ok|okay|d accord|dac|volontiers|avec plaisir|allez y|go|parfait|super|carrement|bien sur|preparez|je veux bien|c est bon|ca marche|faites le|vas y)\b/;
const NO = /^ ?(non|non merci|pas maintenant|plus tard|pas encore|je reflechis|pas pour l instant)( .{0,20})? $/;
// A frequent-question answer only fires on an actual question, never on a statement that happens to contain a
// keyword ("création de devis" answers "what takes your time?", it is not a price question).
const QUESTION = /^ ?(combien|comment|quel|quelle|quels|quelles|pourquoi|ou|est ce|c est quoi|qu est ce|avez vous|pouvez vous|faites vous|vous faites|proposez vous|je voudrais savoir|j aimerais savoir|je veux savoir|dites moi|expliquez)\b/;
const GREETING = /^ ?(bonjour|bonsoir|salut|hello|hey|coucou|bjr)( may)?( .{0,12})? $/;

/* ---------- Scripted answers (site content only) ---------- */

const faq = (start: string) => FAQ.find((f) => f.q.startsWith(start))!.a;

const QUESTIONS: Record<Slot, string> = {
  task: "Qu’est-ce qui vous prend le plus de temps aujourd’hui : créer du contenu, répondre à vos clients, trouver de nouveaux clients, recruter, suivre vos chiffres… ?",
  time: "Combien de temps y passez-vous environ chaque semaine, toute l’équipe comprise ?",
  tools: "Où se passe ce travail aujourd’hui : e-mail, WhatsApp ou chat du site, réseaux sociaux, CRM, tableurs, agenda, logiciel métier ?",
  process: "Et votre façon de faire : plutôt classique, avec quelques règles bien à vous, ou vraiment propre à votre métier ?",
};

const INTENTS: { id: string; re: RegExp; answer: () => string }[] = [
  {
    id: "price",
    re: /\b(prix|tarifs?|combien (ca|cela) coute|combien coute|cout|couts|budget|abonnement|coute cher)\b/,
    answer: () =>
      "Le tarif dépend de votre projet : la tâche confiée, les outils à connecter et le niveau de personnalisation. L’équipe vous le chiffre noir sur blanc après un premier échange de 30 minutes, gratuit et sans engagement.",
  },
  {
    id: "method",
    re: /\b(comment (vous )?(travaillez|ca (se passe|marche|fonctionne)|cela fonctionne|se deroule)|votre methode|les etapes|deroulement|mise en place)\b/,
    answer: () =>
      `En quatre étapes : ${METHOD_STEPS.map((s) => `${lowerFirst(s.title)} (${lowerFirst(s.summary.replace(/\.$/, ""))})`).join(", ")}. ${METHOD_PROMISES[0]}, et ${lowerFirst(METHOD_PROMISES[1])}.`,
  },
  {
    id: "agents",
    re: /\b(quels agents|vos agents|votre equipe|les agents|qui sont|liste des agents|vous proposez quoi|que proposez vous)\b/,
    answer: () => `Nous avons cinq agents : ${TEAM.map((t) => `${t.name}, ${lowerFirst(t.role)}`).join(" ; ")}. Et un agent sur mesure quand votre processus est unique.`,
  },
  { id: "control", re: /\b(garder la main|controle|valider|validation|remplacer (mes|nos) (salaries|employes|equipes)|humain)\b/, answer: () => faq("Est-ce que je garde") },
  { id: "custom", re: /\b(sur mesure|personnalise|specifique a (notre|mon))\b/, answer: () => faq("Quand faut-il") },
  { id: "free", re: /\b(gratuit|payant|sans engagement)\b/, answer: () => faq("Le premier rendez-vous") },
  { id: "what", re: /\b(c est quoi|qu est ce qu un) (un )?agent\b/, answer: () => faq("Qu’est-ce qu’un agent IA ?") },
];

const WHICH_AGENT = /\b(quel agent|quels agents pour|lequel choisir|m orienter|conseillez moi|aidez moi a choisir|mon besoin)\b/;
const STARTERS = new Set([" quel agent pour mon besoin ", " comment travaillez vous ", " prendre rendez vous "]);

const CALLBACK = /\b(rappelez moi|recontactez moi|contactez moi|appelez moi|etre (re)?contacte|etre rappele|parler a (un|quelqu un|l equipe)|un humain|un conseiller)\b/;
const BOOKING = /\b(rendez vous|rdv|reserver|reservation|creneau|creneaux|disponibilites|prendre (un )?rdv)\b/;

/* ---------- Conversation ---------- */

const nextSlot = (m: MayMemory): Slot | undefined =>
  !m.task ? "task" : !m.time ? "time" : !m.tools && !m.toolsAsked ? "tools" : !m.process ? "process" : undefined;

function recommendation(m: MayMemory) {
  const answers: Answers = { task: [m.task!], time: [m.time!], tools: m.tools ?? [], process: [m.process!] };
  const r = buildResult(answers);
  const agent = TEAM.find((t) => t.type === r.agent)!;
  const duo = r.duo ? TEAM.find((t) => t.type === (r.duo as AgentType)) : null;
  const hours = `${hoursSentence(r.hours)} (estimation indicative)`;
  const text =
    r.outcome === "custom"
      ? `Votre processus est propre à votre métier : je vous recommande un agent sur mesure, construit autour de vos règles (atelier de cadrage, prototype sur vos cas réels, puis mise en service). ${hours}.`
      : `Je vous recommande ${agent.name}, ${lowerFirst(agent.role)} (${r.percent} % de compatibilité) : « ${agent.blurb} »${r.outcome === "adapted" ? ` ${FEMININE[r.agent] ? "Elle serait entraînée" : "Il serait entraîné"} à vos règles propres.` : ""} ${hours}.${duo ? ` ${duo.name} pourrait l’épauler.` : ""}`;
  const need: NeedId = r.outcome === "custom" ? "custom" : r.agent;
  const line = r.outcome === "custom" ? `Recommandation de May : un agent sur mesure. ${hours}.` : `Recommandation de May : ${agent.name} (${agent.role}). ${hours}.`;
  return { text, need, line };
}

const TASK_NEED: Record<string, NeedId> = { content: "content", support: "support", prospection: "prospection", hr: "automation", data: "data" };

/** The request prepared from what the visitor said (their words, plus May's recommendation if any). */
export function draftOf(m: MayMemory): MayDraft {
  const words = m.said.filter((s) => s.length > 3 && !STARTERS.has(norm(s)) && !GREETING.test(norm(s))).join("\n");
  const message = [words ? `Ce que j’ai expliqué à May :\n${words}` : "Je souhaite être recontacté pour parler de mon projet.", m.recommended?.line]
    .filter(Boolean)
    .join("\n\n")
    .slice(0, 3_800);
  const draft: MayDraft = { need: m.recommended?.need ?? (m.task ? TASK_NEED[m.task] : undefined) ?? "unsure", message };
  if (m.channel) draft.channel = m.channel;
  return draft;
}

const READY = "Votre demande est prête juste en dessous : relisez-la, ajoutez votre e-mail et envoyez-la. L’équipe vous répond sous 24 h ouvrées.";

/**
 * One visitor message. Returns May's scripted reply, or { kind: "ai" } to let Claude take over
 * (with the memory, so Claude starts from what is already known).
 */
export function mayLocal(input: string, previous: MayMemory): LocalOutcome {
  const t = norm(input);
  const m: MayMemory = { ...previous, said: [...previous.said, input.trim()] };
  const ai = (): LocalOutcome => ({ kind: "ai", memory: m });

  // Long or complex messages: Claude reads them better than rules.
  if (input.length > 320 || (input.match(/\?/g)?.length ?? 0) > 1) return ai();

  // Answers to the question May just asked.
  if (m.asked === "confirm") {
    const channel = readChannel(t);
    if (channel) m.channel = channel;
    if (YES.test(t)) return { kind: "reply", text: READY, memory: { ...m, asked: undefined }, draft: draftOf(m) };
    if (NO.test(t)) return { kind: "reply", text: "Pas de souci. Je reste là si vous avez une question sur nos agents ou notre méthode.", memory: { ...m, asked: undefined } };
  }

  const tasks = TASKS.filter(([, re]) => has(t, re)).map(([id]) => id);
  const tools = TOOLS.filter(([, re]) => has(t, re)).map(([id]) => id);
  const time = readTime(t);
  const process = readProcess(t);
  const channel = readChannel(t);
  if (tasks.length === 1 && !m.task) m.task = tasks[0];
  if (time) m.time = time;
  if (process) m.process = process;
  if (channel) m.channel = channel;
  if (tools.length) m.tools = [...new Set([...(m.tools ?? []), ...tools])];

  const callback = has(t, CALLBACK);
  const booking = has(t, BOOKING) && !callback;
  const asking = /\?/.test(input) || QUESTION.test(t);
  const intents = asking ? INTENTS.filter((i) => has(t, i.re)) : [];
  const greeting = GREETING.test(t);
  const which = has(t, WHICH_AGENT) && !tasks.length;
  const understood = tasks.length > 0 || tools.length > 0 || time || process || channel || callback || booking || intents.length > 0 || which;

  // Several priorities at once: ask which one matters most, still for free.
  if (tasks.length > 1 && !m.task) return { kind: "reply", text: "Laquelle de ces tâches vous prend le plus de temps ? On commence par celle-là.", memory: { ...m, asked: "task" } };

  // An answer May expected but could not read: Claude takes over rather than guessing.
  let answered = false;
  if (m.asked && m.asked !== "confirm" && !understood && !greeting) {
    const unsure = /\b(je ne sais pas|ne sais pas|sais pas|aucune idee|aucun|rien|pas d outil)\b/.test(t);
    if (m.asked === "tools" && unsure) m.tools = [];
    else if (m.asked === "process" && unsure) m.process = "standard";
    else return ai();
    answered = true;
  }
  if (!understood && !greeting && !answered) return ai();

  const parts: string[] = [];
  if (greeting && !understood) parts.push("Bonjour ! Je suis May, l’agente d’accueil de D2S AIgency.");
  for (const i of intents.slice(0, 2)) parts.push(i.answer());

  if (callback) {
    return { kind: "reply", text: [...parts, `Je prépare votre demande pour que l’équipe vous ${m.channel === "phone" ? "rappelle" : "recontacte"}. ${READY}`].join("\n\n"), memory: { ...m, asked: undefined }, draft: draftOf(m) };
  }
  if (booking) {
    return { kind: "reply", text: [...parts, "Je regarde les créneaux disponibles de l’équipe."].join("\n\n"), memory: { ...m, asked: undefined }, booking: true };
  }

  if (m.tools === undefined && m.asked === "tools") m.toolsAsked = true;
  const slot = nextSlot(m);
  if (!slot && !m.recommended && m.task) {
    const reco = recommendation(m);
    m.recommended = { need: reco.need, line: reco.line };
    parts.push(reco.text, "Je prépare votre demande pour en parler avec l’équipe ?");
    return { kind: "reply", text: parts.join("\n\n"), memory: { ...m, asked: "confirm" } };
  }
  // Qualification under way (or starting on a first description / greeting): ask the next thing.
  if (slot && (m.task || tasks.length || greeting || which || m.asked)) {
    if (slot === "tools") m.toolsAsked = true;
    parts.push(QUESTIONS[slot]);
    return { kind: "reply", text: parts.join("\n\n"), memory: { ...m, asked: slot } };
  }
  if (parts.length) {
    parts.push(m.recommended ? "Voulez-vous que je prépare votre demande ?" : "Dites-moi ce qui vous prend le plus de temps, je vous oriente vers le bon agent.");
    return { kind: "reply", text: parts.join("\n\n"), memory: { ...m, asked: m.recommended ? "confirm" : "task" } };
  }
  return ai();
}

/** What the free level already knows, handed to Claude when it takes over. */
export function memorySummary(m: MayMemory) {
  const label = (v: string | undefined, map: Record<string, string>) => (v ? (map[v] ?? v) : "inconnu");
  return [
    `tâche : ${label(m.task, { content: "contenu", support: "support client", prospection: "prospection", hr: "RH / recrutement", data: "chiffres / données", other: "autre" })}`,
    `temps par semaine : ${label(m.time, { low: "moins de 2 h", mid: "2 à 10 h", high: "plus de 10 h" })}`,
    `outils : ${m.tools?.length ? m.tools.join(", ") : "inconnus"}`,
    `processus : ${label(m.process, { standard: "classique", specific: "quelques règles propres", unique: "propre au métier" })}`,
    `préférence d’échange : ${m.channel ? CHANNELS.find((c) => c.id === m.channel)!.label : "inconnue"}`,
    m.recommended ? m.recommended.line : "aucune recommandation encore faite",
  ].join(" ; ");
}
