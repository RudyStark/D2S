import type { Metadata, ResolvingMetadata } from "next";
import type { CSSProperties, ReactNode } from "react";
import { LanguageLink } from "@/components/i18n/LanguageLink";
import { Button } from "@/components/ui/Button";
import { ArrowRight, ArrowUpRight, Calendar, Check, ChatDots, Close, Doc, Globe, Plug, Search, Shield, Sparkle, Users } from "@/components/ui/Icons";
import { Logo } from "@/components/ui/Logo";
import { agentCard, agentCardsOf, type AgentKey } from "@/lib/agent-directory";
import { alternates as hreflang, type Locale } from "@/lib/i18n";
import { legalHrefOf, OFFICE, PUBLISHER, privacyHrefOf } from "@/lib/legal";
import { contactHrefOf, homeOf } from "@/lib/navigation";
import { pageAlternates } from "@/lib/seo";
import { SITE_NAME } from "@/lib/site";
import styles from "./HubPage.module.css";

/*
 * /hub (and /en/hub): the public home page of the client hub, app.d2saigency.com — the address declared to Google
 * as the OAuth app's home page. Google asks for a public page (not a sign-in page) on the verified domain that says
 * what the app does and links to the privacy policy, which details the calendar data (/confidentialite#google-agenda).
 * Keep it true to the hub (repo d2s-app): no price, no invented figure. Server-rendered, no 3D: it loads none of the
 * site's scroll or WebGL code (hence its own light top bar instead of the site header).
 */

const APP_URL = "https://app.d2saigency.com";
const APP_SIGN_IN = `${APP_URL}/connexion`;
const GOOGLE_USER_DATA_POLICY = "https://developers.google.com/terms/api-services-user-data-policy";
const GOOGLE_WORKSPACE_POLICY = "https://developers.google.com/workspace/workspace-api-user-data-developer-policy";
const GOOGLE_PERMISSIONS = "https://myaccount.google.com/permissions";

type IconId = "agents" | "approve" | "calendar" | "files" | "team";
const ICONS: Record<IconId, ReactNode> = {
  agents: <Users size={22} />,
  approve: <Check size={22} />,
  calendar: <Calendar size={22} />,
  files: <Doc size={22} />,
  team: <ChatDots size={22} />,
};

/** The illustration of the hero: what the hub's « agents at work » strip looks like (fictional example). */
const PREVIEW: { key: AgentKey; status: "approve" | "agenda" | "filed"; fr: string; en: string }[] = [
  { key: "prospection", status: "approve", fr: "Relance d’un prospect rédigée", en: "Follow-up to a prospect drafted" },
  { key: "support", status: "agenda", fr: "Rendez-vous pris au téléphone", en: "Appointment booked by phone" },
  { key: "content", status: "approve", fr: "Post LinkedIn prêt à publier", en: "LinkedIn post ready to publish" },
  { key: "presentateur", status: "filed", fr: "Présentation client terminée", en: "Client presentation finished" },
];

