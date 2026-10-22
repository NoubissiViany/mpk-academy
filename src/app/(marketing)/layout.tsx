import Link from "next/link";
import { PublicHeader } from "@/components/public-header";
import { Wordmark } from "@/components/shared";
import { getMessages } from "@/i18n/server";

export default async function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = await getMessages();
  const footer = t.common.footer;
  return (
    <>
      <PublicHeader />
      <main>{children}</main>
      <footer className="mt-24 border-t border-border bg-card">
        <div className="container-page grid gap-10 py-12 sm:grid-cols-3">
          <div>
            <Wordmark />
            <p className="mt-4 max-w-sm text-sm leading-6 text-muted-foreground">
              {footer.tagline}
            </p>
          </div>
          <div>
            <p className="text-sm font-bold">{footer.clarityTitle}</p>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {footer.clarityCopy}
            </p>
          </div>
          <div>
            <p className="text-sm font-bold">{footer.canadaTitle}</p>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {footer.canadaCopy}
            </p>
            <div className="mt-3 flex flex-col items-start gap-2">
              <Link
                href="/themes"
                className="text-sm font-semibold text-primary hover:underline"
              >
                {t.common.nav.themes}
              </Link>
              <Link
                href="/privacy"
                className="text-sm font-semibold text-primary hover:underline"
              >
                {t.common.nav.privacy}
              </Link>
            </div>
          </div>
        </div>
        <div className="border-t py-5 text-center text-xs text-muted-foreground">
          {footer.rights(new Date().getFullYear())}
        </div>
      </footer>
    </>
  );
}
