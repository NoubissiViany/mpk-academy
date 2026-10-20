import { TrackFunnelStep } from "@/components/track-funnel-step";
import { AuthForm } from "@/features/auth/auth-form";
import { Card, CardContent } from "@/components/ui/card";
import { isBetaMode, isOfferedPlanId } from "@/config/product";
import { getMessages } from "@/i18n/server";

export async function generateMetadata() {
  return { title: (await getMessages()).metadata.register };
}

const first = (value?: string | string[]) =>
  Array.isArray(value) ? value[0] : value;

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{
    plan?: string | string[];
    next?: string | string[];
  }>;
}) {
  const resolved = await searchParams;
  const t = (await getMessages()).auth.register;
  const beta = isBetaMode();
  const candidate = first(resolved.plan);
  const planId = isOfferedPlanId(candidate) ? candidate : undefined;
  return (
    <div className="container-page py-16">
      <Card className="mx-auto max-w-xl">
        <CardContent className="pt-6">
          <p className="eyebrow">{t.eyebrow}</p>
          <h1 className="mt-3 text-3xl font-bold">
            {beta ? t.betaTitle : t.title}
          </h1>
          <p className="mt-3 mb-7 text-sm leading-6 text-muted-foreground">
            {beta ? t.betaDescription : t.description}
          </p>
          <TrackFunnelStep step="register_view" />
          <AuthForm
            mode="register"
            planId={planId}
            nextPath={first(resolved.next)}
          />
        </CardContent>
      </Card>
    </div>
  );
}
