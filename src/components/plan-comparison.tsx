"use client";

import Link from "next/link";
import { Check, Star } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { setCheckoutIntentAction } from "@/app/actions/auth";
import { useApp } from "@/components/providers/app-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  formatPlanPrice,
  isPaidPlanId,
  productPlans,
  type ProductPlan,
} from "@/config/product";
import type { PaidPlanId } from "@/types/domain";
import { withErrorReference } from "@/lib/public-error";

export function PlanComparison({
  plans = productPlans,
}: {
  plans?: readonly ProductPlan[];
}) {
  const router = useRouter();
  const { state, hydrated, setState } = useApp();
  const [pendingPlanId, setPendingPlanId] = useState<PaidPlanId | null>(null);

  const choosePaidPlan = async (planId: PaidPlanId) => {
    setPendingPlanId(planId);
    const result = await setCheckoutIntentAction(planId);
    setPendingPlanId(null);
    if (!result.ok) {
      toast.error(withErrorReference(result.message, result.reference));
      if (result.reason === "unauthenticated")
        router.push(`/login?plan=${planId}`);
      return;
    }
    setState((current) => ({
      ...current,
      checkoutIntentPlanId: result.planId,
    }));
    router.push(
      state.diagnosticResult
        ? `/checkout?plan=${result.planId}`
        : "/diagnostic",
    );
  };

  return (
    <div
      className={`grid gap-5 md:grid-cols-2 ${plans.length === 3 ? "xl:grid-cols-3" : "xl:grid-cols-4"}`}
      role="region"
      aria-label="MPK Academy plans"
    >
      {plans.map((plan) => (
        <Card
          key={plan.id}
          role="article"
          aria-label={`${plan.name} plan`}
          className={`h-full ${
            plan.featured
              ? "border-primary bg-primary/[.04] ring-1 ring-primary"
              : ""
          }`}
        >
          <CardContent className="flex h-full flex-col pt-6">
            <div className="flex min-h-8 flex-wrap items-start justify-between gap-2">
              <h3 className="text-xl font-black">{plan.name}</h3>
              {plan.featured && (
                <Badge className="gap-1 whitespace-nowrap">
                  <Star className="size-3 fill-current" aria-hidden="true" />
                  Recommended
                </Badge>
              )}
            </div>

            <div className="mt-5">
              <p className="text-4xl font-black">{formatPlanPrice(plan)}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {plan.paymentModel} · {plan.access}
              </p>
            </div>

            <div
              className={`mt-5 rounded-xl p-4 ${
                plan.featured ? "bg-primary/10" : "bg-muted/60"
              }`}
            >
              <p className="text-xs font-black uppercase tracking-[.12em] text-muted-foreground">
                Best for
              </p>
              <p className="mt-2 text-sm font-bold leading-6">{plan.bestFor}</p>
            </div>

            <ul className="mt-5 space-y-3">
              {plan.highlights.map((highlight) => (
                <li key={highlight} className="flex gap-2 text-sm leading-6">
                  <Check
                    className="mt-0.5 size-4 shrink-0 text-primary"
                    aria-hidden="true"
                  />
                  {highlight}
                </li>
              ))}
            </ul>

            <div className="mt-auto pt-7">
              {plan.id === "free" ? (
                <Button
                  asChild
                  variant={plan.featured ? "primary" : "secondary"}
                  className="w-full"
                >
                  <Link href="/diagnostic">{plan.cta}</Link>
                </Button>
              ) : !hydrated ? (
                <Button
                  variant={plan.featured ? "primary" : "secondary"}
                  className="w-full"
                  disabled
                >
                  Loading…
                </Button>
              ) : !state.user ? (
                <Button
                  asChild
                  variant={plan.featured ? "primary" : "secondary"}
                  className="w-full"
                >
                  <Link href={`/register?plan=${plan.id}`}>{plan.cta}</Link>
                </Button>
              ) : state.planAccess ? (
                <Button
                  asChild
                  variant={plan.featured ? "primary" : "secondary"}
                  className="w-full"
                >
                  <Link href="/dashboard">Go to dashboard</Link>
                </Button>
              ) : (
                <Button
                  variant={plan.featured ? "primary" : "secondary"}
                  className="w-full"
                  disabled={pendingPlanId !== null}
                  onClick={() => {
                    if (isPaidPlanId(plan.id)) void choosePaidPlan(plan.id);
                  }}
                >
                  {pendingPlanId === plan.id ? "Saving…" : plan.cta}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
