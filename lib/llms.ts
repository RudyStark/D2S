import { CONTACT_INTRO } from "./contact-content";
import { DIAGNOSTIC_INTRO, QUESTIONS } from "./diagnostic";
import { METHOD_PROMISES, METHOD_STEPS, SERVICES, SERVICES_INTRO } from "./services";
import { abs, FAQ, SITE_NAME, SITE_SUMMARY } from "./site";
import { TEAM } from "./team";

/*
 * llms.txt (https://llmstxt.org): the site explained in plain Markdown for AI assistants, generated from the
 * same content as the pages. `full` adds every agent's missions, the method and the FAQ.
 */
export function llmsText({ full }: { full: boolean }) {
  const lines: string[] = [];
  const push = (...l: string[]) => lines.push(...l);

  push(`# ${SITE_NAME}`, "", `> ${SITE_SUMMARY}`, "");
  push(
    "## Pages",
    "",
    `- [Accueil](${abs("/")}) : la visite de l’agence en 3D, puis les services, les agents, le diagnostic, la FAQ et le contact.`,
    `- [Nos services](${abs("/#nos-services")}) : ${SERVICES_INTRO.lead}`,
    `- [Nos agents IA](${abs("/#nos-agents-ia")}) : les cinq agents spécialisés et leurs démonstrations.`,
    `- [Comment choisir votre agent IA](${abs("/#comment-choisir")}) : ${DIAGNOSTIC_INTRO.lead}`,
    `- [Questions fréquentes](${abs("/#questions")})`,
    `- [Contact](${abs("/#contact")}) : ${CONTACT_INTRO.lead}`,
    `- [Mentions légales](${abs("/mentions-legales")})`,
    `- [Politique de confidentialité](${abs("/confidentialite")})`,
    "",
  );
  push("## Services", "");
  for (const s of SERVICES) push(`- **${s.title}** : ${s.text}`);
  push(
    "- **Agent IA sur mesure** : quand un processus a ses propres règles, un agent est construit autour du métier (cadrage, prototype sur cas réels, mise en service, amélioration continue).",
    "",
  );
  push("## Les agents", "");
  for (const a of TEAM) push(`- **${a.name}, ${a.role}** : ${a.blurb}`);
  push("");

  if (full) {
    for (const a of TEAM) {
      push(`### ${a.name}, ${a.role}`, "", a.pitch, "", "Missions :");
      for (const m of a.missions) push(`- ${m}`);
      push("", `Canaux : ${a.channels.join(", ")}.`, `Garde-fou : ${a.control}`, "");
    }
    push("## Méthode", "");
    METHOD_STEPS.forEach((s, i) => push(`${i + 1}. **${s.title}** : ${s.summary} ${s.detail} Ce que vous obtenez : ${s.outcome} Votre rôle : ${s.role}`));
    push("", "Engagements :");
    for (const p of METHOD_PROMISES) push(`- ${p}`);
    push("", "## Le diagnostic « Comment choisir votre agent IA ? »", "");
    for (const q of QUESTIONS) push(`- ${q.title} (${q.options.map((o) => o.label).join(", ")})`);
    push("", "Résultat : un agent de l’équipe tel quel, le même agent adapté à vos règles, ou un agent sur mesure, avec une estimation indicative du temps récupéré.", "");
    push("## Questions fréquentes", "");
    for (const { q, a } of FAQ) push(`### ${q}`, "", a, "");
  } else {
    push("## Pour aller plus loin", "", `- [Version complète : missions de chaque agent, méthode, FAQ](${abs("/llms-full.txt")})`, "");
  }
  return lines.join("\n");
}
