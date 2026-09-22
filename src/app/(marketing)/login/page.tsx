import { AuthForm } from "@/features/auth/auth-form";
import { Card, CardContent } from "@/components/ui/card";
import { isPaidPlanId } from "@/config/product";
export const metadata = { title: "Sign in" };
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
  const rawPlan = resolved.plan;
  const candidate = Array.isArray(rawPlan) ? rawPlan[0] : rawPlan;
  const planId = isPaidPlanId(candidate) ? candidate : undefined;
  const error = Array.isArray(resolved.error)
    ? resolved.error[0]
    : resolved.error;
  const reference = Array.isArray(resolved.ref)
    ? resolved.ref[0]
    : resolved.ref;
  return (
    <div className="container-page py-16">
      <Card className="mx-auto max-w-md">
        <CardContent className="pt-6">
          <p className="eyebrow">Welcome back</p>
          <h1 className="mt-3 text-3xl font-bold">
            Continue your preparation.
          </h1>
          <p className="mt-3 mb-7 text-sm leading-6 text-muted-foreground">
            Enter your MPK Academy email and password. Your account and learning
            progress are securely stored with Supabase.
          </p>
          {error === "confirmation" && (
            <div
              className="mb-6 rounded-xl border border-danger/25 bg-danger/5 px-4 py-3 text-sm text-danger"
              role="alert"
            >
              This confirmation link is invalid or has expired. Request a new
              confirmation email or create the account again.
              {reference && (
                <span className="mt-2 block font-mono text-xs">
                  Reference: {reference}
                </span>
              )}
            </div>
          )}
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
