import type { MetadataRoute } from "next";
import { abs } from "@/lib/site";

/** Only real pages: the rooms still under construction are left out (and noindex). */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: abs("/"), lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: abs("/mentions-legales"), lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: abs("/confidentialite"), lastModified: now, changeFrequency: "yearly", priority: 0.2 },
  ];
}
