import type { Metadata } from "next";
import localFont from "next/font/local";
import { AppProvider } from "@/components/providers/app-provider";
import { getLocale, getMessages } from "@/i18n/server";
import { getAppUrl } from "@/lib/app-url";
import "./globals.css";

const manrope = localFont({
  src: "../../node_modules/@fontsource-variable/manrope/files/manrope-latin-wght-normal.woff2",
  variable: "--font-sans",
  display: "swap",
  weight: "200 800",
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getMessages();
  return {
    title: {
      default: t.metadata.defaultTitle,
      template: "%s | MPK Academy",
    },
    description: t.metadata.description,
    metadataBase: new URL(getAppUrl()),
    openGraph: {
      title: "MPK Academy",
      description: t.metadata.ogDescription,
      type: "website",
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const locale = await getLocale();
  return (
    <html lang={locale} data-scroll-behavior="smooth" suppressHydrationWarning>
      <body className={`${manrope.variable} min-h-screen antialiased`}>
        <AppProvider initialLocale={locale}>{children}</AppProvider>
      </body>
    </html>
  );
}
