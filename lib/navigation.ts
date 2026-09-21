export interface NavItem {
  label: string;
  href: string;
}

/*
 * The menu only lists what the site actually holds today: the three sections of the home page and the
 * diagnostic. Études de cas, À propos and Blog keep their URLs but stay out of the menu until they exist
 * (no visitor should land on a page that says "en cours d'aménagement").
 */
export const NAV_ITEMS: NavItem[] = [
  { label: "Accueil", href: "/" },
  { label: "Nos services", href: "/nos-services" },
  { label: "Nos agents IA", href: "/nos-agents-ia" },
  { label: "Comment choisir", href: "/comment-choisir" },
];

/** The form lives at the end of the home page (lib/contact); /contact redirects there. */
export const CONTACT_HREF = "/#contact";

/** Placeholder rooms (V1): each will become a zone of the continuous agency. */
export const PLACEHOLDER_PAGES: Record<string, { title: string; kicker: string; text: string }> = {
  "nos-services": {
    kicker: "Nos services",
    title: "Des agents IA pour chaque défi.",
    text: "Cet espace de l’agence est en cours d’aménagement. Bientôt, vous y entrerez directement depuis l’accueil.",
  },
  "comment-choisir": {
    kicker: "Comment ça marche",
    title: "Comment choisir votre agent IA ?",
    text: "Le diagnostic se trouve sur la page d’accueil, juste après la présentation de l’équipe.",
  },
  "nos-agents-ia": {
    kicker: "Nos agents IA",
    title: "Rencontrez l’équipe.",
    text: "Automatisation, support client, prospection, création de contenu, analyse de données : chaque agent aura bientôt son bureau.",
  },
  "etudes-de-cas": {
    kicker: "Études de cas",
    title: "Des résultats concrets.",
    text: "Nos études de cas arrivent. En attendant, parlons de votre projet.",
  },
  "a-propos": {
    kicker: "À propos",
    title: "L’IA, plus humaine, plus utile.",
    text: "D2S AIgency met l’IA au service des gens et des idées qui comptent. Cette page est en préparation.",
  },
  blog: {
    kicker: "Blog",
    title: "Idées, agents, impact.",
    text: "Les premiers articles sont en cours d’écriture.",
  },
  contact: {
    kicker: "Parlons de votre projet",
    title: "Un projet ? Une idée ? Parlons-en.",
    text: "Le formulaire de contact arrive très bientôt dans cette version du site.",
  },
};
