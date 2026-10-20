import type { Locale } from "@/types/domain";

export type { Locale };

export const locales = ["en", "fr"] as const satisfies readonly Locale[];
export const defaultLocale: Locale = "en";
export const localeCookieName = "mpk_locale";
export const localeCookieMaxAge = 60 * 60 * 24 * 365;

export const isLocale = (value: unknown): value is Locale =>
  value === "en" || value === "fr";

export const intlLocale = (locale: Locale) =>
  locale === "fr" ? "fr-CA" : "en-CA";

/** Picks French only when the browser prefers it over English. */
export function negotiateLocale(acceptLanguage: string | null): Locale {
  if (!acceptLanguage) return defaultLocale;
  const ranked = acceptLanguage
    .split(",")
    .map((part, index) => {
      const [tag, ...params] = part.trim().toLowerCase().split(";");
      const q = Number(
        params.find((param) => param.trim().startsWith("q="))?.split("=")[1],
      );
      return { tag, q: Number.isFinite(q) ? q : 1, index };
    })
    .filter(({ tag }) => tag.startsWith("fr") || tag.startsWith("en"))
    .sort((a, b) => b.q - a.q || a.index - b.index);
  return ranked[0]?.tag.startsWith("fr") ? "fr" : defaultLocale;
}
