"use client";

import Link from "next/link";
import { ArrowRight, Check, KeyRound, Sparkles, Target } from "lucide-react";
import { useApp } from "@/components/providers/app-provider";
import { MetricBar } from "@/components/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  formatPlanPrice,
  getPaidPlan,
  isBetaMode,
  recommendedPaidPlanId,
} from "@/config/product";
import { useI18n } from "@/i18n/client";
import type { Messages } from "@/i18n/messages";
import type { AppState } from "@/types/domain";

function BetaContinueCard({
  state,
  t,
}: {
  state: AppState;
  t: Messages["beta"]["results"];
}) {
  const signedIn = Boolean(state.user);
  return (
    <Card className="mt-8 overflow-hidden border-primary ring-1 ring-primary">
      <CardContent className="grid gap-7 p-0 md:grid-cols-[1.35fr_.65fr]">
        <div className="p-7 sm:p-9">
          <Badge className="gap-1.5">
            <KeyRound className="size-3.5" aria-hidden="true" />
            {t.eyebrow}
          </Badge>
          <h2 className="mt-5 text-3xl font-black">{t.title}</h2>
          <p className="mt-4 leading-7 text-muted-foreground">
            {signedIn ? t.activateCopy : t.guestCopy}
          </p>
        </div>
        <div className="flex flex-col justify-center bg-primary/5 p-7 sm:p-9">
          <Button asChild size="lg" className="w-full lg:text-nowrap">
            <Link href={signedIn ? "/beta" : "/register"}>
              {signedIn ? t.activate : t.createAccount}
              <ArrowRight className="size-4" />
            </Link>
          </Button>
          {!signedIn && (
            <Button asChild variant="secondary" className="mt-2 w-full">
              <Link href={`/login?next=${encodeURIComponent("/dashboard")}`}>
                {t.haveAccount}
              </Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function ResultsView() {
  const { state, hydrated } = useApp();
  const { t } = useI18n();
  const copy = t.diagnostic.results;
  const result = state.diagnosticResult;

  if (!hydrated) {
    return (
      <div
        className="mx-auto h-96 max-w-4xl animate-pulse rounded-2xl bg-muted"
        aria-label={copy.loading}
      />
    );
  }

  if (!result) {
    return (
      <Card className="mx-auto max-w-2xl border-dashed">
        <CardContent className="py-12 text-center">
          <h1 className="text-2xl font-bold">{copy.emptyTitle}</h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">
            {copy.emptyBody}
          </p>
          <Button asChild className="mt-6">
            <Link href="/diagnostic">{copy.emptyCta}</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const skills = t.diagnostic.skills;
  const levelContent = t.diagnostic.levels[result.level];
  const strength = skills[result.strength];
  const priority = skills[result.priority];
  const intake = state.diagnosticIntake;
  const goal =
    intake?.goal && intake.goal !== "Not sure yet" ? intake.goal : undefined;
  const target =
    intake?.target && intake.target !== "I'm not sure"
      ? intake.target
      : undefined;
  const experience = intake?.frenchExperience
    ? t.diagnostic.intake.experience[intake.frenchExperience]
    : undefined;
  const hasAccess = Boolean(state.user && state.planAccess);

  return (
    <div className="mx-auto max-w-4xl">
      <div
        className="mb-8 flex items-center gap-3"
        aria-label={t.diagnostic.step(3)}
      >
        {[1, 2, 3].map((item) => (
          <span key={item} className="h-1.5 flex-1 rounded-full bg-primary" />
        ))}
        <span className="shrink-0 text-xs font-bold uppercase tracking-[.14em] text-muted-foreground">
          {t.diagnostic.step(3)}
        </span>
      </div>

      <header className="text-center">
        <p className="eyebrow">{copy.eyebrow}</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
          {copy.title}
        </h1>
      </header>

      <Card className="mt-8 overflow-hidden border-primary/20">
        <CardContent className="grid gap-8 p-0 md:grid-cols-[.7fr_1.3fr]">
          <div className="bg-ink p-7 text-white sm:p-9">
            <p className="text-xs font-bold uppercase tracking-[.16em] text-white/55">
              {copy.levelLabel}
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
              {copy.intakeSummary(goal, target, experience)}
            </p>
          </div>
        </CardContent>
      </Card>

      <section className="mt-10">
        <h2 className="text-xs font-black uppercase tracking-[.18em] text-muted-foreground">
          {copy.skillsTitle}
        </h2>
        <Card className="mt-4">
          <CardContent className="grid gap-x-10 gap-y-6 pt-6 md:grid-cols-2">
            <MetricBar
              label={copy.reading}
              value={result.skillScores.reading ?? 0}
            />
            <MetricBar
              label={copy.foundation}
              value={
                result.languageFoundation ??
                Math.round(
                  ((result.skillScores.grammar ?? 0) +
                    (result.skillScores.vocabulary ?? 0)) /
                    2,
                )
              }
            />
            {result.skillScores.listening === null ? (
              <p>{copy.listeningPending}</p>
            ) : (
              <MetricBar
                label={copy.listening}
                value={result.skillScores.listening}
              />
            )}
            <p>{copy.writingPending}</p>
            <p>{copy.speakingPending}</p>
            <p className="text-sm text-muted-foreground md:col-span-2">
              {copy.basedOn(result.assessedItemCount ?? copy.historical)}
            </p>
          </CardContent>
        </Card>
      </section>

      <div className="mt-6 grid gap-5 md:grid-cols-2">
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs font-black uppercase tracking-[.18em] text-muted-foreground">
              {copy.strengthTitle}
            </p>
            <div className="mt-5 flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded-full bg-primary/10 text-primary">
                <Check className="size-5" aria-hidden="true" />
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
              {copy.priorityTitle}
            </p>
            <div className="mt-5 flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded-full bg-accent/10 text-accent">
                <Target className="size-5" aria-hidden="true" />
              </span>
              <h2 className="text-xl font-bold">{priority.label}</h2>
            </div>
            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              {priority.priority}
            </p>
            <p className="mt-3 text-sm font-bold">{copy.startHere}</p>
          </CardContent>
        </Card>
      </div>

      {hasAccess ? (
        <div className="mt-8 flex justify-center">
          <Button asChild size="lg">
            <Link href="/dashboard">
              {copy.dashboard}
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      ) : isBetaMode() ? (
        <BetaContinueCard state={state} t={t.beta.results} />
      ) : (
        <PlanRecommendation state={state} t={t} />
      )}

      <div className="mt-6 flex flex-col items-center">
        <p className="mt-4 text-center text-xs leading-5 text-muted-foreground">
          {copy.disclaimer}
        </p>
      </div>
    </div>
  );
}

// The recommendation follows the learner's target only; the copy says so.
function PlanRecommendation({ state, t }: { state: AppState; t: Messages }) {
  const copy = t.diagnostic.results;
  const intake = state.diagnosticIntake;
  const recommendedPlan = getPaidPlan(recommendedPaidPlanId(intake?.target))!;
  const selectedPlan = state.checkoutIntentPlanId
    ? getPaidPlan(state.checkoutIntentPlanId)
    : undefined;
  const checkoutPlan = selectedPlan ?? recommendedPlan;
  const differs =
    Boolean(selectedPlan) && selectedPlan?.id !== recommendedPlan.id;
  const href = state.user
    ? `/checkout?plan=${checkoutPlan.id}`
    : `/register?plan=${checkoutPlan.id}`;
  const goalText = intake?.target ?? copy.currentGoal;
  const kind = selectedPlan ? copy.selected : copy.recommended;
  return (
    <Card
      className="mt-8 overflow-hidden border-primary ring-1 ring-primary"
      aria-label={copy.planLabel(kind, checkoutPlan.name)}
    >
      <CardContent className="grid gap-7 p-0 md:grid-cols-[1.35fr_.65fr]">
        <div className="p-7 sm:p-9">
          <Badge className="gap-1.5">
            <Sparkles className="size-3.5" aria-hidden="true" />
            {kind}
          </Badge>
          <h2 className="mt-5 text-3xl font-black">{checkoutPlan.name}</h2>
          {differs ? (
            <div className="mt-4 space-y-3 leading-7 text-muted-foreground">
              <p>{copy.selectedDiffers(checkoutPlan.name)}</p>
              <p>{copy.basis(goalText, recommendedPlan.name)}</p>
            </div>
          ) : (
            <p className="mt-4 leading-7 text-muted-foreground">
              {copy.basisSame(goalText)}
            </p>
          )}
          <p className="mt-4 font-semibold">{checkoutPlan.purpose}</p>
        </div>
        <div className="flex flex-col justify-center bg-primary/5 p-7 sm:p-9">
          <p className="text-4xl font-black">{formatPlanPrice(checkoutPlan)}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            {checkoutPlan.paymentModel} · {checkoutPlan.access}
          </p>
          <Button asChild size="lg" className="mt-6 w-full lg:text-nowrap">
            <Link href={href}>
              {copy.continueWith(checkoutPlan.name)}
              <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button asChild variant="secondary" className="mt-2 w-full">
            <Link href="/pricing">{copy.compare}</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
