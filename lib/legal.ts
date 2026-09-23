/*
 * Legal information shown on /mentions-legales and /confidentialite.
 * Every `null` is rendered as a visible "À compléter" marker: the company details are not invented here.
 * Fill them before going live, then have both pages reviewed (they describe what the site really does).
 */

export const LEGAL_UPDATED = "23 septembre 2026";

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

export const PROCESSORS = {
  hosting: "Cloudflare (hébergement et protection technique du site)" as string | null,
  requests: "Resend (transmission des demandes et e-mails de confirmation)" as string | null,
  assistant: "Anthropic, modèle Claude via API (génération des réponses de May)" as string | null,
  calendar: "Calendly (disponibilités et réservation des visios choisies dans le formulaire)" as string | null,
  mailbox: "IONOS (messagerie de l’équipe, qui reçoit les demandes)" as string | null,
  /** Transfers outside the EU, if a processor is outside it (and the safeguard used). To confirm: each DPA accepted. */
  transfers:
    "Cloudflare, Anthropic, Calendly et Resend sont des sociétés américaines : des données peuvent être traitées aux États-Unis. Ces transferts sont encadrés par les clauses contractuelles types de la Commission européenne prévues dans leurs accords de traitement des données et, pour les sociétés certifiées, par le cadre de protection des données UE–États-Unis (Data Privacy Framework)." as
      | string
      | null,
};

/** Address where people exercise their rights (often the same as PUBLISHER.email). */
export const PRIVACY_CONTACT = "rudy.saksik@d2saigency.com" as string | null;

export const PRIVACY_HREF = "/confidentialite";
export const LEGAL_HREF = "/mentions-legales";
