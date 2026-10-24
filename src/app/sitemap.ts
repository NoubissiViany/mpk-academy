import type { MetadataRoute } from "next";
import { themeIssues } from "@/content/themes";
import { getAppUrl } from "@/lib/app-url";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getAppUrl();
  const themesUpdated = new Date(`${themeIssues[0].month}-01T00:00:00Z`);
  return [
    { url: base, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/diagnostic`, changeFrequency: "monthly", priority: 0.8 },
    ...(["fr", "en"] as const).map((lang) => ({
      url: `${base}/themes/${lang}`,
      lastModified: themesUpdated,
      changeFrequency: "monthly" as const,
      priority: 0.7,
      alternates: {
        languages: { fr: `${base}/themes/fr`, en: `${base}/themes/en` },
      },
    })),
    { url: `${base}/privacy`, changeFrequency: "yearly", priority: 0.2 },
  ];
}
