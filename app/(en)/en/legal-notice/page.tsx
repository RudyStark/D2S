import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, type LegalSection } from "@/components/pages/LegalPage";
import { HOST, PUBLISHER, SIRET, privacyHrefOf } from "@/lib/legal";
import { pageAlternates } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Legal notice",
  description: "Publisher, host, intellectual property and credits of the D2S AIgency website.",
  alternates: pageAlternates("/mentions-legales", "en"),
};

/* English translation of /mentions-legales (the French version prevails). Same facts, from lib/legal. */
const SECTIONS: LegalSection[] = [
  {
    id: "publisher",
    title: "Website publisher",
    body: (
      <dl>
        <dt>Trade name</dt>
        <dd>{PUBLISHER.brand}</dd>
        <dt>Company name</dt>
        <dd>{PUBLISHER.legalName}</dd>
        <dt>Legal form</dt>
        <dd>Sole proprietorship (entrepreneur individuel)</dd>
        <dt>Registered office</dt>
        <dd>{PUBLISHER.address}, France</dd>
        <dt>Registration</dt>
        <dd>SIRET {SIRET}</dd>
        <dt>VAT</dt>
        <dd>No intra-community VAT number — VAT not applicable, article 293 B of the French General Tax Code</dd>
        <dt>Contact</dt>
        <dd>
          {PUBLISHER.email}
          {PUBLISHER.phone && <> · {PUBLISHER.phone}</>}
        </dd>
        <dt>Publication director</dt>
        <dd>{PUBLISHER.publicationDirector}</dd>
      </dl>
    ),
  },
  {
    id: "host",
    title: "Host",
    body: (
      <dl>
        <dt>Company</dt>
        <dd>{HOST.name}</dd>
        <dt>Address</dt>
        <dd>101 Townsend St, San Francisco, California 94107, United States</dd>
        <dt>Phone</dt>
        <dd>{HOST.phone}</dd>
      </dl>
    ),
  },
  {
    id: "intellectual-property",
    title: "Intellectual property",
    body: (
      <>
        <p>
          The {PUBLISHER.brand} brand and logo, the agents Déa, Loic, May, Diva and Morgan, their illustrations and 3D models, the
          texts, the layout and the agency’s setting are the property of {PUBLISHER.brand}. Any reproduction or reuse without written
          permission is prohibited.
        </p>
        <p>The demonstrations shown in the agents’ profiles are illustrative and use fictitious data.</p>
      </>
    ),
  },
  {
    id: "credits",
    title: "Credits",
    body: (
      <ul>
        <li>
          3D textures and plants: <a href="https://polyhaven.com">Poly Haven</a>, CC0 licence (public domain).
        </li>
        <li>Inter, Inter Tight, Caveat and Montserrat fonts, SIL Open Font License, served from this site.</li>
        <li>3D rendering: three.js and React Three Fiber (MIT licence).</li>
      </ul>
    ),
  },
  {
    id: "liability",
    title: "Liability",
    body: (
      <p>
        {PUBLISHER.brand} takes care to publish accurate information but cannot guarantee it is complete. The estimates shown (for
        example the time saved in the diagnostic) are indicative and are not a contractual commitment.
      </p>
    ),
  },
  {
    id: "personal-data",
    title: "Personal data",
    body: (
      <p>
        What we collect, why, and how to exercise your rights: see our <Link href={privacyHrefOf("en")}>privacy policy</Link>. The
        site sets no cookies.
      </p>
    ),
  },
  {
    id: "law",
    title: "Governing law",
    body: <p>This website and this notice are governed by French law.</p>,
  },
];

export default function LegalNoticePage() {
  return (
    <LegalPage
      locale="en"
      kicker="Legal information"
      title="Legal notice"
      intro={
        <p>
          Who publishes this site, who hosts it, and who owns its content. This English translation is provided for convenience; the{" "}
          <Link href="/mentions-legales">French version</Link> prevails.
        </p>
      }
      sections={SECTIONS}
    />
  );
}
