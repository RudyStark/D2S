"use client";

import { usePathname } from "next/navigation";
import type { MouseEvent } from "react";
import { Globe } from "@/components/ui/Icons";
import { counterpart, type Locale } from "@/lib/i18n";
import { useLocale } from "./LocaleProvider";

const OTHER: Record<Locale, { id: Locale; short: string; label: string }> = {
  fr: { id: "en", short: "EN", label: "English version" },
  en: { id: "fr", short: "FR", label: "Version française" },
};

/**
 * The mobile language switch: one tap to the same page in the other language, at the same section (a real link: the
 * two languages are two documents). `variant="menu"` = both languages side by side, in the menu.
 */
export function LanguageLink({ className, variant = "compact" }: { className?: string; variant?: "compact" | "menu" }) {
  const locale = useLocale();
  const pathname = usePathname();
  const other = OTHER[locale];
  // Read at click time: the section the visitor is on travels with them.
  const keepPlace = (e: MouseEvent<HTMLAnchorElement>) => {
    e.currentTarget.href = counterpart(pathname, window.location.hash, other.id);
  };

  if (variant === "menu") {
    return (
      <p className={className} aria-label={locale === "en" ? "Language" : "Langue"}>
        <span aria-current="true" lang={locale}>
          {locale === "en" ? "English" : "Français"}
        </span>
        <a href={counterpart(pathname, "", other.id)} hrefLang={other.id} lang={other.id} onClick={keepPlace}>
          {other.id === "en" ? "English" : "Français"}
        </a>
      </p>
    );
  }
  return (
    <a className={className} href={counterpart(pathname, "", other.id)} hrefLang={other.id} lang={other.id} aria-label={other.label} onClick={keepPlace}>
      <Globe size={18} />
      <span aria-hidden="true">{other.short}</span>
    </a>
  );
}
