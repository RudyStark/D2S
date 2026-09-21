/*
 * Legal information shown on /mentions-legales and /confidentialite.
 * Every `null` is rendered as a visible "À compléter" marker: the company details are not invented here.
 * Fill them before going live, then have both pages reviewed (they describe what the site really does).
 */

export const LEGAL_UPDATED = "21 septembre 2026";

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
  /** SAS, SARL, EI… */
  legalForm: null as string | null,
  shareCapital: null as string | null,
  address: `${OFFICE.street}, ${OFFICE.postalCode} ${OFFICE.city}` as string | null,
  /** SIRET (+ ville du RCS si la société y est immatriculée). */
  registration: `SIRET ${SIRET}` as string | null,
  vatNumber: null as string | null,
  email: null as string | null,
  phone: null as string | null,
  /** Directeur ou directrice de la publication. */
  publicationDirector: null as string | null,
};

export const HOST = {
  name: null as string | null,
  address: null as string | null,
  phone: null as string | null,
};

/** Where contact requests end up (CONTACT_WEBHOOK_URL): the tool and its location (UE or not). */
export const PROCESSORS = {
  hosting: null as string | null,
  requests: null as string | null,
  /** Transfers outside the EU, if a processor is outside it (and the safeguard used). */
  transfers: null as string | null,
};

/** Address where people exercise their rights (often the same as PUBLISHER.email). */
export const PRIVACY_CONTACT = null as string | null;

export const PRIVACY_HREF = "/confidentialite";
export const LEGAL_HREF = "/mentions-legales";
