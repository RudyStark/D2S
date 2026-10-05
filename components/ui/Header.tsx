"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useFrameUpdate } from "@/hooks/useFrameUpdate";
import { scrollToElement, scrollToProgress, setScrollLocked } from "@/lib/experience/director";
import { frame } from "@/lib/experience/store";
import { beatEased } from "@/lib/experience/timeline";
import { CONTACT_ID, contactClick } from "@/lib/contact";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { counterpart, type Locale } from "@/lib/i18n";
import { contactHrefOf, homeOf, navItemsOf } from "@/lib/navigation";
import { Button } from "./Button";
import { ContactDialog } from "./ContactDialog";
import styles from "./Header.module.css";
import { ArrowRight, ChevronDown, Globe } from "./Icons";
import { Logo } from "./Logo";

/** Sections of the home page, deepest last (the nav follows the scroll through them). */
const HOME_SECTIONS = ["nos-services", "nos-agents-ia", "comment-choisir"];

const TEXTS = {
  fr: {
    nav: "Navigation principale",
    cta: "Parlons de votre projet",
    open: "Ouvrir le menu",
    close: "Fermer le menu",
    language: "Langue : français",
  },
  en: {
    nav: "Main navigation",
    cta: "Discuss your project",
    open: "Open the menu",
    close: "Close the menu",
    language: "Language: English",
  },
};

const LANGUAGES: { id: Locale; label: string; short: string }[] = [
  { id: "fr", label: "Français", short: "FR" },
  { id: "en", label: "English", short: "EN" },
];

/**
 * The language switch: the same page in the other language, at the same place (the home page section the visitor is
 * reading travels with them). A real link — the two languages are two documents.
 */
function LanguageSwitch({ section }: { section: string | null }) {
  const locale = useLocale();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  return (
    <div ref={root} className={styles.lang}>
      <button
        type="button"
        className={styles.langButton}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={TEXTS[locale].language}
        onClick={() => setOpen((v) => !v)}
      >
        <Globe />
        <span>{locale.toUpperCase()}</span>
        <ChevronDown />
      </button>
      {open && (
        <ul className={styles.langMenu}>
          {LANGUAGES.map((l) => (
            <li key={l.id}>
              {l.id === locale ? (
                <span aria-current="true" lang={l.id}>
                  {l.label}
                  <small>{l.short}</small>
                </span>
              ) : (
                <a
                  href={counterpart(pathname, "", l.id)}
                  hrefLang={l.id}
                  lang={l.id}
                  onClick={(e) => {
                    // Read at click time: the section on screen, or the anchor of the page.
                    const hash = section ? (section.startsWith("#") ? section : `#${section}`) : window.location.hash;
                    e.currentTarget.href = counterpart(pathname, hash, l.id);
                  }}
                >
                  {l.label}
                  <small>{l.short}</small>
                </a>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Fixed header. Compacts (never hides) as the visitor walks into the agency. */
export function Header() {
  const locale = useLocale();
  const t = TEXTS[locale];
  const pathname = usePathname();
  const header = useRef<HTMLElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  // "Contact": a direct message to the team, in a dialog (the form below stays for projects and visios).
  const [contactOpen, setContactOpen] = useState(false);
  const onHome = pathname === homeOf(locale);
  /** On the home page, services and agents live below the reception: the nav follows the scroll. */
  const [section, setSection] = useState<string | null>(null);
  const sectionRef = useRef<string | null>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  useFrameUpdate(() => {
    if (!header.current) return;
    header.current.style.setProperty("--compact", beatEased(frame.progress, "headerCompact").toFixed(3));
    let next: string | null = null;
    if (onHome && frame.services > 0.5) {
      // The deepest section whose top has passed the middle of the screen wins.
      next = HOME_SECTIONS[0];
      for (const id of HOME_SECTIONS) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top < window.innerHeight * 0.5) next = id;
      }
      // The form is not a nav entry: nothing is highlighted there.
      const contact = document.getElementById(CONTACT_ID);
      if (contact && contact.getBoundingClientRect().top < window.innerHeight * 0.5) next = "#contact";
    }
    if (next !== sectionRef.current) {
      sectionRef.current = next;
      setSection(next);
    }
  });

  return (
    <header ref={header} className={styles.header} data-home={onHome}>
      <div className={styles.inner}>
        <Logo className={styles.logo} />
        <nav aria-label={t.nav} className={styles.nav} data-open={menuOpen} id="main-nav">
          <ul>
            {navItemsOf(locale).map((item) => {
              const sectionId = item.section;
              const isHome = item.href === homeOf(locale);
              const active = onHome ? (sectionId ? section === sectionId : isHome && !section) : item.href === pathname;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={styles.link}
                    onClick={(e) => {
                      setMenuOpen(false);
                      if (isHome && onHome) {
                        e.preventDefault();
                        frame.forced = null;
                        scrollToProgress(0);
                      }
                      const target = sectionId && onHome ? document.getElementById(sectionId) : null;
                      if (target) {
                        e.preventDefault();
                        frame.forced = null;
                        scrollToElement(target);
                      }
                    }}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
            <li>
              <button
                type="button"
                className={styles.link}
                aria-haspopup="dialog"
                onClick={() => {
                  setMenuOpen(false);
                  setContactOpen(true);
                }}
              >
                Contact
              </button>
            </li>
          </ul>
        </nav>
        <ContactDialog open={contactOpen} onClose={() => setContactOpen(false)} onLock={setScrollLocked} />
        <div className={styles.actions}>
          <Button href={contactHrefOf(locale)} icon={<ArrowRight className={styles.ctaIcon} />} className={styles.cta} onClick={contactClick({ source: "header" })}>
            {t.cta}
          </Button>
          <LanguageSwitch section={onHome ? section : null} />
          <button
            type="button"
            className={styles.menuButton}
            aria-expanded={menuOpen}
            aria-controls="main-nav"
            onClick={() => setMenuOpen((v) => !v)}
          >
            <span className="visually-hidden">{menuOpen ? t.close : t.open}</span>
            <span className={styles.menuIcon} aria-hidden="true" />
          </button>
        </div>
      </div>
    </header>
  );
}
