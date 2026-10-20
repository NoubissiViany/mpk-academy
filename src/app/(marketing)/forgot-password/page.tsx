import { Card, CardContent } from "@/components/ui/card";
import { ForgotPasswordForm } from "@/features/auth/password-forms";
import { getMessages } from "@/i18n/server";

export async function generateMetadata() {
  return { title: (await getMessages()).metadata.forgotPassword };
}

export default async function ForgotPasswordPage() {
  const t = (await getMessages()).auth.forgot;
  return (
    <div className="container-page py-16">
      <Card className="mx-auto max-w-md">
        <CardContent className="pt-6">
          <p className="eyebrow">{t.eyebrow}</p>
          <h1 className="mt-3 text-3xl font-bold">{t.title}</h1>
          <p className="mt-3 mb-7 text-sm leading-6 text-muted-foreground">
            {t.description}
          </p>
          <ForgotPasswordForm />
        </CardContent>
      </Card>
    </div>
  );
}