const TEXTS = {
  fr: {
    metaTitle: "Le hub, l’espace de travail de vos agents IA",
    metaDescription:
      "Le hub D2S AIgency (app.d2saigency.com) est l’espace client où travaillent vos agents IA : vous validez ce qu’ils préparent, retrouvez rendez-vous, livrables et messages.",
    top: { site: "Le site", signIn: "Accéder à mon espace", signInShort: "Mon espace" },
    badge: "Hub D2S AIgency · espace client",
    title: ["L’espace de travail de vos ", "agents IA", "."],
    lead: "Le hub D2S AIgency, sur app.d2saigency.com, est l’espace en ligne réservé à nos clients. Vous y retrouvez les agents IA qui travaillent pour votre entreprise, vous validez ce qu’ils préparent, et vous suivez vos rendez-vous, vos livrables et vos échanges avec l’équipe D2S.",
    signIn: "Accéder à mon espace",
    talk: "Parler à l’équipe",
    access: "Accès sur invitation : votre compte est créé par l’équipe D2S lors de la mise en service de vos agents.",
    preview: {
      title: "Agents au travail",
      live: "En direct",
      status: { approve: "À valider", agenda: "Dans l’agenda", filed: "Dans vos livrables" },
      primary: "Relire et valider",
      secondary: "Ouvrir l’agenda",
      caption: "Illustration de l’espace client · exemple fictif",
    },
    features: {
      kicker: "Dans le hub",
      title: "Tout ce que font vos agents, au même endroit.",
      lead: "Chaque entreprise a son propre espace, avec ses agents, ses rendez-vous, ses documents et ses échanges.",
      teamLabel: (n: number) => `Les ${n} agents de D2S AIgency`,
      items: (n: number): { icon: IconId; title: string; text: string; link?: { href: string; label: string } }[] => [
        {
          icon: "agents",
          title: "Vos agents au travail",
          text: `Vous retrouvez les agents que vous avez choisis parmi les ${n} de D2S AIgency, chacun avec son métier : prospection, support client, contenu, e-mails, comptabilité… Vous leur confiez une tâche et voyez en direct où ils en sont.`,
        },
        {
          icon: "approve",
          title: "Vous relisez, vous validez",
          text: "Messages, propositions, publications : ce que vos agents préparent vous attend dans le hub. Vous relisez, corrigez si besoin, puis validez.",
        },
        {
          icon: "calendar",
          title: "Vos rendez-vous, dans un seul agenda",
          text: "Les rendez-vous pris par vos agents, au téléphone, sur votre site ou par e-mail, sont réunis dans l’agenda du hub. Vous pouvez aussi y relier votre propre agenda.",
          link: { href: "#agenda", label: "Comment ça marche" },
        },
        {
          icon: "files",
          title: "Vos livrables et votre marque",
          text: "Posts, propositions, analyses, réponses types : chaque livrable est rangé, prêt à copier, télécharger ou imprimer. Votre profil de marque et vos documents guident vos agents.",
        },
        {
          icon: "team",
          title: "L’équipe D2S, à portée de message",
          text: "La messagerie du hub réunit vos demandes, nos réponses et les nouvelles de votre équipe. Vous êtes prévenu par e-mail à chaque réponse.",
        },
      ],
    },
    calendar: {
      id: "agenda",
      // The other language's id, so that a link keeps its place when the language is switched (LanguageLink keeps the hash).
      alias: "calendar",
      badge: "Facultatif",
      title: "Connexion de votre agenda (Google Agenda ou Outlook)",
      lead: "Le hub fonctionne sans. Si vous reliez votre agenda, vos agents ne proposent que des créneaux où vous êtes libre et y inscrivent les rendez-vous qu’ils fixent : Inès pour ceux convenus par e-mail, Loic pour ceux pris au téléphone ou sur le chat de votre site, Diva pour les entretiens d’embauche.",
      how: "La connexion se fait dans le hub, page Configuration, rubrique « Votre agenda », sur la page d’autorisation de Google ou de Microsoft : votre mot de passe ne se saisit que chez eux, jamais dans le hub.",
      reads: {
        title: "Ce que le hub lit",
        text: [
          "L’adresse e-mail du compte connecté, pour savoir lequel est branché, et vos plages occupées : l’heure de début et de fin. Le hub n’utilise jamais le titre, le lieu, les participants ni le contenu de vos événements.",
          "Ces plages sont lues quand un agent cherche un créneau libre ou quand la connexion est vérifiée, gardées deux minutes au plus en mémoire, et jamais enregistrées dans une base de données (seul leur nombre sur la semaine est noté à la vérification) : seuls les créneaux que vos agents proposent ou réservent sont gardés dans votre espace.",
        ],
      },
      writes: {
        title: "Ce que le hub écrit",
        text: [
          "Les rendez-vous fixés par vos agents : l’heure, l’objet, le lieu ou le lien de visio, et la personne concernée. Pour ceux d’Inès et de Diva, la personne est invitée : Google ou Microsoft lui envoie l’invitation (et l’annulation, le cas échéant). Loic confirme lui-même ses rendez-vous, par SMS ou par e-mail.",
          "Si vous annulez l’un de ces rendez-vous dans le hub, il est retiré de votre agenda.",
        ],
        health: [
          "Cabinet de santé",
          "Loic et Inès n’y inscrivent que l’heure, le lieu, des initiales et un lien vers le hub, sans inviter personne ni créer de lien Meet ou Teams : ni nom, ni coordonnées, ni objet de l’e-mail, ni motif, ni détail de santé. Inès joint sa propre invitation à sa réponse ; Loic confirme par SMS ou par e-mail. Les entretiens de Diva, qui ne concernent pas vos patients, gardent le poste et le nom du candidat, qui est invité.",
        ],
      },
      never: {
        title: "Ce qu’il ne fait jamais",
        items: [
          "Lire le titre, le lieu, les participants ou le contenu de vos événements, ni modifier ou supprimer un événement qu’il n’a pas créé.",
          "Vendre vos données, ou s’en servir pour de la publicité.",
          "Les utiliser pour créer, entraîner ou améliorer des modèles d’intelligence artificielle.",
          "Les transmettre à d’autres que les prestataires nécessaires au hub et les personnes avec qui vos agents prennent rendez-vous, sauf obligation légale.",
        ],
      },
      unplug: {
        title: "Débrancher à tout moment",
        hub: (
          <>
            Dans le hub : <strong>Configuration → Votre agenda → Déconnecter</strong>. L’accès est effacé du hub et, sauf s’il sert encore
            l’agenda d’un autre espace du hub, nous demandons à Google de le révoquer. Les rendez-vous déjà inscrits restent dans votre agenda.
          </>
        ),
        google: (
          <>
            Depuis votre compte Google : <a href={GOOGLE_PERMISSIONS}>myaccount.google.com/permissions</a>, puis retirez l’accès de
            D2S AIgency.
          </>
        ),
        microsoft: <>Avec Outlook : retirez aussi l’application dans les réglages de votre compte Microsoft (applications autorisées).</>,
      },
      commitment: {
        title: "Données Google : notre engagement",
        intro: "Ce que nous faisons des données de votre agenda (accès, usage, conservation, partage, suppression) est détaillé dans notre politique de confidentialité.",
        link: "Lire la section consacrée à votre agenda",
        anchor: "#google-agenda",
        translation:
          "En français : l’utilisation par D2S AIgency des informations reçues des API Google, et leur transfert vers toute autre application, respecteront le règlement de Google sur les données utilisateur des services d’API (Google API Services User Data Policy), y compris ses exigences d’utilisation limitée (Limited Use). L’utilisation des informations reçues des API Google Workspace respectera le règlement de Google sur les données utilisateur et les développeurs des API Workspace (Google Workspace API User Data and Developer Policy).",
      },
    },
    security: {
      kicker: "Sécurité",
      title: "Un espace privé, qui le reste.",
      lead: "Vos agents travaillent avec des informations de votre entreprise : elles sont protégées à chaque étape.",
      items: [
        {
          icon: <Shield size={22} />,
          title: "Des accès chiffrés",
          text: "Connexion chiffrée (HTTPS) sur tout le hub. Les clés et autorisations de vos services (agenda, boîte mail…) sont chiffrées avant d’être enregistrées et ne sont jamais réaffichées. Chaque entreprise n’accède qu’à son propre espace.",
        },
        {
          icon: <Globe size={22} />,
          title: "Une base de données dans l’Union européenne",
          text: "La base de données du hub est hébergée en Irlande, dans l’Union européenne.",
        },
        {
          icon: <Check size={22} />,
          title: "Rien n’est envoyé sans votre validation",
          text: "Ce que vos agents préparent attend votre accord avant de partir. Si vous laissez un agent agir seul sur une tâche précise, comme l’accueil téléphonique de Loic, c’est vous qui en fixez les règles.",
        },
      ],
    },
    cta: {
      client: { title: "Déjà client ?", text: "Retrouvez vos agents, vos rendez-vous et vos livrables.", action: "Accéder à mon espace" },
      prospect: { title: "Pas encore client ?", text: "Parlons de ce que vos agents pourraient prendre en charge.", action: "Parler à l’équipe" },
    },
    footer: {
      nav: "Liens utiles",
      home: "Accueil du site",
      privacy: "Confidentialité",
      legal: "Mentions légales",
      contact: "Contact",
      publisher: `${PUBLISHER.brand} est une marque de ${PUBLISHER.legalName} · ${OFFICE.street}, ${OFFICE.postalCode} ${OFFICE.city}`,
    },
  },
  en: {
    metaTitle: "The hub, your AI agents’ workspace",
    metaDescription:
      "The D2S AIgency hub (app.d2saigency.com) is the client workspace where your AI agents work: approve what they prepare, find appointments, deliverables and messages.",
    top: { site: "Website", signIn: "Go to my workspace", signInShort: "My workspace" },
    badge: "D2S AIgency hub · client workspace",
    title: ["The workspace of your ", "AI agents", "."],
    lead: "The D2S AIgency hub, at app.d2saigency.com, is the online workspace reserved for our clients. It is where you find the AI agents working for your business, approve what they prepare, and follow your appointments, deliverables and conversations with the D2S team.",
    signIn: "Go to my workspace",
    talk: "Talk to the team",
    access: "Access by invitation: your account is created by the D2S team when your agents are set up.",
    preview: {
      title: "Agents at work",
      live: "Live",
      status: { approve: "To approve", agenda: "In the calendar", filed: "In your deliverables" },
      primary: "Review and approve",
      secondary: "Open the calendar",
      caption: "Illustration of the client workspace · fictional example",
    },
    features: {
      kicker: "Inside the hub",
      title: "Everything your agents do, in one place.",
      lead: "Each business has its own workspace, with its agents, appointments, documents and conversations.",
      teamLabel: (n: number) => `D2S AIgency’s ${n} agents`,
      items: (n: number): { icon: IconId; title: string; text: string; link?: { href: string; label: string } }[] => [
        {
          icon: "agents",
          title: "Your agents at work",
          text: `You find the agents you chose among D2S AIgency’s ${n}, each with its own job: prospecting, customer support, content, e-mail, accounting… You give them a task and see live how far they have got.`,
        },
        {
          icon: "approve",
          title: "You review, you approve",
          text: "Messages, proposals, posts: what your agents prepare waits for you in the hub. You read it, edit it if needed, then approve it.",
        },
        {
          icon: "calendar",
          title: "Your appointments, in one calendar",
          text: "Appointments booked by your agents, by phone, on your website or by e-mail, all land in the hub’s calendar. You can also link your own calendar.",
          link: { href: "#calendar", label: "How it works" },
        },
        {
          icon: "files",
          title: "Your deliverables and your brand",
          text: "Posts, proposals, analyses, reply templates: every deliverable is filed, ready to copy, download or print. Your brand profile and your documents guide your agents.",
        },
        {
          icon: "team",
          title: "The D2S team, one message away",
          text: "The hub’s inbox brings together your requests, our replies and news from your team. You get an e-mail each time we reply.",
        },
      ],
    },
    calendar: {
      id: "calendar",
      alias: "agenda",
      badge: "Optional",
      title: "Connecting your calendar (Google Calendar or Outlook)",
      lead: "The hub works without it. If you link your calendar, your agents only offer times when you are free and add the appointments they set to it: Inès for those agreed by e-mail, Loic for those booked by phone or on your website’s chat, Diva for job interviews.",
      how: "You connect it in the hub, on the Configuration page, under “Votre agenda” (your calendar), through Google’s or Microsoft’s own consent page: your password is only ever typed there, never in the hub.",
      reads: {
        title: "What the hub reads",
        text: [
          "The e-mail address of the connected account, to know which one is linked, and your busy times: when each one starts and ends. The hub never uses the title, location, attendees or content of your events.",
          "These busy times are read when an agent looks for a free slot or when the connection is checked, kept in memory for two minutes at most, and never stored in a database (only their number over the week is noted at each check): only the slots your agents offer or book are kept in your workspace.",
        ],
      },
      writes: {
        title: "What the hub writes",
        text: [
          "The appointments your agents set: the time, the subject, the place or video link, and the person concerned. For Inès’s and Diva’s, the person is invited: Google or Microsoft sends them the invitation (and the cancellation, if any). Loic confirms his appointments himself, by text message or e-mail.",
          "If you cancel one of these appointments in the hub, it is removed from your calendar.",
        ],
        health: [
          "Healthcare practices",
          "Loic and Inès write only the time, the place, initials and a link to the hub, without inviting anyone or creating a Meet or Teams link: no name, no contact details, no e-mail subject, no reason for the visit, no health detail. Inès attaches her own invitation to her reply; Loic confirms by text message or e-mail. Diva’s interviews, which do not concern your patients, keep the position and the candidate’s name, and the candidate is invited.",
        ],
      },
      never: {
        title: "What it never does",
        items: [
          "Read the title, location, attendees or content of your events, or change or delete an event it did not create.",
          "Sell your data, or use it for advertising.",
          "Use it to create, train or improve artificial intelligence models.",
          "Share it with anyone other than the providers the hub needs and the people your agents book meetings with, unless the law requires it.",
        ],
      },
      unplug: {
        title: "Disconnect at any time",
        hub: (
          <>
            In the hub: <strong>Configuration → Votre agenda → Déconnecter</strong> (disconnect). The access is erased from the hub and,
            unless it still serves another hub workspace’s calendar, we ask Google to revoke it. Appointments already added stay in your calendar.
          </>
        ),
        google: (
          <>
            From your Google account: <a href={GOOGLE_PERMISSIONS}>myaccount.google.com/permissions</a>, then remove D2S AIgency’s
            access.
          </>
        ),
        microsoft: <>With Outlook: also remove the app in your Microsoft account settings (apps you have allowed).</>,
      },
      commitment: {
        title: "Google user data: our commitment",
        intro: "What we do with your calendar data (access, use, storage, sharing, deletion) is set out in our privacy policy.",
        link: "Read the section about your calendar",
        anchor: "#google-calendar",
        translation: null,
      },
    },
    security: {
      kicker: "Security",
      title: "A private workspace that stays private.",
      lead: "Your agents work with your company’s information: it is protected at every step.",
      items: [
        {
          icon: <Shield size={22} />,
          title: "Encrypted access",
          text: "Encrypted connection (HTTPS) across the hub. The keys and authorisations of your services (calendar, mailbox…) are encrypted before being stored and are never displayed again. Each business only has access to its own workspace.",
        },
        {
          icon: <Globe size={22} />,
          title: "A database in the European Union",
          text: "The hub’s database is hosted in Ireland, in the European Union.",
        },
        {
          icon: <Check size={22} />,
          title: "Nothing is sent without your approval",
          text: "What your agents prepare waits for your go-ahead before it goes out. If you let an agent act on its own for a specific task, such as Loic answering your phone, you set the rules.",
        },
      ],
    },
    cta: {
      client: { title: "Already a client?", text: "Find your agents, appointments and deliverables.", action: "Go to my workspace" },
      prospect: { title: "Not a client yet?", text: "Let’s talk about what your agents could take on.", action: "Talk to the team" },
    },
    footer: {
      nav: "Useful links",
      home: "Website home",
      privacy: "Privacy",
      legal: "Legal notice",
      contact: "Contact",
      publisher: `${PUBLISHER.brand} is a brand of ${PUBLISHER.legalName} · ${OFFICE.street}, ${OFFICE.postalCode} ${OFFICE.city}, France`,
    },
  },
};

