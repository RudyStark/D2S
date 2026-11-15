import { LOGO_SRC } from "@/lib/brand";
import { contactIntroOf } from "@/lib/contact-content";
import type { Locale } from "@/lib/i18n";
import { OFFICE, PUBLISHER, SIRET } from "@/lib/legal";
import { offersOf } from "@/lib/offers";
import { servicesText } from "@/lib/services";
import { abs, SITE_NAME, SITE_URL, siteText } from "@/lib/site";
import { teamOf } from "@/lib/team";
import { moreTeamOf } from "@/lib/team-more";

/*
 * Schema.org description of the agency, read by search engines and AI assistants: who (Organization),
 * where (WebSite / WebPage), what (the offer and the five agents as Services) and the FAQ shown on the page.
 * Everything restates the visible content — nothing here that a visitor cannot read on the site.
 */
const ORG = `${SITE_URL}/#organization`;

const WORDS = {
  fr: {
    plugType: "Agents IA prêts à l’emploi",
    customType: "Conception d’agents IA sur mesure",
    solutionType: "Développement de logiciels IA sur mesure",
    international: "International",
    missions: "Missions",
    colon: " : ",
    slogan: "Votre équipe, augmentée par l’IA.",
    knows: [
      "Intelligence artificielle",
      "Agents IA",
      "Automatisation des processus",
      "Support client automatisé",
      "Prospection commerciale",
      "Recrutement et RH",
      "Création de contenu",
      "Analyse de données",
      "Logiciels IA sur mesure",
      "Applications métier",
      "Orchestration d’agents IA",
    ],
    catalog: "Agents et solutions IA de D2S AIgency",
    contactType: "commercial",
    lang: "fr-FR",
    home: "/",
  },
  en: {
    plugType: "Ready-to-use AI agents",
    customType: "Custom AI agent design",
    solutionType: "Custom AI software development",
    international: "International",
    missions: "Tasks",
    colon: ": ",
    slogan: "Your team, augmented by AI.",
    knows: [
      "Artificial intelligence",
      "AI agents",
      "Process automation",
      "Automated customer support",
      "Sales prospecting",
      "Recruiting and HR",
      "Content creation",
      "Data analysis",
      "Custom AI software",
      "Business applications",
      "AI agent orchestration",
    ],
    catalog: "D2S AIgency AI agents and solutions",
    contactType: "sales",
    lang: "en",
    home: "/en",
  },
};

