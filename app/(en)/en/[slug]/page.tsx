import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { PlaceholderRoom } from "@/components/pages/PlaceholderRoom";
import { PLACEHOLDER_PAGES_EN } from "@/lib/navigation";
import { pageAlternates } from "@/lib/seo";

export const dynamicParams = false;

export function generateStaticParams() {
  return Object.keys(PLACEHOLDER_PAGES_EN).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = PLACEHOLDER_PAGES_EN[slug];
  return page ? { title: page.kicker, robots: { index: false, follow: true }, alternates: pageAlternates(`/${page.fr}`, "en") } : {};
}

/** The English rooms: the sections live on the home page (same anchors as in French). */
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (slug === "services") permanentRedirect("/en#nos-services");
  if (slug === "contact") permanentRedirect("/en#contact");
  if (slug === "how-to-choose") permanentRedirect("/en#comment-choisir");
  if (slug === "ai-agents") permanentRedirect("/en#nos-agents-ia");
  const page = PLACEHOLDER_PAGES_EN[slug];
  if (!page) notFound();
  return <PlaceholderRoom {...page} locale="en" />;
}
