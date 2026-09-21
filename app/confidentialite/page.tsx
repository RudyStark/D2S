import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, ToFill, type LegalSection } from "@/components/pages/LegalPage";
import { LEGAL_HREF, PRIVACY_CONTACT, PROCESSORS, PUBLISHER } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Politique de confidentialité",
  description: "Quelles données D2S AIgency collecte, pourquoi, combien de temps, et comment exercer vos droits. Aucun cookie, aucun pisteur.",
  alternates: { canonical: "/confidentialite" },
};

/*
 * Describes what the site really does (keep it true when the site changes):
 * - one form (contact) sends data, to /api/contact then CONTACT_WEBHOOK_URL;
 * - the diagnostic and May's question box compute in the browser and send nothing by themselves;
 * - no cookie, no audience measurement, no advertising tracker, fonts served by our own server;
 * - one technical sessionStorage entry (d2s:gpu-trouble) when the 3D had to be reduced.
 */
const contact = <ToFill value={PRIVACY_CONTACT ?? PUBLISHER.email} label="Adresse e-mail de contact" />;

const SECTIONS: LegalSection[] = [
  {
    id: "responsable",
    title: "Qui est responsable de vos données ?",
    body: (
      <>
        <p>
          Le responsable du traitement est <strong>{PUBLISHER.brand}</strong> (
          <ToFill value={PUBLISHER.legalName} label="Raison sociale" />, <ToFill value={PUBLISHER.address} label="Adresse du siège" />
          ).
        </p>
        <p>Pour toute question sur vos données : {contact}.</p>
      </>
    ),
  },
  {
    id: "donnees",
    title: "Quelles données collectons-nous ?",
    body: (
      <>
        <p>
          Uniquement celles que vous nous transmettez avec le formulaire <strong>« Parlons de votre projet »</strong>, au moment où vous
          l’envoyez :
        </p>
        <ul>
          <li>prénom et nom, e-mail professionnel, entreprise ;</li>
          <li>téléphone, si vous choisissez de le donner (facultatif) ;</li>
          <li>votre message, le type de projet choisi et votre préférence d’échange (visio, appel, e-mail) ;</li>
          <li>le bouton qui vous a amené au formulaire (par exemple la fiche d’un agent) ;</li>
          <li>le résumé de votre diagnostic « Comment choisir votre agent IA ? », seulement s’il est joint à la demande (vous pouvez le retirer avant l’envoi).</li>
        </ul>
        <p>
          Le diagnostic et la question posée à May, notre agente d’accueil, sont calculés <strong>dans votre navigateur</strong> : rien
          ne nous est envoyé tant que vous n’avez pas validé le formulaire.
        </p>
      </>
    ),
  },
  {
    id: "finalites",
    title: "Pourquoi, et sur quelle base ?",
    body: (
      <>
        <p>Vos données servent à :</p>
        <ul>
          <li>répondre à votre demande et organiser le premier échange ;</li>
          <li>vous adresser une proposition, si vous le souhaitez ;</li>
          <li>assurer un suivi raisonnable de cette demande.</li>
        </ul>
        <p>
          Base légale : les <strong>mesures précontractuelles prises à votre demande</strong> (article 6.1.b du RGPD). La case à cocher
          du formulaire confirme votre accord pour être recontacté. Aucune donnée n’est vendue, ni utilisée pour de la publicité.
        </p>
      </>
    ),
  },
  {
    id: "duree",
    title: "Combien de temps les gardons-nous ?",
    body: (
      <>
        <p>
          <strong>3 ans à compter de notre dernier échange</strong>, puis elles sont supprimées. Si un contrat est signé, les données
          utiles sont conservées pendant la relation, puis pendant les durées imposées par la loi (obligations comptables et fiscales).
        </p>
        <p>Les demandes identifiées comme du spam sont écartées sans être conservées.</p>
      </>
    ),
  },
  {
    id: "destinataires",
    title: "Qui y a accès ?",
    body: (
      <>
        <p>Seule l’équipe {PUBLISHER.brand} en charge de votre demande. Nos prestataires techniques n’agissent que pour notre compte :</p>
        <dl>
          <dt>Hébergement du site</dt>
          <dd>
            <ToFill value={PROCESSORS.hosting} label="Hébergeur" />
          </dd>
          <dt>Réception des demandes</dt>
          <dd>
            <ToFill value={PROCESSORS.requests} label="Outil (CRM, Make, Zapier, messagerie…)" />
          </dd>
          <dt>Transferts hors UE</dt>
          <dd>
            <ToFill value={PROCESSORS.transfers} label="Aucun, ou pays et garanties (clauses contractuelles types)" />
          </dd>
        </dl>
      </>
    ),
  },
  {
    id: "cookies",
    title: "Cookies et traceurs",
    body: (
      <>
        <p>
          <strong>Ce site ne dépose aucun cookie</strong> et n’utilise aucun outil de mesure d’audience ni de publicité. C’est pourquoi
          aucun bandeau de consentement ne vous est demandé.
        </p>
        <p>
          Les polices sont servies par notre propre serveur : votre navigateur ne contacte aucun service tiers pendant la visite.
        </p>
        <p>
          Une seule information technique peut être gardée <strong>dans l’onglet, le temps de la visite</strong> : si votre carte
          graphique a dû interrompre le décor 3D, le site s’en souvient pour s’afficher en qualité allégée. Elle ne vous identifie pas,
          n’est jamais transmise et disparaît à la fermeture de l’onglet. Ce stockage strictement nécessaire est dispensé de
          consentement.
        </p>
      </>
    ),
  },
  {
    id: "securite",
    title: "Comment les protégeons-nous ?",
    body: (
      <ul>
        <li>connexion chiffrée (HTTPS) et en-têtes de sécurité stricts sur tout le site ;</li>
        <li>données limitées au nécessaire, contrôlées et bornées à la réception ;</li>
        <li>protection anti-spam sans cookie ni captcha (champ piège, délai minimal, limitation du nombre d’envois) ;</li>
        <li>accès réservé aux personnes qui traitent votre demande.</li>
      </ul>
    ),
  },
  {
    id: "droits",
    title: "Vos droits",
    body: (
      <>
        <p>
          Vous pouvez à tout moment accéder à vos données, les faire rectifier ou effacer, limiter ou refuser leur utilisation, les
          récupérer (portabilité), et définir des directives sur leur sort après votre décès.
        </p>
        <p>
          Écrivez-nous à {contact}. Nous répondons sous un mois. Si vous estimez que vos droits ne sont pas respectés, vous pouvez
          saisir la CNIL (<a href="https://www.cnil.fr/fr/plaintes">cnil.fr</a>).
        </p>
        <p>
          Voir aussi nos <Link href={LEGAL_HREF}>mentions légales</Link>.
        </p>
      </>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <LegalPage
      kicker="Données personnelles"
      title="Politique de confidentialité"
      intro={<p>En bref : nous ne collectons que ce que vous nous envoyez avec le formulaire de contact, pour vous répondre. Pas de cookie, pas de pisteur.</p>}
      sections={SECTIONS}
    />
  );
}
