import { CONTACT_INTRO } from "./contact-content";
import { DIAGNOSTIC_INTRO, QUESTIONS } from "./diagnostic";
import { offersOf } from "./offers";
import { METHOD_PROMISES, METHOD_STEPS, SERVICES, SERVICES_INTRO } from "./services";
import { abs, FAQ, SITE_NAME, SITE_SUMMARY } from "./site";
import { TEAM } from "./team";
import { MORE_TEAM, POLES } from "./team-more";

/*
 * llms.txt (https://llmstxt.org): the site explained in plain Markdown for AI assistants, generated from the
 * same content as the pages. `full` adds every agent's missions, the method and the FAQ.
 */
export function llmsText({ full }: { full: boolean }) {
  const lines: string[] = [];
  const push = (...l: string[]) => lines.push(...l);
  const O = offersOf("fr");

  push(`# ${SITE_NAME}`, "", `> ${SITE_SUMMARY}`, "");
  push(
    "## Pages",
    "",
    `- [Accueil](${abs("/")}) : la visite de l’agence en 3D, puis les services, les agents, l’offre sur mesure, la méthode, le diagnostic, la FAQ et le contact.`,
    `- [Nos services](${abs("/#nos-services")}) : ${SERVICES_INTRO.lead}`,
    `- [Nos agents IA](${abs("/#nos-agents-ia")}) : les cinq agents phares, les onze autres experts de l’équipe et leurs démonstrations.`,
    `- [Sur mesure](${abs("/#sur-mesure")}) : ${O.intro.lead}`,
    `- [Comment choisir votre agent IA](${abs("/#comment-choisir")}) : ${DIAGNOSTIC_INTRO.lead}`,
    `- [Questions fréquentes](${abs("/#questions")})`,
    `- [Contact](${abs("/#contact")}) : ${CONTACT_INTRO.lead}`,
    `- [Mentions légales](${abs("/mentions-legales")})`,
    `- [Politique de confidentialité](${abs("/confidentialite")})`,
    `- [English version](${abs("/en")}) : the same site in English (${abs("/en/legal-notice")}, ${abs("/en/privacy")}).`,
    "",
  );
  push("## Services", "", "Trois façons de travailler avec D2S AIgency :", "");
  for (const c of O.cards) push(`${c.index}. **${c.title}** : ${c.text} ${c.fit}`);
  push("");
  for (const s of SERVICES) push(`### ${s.title}`, "", s.text, "");
  push(`### ${O.agent.tag}`, "", O.agent.text, "");
  for (const pt of O.agent.points) push(`- ${pt.title} : ${pt.text}`);
  push("", `Étapes : ${O.agent.steps.map((st) => `${st.title} (${st.text.replace(/\.$/, "")})`).join(", ")}.`, "");
  push(`### ${O.solutions.tag}`, "", O.solutions.text, "");
  for (const f of O.solutions.formats) {
    push(`- **${f.title}** (${f.tag}) : ${f.text}`);
    for (const pt of f.points) push(`  - ${pt}`);
  }
  push("");
  push("## Les agents", "", "Cinq agents phares :", "");
  for (const a of TEAM) push(`- **${a.name}, ${a.role}** : ${a.blurb}`);
  push("", "Onze autres experts, par pôle :", "");
  for (const pole of POLES) {
    for (const a of MORE_TEAM.filter((m) => m.pole === pole.id)) push(`- **${a.name}, ${a.role}** (${pole.label}) : ${a.blurb}`);
  }
  push("");

  if (full) {
    for (const a of TEAM) {
      push(`### ${a.name}, ${a.role}`, "", a.pitch, "", "Missions :");
      for (const m of a.missions) push(`- ${m}`);
      push("", `Canaux : ${a.channels.join(", ")}.`, `Garde-fou : ${a.control}`, "");
    }
    for (const a of MORE_TEAM) {
      push(`### ${a.name}, ${a.role}`, "", a.pitch, "", "Missions :");
      for (const m of a.missions) push(`- ${m}`);
      push("", `Canaux : ${a.channels.join(", ")}.`, `Garde-fou : ${a.control}`, "");
    }
    push("## Méthode", "");
    METHOD_STEPS.forEach((s, i) => push(`${i + 1}. **${s.title}** : ${s.summary} ${s.detail} Ce que vous obtenez : ${s.outcome} Votre rôle : ${s.role}`));
    push("", "Engagements :");
    for (const p of METHOD_PROMISES) push(`- ${p}`);
    push("", "## Le diagnostic « Comment choisir votre agent IA ? »", "");
    push("- Que voulez-vous confier à l’IA ? (Une tâche précise, Tout le quotidien de mon métier, Plusieurs services ou équipes)");
    push("  - Tout un métier ou plusieurs services : taille de la structure puis ce que la solution doit réunir ; résultat : une application métier IA ou un centre de pilotage IA (solutions IA sur mesure).");
    push("  - Une tâche précise :");
    for (const q of QUESTIONS) push(`    - ${q.title} (${q.options.map((o) => o.label).join(", ")})`);
    push("", "Résultat : un agent de l’équipe tel quel, le même agent adapté à vos règles, ou un agent sur mesure, avec une estimation indicative du temps récupéré.", "");
    push("## Questions fréquentes", "");
    for (const { q, a } of FAQ) push(`### ${q}`, "", a, "");
  } else {
    push("## Pour aller plus loin", "", `- [Version complète : missions de chaque agent, méthode, FAQ](${abs("/llms-full.txt")})`, "");
  }
  return lines.join("\n");
}
