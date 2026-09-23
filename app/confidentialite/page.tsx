import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, ToFill, type LegalSection } from "@/components/pages/LegalPage";
import { LEGAL_HREF, PRIVACY_CONTACT, PROCESSORS, PUBLISHER } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Politique de confidentialité",
  description: "Comment D2S AIgency traite les messages adressés à May, les demandes de contact et les prises de rendez-vous.",
  alternates: { canonical: "/confidentialite" },
};

/*
 * Describes what the site really does (keep it true when the site changes):
 * - the contact form sends data to /api/contact, then Resend and the optional CRM webhook;
 * - the menu's "Contact" dialog sends a topic and a message to /api/message, then Resend;
 * - the IP address is kept in memory for a few minutes only, to limit abuse (rate limits);
 * - May sends the conversation to /api/may/chat, then to Anthropic (Claude API); nothing is stored by the site;
 * - Calendly availability is fetched server-side; a slot picked in the form is booked by our server (name, e-mail, time);
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
          Celles que vous nous transmettez dans le chat de May, avec le formulaire <strong>« Parlons de votre projet »</strong> ou
          avec la fenêtre <strong>« Contact »</strong> du menu :
        </p>
        <ul>
          <li>prénom et nom, e-mail professionnel, entreprise ;</li>
          <li>téléphone, si vous choisissez de le donner (facultatif) ;</li>
          <li>votre message, le type de projet ou le sujet choisi et votre préférence d’échange (visio, appel, e-mail) ;</li>
          <li>le bouton qui vous a amené au formulaire (par exemple la fiche d’un agent) ;</li>
          <li>le résumé de votre diagnostic « Comment choisir votre agent IA ? », seulement s’il est joint à la demande (vous pouvez le retirer avant l’envoi).</li>
          <li>les messages de la conversation avec May, lorsque vous les envoyez dans le chat.</li>
        </ul>
        <p>
          Pour limiter les abus (envois répétés, robots), votre adresse IP est aussi utilisée par notre serveur, en mémoire et pendant
          quelques minutes seulement : elle n’est ni enregistrée ni associée à votre demande.
        </p>
        <p>
          Le diagnostic reste dans votre navigateur tant que vous ne le joignez pas au formulaire. Chaque message adressé à May est en
          revanche transmis à notre serveur puis à notre fournisseur d’intelligence artificielle afin de produire sa réponse. Si vous
          acceptez que May prépare votre demande, ou choisissez « Être recontacté par l’équipe », cette demande (ou la conversation) est
          recopiée dans le formulaire : vous la relisez et pouvez la modifier avant de l’envoyer vous-même. Le site ne conserve pas la
          conversation : elle disparaît quand vous quittez la page.
        </p>
        <p>
          Si vous choisissez un créneau de visio dans le formulaire, votre nom, votre adresse e-mail et le créneau choisi sont
          transmis à Calendly pour réserver le rendez-vous : Calendly vous envoie l’invitation, le lien de connexion et les rappels.
          Les disponibilités affichées sont lues par notre serveur ; aucun script ni cookie Calendly n’est chargé sur le site.
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
          <li>répondre à votre demande ou à votre message et organiser le premier échange ;</li>
          <li>vous confirmer la bonne réception de votre demande et, le cas échéant, votre rendez-vous, par e-mail ;</li>
          <li>vous orienter dans le chat vers le service ou l’agent IA adapté ;</li>
          <li>afficher des types de rendez-vous et créneaux réellement disponibles ;</li>
          <li>vous adresser une proposition, si vous le souhaitez ;</li>
          <li>assurer un suivi raisonnable de cette demande.</li>
        </ul>
        <p>
          Base légale : les <strong>mesures précontractuelles prises à votre demande</strong> (article 6.1.b du RGPD) pour le contact et
          la réservation, et notre intérêt légitime à répondre aux questions sur nos services pour le chat (article 6.1.f). Les cases à
          cocher des formulaires confirment votre accord pour être recontacté. Aucune donnée n’est vendue, ni utilisée pour de la publicité.
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
        <p>
          D2S ne crée pas de compte visiteur et n’enregistre pas volontairement l’historique du chat dans une base de données. Les
          prestataires techniques peuvent toutefois conserver des journaux pendant la durée nécessaire à la sécurité et au fonctionnement
          de leurs services, selon nos réglages et nos contrats avec eux.
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
          <dt>Messagerie de l’équipe</dt>
          <dd>
            <ToFill value={PROCESSORS.mailbox} label="Messagerie" />
          </dd>
          <dt>Assistant May</dt>
          <dd>
            <ToFill value={PROCESSORS.assistant} label="Fournisseur d’intelligence artificielle" />
          </dd>
          <dt>Prise de rendez-vous</dt>
          <dd>
            <ToFill value={PROCESSORS.calendar} label="Outil de réservation" />
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
          L’ouverture d’un bouton de rendez-vous vous conduit vers Calendly, dont la page applique sa propre politique de cookies et de
          confidentialité. Aucun contenu Calendly n’est chargé avant cette action.
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
      intro={<p>En bref : May traite les messages que vous lui envoyez pour vous répondre, et le formulaire transmet les informations nécessaires pour vous recontacter. Le site n’ajoute ni cookie publicitaire ni pisteur.</p>}
      sections={SECTIONS}
    />
  );
}
