import type { Metadata } from "next";
import localFont from "next/font/local";
import { AppProvider } from "@/components/providers/app-provider";
import { productConfig } from "@/config/product";
import "./globals.css";

const manrope = localFont({
  src: "../../node_modules/@fontsource-variable/manrope/files/manrope-latin-wght-normal.woff2",
  variable: "--font-sans",
  display: "swap",
  weight: "200 800",
});

export const metadata: Metadata = {
  title: { default: "MPK Academy — TEF/TCF preparation", template: "%s | MPK Academy" },
  description: "Prepare for TEF/TCF with a plan built around your weaknesses and English support when you need it.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  openGraph: { title: "MPK Academy", description: productConfig.courseName, type: "website" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning><body className={`${manrope.variable} min-h-screen antialiased`}><AppProvider>{children}</AppProvider></body></html>;
}
