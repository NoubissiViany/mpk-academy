import { AuthForm } from "@/features/auth/auth-form";
import { Card, CardContent } from "@/components/ui/card";
import { isPaidPlanId } from "@/config/product";
export const metadata = { title: "Create account" };
export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string | string[] }>;
}) {
  const rawPlan = (await searchParams).plan;
  const candidate = Array.isArray(rawPlan) ? rawPlan[0] : rawPlan;
  const planId = isPaidPlanId(candidate) ? candidate : undefined;
  return (
    <div className="container-page py-16">
      <Card className="mx-auto max-w-xl">
        <CardContent className="pt-6">
          <p className="eyebrow">Create your learning plan</p>
          <h1 className="mt-3 text-3xl font-bold">
            Turn your result into a focused next step.
          </h1>
          <p className="mt-3 mb-7 text-sm leading-6 text-muted-foreground">
            Mock registration stores only local demo data in this browser. It is
            not production authentication.
          </p>
          <AuthForm mode="register" planId={planId} />
        </CardContent>
      </Card>
    </div>
  );
}
