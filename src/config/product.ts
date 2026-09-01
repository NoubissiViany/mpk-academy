import type { Locale } from "@/types/domain";

export const productConfig = {
  name: "MPK Academy",
  courseName: "French for Canadian Immigration — TEF/TCF Preparation",
  price: 249,
  currency: "CAD",
  freeLessonCount: 3,
  supportedLanguages: ["en", "fr"] satisfies Locale[],
  storageKey: "mpk-academy:v1",
  localeCookie: "mpk_locale",
  readinessDisclaimer:
    "MPK Readiness is a preparation indicator based on activity inside MPK Academy. It is not an official TEF/TCF score or immigration outcome.",
  certificateDisclaimer:
    "This is a course completion certificate, not an official TEF/TCF score or immigration credential.",
} as const;

export const featureFlags = {
  enableReadiness: true,
  enableExamMode: true,
  enableMistakeReview: true,
  enableCertificate: true,
} as const;

export const formatPrice = (locale: Locale = "en") =>
  new Intl.NumberFormat(locale === "fr" ? "fr-CA" : "en-CA", {
    style: "currency",
    currency: productConfig.currency,
    maximumFractionDigits: 0,
  }).format(productConfig.price);
