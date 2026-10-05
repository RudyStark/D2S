"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent,
} from "react";
import {
  ArrowRight,
  Bars,
  Calendar,
  Check,
  ChevronDown,
  ChevronRight,
  Clock,
  Close,
  ContactCard,
  Mail,
  People,
  Sparkle,
} from "@/components/ui/Icons";
import { LanguageLink } from "@/components/i18n/LanguageLink";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { MayChat } from "@/components/may/MayChat";
import { ContactDialog } from "@/components/ui/ContactDialog";
import { Logo } from "@/components/ui/Logo";
import { servicesText } from "@/lib/services";
import { siteText } from "@/lib/site";
import { teamOf, type AgentProfile } from "@/lib/team";
import { moreByPoleOf, moreTeamOf } from "@/lib/team-more";
import { legalHrefOf, privacyHrefOf } from "@/lib/legal";
import { MobileAgentDialog } from "./MobileAgentDialog";
import { MobileContact } from "./MobileContact";
import { MobileDiagnostic } from "./MobileDiagnostic";
import {
  mobileSectionsOf,
  scrollToMobileSection,
  type MobileContactIntent,
} from "./mobile-navigation";
import styles from "./MobileHome.module.css";

const TEXTS = {
  fr: {
    skip: "Aller au contenu",
    openMenu: "Ouvrir le menu",
    closeMenu: "Fermer le menu",
    nav: "Navigation mobile",
    explore: "Explorez l’agence",
    tagline: "L’IA, plus humaine, plus utile.",
    badge: "L’IA, plus humaine, plus utile",
    hero: ["L’agence IA", "qui transforme", "votre temps en", "performance."],
    heroLead: "Des agents IA sur mesure pour automatiser vos tâches et libérer ce qui compte vraiment.",
    start: "Démarrer un projet",
    discover: "Découvrir nos agents",
    heroRoles: { content: "Création de contenu", support: "Support client" } as Record<string, string>,
    scroll: "Défilez pour découvrir",
    mission: "Notre mission",
    missionTitle: ["L’IA au service des gens et des", "idées qui comptent."],
    missionLead: "L’humain, la créativité et l’impact au cœur de chaque projet.",
    mayAlt: "May, votre commerciale IA",
    hello: ["Bonjour,", "moi c’est", "May."],
    helps: "Je vous aide à trouver le bon agent.",
    benefits: [
      ["Plus de temps", "Automatisez les tâches répétitives et concentrez-vous sur l’essentiel."],
      ["Plus d’impact", "Des agents IA qui renforcent vos équipes au quotidien."],
      ["Croissance durable", "Des agents qui évoluent avec vos besoins."],
    ],
    services: "Nos services",
    servicesTitle: ["L’IA qui s’adapte", "à vous."],
    servicesLead: "Connectée à vos outils. Pensée pour vos équipes.",
    ready: "Des agents prêts à travailler",
    tools: ["E-mail", "CRM", "Agenda"],
    find: "Trouver mon agent",
    specific: "Un besoin spécifique ?",
    unique: "Un processus unique à votre métier ? Nous construisons votre agent sur mesure.",
    talkNeed: "Parlons de votre besoin",
    method: "Notre méthode",
    methodTitle: "De l’idée à l’impact.",
    result: "Le résultat",
    role: "Votre rôle",
    agents: "Nos agents IA",
    agentsTitle: ["Une équipe IA.", "Vos ambitions."],
    agentsLead: "Cinq agents phares, et toute une équipe derrière eux.",
    discoverOne: (name: string, role: string) => `Découvrir ${name}, ${role}`,
    discoverShort: "Découvrir",
    experts: (n: number) => `+${n} experts dans l’équipe`,
    expertsText: "Chacun a son métier précis, et ils se passent le relais.",
    findAgent: "Trouver l’agent qu’il vous faut",
    control: "Vous gardez le dernier mot.",
    controlText: "Des agents IA à vos côtés, avec vos équipes aux commandes.",
    faq: "Questions fréquentes",
    faqTitle: ["Vos questions,", "nos réponses."],
    legalNav: "Informations légales",
    legal: "Mentions légales",
    privacy: "Confidentialité",
    top: "Retour en haut",
  },
  en: {
    skip: "Skip to content",
    openMenu: "Open the menu",
    closeMenu: "Close the menu",
    nav: "Mobile navigation",
    explore: "Explore the agency",
    tagline: "AI, more human, more useful.",
    badge: "AI, more human, more useful",
    hero: ["The AI agency", "that turns", "your time into", "performance."],
    heroLead: "Custom AI agents to automate your tasks and free up what really matters.",
    start: "Start a project",
    discover: "Meet our agents",
    heroRoles: { content: "Content creation", support: "Customer support" } as Record<string, string>,
    scroll: "Scroll to discover",
    mission: "Our mission",
    missionTitle: ["AI working for the people and the", "ideas that matter."],
    missionLead: "People, creativity and impact at the heart of every project.",
    mayAlt: "May, your AI sales rep",
    hello: ["Hello,", "I’m", "May."],
    helps: "I help you find the right agent.",
    benefits: [
      ["More time", "Automate repetitive tasks and focus on what matters."],
      ["More impact", "AI agents that strengthen your teams every day."],
      ["Lasting growth", "Agents that grow with your needs."],
    ],
    services: "Our services",
    servicesTitle: ["AI that adapts", "to you."],
    servicesLead: "Connected to your tools. Designed for your teams.",
    ready: "Agents ready to work",
    tools: ["E-mail", "CRM", "Calendar"],
    find: "Find my agent",
    specific: "A specific need?",
    unique: "A process unique to your trade? We build your custom agent.",
    talkNeed: "Let’s talk about your need",
    method: "Our method",
    methodTitle: "From idea to impact.",
    result: "The result",
    role: "Your role",
    agents: "Our AI agents",
    agentsTitle: ["An AI team.", "Your ambitions."],
    agentsLead: "Five flagship agents, and a whole team behind them.",
    discoverOne: (name: string, role: string) => `Meet ${name}, ${role}`,
    discoverShort: "Meet",
    experts: (n: number) => `+${n} experts on the team`,
    expertsText: "Each one has a precise trade, and they hand over to each other.",
    findAgent: "Find the agent you need",
    control: "You keep the final say.",
    controlText: "AI agents by your side, with your teams in charge.",
    faq: "Frequently asked questions",
    faqTitle: ["Your questions,", "our answers."],
    legalNav: "Legal information",
    legal: "Legal notice",
    privacy: "Privacy",
    top: "Back to top",
  },
};

