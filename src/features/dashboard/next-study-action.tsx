"use client";
import Link from "next/link";
import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { useApp } from "@/components/providers/app-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { hasPlanFeature } from "@/config/product";
import { useI18n } from "@/i18n/client";
import { lessonTitle } from "@/i18n/format";
import type { Messages } from "@/i18n/messages";
import { getTodayPlan, type TodayStep } from "@/lib/domain/today";

export function todayStepAction(step: TodayStep, t: Messages) {
  if (step.kind === "lesson") return t.ux.plan.lesson(step.minutes);
  return t.ux.plan[step.kind](t.practice.skills[step.skill], step.minutes);
}

export function NextStudyAction() {
  const { state, hydrated } = useApp();
  const { t, locale } = useI18n();
  const [now] = useState(() => new Date());
  if (!hydrated || !state.planAccess) return null;
  const plan = getTodayPlan(state, now, {
    personalized: hasPlanFeature(
      state.planAccess,
      "personalizedRecommendations",
    ),
    reviews: hasPlanFeature(state.planAccess, "mistakeReview"),
  });
  if (!plan.steps.length) return null;
  const next = plan.next;
  return (
    <Card className="mt-6 border-primary/20">
      <CardContent className="flex flex-col gap-4 pt-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold">
            {next ? t.ux.plan.next : t.ux.plan.completed}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {next
              ? next.kind === "lesson"
                ? lessonTitle(locale, next.lesson)
                : t.ux.plan.remaining(plan.minutes)
              : t.ux.plan.completedBody}
          </p>
        </div>
        <Button asChild>
          <Link href={next?.href ?? "/dashboard"}>
            {next ? todayStepAction(next, t) : t.ux.plan.dashboard}
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
