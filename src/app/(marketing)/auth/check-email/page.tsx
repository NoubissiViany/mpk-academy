import { Mail } from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ResendConfirmation } from "@/features/auth/resend-confirmation";
import { getMessages } from "@/i18n/server";

export async function generateMetadata() {
  return { title: (await getMessages()).metadata.checkEmail };
}

export default async function CheckEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = await searchParams;
  const t = (await getMessages()).auth.checkEmail;
  return (
    <div className="container-page py-16">
      <Card className="mx-auto max-w-md">
        <CardContent className="pt-6">
          <p className="eyebrow">{t.eyebrow}</p>
          <h1 className="mt-3 text-3xl font-bold">{t.title}</h1>
          <div className="mt-5 flex gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm leading-6">
            <Mail
              className="mt-0.5 size-5 shrink-0 text-primary"
              aria-hidden="true"
            />
            <div className="min-w-0">
              <p className="wrap-anywhere font-semibold">{t.body(email)}</p>
              <p className="mt-2">{t.inboxHint}</p>
            </div>
          </div>
          <p className="mt-4 text-sm leading-6 text-muted-foreground">
            {t.browserHint}
          </p>
          {email && <ResendConfirmation email={email} />}
          <Button
            asChild
            className={email ? "mt-3 w-full" : "mt-7 w-full"}
            variant="secondary"
          >
            <Link href="/login">{t.back}</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
