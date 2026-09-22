"use client";

import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Headphones,
  Mic2,
  PenLine,
  Target,
} from "lucide-react";
import { useApp } from "@/components/providers/app-provider";
import { updateExamGoalAction } from "@/app/actions/learner";
import { PageHeader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { diagnosticSkillContent } from "@/config/diagnostic";
import {
  examConfigurations,
  examSkillContent,
  examSkillOrder,
} from "@/config/exams";
import { hasPlanFeature } from "@/config/product";
import {
  createEmptyExamProfile,
  getSkillStatus,
} from "@/lib/domain/exam-progress";
import { getDiagnosticNextActivity } from "@/lib/domain/personalization";
import type { ExamId, ExamSkill } from "@/types/domain";

const skillIcons = {
  reading: BookOpen,
  listening: Headphones,
  writing: PenLine,
  speaking: Mic2,
} satisfies Record<ExamSkill, typeof BookOpen>;

export function DashboardView() {
  const { state, hydrated, replaceState } = useApp();
  const user = state.user;
  const activeExam =
    user?.goal.exam === "TEF Canada" || user?.goal.exam === "TCF Canada"
      ? user.goal.exam
      : null;

  if (!hydrated)
    return (
      <div
        className="h-96 animate-pulse rounded-2xl bg-muted"
        aria-label="Loading dashboard"
      />
    );

  if (!state.planAccess) {
    const priority = state.diagnosticResult
      ? diagnosticSkillContent[state.diagnosticResult.priority]
      : null;
    return (
      <>
        <PageHeader
          eyebrow="Dashboard"
          title={`Welcome, ${user?.firstName ?? "Learner"}`}
          description="Your free account includes the assessment and a basic weakness profile."
        />
        <Card className="max-w-3xl border-primary/20">
          <CardContent className="pt-6">
            <p className="eyebrow">Assessment</p>
            <h2 className="mt-3 text-2xl font-bold">
              {state.diagnosticResult
                ? `Your estimated level is ${state.diagnosticResult.level}`
                : "Establish your starting point"}
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {priority
                ? `${priority.label} is the main weakness identified by your latest assessment.`
                : "Complete the assessment to identify your current level, strengths, and priority weakness."}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild>
                <Link
                  href={
                    state.diagnosticResult
                      ? "/diagnostic/results"
                      : "/diagnostic"
                  }
                >
                  {state.diagnosticResult
                    ? "View assessment results"
                    : "Start assessment"}
                </Link>
              </Button>
              <Button asChild variant="secondary">
                <Link href="/choose-plan">Compare paid plans</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </>
    );
  }

  const selectExam = async (exam: ExamId) => {
    const result = await updateExamGoalAction({
      exam,
      target: user?.goal.target ?? "I'm not sure",
      targetDate: user?.goal.targetDate,
    });
    if (result.ok) replaceState(result.snapshot);
  };

  if (!activeExam) {
    return (
      <>
        <PageHeader
          eyebrow="Choose your preparation"
          title="Which Canadian French exam are you preparing for?"
          description="TEF Canada and TCF Canada assess the same four language abilities through different formats. Your choice creates a separate dashboard that you can switch later in Settings."
        />
        <div className="grid gap-5 md:grid-cols-2">
          {(["TEF Canada", "TCF Canada"] as const).map((exam) => {
            const config = examConfigurations[exam];
            return (
              <Card key={exam}>
                <CardContent className="pt-6">
                  <h2 className="text-2xl font-bold">{exam}</h2>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    {config.officialFormat.reading}.{" "}
                    {config.officialFormat.writing}.
                  </p>
                  <Button className="mt-6" onClick={() => selectExam(exam)}>
                    Prepare for {config.shortName}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </>
    );
  }

  const profile =
    state.examProfiles[activeExam] ?? createEmptyExamProfile(activeExam);
  const diagnosticNext = state.diagnosticResult
    ? getDiagnosticNextActivity(state.diagnosticResult)
    : null;
  const shortName = examConfigurations[activeExam].shortName;
  const readiness = state.diagnosticResult?.score ?? null;
  const personalized = hasPlanFeature(
    state.planAccess,
    "personalizedRecommendations",
  );
  const detailedReadiness = hasPlanFeature(
    state.planAccess,
    "detailedReadiness",
  );

  return (
    <>
      <PageHeader
        eyebrow="Dashboard"
        title={`Welcome back, ${user?.firstName ?? "Learner"}`}
        description="Your exam, current progress, and clearest next step in one place."
      />

      <div className="my-8 grid gap-5 lg:grid-cols-[1.2fr_.8fr]">
        <Card className="border-primary/20 bg-primary text-primary-foreground">
          <CardContent className="pt-6">
            <p className="text-xs font-bold tracking-[0.14em] text-white/70">
              RECOMMENDED NEXT
            </p>
            <Target className="mt-6 size-6" />
            <h2 className="mt-3 text-xl font-bold">
              {personalized && diagnosticNext
                ? `Start with ${diagnosticNext.label.toLowerCase()}`
                : "Continue your guided lessons"}
            </h2>
            <p className="mt-3 text-sm text-white/75">
              {personalized && diagnosticNext
                ? `${diagnosticNext.label} is the priority identified by your latest diagnostic result.`
                : "Build your French foundations and continue through the available skill lessons."}
            </p>
            <Button asChild variant="secondary" className="mt-6">
              <Link
                href={
                  personalized
                    ? (diagnosticNext?.href ?? "/diagnostic")
                    : "/learn"
                }
              >
                {personalized && diagnosticNext
                  ? "Start recommended activity"
                  : "Continue learning"}
              </Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <h2 className="text-sm font-bold tracking-[0.14em]">THIS WEEK</h2>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-x-5 gap-y-6">
            <WeeklyStat
              value={String(profile.weekly.practiceSessions)}
              label="practice sessions"
            />
            <WeeklyStat
              value={`${Math.floor(profile.weekly.minutesStudied / 60)}h ${profile.weekly.minutesStudied % 60}m`}
              label="studied"
            />
            <WeeklyStat
              value={String(profile.weekly.questionsReviewed)}
              label="questions reviewed"
            />
            {detailedReadiness ? (
              <WeeklyStat
                value={`${profile.weekly.readinessChange >= 0 ? "+" : ""}${Math.round(profile.weekly.readinessChange)}%`}
                label="readiness"
              />
            ) : (
              <WeeklyStat
                value={`${state.progress.courseCompletion}%`}
                label="course complete"
              />
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-primary/20">
        <CardContent className="pt-6">
          <p className="text-xs font-bold tracking-[0.14em] text-muted-foreground">
            MY EXAM
          </p>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-2xl font-bold">{activeExam}</h2>
            <p className="font-semibold">Target: {user?.goal.target}</p>
          </div>
          <div className="mt-7 flex items-end justify-between gap-4 text-sm">
            <span className="font-semibold">
              {detailedReadiness ? "Diagnostic readiness" : "Practice accuracy"}
            </span>
            <strong className="text-2xl">
              {detailedReadiness
                ? readiness === null
                  ? "—"
                  : `${readiness}%`
                : `${state.progress.practiceAccuracy}%`}
            </strong>
          </div>
          <Progress
            className="mt-3"
            value={
              detailedReadiness
                ? (readiness ?? 0)
                : state.progress.practiceAccuracy
            }
            label={
              detailedReadiness && readiness === null
                ? "Diagnostic readiness not available yet"
                : detailedReadiness
                  ? `Diagnostic readiness ${readiness}%`
                  : `Practice accuracy ${state.progress.practiceAccuracy}%`
            }
          />
          <p className="mt-3 text-xs text-muted-foreground">
            {detailedReadiness
              ? readiness === null
                ? "Complete your assessment to establish readiness."
                : `This provisional result comes from your latest diagnostic. It is not an official ${shortName}, NCLC, or immigration score.`
              : `${state.progress.practiceAnswered} practice questions completed. Detailed readiness is available with Complete and Intensive.`}
          </p>
        </CardContent>
      </Card>

      <h2 className="mt-9 text-sm font-bold tracking-[0.14em]">
        YOUR 4 EXAM SKILLS
      </h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {examSkillOrder.map((skill) => {
          const Icon = skillIcons[skill];
          const content = examSkillContent[skill];
          const productive = skill === "writing" || skill === "speaking";
          const score = productive ? null : profile.skills[skill].current;
          return (
            <Card key={skill}>
              <CardContent className="pt-6">
                <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="size-5" />
                </span>
                <h3 className="mt-4 text-lg font-bold">{content.label}</h3>
                <p className="text-sm text-muted-foreground">
                  {content.labelFr}
                </p>
                <p className="mt-5 text-3xl font-bold">
                  {productive
                    ? "Not assessed yet"
                    : score === null
                      ? "—"
                      : `${score}%`}
                </p>
                <p className="mt-1 text-sm font-semibold text-muted-foreground">
                  {productive
                    ? "Correction coming soon"
                    : getSkillStatus(score)}
                </p>
                {productive ? (
                  <p className="mt-6 text-sm font-semibold text-muted-foreground">
                    Practice assessment unavailable
                  </p>
                ) : (
                  <Link
                    className="mt-6 inline-flex items-center gap-1 text-sm font-bold text-primary hover:underline"
                    href={`/practice/session?skill=${skill}`}
                  >
                    Practice <ArrowRight className="size-4" />
                  </Link>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </>
  );
}

function WeeklyStat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <strong className="text-xl">{value}</strong>
      <p className="mt-1 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
