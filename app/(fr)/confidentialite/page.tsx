import type { Metadata } from "next";
import Link from "next/link";
import type { CSSProperties } from "react";
import { LegalPage, ToFill, type LegalSection } from "@/components/pages/LegalPage";
import { LEGAL_HREF, PRIVACY_CONTACT, PROCESSORS, PUBLISHER } from "@/lib/legal";
import { pageAlternates } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Politique de confidentialité",
  description:
    "Comment D2S AIgency traite les messages adressés à May, les demandes de contact, les prises de rendez-vous et les agendas Google ou Outlook connectés au hub de ses clients.",
  alternates: pageAlternates("/confidentialite", "fr"),
};

/*
 * Describes what the site, and the hub's calendar connection, really do (keep it true when either changes):
 * - the contact form sends data to /api/contact, then Resend and the optional CRM webhook;
 * - the menu's "Contact" dialog sends a topic and a message to /api/message, then Resend;
 * - the IP address is kept in memory for a few minutes only, to limit abuse (rate limits);
 * - May sends the conversation to /api/may/chat, then to Anthropic (Claude API); nothing is stored by the site;
 * - Calendly availability is fetched server-side; a slot picked in the form is booked by our server (name, e-mail, time);
 * - no cookie, no audience measurement, no advertising tracker, fonts served by our own server;
 * - one technical sessionStorage entry (d2s:gpu-trouble) when the 3D had to be reduced;
 * - the client hub (app.d2saigency.com, repo d2s-app) can connect a Google or Outlook calendar (oauth.ts, ines/calendar.ts):
 *   busy times read (freebusy, two minutes in memory), the agents' own events created and cancelled (events.owned), the
 *   refresh token sealed (AES-GCM) in Supabase, erased on « Déconnecter » and revoked unless another org's agenda uses the account (api/integrations); free slots go to
 *   Claude (Inès, Loic), ElevenLabs (Loic's calls) and Twilio (SMS), the slots proposed are held 5 days (ines/meetings.ts),
 *   and a Meet link goes to Fireflies when Jules is sent into the meeting (calls.ts). A healthcare practice (vertical.ts):
 *   Loic's and Inès's events carry only the time, the place, initials and a link to the hub, nobody invited, never a Meet
 *   or Teams (boite.ts, loic/appointments.ts); Diva's interviews are unchanged. Google's OAuth verification
 *   requires this section and its Limited Use statement, quoted word for word: keep them.
 */
const contact = <ToFill value={PRIVACY_CONTACT ?? PUBLISHER.email} label="Adresse e-mail de contact" />;

