"use client";

import Link from "next/link";
import { ArrowRight, Check, Sparkles, Target } from "lucide-react";
import { useApp } from "@/components/providers/app-provider";
import { MetricBar } from "@/components/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  diagnosticLevelContent,
  diagnosticSkillContent,
  diagnosticSkillOrder,
} from "@/config/diagnostic";
import {
  formatPlanPrice,
  getPaidPlan,
  recommendedPaidPlanId,
} from "@/config/product";

function intakeSummary(goal?: string, target?: string, experience?: string) {
  const goalText =
    goal && goal !== "Not sure yet"
      ? `preparing for ${goal}`
      : "exploring your French goals";
  const targetText =
    target && target !== "I'm not sure" ? ` and aiming for ${target}` : "";
  const experienceText = experience
    ? ` You described your French today as “${experience.toLowerCase()}.”`
    : "";
  return `This starting point is personalized for someone ${goalText}${targetText}.${experienceText}`;
}

export function ResultsView() {
  const { state, hydrated } = useApp();
  const result = state.diagnosticResult;

  if (!hydrated) {
    return (
      <div
        className="mx-auto h-96 max-w-4xl animate-pulse rounded-2xl bg-muted"
        aria-label="Loading assessment results"
      />
    );
  }

  if (!result) {
    return (
      <Card className="mx-auto max-w-2xl border-dashed">
        <CardContent className="py-12 text-center">
          <h1 className="text-2xl font-bold">No assessment result yet</h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">
            Complete the French assessment to see your estimated level and
            six-skill profile.
          </p>
          <Button asChild className="mt-6">
            <Link href="/diagnostic">Start my assessment</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const levelContent = diagnosticLevelContent[result.level];
  const strength = diagnosticSkillContent[result.strength];
  const priority = diagnosticSkillContent[result.priority];
  const intake = state.diagnosticIntake;
  const hasPurchasedPlan = Boolean(state.user && state.planAccess);
  const recommendedPlan = getPaidPlan(recommendedPaidPlanId(intake?.target))!;
  const selectedPlan = state.checkoutIntentPlanId
    ? getPaidPlan(state.checkoutIntentPlanId)
    : undefined;
  const checkoutPlan = selectedPlan ?? recommendedPlan;
  const selectionDiffersFromRecommendation =
    Boolean(selectedPlan) && selectedPlan?.id !== recommendedPlan.id;
  const recommendationHref = state.user
    ? `/checkout?plan=${checkoutPlan.id}`
    : `/register?plan=${checkoutPlan.id}`;

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8 flex items-center gap-3" aria-label="Step 3 of 3">
        {[1, 2, 3].map((item) => (
          <span key={item} className="h-1.5 flex-1 rounded-full bg-primary" />
        ))}
        <span className="shrink-0 text-xs font-bold uppercase tracking-[.14em] text-muted-foreground">
          Step 3 of 3
        </span>
      </div>

      <header className="text-center">
        <p className="eyebrow">Assessment complete</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
          Your French Assessment
        </h1>
      </header>

      <Card className="mt-8 overflow-hidden border-primary/20">
        <CardContent className="grid gap-8 p-0 md:grid-cols-[.7fr_1.3fr]">
          <div className="bg-ink p-7 text-white sm:p-9">
            <p className="text-xs font-bold uppercase tracking-[.16em] text-white/55">
              Estimated level
            </p>
            <p className="mt-4 text-7xl font-black text-[#74dab8]">
              {result.level}
            </p>
            <p className="mt-3 text-lg font-bold">{levelContent.descriptor}</p>
          </div>
          <div className="p-7 sm:p-9">
            <p className="text-xl font-bold leading-8">
              {levelContent.summary}
            </p>
            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              {intakeSummary(
                intake?.goal,
                intake?.target,
                intake?.frenchExperience,
              )}
            </p>
          </div>
        </CardContent>
      </Card>

      <section className="mt-10">
        <h2 className="text-xs font-black uppercase tracking-[.18em] text-muted-foreground">
          Your skills
        </h2>
        <Card className="mt-4">
          <CardContent className="grid gap-x-10 gap-y-6 pt-6 md:grid-cols-2">
            {diagnosticSkillOrder.map((skill) => (
              <MetricBar
                key={skill}
                label={diagnosticSkillContent[skill].label}
                value={result.skillScores[skill]}
              />
            ))}
          </CardContent>
        </Card>
      </section>

      <div className="mt-6 grid gap-5 md:grid-cols-2">
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs font-black uppercase tracking-[.18em] text-muted-foreground">
              Your strength
            </p>
            <div className="mt-5 flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded-full bg-primary/10 text-primary">
                <Check className="size-5" />
              </span>
              <h2 className="text-xl font-bold">{strength.label}</h2>
            </div>
            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              {strength.strength}
            </p>
          </CardContent>
        </Card>
        <Card className="border-accent/30 bg-accent/5">
          <CardContent className="pt-6">
            <p className="text-xs font-black uppercase tracking-[.18em] text-muted-foreground">
              Your priority
            </p>
            <div className="mt-5 flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded-full bg-accent/10 text-accent">
                <Target className="size-5" />
              </span>
              <h2 className="text-xl font-bold">{priority.label}</h2>
            </div>
            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              {priority.priority}
            </p>
            <p className="mt-3 text-sm font-bold">
              We recommend starting here.
            </p>
          </CardContent>
        </Card>
      </div>

      {hasPurchasedPlan ? (
        <div className="mt-8 flex justify-center">
          <Button asChild size="lg">
            <Link href="/dashboard">
              Go to dashboard
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      ) : (
        <Card
          className="mt-8 overflow-hidden border-primary ring-1 ring-primary"
          aria-label={`${selectedPlan ? "Selected" : "Recommended"} plan: ${checkoutPlan.name}`}
        >
          <CardContent className="grid gap-7 p-0 md:grid-cols-[1.35fr_.65fr]">
            <div className="p-7 sm:p-9">
              <Badge className="gap-1.5">
                <Sparkles className="size-3.5" aria-hidden="true" />
                {selectedPlan ? "Your selected plan" : "Recommended for you"}
              </Badge>
              <h2 className="mt-5 text-3xl font-black">{checkoutPlan.name}</h2>
              {selectionDiffersFromRecommendation ? (
                <div className="mt-4 space-y-3 leading-7 text-muted-foreground">
                  <p>
                    You selected {checkoutPlan.name} before your assessment.
                    Your selection remains ready for checkout.
                  </p>
                  <p>
                    Based on your {intake?.target ?? "current"} goal,{" "}
                    {result.level} estimated level, and{" "}
                    {priority.label.toLowerCase()} priority, your assessment
                    recommends {recommendedPlan.name}.
                  </p>
                </div>
              ) : (
                <p className="mt-4 leading-7 text-muted-foreground">
                  Based on your {intake?.target ?? "current"} goal,{" "}
                  {result.level} estimated level, and{" "}
                  {priority.label.toLowerCase()} priority, this plan gives you
                  the right level of support for your next step.
                </p>
              )}
              <p className="mt-4 font-semibold">{checkoutPlan.purpose}</p>
            </div>
            <div className="flex flex-col justify-center bg-primary/5 p-7 sm:p-9">
              <p className="text-4xl font-black">
                {formatPlanPrice(checkoutPlan)}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                {checkoutPlan.paymentModel} · {checkoutPlan.access}
              </p>
              <Button asChild size="lg" className="mt-6 w-full lg:text-nowrap">
                <Link href={recommendationHref}>
                  Continue with {checkoutPlan.name}
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild variant="secondary" className="mt-2 w-full">
                <Link href="/pricing">Compare all plans</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="mt-6 flex flex-col items-center">
        <p className="mt-4 text-center text-xs leading-5 text-muted-foreground">
          This MPK Academy estimate is a learning indicator, not an official
          TEF/TCF score.
        </p>
      </div>
    </div>
  );
}