function graph(locale: Locale) {
  const w = WORDS[locale];
  const site = siteText(locale);
  const { services: SERVICES } = servicesText(locale);
  const TEAM = teamOf(locale);
  const MORE = moreTeamOf(locale);
  const OFFERS = offersOf(locale);
  const france = { "@type": "Country", name: "France" };
  // The organisation and the services are the same in both languages (same ids); the pages are not.
  const page = abs(w.home);
  const services = [
    {
      "@type": "Service",
      "@id": `${SITE_URL}/#service-plug-and-play`,
      name: SERVICES[0].title,
      serviceType: w.plugType,
      description: `${SERVICES[0].text} ${SERVICES[0].benefits.map((b) => `${b.title}${w.colon}${b.text}`).join(" ")}`,
      provider: { "@id": ORG },
      areaServed: { "@type": "Country", name: "France" },
      availableLanguage: ["fr", "en"],
    },
    {
      "@type": "Service",
      "@id": `${SITE_URL}/#service-sur-mesure`,
      name: OFFERS.agent.tag,
      serviceType: w.customType,
      description: `${OFFERS.agent.text} ${OFFERS.agent.points.map((p) => `${p.title}${w.colon}${p.text}`).join(" ")} ${OFFERS.agent.steps.map((s) => s.title).join(", ")}.`,
      provider: { "@id": ORG },
      areaServed: france,
      availableLanguage: ["fr", "en"],
    },
    {
      "@type": "Service",
      "@id": `${SITE_URL}/#service-solutions-ia`,
      name: OFFERS.solutions.tag,
      serviceType: w.solutionType,
      description: OFFERS.solutions.text,
      provider: { "@id": ORG },
      areaServed: [france, { "@type": "Place", name: w.international }],
      availableLanguage: ["fr", "en"],
      hasOfferCatalog: {
        "@type": "OfferCatalog",
        name: OFFERS.solutions.tag,
        itemListElement: OFFERS.solutions.formats.map((f) => ({
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: f.title,
            audience: { "@type": "BusinessAudience", name: f.tag },
            description: `${f.text} ${f.points.join(". ")}.`,
          },
        })),
      },
    },
    ...TEAM.map((agent) => ({
      "@type": "Service",
      "@id": `${SITE_URL}/#agent-${agent.type}`,
      name: `${agent.name}, ${agent.role}`,
      alternateName: agent.name,
      serviceType: agent.role,
      description: `${agent.pitch} ${w.missions}${w.colon}${agent.missions.join(locale === "en" ? "; " : " ; ")}. ${agent.control}`,
      provider: { "@id": ORG },
      availableChannel: agent.channels.map((c) => ({ "@type": "ServiceChannel", name: c })),
    })),
    ...MORE.map((agent) => ({
      "@type": "Service",
      "@id": `${SITE_URL}/#agent-${agent.slug}`,
      name: `${agent.name}, ${agent.role}`,
      alternateName: agent.name,
      serviceType: agent.role,
      description: agent.blurb,
      provider: { "@id": ORG },
    })),
  ];

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": ORG,
        name: SITE_NAME,
        ...(PUBLISHER.legalName ? { legalName: PUBLISHER.legalName } : {}),
        url: SITE_URL,
        logo: { "@type": "ImageObject", url: abs(LOGO_SRC) },
        address: {
          "@type": "PostalAddress",
          streetAddress: OFFICE.street,
          postalCode: OFFICE.postalCode,
          addressLocality: OFFICE.city,
          addressRegion: OFFICE.region,
          addressCountry: OFFICE.country,
        },
        identifier: { "@type": "PropertyValue", propertyID: "SIRET", value: SIRET.replace(/\s/g, "") },
        ...(PUBLISHER.email ? { email: PUBLISHER.email } : {}),
        ...(PUBLISHER.email
          ? { contactPoint: { "@type": "ContactPoint", contactType: w.contactType, email: PUBLISHER.email, url: `${page}#contact`, availableLanguage: ["French", "English"], areaServed: "FR" } }
          : {}),
        ...(PUBLISHER.phone ? { telephone: PUBLISHER.phone } : {}),
        image: abs("/opengraph-image.jpg"),
        description: site.summary,
        slogan: w.slogan,
        knowsAbout: w.knows,
        areaServed: france,
        hasOfferCatalog: {
          "@type": "OfferCatalog",
          name: w.catalog,
          itemListElement: services.map((s) => ({ "@type": "Offer", itemOffered: { "@id": s["@id"] } })),
        },
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: SITE_URL,
        name: SITE_NAME,
        description: site.description,
        inLanguage: ["fr-FR", "en"],
        publisher: { "@id": ORG },
      },
      {
        "@type": "WebPage",
        "@id": `${page}#webpage`,
        url: page,
        name: site.title,
        description: site.description,
        inLanguage: w.lang,
        isPartOf: { "@id": `${SITE_URL}/#website` },
        about: { "@id": ORG },
        primaryImageOfPage: { "@type": "ImageObject", url: abs("/opengraph-image.jpg") },
        potentialAction: { "@type": "CommunicateAction", name: contactIntroOf(locale).title.join(" "), target: `${page}#contact` },
      },
      ...services,
      {
        "@type": "FAQPage",
        "@id": `${page}#faq`,
        inLanguage: w.lang,
        mainEntity: site.faq.map(({ q, a }) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
      },
    ],
  };
}

export function StructuredData({ locale = "fr" }: { locale?: Locale }) {
  // "<" escaped so no text can ever close the script element.
  const json = JSON.stringify(graph(locale)).replace(/</g, "\\u003c");
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
