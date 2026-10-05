/*
 * The site's two languages. French stays at the root (d2saigency.com, nothing moves for search engines), English lives
 * under /en (d2saigency.com/en), with hreflang between them. Pure: shared by the server and the browser.
 */

export type Locale = "fr" | "en";
export const LOCALES: Locale[] = ["fr", "en"];
export const DEFAULT_LOCALE: Locale = "fr";

/** The pages whose address changes with the language (the home page and its sections only gain « /en »). */
const PAGES: { fr: string; en: string }[] = [
  { fr: "/mentions-legales", en: "/en/legal-notice" },
  { fr: "/confidentialite", en: "/en/privacy" },
  { fr: "/a-propos", en: "/en/about" },
  { fr: "/nos-services", en: "/en/services" },
  { fr: "/nos-agents-ia", en: "/en/ai-agents" },
  { fr: "/comment-choisir", en: "/en/how-to-choose" },
  { fr: "/contact", en: "/en/contact" },
];

/** The language of an address. */
export const localeOf = (path: string): Locale => (path === "/en" || path.startsWith("/en/") || path.startsWith("/en#") || path.startsWith("/en?") ? "en" : "fr");

/** A French address written for the given language: « / » → « /en », « /#contact » → « /en#contact ». */
export function localize(path: string, locale: Locale): string {
  if (locale === "fr") return path;
  const [base, hash = ""] = path.split("#");
  const page = PAGES.find((p) => p.fr === base);
  if (page) return page.en + (hash ? `#${hash}` : "");
  if (base === "" || base === "/") return `/en${hash ? `#${hash}` : ""}`;
  return `/en${base}${hash ? `#${hash}` : ""}`;
}

/** The same page in the other language (the language switch): the section you are on is kept. */
export function counterpart(path: string, hash: string, to: Locale): string {
  const from = localeOf(path);
  if (from === to) return path + hash;
  if (to === "en") return localize(path, "en") + hash;
  const page = PAGES.find((p) => p.en === path);
  if (page) return page.fr + hash;
  const fr = path.replace(/^\/en(?=\/|$)/, "") || "/";
  return fr + hash;
}

/** The hreflang alternates of a page (its French address). */
export const alternates = (frPath: string) => ({ fr: frPath, en: localize(frPath, "en"), "x-default": frPath });