/** Native anchors still work before hydration. Modified clicks retain their normal behaviour. */
function anchorClick(event: MouseEvent<HTMLAnchorElement>, id: string) {
  if (
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey ||
    event.button !== 0
  )
    return;
  event.preventDefault();
  window.history.pushState(null, "", `#${id}`);
  scrollToMobileSection(id);
}

export default function MobileHome() {
  const locale = useLocale();
  const t = TEXTS[locale];
  const TEAM = teamOf(locale);
  const MORE_TEAM = moreTeamOf(locale);
  const MORE_BY_POLE = moreByPoleOf(locale);
  const MOBILE_SECTIONS = mobileSectionsOf(locale);
  const { services: SERVICES, intro: SERVICES_INTRO, steps: METHOD_STEPS, promises: METHOD_PROMISES } = servicesText(locale);
  const FAQ = siteText(locale).faq;
  const root = useRef<HTMLDivElement>(null);
  const progress = useRef<HTMLSpanElement>(null);
  const menu = useRef<HTMLDialogElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  // "Contact" in the menu: the same direct-message dialog as on desktop.
  const [contactOpen, setContactOpen] = useState(false);
  const [active, setActive] = useState("agence");
  const [agent, setAgent] = useState<AgentProfile | null>(null);
  const [intent, setIntent] = useState<MobileContactIntent | null>(null);

  const contact = useCallback((next: MobileContactIntent) => {
    setIntent({ ...next, stamp: Date.now() });
    setAgent(null);
    window.history.pushState(null, "", "#contact");
    requestAnimationFrame(() => scrollToMobileSection("contact"));
  }, []);

  useEffect(() => {
    if (!window.matchMedia("(max-width: 1024px)").matches) return;
    const container = root.current;
    if (!container) return;
    let raf = 0;
    const sections = Array.from(
      container.querySelectorAll<HTMLElement>("[data-mobile-section]"),
    );
    const update = () => {
      raf = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (progress.current)
        progress.current.style.transform = `scaleX(${max > 0 ? Math.min(1, window.scrollY / max) : 0})`;
      let current = "agence";
      for (const section of sections)
        if (section.getBoundingClientRect().top <= 160) current = section.id;
      setActive((previous) => (previous === current ? previous : current));
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.setAttribute("data-revealed", "true");
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.08 },
    );
    container
      .querySelectorAll("[data-reveal]")
      .forEach((element) => observer.observe(element));
    const resize = new ResizeObserver(schedule);
    resize.observe(container);
    const hash = () => {
      const id = window.location.hash.slice(1);
      if (id) requestAnimationFrame(() => scrollToMobileSection(id, true));
    };
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    window.addEventListener("hashchange", hash);
    update();
    hash();
    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      resize.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("hashchange", hash);
    };
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const dialog = menu.current;
    if (!dialog) return;
    dialog.showModal();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      dialog.close();
      document.body.style.overflow = overflow;
    };
  }, [menuOpen]);

  return (
    <div ref={root} className={styles.root} data-mobile-home>
      <a
        href="#nos-services"
        className="skip-link"
        onClick={(e) => anchorClick(e, "nos-services")}
      >
        {t.skip}
      </a>
      <header className={styles.header} data-mobile-header>
        <div className={styles.headerInner}>
          <Logo width={106} className={styles.logo} />
          <div className={styles.headerEnd}>
          <LanguageLink className={styles.lang} />
          <button
            type="button"
            className={styles.menuButton}
            aria-label={t.openMenu}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            onClick={() => setMenuOpen(true)}
          >
            <span />
            <span />
            <span />
          </button>
          </div>
        </div>
        <div className={styles.progress} aria-hidden="true">
          <span ref={progress} />
        </div>
      </header>

      <dialog
        ref={menu}
        id="mobile-menu"
        className={styles.menu}
        aria-label="Navigation"
        onCancel={() => setMenuOpen(false)}
        onClick={(e) => {
          if (e.target === e.currentTarget) setMenuOpen(false);
        }}
      >
        <div className={styles.menuTop}>
          <Logo width={112} />
          <button
            type="button"
            className={styles.iconButton}
            aria-label={t.closeMenu}
            onClick={() => setMenuOpen(false)}
            autoFocus
          >
            <Close />
          </button>
        </div>
        <p className={styles.eyebrow}>{t.explore}</p>
        <nav aria-label={t.nav}>
          {MOBILE_SECTIONS.map(({ id, label }, i) => (
            <a
              key={id}
              href={`#${id}`}
              aria-current={active === id ? "location" : undefined}
              onClick={(e) => {
                menu.current?.close();
                setMenuOpen(false);
                anchorClick(e, id);
              }}
            >
              <span>{String(i + 1).padStart(2, "0")}</span>
              {label}
              <ArrowRight size={18} />
            </a>
          ))}
          <button
            type="button"
            aria-haspopup="dialog"
            onClick={() => {
              menu.current?.close();
              setMenuOpen(false);
              setContactOpen(true);
            }}
          >
            <span>{String(MOBILE_SECTIONS.length + 1).padStart(2, "0")}</span>
            Contact
            <ArrowRight size={18} />
          </button>
        </nav>
        <LanguageLink variant="menu" className={styles.menuLang} />
        <p className={styles.menuNote}>{t.tagline}</p>
      </dialog>
      <ContactDialog open={contactOpen} onClose={() => setContactOpen(false)} />

      <main>
        <section
          id="agence"
          tabIndex={-1}
          className={`${styles.section} ${styles.hero}`}
          data-mobile-section
          aria-labelledby="mobile-hero-title"
        >
          <div className={styles.inner}>
            <p className={styles.badge}>
              <Sparkle size={15} />
              {t.badge}
            </p>
            <h1 id="mobile-hero-title" className={styles.heroTitle}>
              {t.hero[0]}
              <br />
              {t.hero[1]}
              <br />
              {t.hero[2]}
              <br />
              <span>{t.hero[3]}</span>
            </h1>
            <p className={styles.lead}>{t.heroLead}</p>
            <div className={styles.heroActions}>
              <button
                type="button"
                className={styles.primary}
                onClick={() => contact({ source: "mobile-hero" })}
              >
                {t.start}
                <ArrowRight />
              </button>
              <a
                href="#nos-agents-ia"
                className={styles.secondary}
                onClick={(e) => anchorClick(e, "nos-agents-ia")}
              >
                {t.discover}
                <ChevronRight />
              </a>
            </div>
            <div className={styles.heroAgents}>
              {[TEAM[0], TEAM[1]].map((person) => (
                <div key={person.type} className={styles.heroAgent}>
                  {/* Existing 2D cut-outs, never the GLB or a WebGL screenshot. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/images/agents/${person.type}.webp`}
                    width={person.type === "content" ? 472 : 473}
                    height={person.type === "content" ? 1178 : 1120}
                    alt={`${person.name}, ${person.role}`}
                    fetchPriority="high"
                  />
                  <span>
                    <strong>{person.name}</strong>
                    {t.heroRoles[person.type]}
                  </span>
                </div>
              ))}
            </div>
            <a
              href="#mission"
              className={styles.scrollCue}
              onClick={(e) => anchorClick(e, "mission")}
            >
              <ChevronDown size={22} />
              <span>{t.scroll}</span>
            </a>
          </div>
        </section>

        <section
          id="mission"
          tabIndex={-1}
          className={styles.section}
          data-mobile-section
          aria-labelledby="mobile-mission-title"
        >
          <div className={styles.inner}>
            <div data-reveal>
              <p className={styles.eyebrow}>{t.mission}</p>
              <h2 id="mobile-mission-title" className={styles.title}>
                {t.missionTitle[0]} <span>{t.missionTitle[1]}</span>
              </h2>
              <p className={styles.lead}>{t.missionLead}</p>
            </div>
            <div className={styles.welcome} data-reveal>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                className={styles.may}
                src="/images/agents/prospection.webp"
                alt={t.mayAlt}
                width={526}
                height={1165}
                loading="lazy"
              />
              <div className={styles.welcomeCopy}>
                <h3>
                  {t.hello[0]}
                  <br />
                  {t.hello[1]} <span>{t.hello[2]}</span>
                </h3>
                <p>{t.helps}</p>
              </div>
              <div className={styles.welcomeChat}>
                <MayChat
                  variant="mobile"
                  showIntro={false}
                  onContact={(message) =>
                    contact({
                      source: "may-chat-mobile",
                      need: "unsure",
                      message,
                    })
                  }
                />
              </div>
            </div>
            <ul className={styles.benefits} data-reveal>
              <li>
                <span className={styles.roundIcon}>
                  <Clock />
                </span>
                <div>
                  <strong>{t.benefits[0][0]}</strong>
                  <p>{t.benefits[0][1]}</p>
                </div>
              </li>
              <li>
                <span className={styles.roundIcon}>
                  <Bars />
                </span>
                <div>
                  <strong>{t.benefits[1][0]}</strong>
                  <p>{t.benefits[1][1]}</p>
                </div>
              </li>
              <li>
                <span className={styles.roundIcon}>
                  <People />
                </span>
                <div>
                  <strong>{t.benefits[2][0]}</strong>
                  <p>{t.benefits[2][1]}</p>
                </div>
              </li>
            </ul>
          </div>
        </section>

        <section
          id="nos-services"
          tabIndex={-1}
          className={`${styles.section} ${styles.tinted}`}
          data-mobile-section
          aria-labelledby="mobile-services-title"
        >
          <div className={styles.inner}>
            <div data-reveal>
              <p className={styles.eyebrow}>{t.services}</p>
              <h2 id="mobile-services-title" className={styles.title}>
                {t.servicesTitle[0]} <span>{t.servicesTitle[1]}</span>
              </h2>
              <p className={styles.lead}>{t.servicesLead}</p>
            </div>
            <article className={styles.serviceCard} data-reveal>
              <p className={styles.eyebrow}>01 · Plug & Play</p>
              <h3>{t.ready}</h3>
              <p>{SERVICES[0].text}</p>
              <ul className={styles.checkList}>
                {SERVICES[0].benefits.map((benefit) => (
                  <li key={benefit.title}>
                    <Check size={18} />
                    <span>
                      <strong>{benefit.title}</strong>
                      {benefit.text}
                    </span>
                  </li>
                ))}
              </ul>
              <div className={styles.tools}>
                <span>
                  <Mail />
                  {t.tools[0]}
                </span>
                <span>
                  <ContactCard />
                  {t.tools[1]}
                </span>
                <span>
                  <Calendar />
                  {t.tools[2]}
                </span>
              </div>
              <a
                href="#comment-choisir"
                className={styles.primary}
                onClick={(e) => anchorClick(e, "comment-choisir")}
              >
                {t.find}
                <ArrowRight />
              </a>
              <details className={styles.serviceDetails}>
                <summary>
                  {t.specific}
                  <ChevronDown size={18} />
                </summary>
                <p>
                  {SERVICES_INTRO.lead} {t.unique}
                </p>
                <button
                  type="button"
                  className={styles.textButton}
                  onClick={() =>
                    contact({ source: "mobile-custom", need: "custom" })
                  }
                >
                  {t.talkNeed}
                  <ArrowRight size={17} />
                </button>
              </details>
            </article>
            <div className={styles.method} data-reveal>
              <p className={styles.eyebrow}>{t.method}</p>
              <h3>{t.methodTitle}</h3>
              <ol>
                {METHOD_STEPS.map((step, i) => (
                  <li key={step.title}>
                    <span className={styles.stepNumber}>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <details>
                      <summary>
                        <span>
                          {step.title}
                          <small>{step.summary}</small>
                        </span>
                        <ChevronDown size={18} />
                      </summary>
                      <div className={styles.stepDetail}>
                        <p>{step.detail}</p>
                        <p>
                          <strong>{t.result}</strong>
                          {step.outcome}
                        </p>
                        <p>
                          <strong>{t.role}</strong>
                          {step.role}
                        </p>
                      </div>
                    </details>
                  </li>
                ))}
              </ol>
              <ul className={styles.promises}>
                {METHOD_PROMISES.map((promise) => (
                  <li key={promise}>
                    <Check size={16} />
                    {promise}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section
          id="nos-agents-ia"
          tabIndex={-1}
          className={styles.section}
          data-mobile-section
          aria-labelledby="mobile-agents-title"
        >
          <div className={styles.inner}>
            <div data-reveal>
              <p className={styles.eyebrow}>{t.agents}</p>
              <h2 id="mobile-agents-title" className={styles.title}>
                {t.agentsTitle[0]}
                <br />
                <span>{t.agentsTitle[1]}</span>
              </h2>
              <p className={styles.lead}>{t.agentsLead}</p>
            </div>
            <ul className={styles.agentList}>
              {TEAM.map((person) => (
                <li key={person.type} data-reveal>
                  <button
                    type="button"
                    className={styles.agentCard}
                    onClick={() => setAgent(person)}
                    aria-label={t.discoverOne(person.name, person.role)}
                  >
                    <span
                      className={styles.agentPortrait}
                      style={{
                        background: `linear-gradient(150deg, ${person.tint[0]}, ${person.tint[1]})`,
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`/images/agents/${person.type}.webp`}
                        alt=""
                        width={100}
                        height={240}
                        loading="lazy"
                      />
                    </span>
                    <span className={styles.agentInfo}>
                      <strong>{person.name}</strong>
                      <span>{person.role}</span>
                      <small>{t.discoverShort}</small>
                    </span>
                    <span className={styles.agentArrow}>
                      <ChevronRight />
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            {/* The rest of the team: a few concrete lines, not eleven more cards. */}
            <div className={styles.moreTeam} data-reveal>
              <div className={styles.moreHead}>
                <span className={styles.moreStack} aria-hidden="true">
                  {MORE_TEAM.slice(0, 5).map((a) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={a.slug} src={a.avatar} alt="" width={34} height={34} loading="lazy" />
                  ))}
                  <b>+{MORE_TEAM.length - 5}</b>
                </span>
                <span>
                  <strong>{t.experts(MORE_TEAM.length)}</strong>
                  {t.expertsText}
                </span>
              </div>
              <ul className={styles.morePoles}>
                {MORE_BY_POLE.map((p) => (
                  <li key={p.pole}>
                    <span className={styles.morePole}>
                      <strong>{p.label}</strong>
                      <span className={styles.moreFaces} aria-hidden="true">
                        {p.agents.map((slug) => (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img key={slug} src={`/images/agents/${slug}-avatar.webp`} alt="" width={24} height={24} loading="lazy" />
                        ))}
                      </span>
                    </span>
                    <p>{p.text}</p>
                  </li>
                ))}
              </ul>
              <a href="#comment-choisir" className={styles.moreLink} onClick={(e) => anchorClick(e, "comment-choisir")}>
                {t.findAgent}
                <ChevronRight />
              </a>
            </div>
            <p className={styles.control}>
              <People size={26} />
              <span>
                <strong>{t.control}</strong>
                {t.controlText}
              </span>
            </p>
          </div>
        </section>

        <MobileDiagnostic onContact={contact} onAgent={setAgent} />

        <section
          id="questions"
          tabIndex={-1}
          className={styles.section}
          data-mobile-section
          aria-labelledby="mobile-faq-title"
        >
          <div className={styles.inner}>
            <div data-reveal>
              <p className={styles.eyebrow}>{t.faq}</p>
              <h2 id="mobile-faq-title" className={styles.title}>
                {t.faqTitle[0]}
                <br />
                <span>{t.faqTitle[1]}</span>
              </h2>
            </div>
            <div className={styles.faq}>
              {FAQ.map(({ q, a }) => (
                <details key={q} name="mobile-faq">
                  <summary>
                    {q}
                    <ChevronDown size={18} />
                  </summary>
                  <p>{a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <MobileContact
          intent={intent}
          onClearDiagnostic={() =>
            setIntent((current) =>
              current ? { ...current, diagnostic: undefined } : null,
            )
          }
        />
      </main>

      <footer className={styles.footer}>
        <Logo width={110} animated={false} />
        <p>{t.tagline}</p>
        <nav aria-label={t.legalNav}>
          <a href={legalHrefOf(locale)}>{t.legal}</a>
          <a href={privacyHrefOf(locale)}>{t.privacy}</a>
        </nav>
        <small>© {new Date().getFullYear()} D2S AIgency</small>
        <a
          href="#agence"
          className={styles.backTop}
          onClick={(e) => anchorClick(e, "agence")}
        >
          {t.top}
          <ChevronDown size={16} />
        </a>
      </footer>

      {agent && (
        <MobileAgentDialog
          key={agent.type}
          agent={agent}
          onClose={() => setAgent(null)}
          onContact={contact}
        />
      )}
    </div>
  );
}
