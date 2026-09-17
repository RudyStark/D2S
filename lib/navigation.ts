export interface NavItem {
  label: string;
  href: string;
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Accueil", href: "/" },
  { label: "Nos services", href: "/nos-services" },
  { label: "Nos agents IA", href: "/nos-agents-ia" },
  { label: "Études de cas", href: "/etudes-de-cas" },
  { label: "À propos", href: "/a-propos" },
  { label: "Blog", href: "/blog" },
];

export const CONTACT_HREF = "/contact";

/** Placeholder rooms (V1): each will become a zone of the continuous agency. */
export const PLACEHOLDER_PAGES: Record<string, { title: string; kicker: string; text: string }> = {
  "nos-services": {
    kicker: "Nos services",
    title: "Des agents IA pour chaque défi.",
    text: "Cet espace de l’agence est en cours d’aménagement. Bientôt, vous y entrerez directement depuis l’accueil.",
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
    text: "D2S Studio met l’IA au service des gens et des idées qui comptent. Cette page est en préparation.",
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
