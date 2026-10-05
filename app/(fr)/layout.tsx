import { RootDocument } from "@/components/i18n/RootDocument";
import { rootMetadata, rootViewport } from "@/lib/seo";
import "../globals.css";

export const metadata = rootMetadata("fr");
export const viewport = rootViewport;

/** The French site (at the root: d2saigency.com). The English one is app/(en), under /en. */
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <RootDocument locale="fr">{children}</RootDocument>;
}
