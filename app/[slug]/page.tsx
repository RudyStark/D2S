import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { PlaceholderRoom } from "@/components/pages/PlaceholderRoom";
import { PLACEHOLDER_PAGES } from "@/lib/navigation";

export const dynamicParams = false;

export function generateStaticParams() {
  return Object.keys(PLACEHOLDER_PAGES).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = PLACEHOLDER_PAGES[slug];
  // Rooms still under construction: reachable, but kept out of search results until they have content.
  return page ? { title: page.kicker, robots: { index: false, follow: true } } : {};
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  // Services live on the home page, below the reception.
  if (slug === "nos-services") permanentRedirect("/#nos-services");
  if (slug === "contact") permanentRedirect("/#contact");
  if (slug === "comment-choisir") permanentRedirect("/#comment-choisir");
  if (slug === "nos-agents-ia") permanentRedirect("/#nos-agents-ia");
  const page = PLACEHOLDER_PAGES[slug];
  if (!page) notFound();
  return <PlaceholderRoom {...page} />;
}
