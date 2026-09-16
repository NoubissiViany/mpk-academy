import { AuthForm } from "@/features/auth/auth-form";
import { Card, CardContent } from "@/components/ui/card";
import { getPaidPlan } from "@/config/product";
export const metadata = { title: "Sign in" };
export default async function LoginPage({
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
  const planId =
    candidate === undefined ? undefined : getPaidPlan(candidate).id;
  return (
    <div className="container-page py-16">
      <Card className="mx-auto max-w-md">
        <CardContent className="pt-6">
          <p className="eyebrow">Welcome back</p>
          <h1 className="mt-3 text-3xl font-bold">
            Continue your preparation.
          </h1>
          <p className="mt-3 mb-7 text-sm leading-6 text-muted-foreground">
            Enter the email and password you used when creating your account on
            this browser. Local accounts are available only in this browser.
          </p>
          <AuthForm
            mode="login"
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
