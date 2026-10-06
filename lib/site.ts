import type { Locale } from "./i18n";
import { METHOD_PROMISES, METHOD_STEPS, SERVICES, servicesText } from "./services";
import { TEAM, teamOf } from "./team";
import { MORE_TEAM, moreTeamOf } from "./team-more";

/*
 * Site identity for search engines and AI assistants (metadata, JSON-LD, sitemap, robots, llms.txt).
 * SITE_URL must be the production domain (NEXT_PUBLIC_SITE_URL): canonical URLs and share previews use it.
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3217").replace(/\/$/, "");
export const SITE_NAME = "D2S AIgency";
export const SITE_TITLE = "D2S AIgency — Agence IA : agents IA sur mesure pour votre entreprise";
export const SITE_DESCRIPTION =
  "D2S AIgency, agence IA en Île-de-France : 16 agents IA prêts à l’emploi ou sur mesure pour la prospection, le support client, le contenu et la gestion.";
/** One paragraph an assistant can quote as is. */
export const SITE_SUMMARY =
  "D2S AIgency est une agence d’intelligence artificielle basée aux Pavillons-sous-Bois, en Île-de-France, qui conçoit, connecte et fait évoluer des agents IA pour les entreprises. Ses cinq agents phares (Déa pour le contenu, Loic pour le support client, May pour la prospection, Diva pour les RH et Morgan pour l’analyse de données) et onze autres experts (vente, marketing, gestion, pilotage) travaillent dans les outils existants de l’entreprise, 24h/24, et laissent toujours la décision aux équipes. Quand un processus est propre au métier, D2S AIgency construit un agent sur mesure. Le premier échange, de 30 minutes, est gratuit et sans engagement.";

/** "Support client IA" → "support client IA" (only the first letter; a leading acronym such as "AI" is kept). */
export const lowerFirst = (s: string) => (/^[A-Z]{2}/.test(s) ? s : s.charAt(0).toLowerCase() + s.slice(1));

