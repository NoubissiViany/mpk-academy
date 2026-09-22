"use client";

import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  LoaderCircle,
  ShieldAlert,
} from "lucide-react";
import { useApp } from "@/components/providers/app-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getPaidPlan } from "@/config/product";

export function CheckoutSuccessView() {
  const { state, hydrated } = useApp();

  if (!hydrated)
    return (
      <Card className="mx-auto max-w-2xl">
        <CardContent className="grid min-h-72 place-items-center">
          <LoaderCircle className="size-7 animate-spin text-primary" />
        </CardContent>
      </Card>
    );

  const plan = state.planAccess
    ? getPaidPlan(state.planAccess.planId)
    : undefined;

  if (!plan)
    return (
      <Card className="mx-auto max-w-2xl">
        <CardContent className="py-12 text-center">
          <ShieldAlert className="mx-auto size-12 text-danger" />
          <h1 className="mt-5 text-2xl font-bold">Payment not confirmed</h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">
            We could not find a completed purchase for this local account.
          </p>
          <Button asChild className="mt-7">
            <Link href="/choose-plan">Choose a plan</Link>
          </Button>
        </CardContent>
      </Card>
    );

  const hasAssessment = Boolean(state.diagnosticResult);
  return (
    <Card className="mx-auto max-w-2xl">
      <CardContent className="py-12 text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-full bg-primary/10">
          <CheckCircle2 className="size-7 text-primary" />
        </span>
        <p className="eyebrow mt-6">Mock payment successful</p>
        <h1 className="mt-3 text-3xl font-bold">
          Your {plan.name} plan is unlocked.
        </h1>
        <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-muted-foreground">
          {hasAssessment
            ? "Your saved assessment is connected to your account and your dashboard is ready."
            : "Next, complete your assessment so MPK Academy can prepare your starting point."}
        </p>
        <Button asChild size="lg" className="mt-7">
          <Link href={hasAssessment ? "/dashboard" : "/diagnostic"}>
            {hasAssessment ? "Go to dashboard" : "Start my assessment"}
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