/**
 * The page's metadata (title, description, canonical and hreflang /hub ↔ /en/hub). A page's openGraph and twitter
 * replace the layout's whole (shallow merge), and the language's image files belong to the layout's segment, not to
 * this page's: their images are taken from `parent` and set again here, or the shared link would have no image.
 */
export async function hubMetadata(locale: Locale, parent: ResolvingMetadata): Promise<Metadata> {
  const t = TEXTS[locale];
  const { openGraph, twitter } = await parent;
  return {
    title: t.metaTitle,
    description: t.metaDescription,
    alternates: pageAlternates("/hub", locale),
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      locale: locale === "en" ? "en_US" : "fr_FR",
      url: hreflang("/hub")[locale],
      title: `${t.metaTitle} — ${SITE_NAME}`,
      description: t.metaDescription,
      ...(openGraph?.images?.length ? { images: openGraph.images } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: `${t.metaTitle} — ${SITE_NAME}`,
      description: t.metaDescription,
      ...(twitter?.images?.length ? { images: twitter.images } : {}),
    },
  };
}

/** The Limited Use statement, word for word as Google asks for it (in English on both pages). */
function GoogleStatement() {
  return (
    <blockquote lang="en" className={styles.quote}>
      <p>
        D2S AIgency’s use and transfer to any other app of information received from Google APIs will adhere to{" "}
        <a href={GOOGLE_USER_DATA_POLICY}>Google API Services User Data Policy</a>, including the Limited Use requirements.
      </p>
      <p>
        The use of information received from Google Workspace APIs will adhere to the{" "}
        <a href={GOOGLE_WORKSPACE_POLICY}>Google Workspace API User Data and Developer Policy</a>.
      </p>
    </blockquote>
  );
}

