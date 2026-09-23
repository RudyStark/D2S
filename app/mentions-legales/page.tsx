import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, ToFill, type LegalSection } from "@/components/pages/LegalPage";
import { HOST, PRIVACY_HREF, PUBLISHER } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Mentions légales",
  description: "Éditeur, hébergeur, propriété intellectuelle et crédits du site D2S AIgency.",
  alternates: { canonical: "/mentions-legales" },
};

const SECTIONS: LegalSection[] = [
  {
    id: "editeur",
    title: "Éditeur du site",
    body: (
      <dl>
        <dt>Nom commercial</dt>
        <dd>{PUBLISHER.brand}</dd>
        <dt>Raison sociale</dt>
        <dd>
          <ToFill value={PUBLISHER.legalName} label="Raison sociale" />
        </dd>
        <dt>{PUBLISHER.shareCapital ? "Forme et capital" : "Forme juridique"}</dt>
        <dd>
          <ToFill value={PUBLISHER.legalForm} label="Forme juridique" />
          {PUBLISHER.shareCapital && <> · {PUBLISHER.shareCapital}</>}
        </dd>
        <dt>Siège</dt>
        <dd>
          <ToFill value={PUBLISHER.address} label="Adresse" />
        </dd>
        <dt>Immatriculation</dt>
        <dd>
          <ToFill value={PUBLISHER.registration} label="SIRET et RCS" />
        </dd>
        <dt>TVA intracommunautaire</dt>
        <dd>
          <ToFill value={PUBLISHER.vatNumber} label="Numéro de TVA" />
        </dd>
        <dt>Contact</dt>
        <dd>
          <ToFill value={PUBLISHER.email} label="E-mail" />
          {PUBLISHER.phone && <> · {PUBLISHER.phone}</>}
        </dd>
        <dt>Directeur de la publication</dt>
        <dd>
          <ToFill value={PUBLISHER.publicationDirector} label="Nom" />
        </dd>
      </dl>
    ),
  },
  {
    id: "hebergeur",
    title: "Hébergeur",
    body: (
      <dl>
        <dt>Société</dt>
        <dd>
          <ToFill value={HOST.name} label="Hébergeur" />
        </dd>
        <dt>Adresse</dt>
        <dd>
          <ToFill value={HOST.address} label="Adresse" />
        </dd>
        <dt>Téléphone</dt>
        <dd>
          <ToFill value={HOST.phone} label="Téléphone" />
        </dd>
      </dl>
    ),
  },
  {
    id: "propriete",
    title: "Propriété intellectuelle",
    body: (
      <>
        <p>
          La marque et le logo {PUBLISHER.brand}, les agents Déa, Loic, May, Diva et Morgan, leurs illustrations et modèles 3D, les
          textes, la mise en page et le décor de l’agence sont la propriété de {PUBLISHER.brand}. Toute reproduction ou réutilisation
          sans autorisation écrite est interdite.
        </p>
        <p>
          Les démonstrations présentées dans les fiches des agents sont illustratives et utilisent des données fictives.
        </p>
      </>
    ),
  },
  {
    id: "credits",
    title: "Crédits",
    body: (
      <ul>
        <li>
          Textures et végétation 3D : <a href="https://polyhaven.com">Poly Haven</a>, licence CC0 (domaine public).
        </li>
        <li>Polices Inter, Inter Tight, Caveat et Montserrat, licence SIL Open Font License, servies depuis ce site.</li>
        <li>Rendu 3D : three.js et React Three Fiber (licence MIT).</li>
      </ul>
    ),
  },
  {
    id: "responsabilite",
    title: "Responsabilité",
    body: (
      <p>
        {PUBLISHER.brand} veille à l’exactitude des informations publiées, sans pouvoir en garantir l’exhaustivité. Les estimations
        affichées (par exemple le temps gagné dans le diagnostic) sont indicatives et ne constituent pas un engagement contractuel.
      </p>
    ),
  },
  {
    id: "donnees",
    title: "Données personnelles",
    body: (
      <p>
        Ce que nous collectons, pourquoi et comment exercer vos droits : voir notre{" "}
        <Link href={PRIVACY_HREF}>politique de confidentialité</Link>. Le site ne dépose aucun cookie.
      </p>
    ),
  },
  {
    id: "droit",
    title: "Droit applicable",
    body: <p>Le présent site et ses mentions sont soumis au droit français.</p>,
  },
];

export default function LegalNoticePage() {
  return <LegalPage kicker="Informations légales" title="Mentions légales" intro={<p>Qui édite ce site, qui l’héberge, et à qui appartiennent ses contenus.</p>} sections={SECTIONS} />;
}
