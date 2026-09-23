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
import { MayChat } from "@/components/may/MayChat";
import { ContactDialog } from "@/components/ui/ContactDialog";
import { Logo } from "@/components/ui/Logo";
import {
  METHOD_PROMISES,
  METHOD_STEPS,
  SERVICES,
  SERVICES_INTRO,
} from "@/lib/services";
import { FAQ } from "@/lib/site";
import { TEAM, type AgentProfile } from "@/lib/team";
import { LEGAL_HREF, PRIVACY_HREF } from "@/lib/legal";
import { MobileAgentDialog } from "./MobileAgentDialog";
import { MobileContact } from "./MobileContact";
import { MobileDiagnostic } from "./MobileDiagnostic";
import {
  MOBILE_SECTIONS,
  scrollToMobileSection,
  type MobileContactIntent,
} from "./mobile-navigation";
import styles from "./MobileHome.module.css";

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
        Aller au contenu
      </a>
      <header className={styles.header} data-mobile-header>
        <div className={styles.headerInner}>
          <Logo width={106} className={styles.logo} />
          <button
            type="button"
            className={styles.menuButton}
            aria-label="Ouvrir le menu"
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            onClick={() => setMenuOpen(true)}
          >
            <span />
            <span />
            <span />
          </button>
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
            aria-label="Fermer le menu"
            onClick={() => setMenuOpen(false)}
            autoFocus
          >
            <Close />
          </button>
        </div>
        <p className={styles.eyebrow}>Explorez l’agence</p>
        <nav aria-label="Navigation mobile">
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
        <p className={styles.menuNote}>L’IA, plus humaine, plus utile.</p>
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
              L’IA, plus humaine, plus utile
            </p>
            <h1 id="mobile-hero-title" className={styles.heroTitle}>
              L’agence IA
              <br />
              qui transforme
              <br />
              votre temps en
              <br />
              <span>performance.</span>
            </h1>
            <p className={styles.lead}>
              Des agents IA sur mesure pour automatiser vos tâches et libérer ce
              qui compte vraiment.
            </p>
            <div className={styles.heroActions}>
              <button
                type="button"
                className={styles.primary}
                onClick={() => contact({ source: "mobile-hero" })}
              >
                Démarrer un projet
                <ArrowRight />
              </button>
              <a
                href="#nos-agents-ia"
                className={styles.secondary}
                onClick={(e) => anchorClick(e, "nos-agents-ia")}
              >
                Découvrir nos agents
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
                    {person.type === "content"
                      ? "Création de contenu"
                      : "Support client"}
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
              <span>Défilez pour découvrir</span>
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
              <p className={styles.eyebrow}>Notre mission</p>
              <h2 id="mobile-mission-title" className={styles.title}>
                L’IA au service des gens et des <span>idées qui comptent.</span>
              </h2>
              <p className={styles.lead}>
                L’humain, la créativité et l’impact au cœur de chaque projet.
              </p>
            </div>
            <div className={styles.welcome} data-reveal>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                className={styles.may}
                src="/images/agents/prospection.webp"
                alt="May, votre commerciale IA"
                width={526}
                height={1165}
                loading="lazy"
              />
              <div className={styles.welcomeCopy}>
                <h3>
                  Bonjour,
                  <br />
                  moi c’est <span>May.</span>
                </h3>
                <p>Je vous aide à trouver le bon agent.</p>
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
                  <strong>Plus de temps</strong>
                  <p>
                    Automatisez les tâches répétitives et concentrez-vous sur
                    l’essentiel.
                  </p>
                </div>
              </li>
              <li>
                <span className={styles.roundIcon}>
                  <Bars />
                </span>
                <div>
                  <strong>Plus d’impact</strong>
                  <p>Des agents IA qui renforcent vos équipes au quotidien.</p>
                </div>
              </li>
              <li>
                <span className={styles.roundIcon}>
                  <People />
                </span>
                <div>
                  <strong>Croissance durable</strong>
                  <p>Des agents qui évoluent avec vos besoins.</p>
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
              <p className={styles.eyebrow}>Nos services</p>
              <h2 id="mobile-services-title" className={styles.title}>
                L’IA qui s’adapte <span>à vous.</span>
              </h2>
              <p className={styles.lead}>
                Connectée à vos outils. Pensée pour vos équipes.
              </p>
            </div>
            <article className={styles.serviceCard} data-reveal>
              <p className={styles.eyebrow}>01 · Plug & Play</p>
              <h3>Des agents prêts à travailler</h3>
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
                  E-mail
                </span>
                <span>
                  <ContactCard />
                  CRM
                </span>
                <span>
                  <Calendar />
                  Agenda
                </span>
              </div>
              <a
                href="#comment-choisir"
                className={styles.primary}
                onClick={(e) => anchorClick(e, "comment-choisir")}
              >
                Trouver mon agent
                <ArrowRight />
              </a>
              <details className={styles.serviceDetails}>
                <summary>
                  Un besoin spécifique ?<ChevronDown size={18} />
                </summary>
                <p>
                  {SERVICES_INTRO.lead} Un processus unique à votre métier ?
                  Nous construisons votre agent sur mesure.
                </p>
                <button
                  type="button"
                  className={styles.textButton}
                  onClick={() =>
                    contact({ source: "mobile-custom", need: "custom" })
                  }
                >
                  Parlons de votre besoin
                  <ArrowRight size={17} />
                </button>
              </details>
            </article>
            <div className={styles.method} data-reveal>
              <p className={styles.eyebrow}>Notre méthode</p>
              <h3>De l’idée à l’impact.</h3>
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
                          <strong>Le résultat</strong>
                          {step.outcome}
                        </p>
                        <p>
                          <strong>Votre rôle</strong>
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
              <p className={styles.eyebrow}>Nos agents IA</p>
              <h2 id="mobile-agents-title" className={styles.title}>
                Une équipe IA.
                <br />
                <span>Vos ambitions.</span>
              </h2>
              <p className={styles.lead}>
                Cinq expertises complémentaires pour couvrir vos besoins.
              </p>
            </div>
            <ul className={styles.agentList}>
              {TEAM.map((person) => (
                <li key={person.type} data-reveal>
                  <button
                    type="button"
                    className={styles.agentCard}
                    onClick={() => setAgent(person)}
                    aria-label={`Découvrir ${person.name}, ${person.role}`}
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
                      <small>Découvrir</small>
                    </span>
                    <span className={styles.agentArrow}>
                      <ChevronRight />
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            <p className={styles.control}>
              <People size={26} />
              <span>
                <strong>Vous gardez le dernier mot.</strong>Des agents IA à vos
                côtés, avec vos équipes aux commandes.
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
              <p className={styles.eyebrow}>Questions fréquentes</p>
              <h2 id="mobile-faq-title" className={styles.title}>
                Vos questions,
                <br />
                <span>nos réponses.</span>
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
        <p>L’IA, plus humaine, plus utile.</p>
        <nav aria-label="Informations légales">
          <a href={LEGAL_HREF}>Mentions légales</a>
          <a href={PRIVACY_HREF}>Confidentialité</a>
        </nav>
        <small>© {new Date().getFullYear()} D2S AIgency</small>
        <a
          href="#agence"
          className={styles.backTop}
          onClick={(e) => anchorClick(e, "agence")}
        >
          Retour en haut
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
