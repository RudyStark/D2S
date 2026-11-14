"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { gateState, rememberLanguage, setGateState, type GateState } from "@/lib/language-gate";
import type { Locale } from "@/lib/i18n";
import { GateLogo } from "./GateLogo";
import styles from "./LanguageGate.module.css";

/*
 * The very first screen of the site: "Choisissez votre langue / Choose your language", before the agency itself
 * loads underneath. Whether it shows is decided before the first paint by the inline script of
 * lib/language-gate-script.ts; this component only plays it.
 *
 * Only the backdrop is a picture (public/images/gate/fond-langue.webp: soft light, glass shapes, Déa and Loic in
 * transparency; its own logo, texts and buttons were erased from it). Everything that must stay sharp is drawn
 * by the page: the vector logo, the texts, the buttons — so nothing pixelates, however large the screen. The
 * backdrop is all soft gradients, it can be enlarged without showing it. Only the logo and the buttons move.
 */

type Action = "leaving" | "away" | "closed";

const FADE_MS = 520;
const PICK_MS = 300;

const noop = () => () => {};
const readGate = (): GateState | "ssr" => gateState();
const serverGate = (): GateState | "ssr" => "ssr";

export function LanguageGate() {
  const locale = useLocale();
  const root = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const subId = useId();
  const flagId = useId().replace(/:/g, "");
  const initial = useSyncExternalStore(noop, readGate, serverGate);
  const [action, setAction] = useState<Action | null>(null);
  const [picked, setPicked] = useState<Locale | null>(null);

  const mode = action ?? (initial === "open" || initial === "enter" || initial === "ssr" ? initial : "closed");

  // The rest of the page is out of reach while the gate is up (keyboard, screen readers).
  useEffect(() => {
    if (mode !== "open") return;
    const el = root.current;
    if (!el?.parentElement) return;
    const others = Array.from(el.parentElement.children).filter(
      (node): node is HTMLElement => node !== el && node instanceof HTMLElement && !node.inert,
    );
    others.forEach((node) => (node.inert = true));
    el.focus({ preventScroll: true });
    return () => others.forEach((node) => (node.inert = false));
  }, [mode]);

  // Just arrived from the other language: the picture fades away on its own.
  useEffect(() => {
    if (initial !== "enter" || action) return;
    const id = window.setTimeout(() => leave(), 260);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs once, when the "enter" state is read
  }, [initial]);

  function leave() {
    setGateState("leaving");
    setAction("leaving");
    window.setTimeout(() => {
      setGateState("done");
      setAction("closed");
    }, FADE_MS);
  }

  function choose(lang: Locale, event: React.MouseEvent<HTMLAnchorElement>) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
    event.preventDefault();
    if (picked) return;
    setPicked(lang);
    if (lang === locale) {
      rememberLanguage(lang, false);
      window.setTimeout(leave, PICK_MS);
      return;
    }
    rememberLanguage(lang, true);
    window.setTimeout(() => window.location.assign(`${lang === "en" ? "/en" : "/"}${window.location.hash}`), PICK_MS);
  }

  // Arrows move between the two languages.
  function onKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) return;
    const links = Array.from(event.currentTarget.querySelectorAll<HTMLAnchorElement>("a"));
    const at = links.indexOf(document.activeElement as HTMLAnchorElement);
    const next = event.key === "ArrowLeft" || event.key === "ArrowUp" ? at - 1 : at + 1;
    links[(next + links.length) % links.length]?.focus();
    event.preventDefault();
  }

  if (mode === "closed") return null;

  const choice = (lang: Locale, label: string) => (
    <a
      href={lang === "en" ? "/en" : "/"}
      hrefLang={lang}
      lang={lang}
      className={styles.choice}
      data-lang={lang}
      data-picked={picked === lang || undefined}
      onClick={(event) => choose(lang, event)}
    >
      <span className={styles.beam} aria-hidden="true" />
      <span className={styles.shine} aria-hidden="true" />
      <span className={styles.flagBg} data-flag={lang} aria-hidden="true">
        {lang === "en" && (
          <svg viewBox="0 0 60 30" preserveAspectRatio="xMidYMid slice">
            <defs>
              <linearGradient id={`${flagId}-navy`} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#2a4fd6" />
                <stop offset="1" stopColor="#06155e" />
              </linearGradient>
              <linearGradient id={`${flagId}-red`} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#ff4d5a" />
                <stop offset="1" stopColor="#b30d20" />
              </linearGradient>
              <clipPath id={`${flagId}-uk`}>
                <path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z" />
              </clipPath>
            </defs>
            <path d="M0,0 v30 h60 v-30 z" fill={`url(#${flagId}-navy)`} />
            <path d="M0,0 L60,30 M60,0 L0,30" stroke="#f4f7ff" strokeWidth="6" />
            <path d="M0,0 L60,30 M60,0 L0,30" clipPath={`url(#${flagId}-uk)`} stroke={`url(#${flagId}-red)`} strokeWidth="4" />
            <path d="M30,0 v30 M0,15 h60" stroke="#f4f7ff" strokeWidth="10" />
            <path d="M30,0 v30 M0,15 h60" stroke={`url(#${flagId}-red)`} strokeWidth="6" />
          </svg>
        )}
      </span>
      <span className={styles.inner}>
        <span className={styles.label}>{label}</span>
      </span>
      <span className={styles.arrow} aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h13M13 6l6 6-6 6" />
        </svg>
      </span>
    </a>
  );

  return (
    <div
      ref={root}
      className={styles.gate}
      data-mode={mode}
      data-picked={picked ?? undefined}
      role="dialog"
      aria-modal="true"
      aria-labelledby={`${titleId} ${subId}`}
      tabIndex={-1}
      data-nosnippet=""
    >
      <div className={styles.bg} aria-hidden="true" />

      <div className={styles.column}>
        {/* Déa and Loic, cut out of the backdrop: on an upright screen the backdrop is cropped to its centre. */}
        {/* eslint-disable-next-line @next/next/no-img-element -- static page, decorative */}
        <img className={styles.duo} src="/images/gate/duo.webp" width={430} height={400} alt="" aria-hidden="true" decoding="async" />
        <div className={styles.brand}>
          <GateLogo />
          <span className="visually-hidden">D2S AIgency</span>
        </div>
        <p id={titleId} className={styles.title} lang="fr">
          Choisissez votre <span className={styles.accent}>langue</span>
        </p>
        <p id={subId} className={styles.subtitle} lang="en">
          Choose your language
        </p>
        <span className={styles.divider} aria-hidden="true" />
        <div className={styles.choices} onKeyDown={onKeyDown}>
          {choice("fr", "Français")}
          {choice("en", "English")}
        </div>
        <p className={styles.notice}>
          <span className={styles.noticeIcon} aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2.5" y="3.5" width="19" height="13" rx="2" />
              <path d="M8.5 20.5h7M12 16.5v4" />
              <path className={styles.noticeTick} d="M9 9.5l2 2 4-4" />
            </svg>
          </span>
          <span className={styles.noticeText}>
            <strong lang="fr">Site optimisé pour la version Desktop</strong>
            <em lang="en">Best experienced on desktop</em>
          </span>
        </p>
      </div>

    </div>
  );
}
