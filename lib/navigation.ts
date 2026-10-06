import type { Locale } from "./i18n";

export interface NavItem {
  label: string;
  href: string;
  /** The home page section it scrolls to (when on the home page). */
  section?: string;
}

/*
 * The menu only lists what the site actually holds today: the three sections of the home page and the
 * diagnostic. À propos keeps its URL but stays out of the menu until it exists (no visitor should land on a
 * page that says "en cours d'aménagement"). Études de cas and Blog will never exist: their URLs return a 404.
 */
export const NAV_ITEMS: NavItem[] = [
  { label: "Accueil", href: "/" },
  { label: "Nos services", href: "/nos-services", section: "nos-services" },
  { label: "Nos agents IA", href: "/nos-agents-ia", section: "nos-agents-ia" },
  { label: "Comment choisir", href: "/comment-choisir", section: "comment-choisir" },
];

const NAV_ITEMS_EN: NavItem[] = [
  { label: "Home", href: "/en" },
  { label: "Our services", href: "/en/services", section: "nos-services" },
  { label: "Our AI agents", href: "/en/ai-agents", section: "nos-agents-ia" },
  { label: "How to choose", href: "/en/how-to-choose", section: "comment-choisir" },
];

export const navItemsOf = (locale: Locale) => (locale === "en" ? NAV_ITEMS_EN : NAV_ITEMS);

/** The form lives at the end of the home page (lib/contact); /contact redirects there. */
export const CONTACT_HREF = "/#contact";
export const contactHrefOf = (locale: Locale) => (locale === "en" ? "/en#contact" : CONTACT_HREF);
/** The home page of a language. */
export const homeOf = (locale: Locale) => (locale === "en" ? "/en" : "/");

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
  "a-propos": {
    kicker: "À propos",
    title: "L’IA, plus humaine, plus utile.",
    text: "D2S AIgency met l’IA au service des gens et des idées qui comptent. Cette page est en préparation.",
  },
  contact: {
    kicker: "Parlons de votre projet",
    title: "Un projet ? Une idée ? Parlons-en.",
    text: "Le formulaire de contact arrive très bientôt dans cette version du site.",
  },
};

/** The English rooms (same rooms, English addresses: lib/i18n maps them to the French ones). */
export const PLACEHOLDER_PAGES_EN: Record<string, { title: string; kicker: string; text: string; fr: string }> = {
  services: {
    fr: "nos-services",
    kicker: "Our services",
    title: "An AI agent for every challenge.",
    text: "This part of the agency is being fitted out. Soon you will walk in straight from the reception.",
  },
  "how-to-choose": {
    fr: "comment-choisir",
    kicker: "How it works",
    title: "How to choose your AI agent?",
    text: "The diagnostic is on the home page, right after the team.",
  },
  "ai-agents": {
    fr: "nos-agents-ia",
    kicker: "Our AI agents",
    title: "Meet the team.",
    text: "Automation, customer support, prospecting, content creation, data analysis: every agent will soon have its own office.",
  },
  about: {
    fr: "a-propos",
    kicker: "About",
    title: "AI, more human, more useful.",
    text: "D2S AIgency puts AI to work for the people and ideas that matter. This page is in preparation.",
  },
  contact: {
    fr: "contact",
    kicker: "Let’s talk about your project",
    title: "A project? An idea? Let’s talk.",
    text: "The contact form is coming very soon to this version of the site.",
  },
};
