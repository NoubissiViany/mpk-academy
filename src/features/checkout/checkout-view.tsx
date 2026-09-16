"use client";

import Link from "next/link";
import {
  Check,
  CreditCard,
  LoaderCircle,
  LockKeyhole,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useApp } from "@/components/providers/app-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  calculatePlanAccessUntil,
  formatPlanPrice,
  getPaidPlan,
  productConfig,
} from "@/config/product";
import { mockPaymentRepository } from "@/repositories/mock";

type CheckoutPlan = ReturnType<typeof getPaidPlan>;
type State = "idle" | "redirecting" | "failed" | "cancelled";

const included = [
  "Complete eight-module curriculum",
  "Targeted Practice Mode",
  "French-first exam simulations",
  "Weakness and mistake tracking",
  "Progress and MPK Readiness",
];

export function CheckoutView({ plan }: { plan: CheckoutPlan }) {
  const router = useRouter();
  const { state: appState, hydrated, setState } = useApp();
  const [status, setStatus] = useState<State>("idle");

  const checkout = async () => {
    if (!appState.user) return;
    setStatus("redirecting");
    const result = await mockPaymentRepository.checkout();
    if (result === "success") {
      const purchasedAt = new Date();
      setState((current) => ({
        ...current,
        user: current.user ? { ...current.user, tier: "paid_student" } : null,
        planAccess: {
          planId: plan.id,
          purchasedAt: purchasedAt.toISOString(),
          accessUntil: calculatePlanAccessUntil(
            plan.id,
            purchasedAt,
          ).toISOString(),
        },
        postCheckoutWelcomePending: Boolean(current.diagnosticResult),
      }));
      router.push(`/checkout/success?plan=${plan.id}`);
    } else {
      setStatus(result);
    }
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
              of access.
            </p>

            <div className="mt-7 rounded-xl border bg-muted/40 p-4">
              <p className="text-xs font-bold uppercase tracking-[.14em] text-muted-foreground">
                Program
              </p>
              <p className="mt-2 font-semibold">{productConfig.courseName}</p>
            </div>

            <ul className="mt-7 space-y-3">
              {included.map((item) => (
                <li key={item} className="flex gap-3 text-sm">
                  <Check
                    className="size-5 shrink-0 text-primary"
                    aria-hidden="true"
                  />
                  {item}
                </li>
              ))}
              {plan.id === "intensive" && (
                <li className="flex gap-3 text-sm">
                  <Check
                    className="size-5 shrink-0 text-primary"
                    aria-hidden="true"
                  />
                  Higher AI and mock-exam limits
                </li>
              )}
            </ul>

            <div className="mt-8 flex items-center justify-between border-t pt-6">
              <div>
                <span className="font-bold">Estimated total</span>
                <p className="text-xs text-muted-foreground">CAD · one time</p>
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
            Production payments will use a PCI-compliant provider. This MVP only
            simulates the handoff, does not request card details, and does not
            enforce access periods or usage limits.
          </p>
        </div>
      </div>

      <Card className="h-fit">
        <CardContent className="pt-6">
          <span className="grid size-11 place-items-center rounded-full bg-primary/10 text-primary">
            {status === "redirecting" ? (
              <LoaderCircle className="size-5 animate-spin" />
            ) : status === "failed" || status === "cancelled" ? (
              <XCircle className="size-5 text-danger" />
            ) : (
              <LockKeyhole className="size-5" />
            )}
          </span>
          <h2 className="mt-5 text-xl font-bold">
            {!hydrated
              ? "Preparing checkout…"
              : !appState.user
                ? "Create an account to continue"
                : status === "redirecting"
                  ? "Opening secure checkout…"
                  : status === "failed"
                    ? "Payment was not completed"
                    : status === "cancelled"
                      ? "Checkout cancelled"
                      : `Continue with ${plan.name}`}
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {!hydrated
              ? "Checking your local account."
              : !appState.user
                ? "Your selected plan will be preserved while you register or sign in."
                : status === "idle"
                  ? "No card details will be requested in this mock checkout."
                  : status === "redirecting"
                    ? "Please wait while the mock provider responds."
                    : "Your access has not changed. Try again when you are ready."}
          </p>

          {!hydrated ? (
            <Button className="mt-6 w-full" size="lg" disabled>
              <LoaderCircle className="size-4 animate-spin" /> Preparing…
            </Button>
          ) : !appState.user ? (
            <>
              <Button asChild className="mt-6 w-full" size="lg">
                <Link href={`/register?plan=${plan.id}`}>Create account</Link>
              </Button>
              <Button asChild className="mt-2 w-full" variant="ghost">
                <Link href={`/login?plan=${plan.id}`}>Sign in</Link>
              </Button>
            </>
          ) : (
            <Button
              className="mt-6 w-full"
              size="lg"
              onClick={checkout}
              disabled={status === "redirecting"}
            >
              <CreditCard className="size-4" />
              {status === "idle"
                ? "Continue to secure payment"
                : status === "redirecting"
                  ? "Redirecting…"
                  : "Try again"}
            </Button>
          )}

          <p className="mt-4 text-center text-xs text-muted-foreground">
            Mock checkout simulation
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
