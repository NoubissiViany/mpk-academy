import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RecurringThemes } from "@/features/marketing/recurring-themes";
import { isLocale, locales } from "@/i18n/config";
import { messagesFor } from "@/i18n/messages";

export const generateStaticParams = () => locales.map((lang) => ({ lang }));

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const t = messagesFor(lang).themes;
  return {
    title: t.title,
    description: t.metaDescription,
    alternates: {
      canonical: `/themes/${lang}`,
      languages: { fr: "/themes/fr", en: "/themes/en" },
    },
  };
}

export default async function ThemesInLanguagePage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  return <RecurringThemes lang={lang} />;
}