export const abs = (path = "/") => `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;

/** Questions people (and assistants) actually ask; every answer restates what the site already says. */
export const FAQ: { q: string; a: string }[] = [
  {
    q: "Qu’est-ce qu’un agent IA ?",
    a: "Un agent IA est un assistant logiciel qui prend en charge une tâche répétitive de bout en bout : répondre aux clients, relancer des prospects, trier des candidatures, rédiger des contenus ou expliquer des chiffres. Chez D2S AIgency, chaque agent travaille dans vos outils existants et vous laisse toujours le dernier mot.",
  },
  {
    q: "Qu’est-ce qu’un agent IA Plug & Play ?",
    a: `${SERVICES[0].text} Ils sont pré-entraînés à votre métier, connectés à votre messagerie, votre CRM, votre agenda ou vos documents, et ne demandent aucune ligne de code de votre côté.`,
  },
  {
    q: "Quels agents IA propose D2S AIgency ?",
    a: `Seize agents, chacun expert de son métier. Cinq agents phares : ${TEAM.map((t) => `${t.name}, ${lowerFirst(t.role.replace(/ IA$/, ""))} (${lowerFirst(t.blurb.replace(/\.$/, ""))})`).join(" ; ")}. Et onze autres : ${MORE_TEAM.map((m) => `${m.name}, ${lowerFirst(m.role)}`).join(" ; ")}.`,
  },
  {
    q: "Comment choisir le bon agent IA pour mon entreprise ?",
    a: "Le diagnostic « Comment choisir votre agent IA ? » pose quelques questions : le domaine puis la tâche précise à déléguer, le temps qu’elle prend chaque semaine, les outils utilisés et la spécificité du processus. Il recommande, parmi les seize agents de l’équipe, le plus adapté et celui qui le complète, le même agent entraîné à vos règles, ou un agent sur mesure, avec une estimation indicative du temps récupéré chaque mois.",
  },
  {
    q: "Quand faut-il un agent IA sur mesure ?",
    a: "Quand votre processus a ses propres règles, validations et cas particuliers. D2S AIgency construit alors un agent autour de votre métier : atelier de cadrage, prototype testé sur vos cas réels, puis mise en service, mesure et amélioration continue.",
  },
  {
    q: "Comment se déroule un projet avec D2S AIgency ?",
    a: `En quatre étapes : ${METHOD_STEPS.map((s) => `${lowerFirst(s.title)} (${lowerFirst(s.summary.replace(/\.$/, ""))})`).join(", ")}. ${METHOD_PROMISES.join(". ")}.`,
  },
  {
    q: "Est-ce que je garde le contrôle sur ce que font les agents ?",
    a: "Oui. Rien n’est mis en service sans votre feu vert, vous validez les contenus avant publication, les cas sensibles et les affaires importantes reviennent à vos équipes, et les décisions (par exemple de recrutement) restent entre vos mains.",
  },
  {
    q: "Le premier rendez-vous est-il payant ?",
    a: "Non. Le premier échange dure 30 minutes, il est gratuit et sans engagement : vous repartez avec une idée claire de ce qu’un agent IA peut faire pour votre entreprise.",
  },
];

/* ——— English ——— */

const SITE_TITLE_EN = "D2S AIgency — AI agency: custom AI agents for your business";
const SITE_DESCRIPTION_EN =
  "D2S AIgency, an AI agency near Paris: 16 ready-to-use or custom AI agents for prospecting, customer support, content and back-office work.";
const SITE_SUMMARY_EN =
  "D2S AIgency is an artificial intelligence agency based in Les Pavillons-sous-Bois, near Paris (Île-de-France, France), that designs, connects and keeps improving AI agents for businesses. Its five flagship agents (Déa for content, Loic for customer support, May for prospecting, Diva for HR and Morgan for data analysis) and eleven more experts (sales, marketing, operations, management) work in the company’s existing tools, 24/7, and always leave the decision to its teams. When a process is specific to the business, D2S AIgency builds a custom agent. The first 30-minute call is free and with no commitment.";

function faqEn() {
  const { services, steps, promises } = servicesText("en");
  const team = teamOf("en");
  const more = moreTeamOf("en");
  return [
    {
      q: "What is an AI agent?",
      a: "An AI agent is a software assistant that takes care of a repetitive task from start to finish: answering customers, following up with prospects, sorting applications, writing content or explaining figures. At D2S AIgency, every agent works in your existing tools and always leaves you the final say.",
    },
    {
      q: "What is a Plug & Play AI agent?",
      a: `${services[0].text} They are pre-trained for your trade, connected to your messaging, your CRM, your calendar or your documents, and require no code on your side.`,
    },
    {
      q: "Which AI agents does D2S AIgency offer?",
      a: `Sixteen agents, each an expert in its trade. Five flagship agents: ${team.map((t) => `${t.name}, ${lowerFirst(t.role.replace(/^AI /, ""))} (${lowerFirst(t.blurb.replace(/\.$/, ""))})`).join("; ")}. And eleven more: ${more.map((m) => `${m.name}, ${lowerFirst(m.role)}`).join("; ")}.`,
    },
    {
      q: "How do I choose the right AI agent for my business?",
      a: "The “How to choose your AI agent?” diagnostic asks a few questions: the area, then the precise task to hand over, the time it takes each week, the tools you use and how specific the process is. It recommends, among the sixteen agents of the team, the best fit and the one that complements it, the same agent trained on your rules, or a custom agent, with an indicative estimate of the time saved each month.",
    },
    {
      q: "When do I need a custom AI agent?",
      a: "When your process has its own rules, approvals and special cases. D2S AIgency then builds an agent around your business: a scoping workshop, a prototype tested on your real cases, then go-live, measurement and continuous improvement.",
    },
    {
      q: "How does a project with D2S AIgency work?",
      a: `In four steps: ${steps.map((st) => `${lowerFirst(st.title)} (${lowerFirst(st.summary.replace(/\.$/, ""))})`).join(", ")}. ${promises.join(". ")}.`,
    },
    {
      q: "Do I stay in control of what the agents do?",
      a: "Yes. Nothing goes live without your go-ahead, you approve content before it is published, sensitive cases and big deals go back to your teams, and decisions (hiring, for example) stay in your hands.",
    },
    {
      q: "Is the first meeting paid?",
      a: "No. The first call lasts 30 minutes, it is free and with no commitment: you leave with a clear idea of what an AI agent can do for your business.",
    },
  ];
}

const KEYWORDS_FR = [
  "agence IA",
  "agent IA",
  "agents IA pour entreprise",
  "agent IA sur mesure",
  "automatisation IA",
  "IA support client",
  "IA prospection commerciale",
  "IA recrutement RH",
  "IA création de contenu",
  "IA analyse de données",
];
const KEYWORDS_EN = [
  "AI agency",
  "AI agents",
  "custom AI agent",
  "AI for business",
  "AI automation",
  "AI customer support",
  "AI sales prospecting",
  "AI content creation",
  "AI agency Paris",
];

const FAQ_EN = faqEn();

/** Identity of the site in a language (metadata, JSON-LD, FAQ). */
export const siteText = (locale: Locale) =>
  locale === "en"
    ? { title: SITE_TITLE_EN, description: SITE_DESCRIPTION_EN, summary: SITE_SUMMARY_EN, keywords: KEYWORDS_EN, faq: FAQ_EN }
    : { title: SITE_TITLE, description: SITE_DESCRIPTION, summary: SITE_SUMMARY, keywords: KEYWORDS_FR, faq: FAQ };
