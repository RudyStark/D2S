import { LOGO_SRC } from "@/lib/brand";
import { CONTACT_INTRO } from "@/lib/contact-content";
import { OFFICE, PUBLISHER, SIRET } from "@/lib/legal";
import { SERVICES } from "@/lib/services";
import { abs, FAQ, SITE_DESCRIPTION, SITE_NAME, SITE_SUMMARY, SITE_TITLE, SITE_URL } from "@/lib/site";
import { TEAM } from "@/lib/team";

/*
 * Schema.org description of the agency, read by search engines and AI assistants: who (Organization),
 * where (WebSite / WebPage), what (the offer and the five agents as Services) and the FAQ shown on the page.
 * Everything restates the visible content — nothing here that a visitor cannot read on the site.
 */
const ORG = `${SITE_URL}/#organization`;

function graph() {
  const services = [
    {
      "@type": "Service",
      "@id": `${SITE_URL}/#service-plug-and-play`,
      name: SERVICES[0].title,
      serviceType: "Agents IA prêts à l’emploi",
      description: `${SERVICES[0].text} ${SERVICES[0].benefits.map((b) => `${b.title} : ${b.text}`).join(" ")}`,
      provider: { "@id": ORG },
      areaServed: { "@type": "Country", name: "France" },
      availableLanguage: "fr",
    },
    {
      "@type": "Service",
      "@id": `${SITE_URL}/#service-sur-mesure`,
      name: "Agent IA sur mesure",
      serviceType: "Conception d’agents IA sur mesure",
      description:
        "Un agent IA construit autour des règles, des validations et des cas particuliers de votre métier : atelier de cadrage, prototype testé sur vos cas réels, mise en service, mesure et amélioration continue.",
      provider: { "@id": ORG },
      areaServed: { "@type": "Country", name: "France" },
      availableLanguage: "fr",
    },
    ...TEAM.map((agent) => ({
      "@type": "Service",
      "@id": `${SITE_URL}/#agent-${agent.type}`,
      name: `${agent.name}, ${agent.role}`,
      alternateName: agent.name,
      serviceType: agent.role,
      description: `${agent.pitch} Missions : ${agent.missions.join(" ; ")}. ${agent.control}`,
      provider: { "@id": ORG },
      availableChannel: agent.channels.map((c) => ({ "@type": "ServiceChannel", name: c })),
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
        ...(PUBLISHER.phone ? { telephone: PUBLISHER.phone } : {}),
        image: abs("/opengraph-image.jpg"),
        description: SITE_SUMMARY,
        slogan: "Votre équipe, augmentée par l’IA.",
        knowsAbout: [
          "Intelligence artificielle",
          "Agents IA",
          "Automatisation des processus",
          "Support client automatisé",
          "Prospection commerciale",
          "Recrutement et RH",
          "Création de contenu",
          "Analyse de données",
        ],
        areaServed: { "@type": "Country", name: "France" },
        hasOfferCatalog: {
          "@type": "OfferCatalog",
          name: "Agents IA de D2S AIgency",
          itemListElement: services.map((s) => ({ "@type": "Offer", itemOffered: { "@id": s["@id"] } })),
        },
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: SITE_URL,
        name: SITE_NAME,
        description: SITE_DESCRIPTION,
        inLanguage: "fr-FR",
        publisher: { "@id": ORG },
      },
      {
        "@type": "WebPage",
        "@id": `${SITE_URL}/#webpage`,
        url: SITE_URL,
        name: SITE_TITLE,
        description: SITE_DESCRIPTION,
        inLanguage: "fr-FR",
        isPartOf: { "@id": `${SITE_URL}/#website` },
        about: { "@id": ORG },
        primaryImageOfPage: { "@type": "ImageObject", url: abs("/opengraph-image.jpg") },
        potentialAction: { "@type": "CommunicateAction", name: CONTACT_INTRO.title.join(" "), target: abs("/#contact") },
      },
      ...services,
      {
        "@type": "FAQPage",
        "@id": `${SITE_URL}/#faq`,
        inLanguage: "fr-FR",
        mainEntity: FAQ.map(({ q, a }) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
      },
    ],
  };
}

export function StructuredData() {
  // "<" escaped so no text can ever close the script element.
  const json = JSON.stringify(graph()).replace(/</g, "\\u003c");
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
