import { RootDocument } from "@/components/i18n/RootDocument";
import { rootMetadata, rootViewport } from "@/lib/seo";
import "../globals.css";

export const metadata = rootMetadata("en");
export const viewport = rootViewport;

/** The English site, under /en (the same pages and components as the French one, in English). */
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <RootDocument locale="en">{children}</RootDocument>;
}
