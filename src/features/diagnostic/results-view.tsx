"use client";

import Link from "next/link";
import { ArrowRight, Check, Target } from "lucide-react";
import { useApp } from "@/components/providers/app-provider";
import { MetricBar } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  diagnosticLevelContent,
  diagnosticSkillContent,
  diagnosticSkillOrder,
} from "@/config/diagnostic";

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

      <div className="mt-8 flex flex-col items-center">
        <Button asChild size="lg">
          <Link href={state.user ? "/dashboard" : "/register"}>
            See my learning plan <ArrowRight className="size-4" />
          </Link>
        </Button>
        <p className="mt-4 text-center text-xs leading-5 text-muted-foreground">
          This MPK Academy estimate is a learning indicator, not an official
          TEF/TCF score.
        </p>
      </div>
    </div>
  );
}
