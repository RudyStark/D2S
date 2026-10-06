import { LocaleProvider } from "@/components/i18n/LocaleProvider";
import { fontClasses } from "@/lib/fonts";
import type { Locale } from "@/lib/i18n";

/** The <html> of both root layouts (app/(fr) and app/(en)): the language, the fonts, the language context. */
export function RootDocument({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  return (
    <html lang={locale} className={fontClasses}>
      <body>
        <LocaleProvider locale={locale}>{children}</LocaleProvider>
      </body>
    </html>
  );
}
