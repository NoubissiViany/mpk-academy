import { AuthForm } from "@/features/auth/auth-form";
import { Card, CardContent } from "@/components/ui/card";
import { isPaidPlanId } from "@/config/product";
export const metadata = { title: "Create account" };
export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{
    plan?: string | string[];
    next?: string | string[];
  }>;
}) {
  const resolved = await searchParams;
  const rawPlan = resolved.plan;
  const candidate = Array.isArray(rawPlan) ? rawPlan[0] : rawPlan;
  const planId = isPaidPlanId(candidate) ? candidate : undefined;
  return (
    <div className="container-page py-16">
      <Card className="mx-auto max-w-xl">
        <CardContent className="pt-6">
          <p className="eyebrow">Create your account</p>
          <h1 className="mt-3 text-3xl font-bold">
            Start with your free assessment.
          </h1>
          <p className="mt-3 mb-7 text-sm leading-6 text-muted-foreground">
            If you already completed the assessment, we will keep your results
            and continue with your selected plan. Otherwise, your assessment
            will identify your level and recommend the preparation plan that
            fits your goal. You will confirm your email before signing in.
          </p>
          <AuthForm
            mode="register"
            planId={planId}
            nextPath={
              Array.isArray(resolved.next) ? resolved.next[0] : resolved.next
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}
