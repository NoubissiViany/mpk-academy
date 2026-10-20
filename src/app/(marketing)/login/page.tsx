import { AuthForm } from "@/features/auth/auth-form";
import { Card, CardContent } from "@/components/ui/card";
import { isOfferedPlanId } from "@/config/product";
import { getMessages } from "@/i18n/server";

export async function generateMetadata() {
  return { title: (await getMessages()).metadata.login };
}

const first = (value?: string | string[]) =>
  Array.isArray(value) ? value[0] : value;

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{
    plan?: string | string[];
    next?: string | string[];
    error?: string | string[];
    ref?: string | string[];
  }>;
}) {
  const resolved = await searchParams;
  const t = (await getMessages()).auth.login;
  const candidate = first(resolved.plan);
  const planId = isOfferedPlanId(candidate) ? candidate : undefined;
  const reference = first(resolved.ref);
  return (
    <div className="container-page py-16">
      <Card className="mx-auto max-w-md">
        <CardContent className="pt-6">
          <p className="eyebrow">{t.eyebrow}</p>
          <h1 className="mt-3 text-3xl font-bold">{t.title}</h1>
          <p className="mt-3 mb-7 text-sm leading-6 text-muted-foreground">
            {t.description}
          </p>
          {first(resolved.error) === "confirmation" && (
            <div
              className="mb-6 rounded-xl border border-danger/25 bg-danger/5 px-4 py-3 text-sm text-danger"
              role="alert"
            >
              {t.confirmationError}
              {reference && (
                <span className="mt-2 block font-mono text-xs">
                  {t.reference(reference)}
                </span>
              )}
            </div>
          )}
          <AuthForm
            mode="login"
            planId={planId}
            nextPath={first(resolved.next)}
          />
        </CardContent>
      </Card>
    </div>
  );
}
