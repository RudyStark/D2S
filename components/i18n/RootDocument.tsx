import { LocaleProvider } from "@/components/i18n/LocaleProvider";
import { fontClasses } from "@/lib/fonts";
import { GATE_SCRIPT } from "@/lib/language-gate-script";
import type { Locale } from "@/lib/i18n";

/** The <html> of both root layouts (app/(fr) and app/(en)): the language, the fonts, the language context. */
export function RootDocument({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  return (
    <html lang={locale} className={fontClasses} suppressHydrationWarning>
      <head>
        {/* Decides before the first paint whether the language gate shows (lib/language-gate-script.ts). */}
        <script dangerouslySetInnerHTML={{ __html: GATE_SCRIPT }} />
      </head>
      <body>
        <LocaleProvider locale={locale}>{children}</LocaleProvider>
      </body>
    </html>
  );
}
