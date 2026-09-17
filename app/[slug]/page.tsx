import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PlaceholderRoom } from "@/components/pages/PlaceholderRoom";
import { PLACEHOLDER_PAGES } from "@/lib/navigation";

export const dynamicParams = false;

export function generateStaticParams() {
  return Object.keys(PLACEHOLDER_PAGES).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = PLACEHOLDER_PAGES[slug];
  return page ? { title: `${page.kicker} — D2S Studio` } : {};
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = PLACEHOLDER_PAGES[slug];
  if (!page) notFound();
  return <PlaceholderRoom {...page} />;
}
