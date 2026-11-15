import type { Metadata, ResolvingMetadata, Viewport } from "next";
import type { Locale } from "./i18n";
import { alternates } from "./i18n";
import { SITE_NAME, SITE_URL, siteText } from "./site";

/** The site-wide metadata of a language (each root layout), and its pages' hreflang alternates. */
export function rootMetadata(locale: Locale): Metadata {
  const t = siteText(locale);
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: t.title, template: `%s — ${SITE_NAME}` },
    description: t.description,
    applicationName: SITE_NAME,
    keywords: t.keywords,
    authors: [{ name: SITE_NAME, url: SITE_URL }],
    creator: SITE_NAME,
    publisher: SITE_NAME,
    category: "technology",
    alternates: { canonical: locale === "en" ? "/en" : "/", languages: alternates("/") },
    openGraph: {
      type: "website",
      locale: locale === "en" ? "en_US" : "fr_FR",
      alternateLocale: locale === "en" ? ["fr_FR"] : ["en_US"],
      url: locale === "en" ? "/en" : "/",
      siteName: SITE_NAME,
      title: t.title,
      description: t.description,
    },
    twitter: { card: "summary_large_image", title: t.title, description: t.description },
    robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 } },
    formatDetection: { telephone: false, email: false, address: false },
  };
}

/** A page's canonical address and its counterpart in the other language. */
export const pageAlternates = (frPath: string, locale: Locale): Metadata["alternates"] => ({
  canonical: alternates(frPath)[locale],
  languages: alternates(frPath),
});

export const rootViewport: Viewport = {
  themeColor: "#eef3f9",
  width: "device-width",
  initialScale: 1,
};

/**
 * Full metadata of an inner page: title, description, canonical + hreflang, and its own Open Graph / Twitter
 * card (url, title, description). A page that defines openGraph replaces the layout's whole object, the
 * share image included, so the layout's images are carried over from the parent.
 */
export async function pageMetadata(
  { frPath, locale, title, description }: { frPath: string; locale: Locale; title: string; description: string },
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const { openGraph, twitter } = await parent;
  const url = alternates(frPath)[locale];
  const full = `${title} — ${SITE_NAME}`;
  return {
    title,
    description,
    alternates: pageAlternates(frPath, locale),
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      locale: locale === "en" ? "en_US" : "fr_FR",
      url,
      title: full,
      description,
      ...(openGraph?.images?.length ? { images: openGraph.images } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: full,
      description,
      ...(twitter?.images?.length ? { images: twitter.images } : {}),
    },
  };
}