export function HubPage({ locale = "fr" }: { locale?: Locale }) {
  const t = TEXTS[locale];
  const team = agentCardsOf(locale);
  const features = t.features.items(team.length);
  const cal = t.calendar;

  return (
    <div className={styles.page}>
      <a href="#contenu" className={styles.skip}>
        {locale === "en" ? "Skip to content" : "Aller au contenu"}
      </a>

      <header className={styles.top}>
        <div className={`${styles.wrap} ${styles.topInner}`}>
          <Logo className={styles.brand} width={116} />
          <nav className={styles.topNav} aria-label={locale === "en" ? "Hub page" : "Page du hub"}>
            <a href={homeOf(locale)} className={styles.topLink}>
              {t.top.site}
            </a>
            <LanguageLink className={styles.lang} />
            <a href={APP_SIGN_IN} className={styles.topCta}>
              <span className={styles.long}>{t.top.signIn}</span>
              <span className={styles.short} aria-hidden="true">
                {t.top.signInShort}
              </span>
              <ArrowUpRight size={16} />
            </a>
          </nav>
        </div>
      </header>

      <main id="contenu" className={styles.main}>
        {/* Hero: what the hub is, and the two ways in. */}
        <section className={`${styles.wrap} ${styles.hero}`} aria-labelledby="hub-title">
          <div className={styles.heroCopy}>
            <p className={styles.badge}>
              <span className={styles.badgeIcon} aria-hidden="true">
                <Sparkle size={13} />
              </span>
              {t.badge}
            </p>
            <h1 id="hub-title" className={styles.title}>
              {t.title[0]}
              <span className={styles.accent}>{t.title[1]}</span>
              {t.title[2]}
            </h1>
            <p className={styles.lead}>{t.lead}</p>
            <div className={styles.actions}>
              <Button href={APP_SIGN_IN} icon={<ArrowRight size={20} />} size="lg" className={styles.primaryBtn}>
                {t.signIn}
              </Button>
              <Button href={contactHrefOf(locale)} variant="secondary" size="lg">
                {t.talk}
              </Button>
            </div>
            <p className={styles.access}>{t.access}</p>
          </div>

          <figure className={styles.preview}>
            <div className={styles.window} aria-hidden="true">
              <div className={styles.chrome}>
                <span className={styles.dots}>
                  <i />
                  <i />
                  <i />
                </span>
                <span className={styles.url}>app.d2saigency.com</span>
              </div>
              <div className={styles.winBody}>
                <div className={styles.winHead}>
                  <p className={styles.winTitle}>{t.preview.title}</p>
                  <span className={styles.live}>
                    <i />
                    {t.preview.live}
                  </span>
                </div>
                <ul className={styles.feed}>
                  {PREVIEW.map((p, i) => {
                    const a = agentCard(p.key, locale);
                    return (
                      <li key={p.key} className={styles.feedItem} style={{ "--i": i } as CSSProperties}>
                        {/* eslint-disable-next-line @next/next/no-img-element -- avatar */}
                        <img src={a.avatar} alt="" width={40} height={40} className={styles.feedAvatar} />
                        <span className={styles.feedText}>
                          <span className={styles.feedName}>
                            {a.name} <span>· {a.role}</span>
                          </span>
                          <span className={styles.feedTask}>{locale === "en" ? p.en : p.fr}</span>
                        </span>
                        <span className={styles.chip} data-status={p.status}>
                          {t.preview.status[p.status]}
                        </span>
                      </li>
                    );
                  })}
                </ul>
                <div className={styles.winFoot}>
                  <span className={styles.fakePrimary}>
                    <Check size={16} />
                    {t.preview.primary}
                  </span>
                  <span className={styles.fakeGhost}>{t.preview.secondary}</span>
                </div>
              </div>
            </div>
            <figcaption className={styles.caption}>{t.preview.caption}</figcaption>
          </figure>
        </section>

        {/* What the client does in the hub. */}
        <section className={`${styles.wrap} ${styles.section}`} aria-labelledby="hub-features">
          <header className={styles.head}>
            <p className={styles.kicker}>{t.features.kicker}</p>
            <h2 id="hub-features" className={styles.h2}>
              {t.features.title}
            </h2>
            <p className={styles.headLead}>{t.features.lead}</p>
          </header>
          <ul className={styles.features}>
            {features.map((f, i) => (
              <li key={f.icon} className={styles.feature} data-wide={i === 0 || undefined}>
                <span className={styles.icon} aria-hidden="true">
                  {ICONS[f.icon]}
                </span>
                <h3 className={styles.h3}>{f.title}</h3>
                <p className={styles.text}>{f.text}</p>
                {f.link && (
                  <a href={f.link.href} className={styles.inlineLink}>
                    {f.link.label}
                    <ArrowRight size={16} />
                  </a>
                )}
                {i === 0 && (
                  <ul className={styles.team} aria-label={t.features.teamLabel(team.length)}>
                    {team.map((a) => (
                      <li key={a.key}>
                        {/* eslint-disable-next-line @next/next/no-img-element -- avatar */}
                        <img src={a.avatar} alt={`${a.name}, ${a.role}`} title={`${a.name} · ${a.role}`} width={44} height={44} loading="lazy" decoding="async" />
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </section>

        {/* Google Calendar / Outlook: what is read, what is written, how to unplug, Google's Limited Use statement. */}
        <span id={cal.alias} className={styles.alias} aria-hidden="true" />
        <section id={cal.id} className={`${styles.wrap} ${styles.section} ${styles.anchor}`} aria-labelledby="hub-calendar">
          <div className={styles.panel}>
            <header className={styles.head}>
              <p className={styles.optional}>
                <Plug size={16} />
                {cal.badge}
              </p>
              <h2 id="hub-calendar" className={styles.h2}>
                {cal.title}
              </h2>
              <p className={styles.headLead}>{cal.lead}</p>
              <p className={styles.headNote}>{cal.how}</p>
            </header>

            <div className={styles.facts}>
              <article className={styles.fact}>
                <span className={styles.icon} aria-hidden="true">
                  <Search size={20} />
                </span>
                <h3 className={styles.h3}>{cal.reads.title}</h3>
                {cal.reads.text.map((p) => (
                  <p key={p} className={styles.text}>
                    {p}
                  </p>
                ))}
              </article>
              <article className={styles.fact}>
                <span className={styles.icon} aria-hidden="true">
                  <Calendar size={20} />
                </span>
                <h3 className={styles.h3}>{cal.writes.title}</h3>
                {cal.writes.text.map((p) => (
                  <p key={p} className={styles.text}>
                    {p}
                  </p>
                ))}
                <p className={styles.health}>
                  <strong>{cal.writes.health[0]}</strong>
                  {locale === "en" ? ": " : "\u00a0: "}
                  {cal.writes.health[1]}
                </p>
              </article>
              <article className={styles.fact} data-tone="never">
                <span className={styles.icon} aria-hidden="true">
                  <Close size={20} />
                </span>
                <h3 className={styles.h3}>{cal.never.title}</h3>
                <ul className={styles.never}>
                  {cal.never.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>
            </div>

            <div className={styles.split}>
              <div className={styles.unplug}>
                <h3 className={styles.h3}>{cal.unplug.title}</h3>
                <ol className={styles.steps}>
                  <li>{cal.unplug.hub}</li>
                  <li>{cal.unplug.google}</li>
                  <li>{cal.unplug.microsoft}</li>
                </ol>
              </div>
              <div className={styles.commitment}>
                <h3 className={styles.h3}>{cal.commitment.title}</h3>
                <GoogleStatement />
                {cal.commitment.translation && <p className={styles.translation}>{cal.commitment.translation}</p>}
                <p className={styles.text}>{cal.commitment.intro}</p>
                <a href={`${privacyHrefOf(locale)}${cal.commitment.anchor}`} className={styles.inlineLink}>
                  {cal.commitment.link}
                  <ArrowRight size={16} />
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Security. */}
        <section className={`${styles.wrap} ${styles.section} ${styles.security}`} aria-labelledby="hub-security">
          <header className={styles.head}>
            <p className={styles.kicker}>{t.security.kicker}</p>
            <h2 id="hub-security" className={styles.h2}>
              {t.security.title}
            </h2>
            <p className={styles.headLead}>{t.security.lead}</p>
          </header>
          <ul className={styles.guarantees}>
            {t.security.items.map((s) => (
              <li key={s.title} className={styles.guarantee}>
                <span className={styles.icon} aria-hidden="true">
                  {s.icon}
                </span>
                <div>
                  <h3 className={styles.h3}>{s.title}</h3>
                  <p className={styles.text}>{s.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* The two ways in, again. */}
        <section className={`${styles.wrap} ${styles.section} ${styles.ctas}`} aria-label={locale === "en" ? "Get started" : "Pour commencer"}>
          <div className={styles.ctaCard} data-tone="client">
            <h2 className={styles.ctaTitle}>{t.cta.client.title}</h2>
            <p className={styles.ctaText}>{t.cta.client.text}</p>
            <a href={APP_SIGN_IN} className={styles.ctaLight}>
              {t.cta.client.action}
              <ArrowRight size={18} />
            </a>
          </div>
          <div className={styles.ctaCard}>
            <h2 className={styles.ctaTitle}>{t.cta.prospect.title}</h2>
            <p className={styles.ctaText}>{t.cta.prospect.text}</p>
            <Button href={contactHrefOf(locale)} icon={<ArrowRight size={20} />} size="lg" className={styles.primaryBtn}>
              {t.cta.prospect.action}
            </Button>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={`${styles.wrap} ${styles.footerInner}`}>
          <p className={styles.publisher}>{t.footer.publisher}</p>
          <nav aria-label={t.footer.nav}>
            <ul className={styles.footerLinks}>
              <li>
                <a href={homeOf(locale)}>{t.footer.home}</a>
              </li>
              <li>
                <a href={privacyHrefOf(locale)}>{t.footer.privacy}</a>
              </li>
              <li>
                <a href={legalHrefOf(locale)}>{t.footer.legal}</a>
              </li>
              <li>
                <a href={contactHrefOf(locale)}>{t.footer.contact}</a>
              </li>
            </ul>
          </nav>
        </div>
      </footer>
    </div>
  );
}
