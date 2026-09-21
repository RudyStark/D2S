import { METHOD_PROMISES, METHOD_STEPS, SERVICES } from "./services";
import { TEAM } from "./team";

/*
 * Site identity for search engines and AI assistants (metadata, JSON-LD, sitemap, robots, llms.txt).
 * SITE_URL must be the production domain (NEXT_PUBLIC_SITE_URL): canonical URLs and share previews use it.
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3217").replace(/\/$/, "");
export const SITE_NAME = "D2S AIgency";
export const SITE_TITLE = "D2S AIgency — Agence IA : agents IA sur mesure pour votre entreprise";
export const SITE_DESCRIPTION =
  "D2S AIgency conçoit et déploie des agents IA pour les entreprises : création de contenu, support client, prospection, RH et analyse de données. Prêts à l’emploi ou sur mesure, connectés à vos outils.";
/** One paragraph an assistant can quote as is. */
export const SITE_SUMMARY =
  "D2S AIgency est une agence d’intelligence artificielle basée aux Pavillons-sous-Bois, en Île-de-France, qui conçoit, connecte et fait évoluer des agents IA pour les entreprises. Ses cinq agents spécialisés (Déa pour le contenu, Loic pour le support client, May pour la prospection, Diva pour les RH et Morgan pour l’analyse de données) travaillent dans les outils existants de l’entreprise, 24h/24, et laissent toujours la décision aux équipes. Quand un processus est propre au métier, D2S AIgency construit un agent sur mesure. Le premier échange, de 30 minutes, est gratuit et sans engagement.";

/** "Support client IA" → "support client IA" (only the first letter: acronyms keep their capitals). */
export const lowerFirst = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

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
    a: `Cinq agents spécialisés : ${TEAM.map((t) => `${t.name}, ${lowerFirst(t.role.replace(/ IA$/, ""))} (${lowerFirst(t.blurb.replace(/\.$/, ""))})`).join(" ; ")}.`,
  },
  {
    q: "Comment choisir le bon agent IA pour mon entreprise ?",
    a: "Le diagnostic « Comment choisir votre agent IA ? » pose quatre questions : la tâche à déléguer, le temps qu’elle prend chaque semaine, les outils utilisés et la spécificité du processus. Il recommande l’agent de l’équipe le plus adapté, le même agent entraîné à vos règles, ou un agent sur mesure, avec une estimation indicative du temps récupéré chaque mois.",
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
