"use client";

import { createContext, useContext } from "react";
import type { Locale } from "@/lib/i18n";

/*
 * The page's language for the client components (set by each root layout: app/(fr) and app/(en)). Texts are
 * translated next to where they are used: `const t = TEXTS[useLocale()]`.
 */

const LocaleContext = createContext<Locale>("fr");

export function LocaleProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>;
}

export const useLocale = () => useContext(LocaleContext);
