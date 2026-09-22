import Link from "next/link";
import { Check, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  formatPlanPrice,
  productPlans,
  type ProductPlan,
} from "@/config/product";

function planHref(plan: ProductPlan) {
  return plan.id === "free" ? "/diagnostic" : `/checkout?plan=${plan.id}`;
}

export function PlanComparison({
  plans = productPlans,
}: {
  plans?: readonly ProductPlan[];
}) {
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
              <Button
                asChild
                variant={plan.featured ? "primary" : "secondary"}
                className="w-full"
              >
                <Link href={planHref(plan)}>{plan.cta}</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
