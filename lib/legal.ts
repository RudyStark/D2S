/*
 * Legal information shown on /mentions-legales and /confidentialite.
 * Every `null` is rendered as a visible "À compléter" marker: the company details are not invented here.
 * Fill them before going live, then have both pages reviewed (they describe what the site really does).
 */

export const LEGAL_UPDATED = "24 octobre 2026";

/** Registered office (given by the client, 21/09): also used for the local structured data. */
export const OFFICE = {
  street: "25 avenue Georges Pompidou",
  postalCode: "93320",
  city: "Les Pavillons-sous-Bois",
  region: "Île-de-France",
  country: "FR",
};

export const SIRET = "539 068 098 00026";

export const PUBLISHER = {
  brand: "D2S AIgency",
  /** Raison sociale exacte (Kbis). */
  legalName: "D2S Studio" as string | null,
  /** SAS, SARL, EI… (given by the client, 23/09). */
  legalForm: "Entreprise individuelle — entrepreneur individuel" as string | null,
  /** None for an individual business (not shown then). */
  shareCapital: null as string | null,
  address: `${OFFICE.street}, ${OFFICE.postalCode} ${OFFICE.city}` as string | null,
  /** SIRET (+ ville du RCS si la société y est immatriculée). */
  registration: `SIRET ${SIRET}` as string | null,
  /** VAT franchise (given by the client, 23/09). */
  vatNumber: "Pas de numéro de TVA intracommunautaire — TVA non applicable, article 293 B du CGI" as string | null,
  email: "rudy.saksik@d2saigency.com" as string | null,
  /** Not published (client's choice, 23/09): the line is left out. */
  phone: null as string | null,
  /** Directeur ou directrice de la publication. */
  publicationDirector: "Rudy Saksik" as string | null,
};

/** Cloudflare Workers (official details: cloudflare.com/website-terms, checked 23/09/2026). */
export const HOST = {
  name: "Cloudflare, Inc." as string | null,
  address: "101 Townsend St, San Francisco, California 94107, États-Unis" as string | null,
  phone: "+1 (650) 319-8930" as string | null,
};

/**
 * The site's providers, and the client hub's (app.d2saigency.com, repo d2s-app): its database, Loic's voice and phone,
 * and Jules's meeting robot, which run on the client company's own ElevenLabs, Twilio and Fireflies accounts.
 */
export const PROCESSORS = {
  hosting: "Cloudflare (hébergement et protection technique du site et du hub app.d2saigency.com)" as string | null,
  requests: "Resend (transmission des demandes et e-mails de confirmation)" as string | null,
  assistant: "Anthropic, modèle Claude via API (génération des réponses de May et des agents du hub)" as string | null,
  calendar: "Calendly (disponibilités et réservation des visios choisies dans le formulaire)" as string | null,
  mailbox: "IONOS (messagerie de l’équipe, qui reçoit les demandes)" as string | null,
  database: "Supabase (base de données du hub app.d2saigency.com, hébergée en Irlande, dans l’Union européenne)" as string | null,
  voice: "ElevenLabs (voix et conversations de Loic, l’agent d’accueil du hub, sur le compte ElevenLabs de l’entreprise cliente)" as string | null,
  phone: "Twilio (numéro de téléphone et SMS de Loic, sur le compte Twilio de l’entreprise cliente)" as string | null,
  meetings: "Fireflies (enregistrement et transcription des visios où l’entreprise cliente envoie Jules, sur son compte Fireflies)" as string | null,
  /** Transfers outside the EU, if a processor is outside it (and the safeguard used). To confirm: each DPA accepted. */
  transfers:
    "Cloudflare, Anthropic, Calendly, Resend, ElevenLabs, Twilio, Fireflies et Supabase sont des sociétés américaines : des données peuvent être traitées aux États-Unis. La base de données du hub est toutefois stockée par Supabase en Irlande, dans l’Union européenne. Ces transferts sont encadrés par les clauses contractuelles types de la Commission européenne prévues dans leurs accords de traitement des données et, pour les sociétés certifiées, par le cadre de protection des données UE–États-Unis (Data Privacy Framework)." as
      | string
      | null,
};

/** Address where people exercise their rights (often the same as PUBLISHER.email). */
export const PRIVACY_CONTACT = "rudy.saksik@d2saigency.com" as string | null;

export const PRIVACY_HREF = "/confidentialite";
export const LEGAL_HREF = "/mentions-legales";
export const privacyHrefOf = (locale: "fr" | "en") => (locale === "en" ? "/en/privacy" : PRIVACY_HREF);
export const legalHrefOf = (locale: "fr" | "en") => (locale === "en" ? "/en/legal-notice" : LEGAL_HREF);
