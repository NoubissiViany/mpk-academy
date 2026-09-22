"use client";

import Link from "next/link";
import { Check, LoaderCircle, LockKeyhole, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { createCheckoutSessionAction } from "@/app/actions/checkout";
import { useApp } from "@/components/providers/app-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatPlanPrice, getPaidPlan, productConfig } from "@/config/product";

type CheckoutPlan = NonNullable<ReturnType<typeof getPaidPlan>>;
export function CheckoutView({ plan }: { plan: CheckoutPlan }) {
  const { state: appState, hydrated } = useApp();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const hasAssessment = Boolean(appState.diagnosticResult);

  const checkout = async () => {
    setSubmitting(true);
    const result = await createCheckoutSessionAction(plan.id);
    if (result.ok) {
      window.location.assign(result.url);
      return;
    }
    setSubmitting(false);
    if (result.reason === "assessment_required") {
      toast.error(result.message);
      router.push("/diagnostic");
      return;
    }
    if (result.reason === "active_entitlement") {
      toast.success(result.message);
      router.push("/dashboard");
      return;
    }
    if (result.reason === "unauthenticated") {
      toast.error(result.message);
      router.push(
        `/login?next=${encodeURIComponent(`/checkout?plan=${plan.id}`)}`,
      );
      return;
    }
    toast.error(result.message);
  };

  return (
    <div className="grid gap-7 lg:grid-cols-[1fr_.7fr]">
      <div>
        <Card>
          <CardContent className="pt-6">
            <p className="eyebrow">Order summary</p>
            <div className="mt-3 flex flex-wrap items-baseline justify-between gap-3">
              <h1 className="text-3xl font-bold">{plan.name} plan</h1>
              <p className="text-2xl font-black">{formatPlanPrice(plan)}</p>
            </div>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {plan.purpose}. One-time purchase with {plan.access.toLowerCase()}{" "}
              of access. Applicable tax is calculated at checkout.
            </p>

            <div className="mt-7 rounded-xl border bg-muted/40 p-4">
              <p className="text-xs font-bold uppercase tracking-[.14em] text-muted-foreground">
                Program
              </p>
              <p className="mt-2 font-semibold">{productConfig.courseName}</p>
            </div>

            <ul className="mt-7 space-y-3">
              {plan.highlights.map((item) => (
                <li key={item} className="flex gap-3 text-sm">
                  <Check
                    className="size-5 shrink-0 text-primary"
                    aria-hidden="true"
                  />
                  {item}
                </li>
              ))}
            </ul>

            <div className="mt-8 flex items-center justify-between border-t pt-6">
              <div>
                <span className="font-bold">Estimated total</span>
                <p className="text-xs text-muted-foreground">
                  CAD · one time · plus applicable tax
                </p>
              </div>
              <strong className="text-2xl">{formatPlanPrice(plan)}</strong>
            </div>
          </CardContent>
        </Card>
        <div className="mt-5 flex gap-3 rounded-xl bg-muted p-4">
          <ShieldCheck
            className="size-5 shrink-0 text-primary"
            aria-hidden="true"
          />
          <p className="text-xs leading-5 text-muted-foreground">
            Secure payment is handled by Stripe. MPK Academy grants access only
            after Stripe verifies the payment.
          </p>
        </div>
      </div>

      <Card className="h-fit">
        <CardContent className="pt-6">
          <span className="grid size-11 place-items-center rounded-full bg-primary/10 text-primary">
            <LockKeyhole className="size-5" />
          </span>
          <h2 className="mt-5 text-xl font-bold">
            {!hydrated
              ? "Preparing checkout…"
              : !appState.user
                ? "Create an account to continue"
                : appState.planAccess
                  ? "Your paid plan is already active"
                  : !hasAssessment
                    ? "Complete your assessment first"
                    : `Continue with ${plan.name}`}
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {!hydrated
              ? "Checking your local account."
              : !appState.user
                ? "New learners complete the free assessment before checkout. Existing learners can sign in to continue with this plan."
                : appState.planAccess
                  ? "You cannot purchase another plan while your current access is active."
                  : !hasAssessment
                    ? "Your result is required so MPK Academy can recommend the right preparation plan."
                    : "You will continue to Stripe to complete a secure one-time payment."}
          </p>

          {!hydrated ? (
            <Button className="mt-6 w-full" size="lg" disabled>
              <LoaderCircle className="size-4 animate-spin" /> Preparing…
            </Button>
          ) : !appState.user ? (
            <>
              <Button asChild className="mt-6 w-full" size="lg">
                <Link href="/register">Create account</Link>
              </Button>
              <Button asChild className="mt-2 w-full" variant="ghost">
                <Link href={`/login?plan=${plan.id}`}>Sign in</Link>
              </Button>
            </>
          ) : appState.planAccess ? (
            <Button asChild className="mt-6 w-full" size="lg">
              <Link href="/dashboard">Go to dashboard</Link>
            </Button>
          ) : !hasAssessment ? (
            <Button asChild className="mt-6 w-full" size="lg">
              <Link href="/diagnostic">Start my assessment</Link>
            </Button>
          ) : (
            <Button
              className="mt-6 w-full"
              size="lg"
              disabled={submitting}
              onClick={checkout}
            >
              {submitting ? (
                <>
                  <LoaderCircle className="size-4 animate-spin" /> Preparing…
                </>
              ) : (
                `Pay securely for ${plan.name}`
              )}
            </Button>
          )}

          <p className="mt-4 text-center text-xs text-muted-foreground">
            Access is granted only after verified payment
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
