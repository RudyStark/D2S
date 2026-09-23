"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useFrameUpdate } from "@/hooks/useFrameUpdate";
import { scrollToElement, scrollToProgress, setScrollLocked } from "@/lib/experience/director";
import { frame } from "@/lib/experience/store";
import { beatEased } from "@/lib/experience/timeline";
import { CONTACT_ID, contactClick } from "@/lib/contact";
import { CONTACT_HREF, NAV_ITEMS } from "@/lib/navigation";
import { Button } from "./Button";
import { ContactDialog } from "./ContactDialog";
import styles from "./Header.module.css";
import { ArrowRight, ChevronDown, Globe } from "./Icons";
import { Logo } from "./Logo";

/** Nav entries that are sections of the home page (href → element id), deepest last. */
const HOME_SECTIONS: Record<string, string> = {
  "/nos-services": "nos-services",
  "/nos-agents-ia": "nos-agents-ia",
  "/comment-choisir": "comment-choisir",
};

function LanguageSwitch() {
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
        aria-label="Langue : français"
        onClick={() => setOpen((v) => !v)}
      >
        <Globe />
        <span>FR</span>
        <ChevronDown />
      </button>
      {open && (
        <ul className={styles.langMenu}>
          <li>
            <span aria-current="true">Français</span>
          </li>
          <li>
            <span aria-disabled="true">English · bientôt</span>
          </li>
        </ul>
      )}
    </div>
  );
}

/** Fixed header. Compacts (never hides) as the visitor walks into the agency. */
export function Header() {
  const pathname = usePathname();
  const header = useRef<HTMLElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  // "Contact": a direct message to the team, in a dialog (the form below stays for projects and visios).
  const [contactOpen, setContactOpen] = useState(false);
  const onHome = pathname === "/";
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
      next = "/nos-services";
      for (const [href, id] of Object.entries(HOME_SECTIONS)) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top < window.innerHeight * 0.5) next = href;
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
        <nav aria-label="Navigation principale" className={styles.nav} data-open={menuOpen} id="main-nav">
          <ul>
            {NAV_ITEMS.map((item) => {
              const sectionId = HOME_SECTIONS[item.href];
              const active = onHome ? (sectionId ? section === item.href : item.href === "/" && !section) : item.href === pathname;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={styles.link}
                    onClick={(e) => {
                      setMenuOpen(false);
                      if (item.href === "/" && onHome) {
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
          <Button href={CONTACT_HREF} icon={<ArrowRight className={styles.ctaIcon} />} className={styles.cta} onClick={contactClick({ source: "header" })}>
            Parlons de votre projet
          </Button>
          <LanguageSwitch />
          <button
            type="button"
            className={styles.menuButton}
            aria-expanded={menuOpen}
            aria-controls="main-nav"
            onClick={() => setMenuOpen((v) => !v)}
          >
            <span className="visually-hidden">{menuOpen ? "Fermer le menu" : "Ouvrir le menu"}</span>
            <span className={styles.menuIcon} aria-hidden="true" />
          </button>
        </div>
      </div>
    </header>
  );
}
