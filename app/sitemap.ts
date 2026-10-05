import type { MetadataRoute } from "next";
import { alternates } from "@/lib/i18n";
import { abs } from "@/lib/site";

/** Only real pages, each in both languages with its hreflang alternates (the rooms under construction stay out). */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const pages: { fr: string; changeFrequency: "weekly" | "yearly"; priority: number }[] = [
    { fr: "/", changeFrequency: "weekly", priority: 1 },
    { fr: "/mentions-legales", changeFrequency: "yearly", priority: 0.2 },
    { fr: "/confidentialite", changeFrequency: "yearly", priority: 0.2 },
  ];
  return pages.flatMap(({ fr, changeFrequency, priority }) => {
    const alt = alternates(fr);
    const languages = { fr: abs(alt.fr), en: abs(alt.en), "x-default": abs(alt["x-default"]) };
    return [
      { url: abs(alt.fr), lastModified: now, changeFrequency, priority, alternates: { languages } },
      { url: abs(alt.en), lastModified: now, changeFrequency, priority: priority * 0.9, alternates: { languages } },
    ];
  });
}
