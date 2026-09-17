"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useFrameUpdate } from "@/hooks/useFrameUpdate";
import { scrollToProgress } from "@/lib/experience/director";
import { frame } from "@/lib/experience/store";
import { beatEased } from "@/lib/experience/timeline";
import { CONTACT_HREF, NAV_ITEMS } from "@/lib/navigation";
import { Button } from "./Button";
import styles from "./Header.module.css";
import { ArrowRight, ChevronDown, Globe } from "./Icons";
import { Logo } from "./Logo";

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
        <Globe size={18} />
        <span>FR</span>
        <ChevronDown size={14} />
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
  const onHome = pathname === "/";

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  useFrameUpdate(() => {
    if (!header.current) return;
    header.current.style.setProperty("--compact", beatEased(frame.progress, "headerCompact").toFixed(3));
  });

  return (
    <header ref={header} className={styles.header} data-home={onHome}>
      <div className={styles.inner}>
        <Logo className={styles.logo} />
        <nav aria-label="Navigation principale" className={styles.nav} data-open={menuOpen} id="main-nav">
          <ul>
            {NAV_ITEMS.map((item) => {
              const active = item.href === pathname;
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
                    }}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className={styles.actions}>
          <Button href={CONTACT_HREF} icon={<ArrowRight size={20} />} className={styles.cta}>
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