/* The calendar section's sub-headings and quoted Google statement (LegalPage.module.css styles neither). */
const SUB: CSSProperties = { margin: "18px 0 6px", fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 700, color: "var(--ink)" };
const QUOTE: CSSProperties = { margin: "4px 0 12px", padding: "12px 16px 2px", borderLeft: "3px solid var(--blue)", borderRadius: "0 10px 10px 0", background: "var(--blue-tint)" };

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
        <p>
          Seule l’équipe {PUBLISHER.brand} en charge de votre demande. Nos prestataires techniques n’agissent que pour notre compte, ou
          pour celui de l’entreprise cliente lorsque le hub utilise ses propres comptes (ElevenLabs, Twilio, Fireflies…) :
        </p>
        <dl>
          <dt>Hébergement du site et du hub</dt>
          <dd>
            <ToFill value={PROCESSORS.hosting} label="Hébergeur" />
          </dd>
          <dt>Base de données du hub</dt>
          <dd>
            <ToFill value={PROCESSORS.database} label="Base de données" />
          </dd>
          <dt>Réception des demandes</dt>
          <dd>
            <ToFill value={PROCESSORS.requests} label="Outil (CRM, Make, Zapier, messagerie…)" />
          </dd>
          <dt>Messagerie de l’équipe</dt>
          <dd>
            <ToFill value={PROCESSORS.mailbox} label="Messagerie" />
          </dd>
          <dt>May et les agents du hub</dt>
          <dd>
            <ToFill value={PROCESSORS.assistant} label="Fournisseur d’intelligence artificielle" />
          </dd>
          <dt>Prise de rendez-vous</dt>
          <dd>
            <ToFill value={PROCESSORS.calendar} label="Outil de réservation" />
          </dd>
          <dt>Voix de Loic</dt>
          <dd>
            <ToFill value={PROCESSORS.voice} label="Voix de Loic" />
          </dd>
          <dt>Téléphone et SMS de Loic</dt>
          <dd>
            <ToFill value={PROCESSORS.phone} label="Téléphone et SMS" />
          </dd>
          <dt>Visios de Jules</dt>
          <dd>
            <ToFill value={PROCESSORS.meetings} label="Enregistrement des visios" />
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
          Le hub app.d2saigency.com, réservé à nos clients, n’utilise que les cookies strictement nécessaires à la connexion à leur
          compte et, le temps de brancher un service chez Google ou Microsoft, un cookie technique de 10 minutes.
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
    id: "google-agenda",
    alias: "google-calendar",
    title: "Connexion de votre agenda Google ou Outlook au hub D2S AIgency",
    body: (
      <>
        <p>
          Le hub <strong>app.d2saigency.com</strong> est l’espace réservé aux clients de {PUBLISHER.brand}, où travaillent leurs agents
          IA. Une entreprise cliente peut y connecter son agenda Google (ou Outlook), dans <strong>Configuration → Votre agenda</strong>,
          pour que ses agents proposent de vrais créneaux libres et inscrivent dans cet agenda les rendez-vous qu’ils fixent : Inès pour
          les rendez-vous convenus par e-mail, Loic pour ceux pris au téléphone ou sur le chat de son site, Diva pour les entretiens
          d’embauche. Cette connexion est facultative : sans elle, les agents ne connaissent que les rendez-vous passés par le hub.
        </p>

        <h3 style={SUB}>Ce que le hub demande à Google, et pourquoi</h3>
        <ul>
          <li>
            <strong>Votre adresse e-mail et votre profil de base</strong> (autorisations « openid », « email » et « profile ») : pour
            savoir quel compte Google est connecté. Seule l’adresse est conservée ; votre nom, que Google transmet au moment de la
            connexion, n’est pas enregistré.
          </li>
          <li>
            <strong>Vos plages occupées</strong> (« calendar.freebusy ») : le début et la fin des moments où votre agenda principal est
            occupé, pour ne proposer que des créneaux réellement libres. Cette autorisation ne donne jamais le titre, le lieu, les
            participants ni le contenu de vos événements.
          </li>
          <li>
            <strong>Les événements créés par vos agents</strong> (« calendar.events.owned ») : pour inscrire dans votre agenda principal
            un rendez-vous fixé par un agent et, s’il est annulé ou déplacé par le hub, l’en retirer. Google présente cette autorisation
            comme l’accès aux événements des agendas dont vous êtes propriétaire : le hub ne s’en sert que pour cela, et ne lit, ne
            modifie ni ne supprime aucun autre événement de votre agenda.
          </li>
        </ul>

        <h3 style={SUB}>Ce que vos agents écrivent dans votre agenda</h3>
        <ul>
          <li>Inès : le titre, l’heure et le lieu du rendez-vous, l’objet de l’e-mail qui l’a fixé et la personne invitée (nom et adresse e-mail) ;</li>
          <li>Loic : le titre, l’heure et le lieu du rendez-vous, les coordonnées de la personne et les précisions qu’elle a données ;</li>
          <li>Diva : l’heure et le lieu de l’entretien, le poste, le nom et l’adresse e-mail du candidat ;</li>
          <li>
            pour un cabinet de santé, rien qui révèle un motif ou un détail de santé : Loic et Inès n’y inscrivent que l’heure, le
            lieu, des initiales et un lien vers le hub, sans inviter personne ni créer de lien Google Meet ; le nom, les coordonnées,
            l’objet de l’e-mail et le motif restent dans le hub (si l’agenda branché est Calendly, qui réserve par l’adresse e-mail, le
            nom et l’adresse de la personne lui sont transmis). Les entretiens de Diva, qui ne concernent pas les patients, sont
            inscrits comme ci-dessus, candidat invité.
          </li>
        </ul>
        <p>
          Hors cabinet de santé, la personne est invitée aux rendez-vous d’Inès et de Diva : Google lui envoie l’invitation, puis
          l’annulation si le rendez-vous est annulé par le hub. Dans un cabinet de santé, seul le candidat à un entretien de Diva est
          invité ; Inès joint alors sa propre invitation à sa réponse. Loic n’invite jamais personne : il confirme lui-même ses
          rendez-vous, par SMS ou par e-mail. Pour une visio, Google peut créer un lien Google Meet (jamais pour Loic et Inès dans un
          cabinet de santé), que le hub conserve avec l’identifiant de l’événement.
        </p>

        <h3 style={SUB}>Où vont ces données</h3>
        <p>Seulement là où le service l’exige :</p>
        <ul>
          <li>
            <strong>Cloudflare</strong> : le hub fonctionne sur ses serveurs, par lesquels passent les échanges avec Google ;
          </li>
          <li>
            <strong>Supabase</strong> : la base de données du hub, hébergée en Irlande (Union européenne), garde l’adresse du compte
            connecté, l’accès chiffré, le résultat de la dernière vérification (l’agenda répond, nombre de plages occupées dans la
            semaine), l’identifiant de l’événement et le lien de visio de chaque rendez-vous, ainsi que les créneaux que vos agents ont
            proposés (gardés quelques jours pour la personne à qui ils sont proposés) et le texte des réponses d’Inès et des
            conversations de Loic qui les citent ;
          </li>
          <li>
            <strong>Anthropic</strong> (modèle Claude) : pour rédiger les réponses d’Inès et de Loic, il reçoit les créneaux libres
            déduits de votre agenda, jamais vos événements ;
          </li>
          <li>
            <strong>ElevenLabs</strong> : pendant un appel ou une conversation sur le chat de votre site, Loic reçoit les créneaux libres
            pour les proposer (sur le compte ElevenLabs de votre entreprise, qui garde la conversation 30 jours, sans enregistrer la
            voix) ;
          </li>
          <li>
            <strong>Twilio</strong> : les SMS de confirmation et de rappel envoyés à la personne donnent la date, l’heure et, pour une
            visio, le lien ;
          </li>
          <li>
            <strong>Fireflies</strong> (sur le compte de votre entreprise) : si vous envoyez Jules dans une visio, il reçoit le lien
            Google Meet du rendez-vous pour rejoindre la réunion ;
          </li>
          <li>
            les e-mails de confirmation, envoyés depuis votre boîte mail ou, à défaut, par Resend, donnent les mêmes informations, et le
            point du matin d’Inès, envoyé à votre équipe par Resend, rappelle l’heure et le lieu ou le lien de visio des rendez-vous du
            jour ;
          </li>
          <li>
            les personnes avec qui vos agents prennent rendez-vous (correspondants, appelants, candidats) voient les créneaux libres
            qui leur sont proposés.
          </li>
        </ul>

        <h3 style={SUB}>Combien de temps</h3>
        <ul>
          <li>
            L’accès à votre agenda (le jeton que Google nous remet) est gardé, chiffré, tant que l’agenda est connecté. L’accès
            temporaire qui en découle, valable une heure, reste seulement en mémoire.
          </li>
          <li>
            Vos plages occupées sont lues au moment où un agent en a besoin, ou quand la connexion est vérifiée, gardées dans la
            mémoire du serveur, réutilisées deux minutes au plus, et jamais enregistrées dans une base de données (seul leur nombre
            sur la semaine est noté à chaque vérification).
          </li>
          <li>
            Les rendez-vous fixés par vos agents, avec l’identifiant de l’événement et le lien de visio, font partie de votre espace :
            ils sont conservés comme les autres données de votre contrat (voir <a href="#duree">« Combien de temps les gardons-nous ? »</a>).
          </li>
          <li>
            Les créneaux proposés par vos agents, et les réponses ou conversations qui les citent, sont conservés de la même façon ;
            un créneau proposé mais non retenu redevient libre au bout de 5 jours au plus.
          </li>
          <li>
            Quand vous déconnectez l’agenda, l’accès et l’adresse du compte sont effacés de la configuration du hub, et nous demandons
            à Google de révoquer l’accès, sauf si ce même compte Google est encore branché comme agenda d’un autre espace du hub
            (chez Google, retirer l’accès le retirerait aussi à cet espace). L’adresse du compte peut rester citée dans les messages de suivi de votre espace (quand
            l’équipe {PUBLISHER.brand} a branché l’agenda pour vous, ou quand il ne répondait plus), conservés avec vos autres
            échanges. Les rendez-vous déjà inscrits restent dans votre agenda et dans votre espace.
          </li>
        </ul>

        <h3 style={SUB}>Nos engagements</h3>
        <ul>
          <li>
            les données reçues de Google ne servent qu’à proposer vos créneaux libres et à organiser les rendez-vous de vos agents (les
            inscrire, les annuler, en donner le lien de visio) ;
          </li>
          <li>
            elles ne sont ni vendues, ni louées, ni utilisées pour de la publicité (ciblée ou non), ni pour évaluer une solvabilité ou
            accorder un crédit ;
          </li>
          <li>elles ne sont ni utilisées ni transmises pour créer, entraîner ou améliorer des modèles d’intelligence artificielle ou d’apprentissage automatique ;</li>
          <li>
            elles ne sont transmises qu’aux destinataires cités plus haut (nos prestataires et les personnes avec qui vos agents
            prennent rendez-vous), dans la limite de ce que le service demande, ou lorsque la
            loi l’exige ;
          </li>
          <li>
            personne chez {PUBLISHER.brand} ne les consulte, sauf à votre demande pour une question d’assistance, pour la sécurité
            (enquêter sur un abus ou une faille) ou pour respecter la loi.
          </li>
        </ul>

        <h3 style={SUB}>Sécurité</h3>
        <p>
          La connexion se fait sur la page de Google : vous ne saisissez jamais votre mot de passe dans le hub. L’accès que Google nous
          remet est chiffré (AES-GCM) avant d’être enregistré, n’est jamais renvoyé au navigateur et n’est lu que par notre serveur.
          Les échanges sont chiffrés (HTTPS), et votre espace n’est ouvert qu’aux comptes de votre entreprise et, pour l’assistance, à
          l’équipe {PUBLISHER.brand}.
        </p>

        <h3 style={SUB}>Avec Outlook</h3>
        <p>
          Le hub demande à Microsoft l’autorisation de lire et de modifier votre agenda (« Calendars.ReadWrite »), mais s’en sert de la
          même façon : il n’utilise que le début, la fin et l’état de vos plages occupées, et ne crée ou n’annule que les rendez-vous
          de vos agents (avec un lien Teams pour une visio, jamais pour Loic et Inès dans un cabinet de santé). Microsoft ne propose pas de révocation à distance : à la déconnexion,
          l’accès est effacé du hub ; retirez aussi l’application dans les réglages de votre compte Microsoft.
        </p>

        <h3 style={SUB}>Déconnecter votre agenda</h3>
        <p>
          À tout moment, dans le hub : <strong>Configuration → Votre agenda → Déconnecter</strong>. Vous pouvez aussi retirer l’accès
          de {PUBLISHER.brand} depuis votre compte Google :{" "}
          <a href="https://myaccount.google.com/permissions">myaccount.google.com/permissions</a>.
        </p>

        <h3 style={SUB}>Déclaration d’utilisation limitée (Google)</h3>
        <blockquote lang="en" style={QUOTE}>
          <p>
            D2S AIgency’s use and transfer to any other app of information received from Google APIs will adhere to{" "}
            <a href="https://developers.google.com/terms/api-services-user-data-policy">Google API Services User Data Policy</a>, including
            the Limited Use requirements.
          </p>
          <p>
            The use of information received from Google Workspace APIs will adhere to the{" "}
            <a href="https://developers.google.com/workspace/workspace-api-user-data-developer-policy">
              Google Workspace API User Data and Developer Policy
            </a>
            .
          </p>
        </blockquote>
        <p>
          En français : l’utilisation par {PUBLISHER.brand} des informations reçues des API Google, et leur transfert vers toute autre
          application, respecteront le règlement de Google sur les données utilisateur des services d’API (Google API Services User
          Data Policy), y compris ses exigences d’utilisation limitée (Limited Use). L’utilisation des informations reçues des API
          Google Workspace respectera le règlement de Google sur les données utilisateur et les développeurs des API Workspace (Google
          Workspace API User Data and Developer Policy).
        </p>
      </>
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
      intro={
        <p>
          En bref : May traite les messages que vous lui envoyez pour vous répondre, et le formulaire transmet les informations
          nécessaires pour vous recontacter. Le site n’ajoute ni cookie publicitaire ni pisteur. Clients du hub : ce que nos agents
          font de votre agenda Google ou Outlook est détaillé dans la section{" "}
          <a href="#google-agenda">« Connexion de votre agenda Google ou Outlook »</a>.
        </p>
      }
      sections={SECTIONS}
    />
  );
}
