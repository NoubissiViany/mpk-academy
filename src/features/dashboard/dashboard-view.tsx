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
import { examConfigurations, examSkillOrder } from "@/config/exams";
import { hasPlanFeature, isBetaMode } from "@/config/product";
import { useI18n } from "@/i18n/client";
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
  const { t } = useI18n();
  const copy = t.dashboard;
  const user = state.user;
  const name = user?.firstName ?? copy.learner;
  const activeExam =
    user?.goal.exam === "TEF Canada" || user?.goal.exam === "TCF Canada"
      ? user.goal.exam
      : null;
  if (!hydrated)
    return (
      <div
        className="h-96 animate-pulse rounded-2xl bg-muted"
        aria-label={copy.loading}
      />
    );
  if (!state.planAccess) {
    const priority = state.diagnosticResult
      ? t.diagnostic.skills[state.diagnosticResult.priority].label
      : null;
    return (
      <>
        <PageHeader
          eyebrow={copy.eyebrow}
          title={copy.welcome(name)}
          description={copy.free.description}
        />
        <Card className="max-w-3xl border-primary/20">
          <CardContent className="pt-6">
            <p className="eyebrow">{copy.free.assessment}</p>
            <h2 className="mt-3 text-2xl font-bold">
              {state.diagnosticResult
                ? copy.free.level(state.diagnosticResult.level)
                : copy.free.establish}
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {priority ? copy.free.priority(priority) : copy.free.noResult}
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
                    ? copy.free.viewResults
                    : copy.free.start}
                </Link>
              </Button>
              {!isBetaMode() && (
                <Button asChild variant="secondary">
                  <Link href="/choose-plan">{copy.free.compare}</Link>
                </Button>
              )}
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
          eyebrow={copy.chooseExam.eyebrow}
          title={copy.chooseExam.title}
          description={copy.chooseExam.description}
        />
        <div className="grid gap-5 md:grid-cols-2">
          {(["TEF Canada", "TCF Canada"] as const).map((exam) => {
            const config = examConfigurations[exam];
            return (
              <Card key={exam}>
                <CardContent className="pt-6">
                  <h2 className="text-2xl font-bold">{exam}</h2>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    {t.exam.formats[exam].reading}.{" "}
                    {t.exam.formats[exam].writing}.
                  </p>
                  <Button className="mt-6" onClick={() => selectExam(exam)}>
                    {copy.chooseExam.prepare(config.shortName)}
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
    ? getDiagnosticNextActivity(state.diagnosticResult, activeExam)
    : null;
  const nextSkill = diagnosticNext
    ? t.diagnostic.skills[diagnosticNext.skill].label
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
  const minutes = profile.weekly.minutesStudied;

  return (
    <>
      <PageHeader
        eyebrow={copy.eyebrow}
        title={copy.welcomeBack(name)}
        description={copy.description}
      />

      <div className="my-8 grid gap-5 lg:grid-cols-[1.2fr_.8fr]">
        <Card className="border-primary/20 bg-primary text-primary-foreground">
          <CardContent className="pt-6">
            <p className="text-xs font-bold tracking-[0.14em] text-white/70">
              {copy.next.eyebrow}
            </p>
            <Target className="mt-6 size-6" aria-hidden="true" />
            <h2 className="mt-3 text-xl font-bold">
              {personalized && nextSkill
                ? copy.next.startWith(nextSkill)
                : copy.next.continueTitle}
            </h2>
            <p className="mt-3 text-sm text-white/75">
              {personalized && nextSkill
                ? copy.next.priority(nextSkill)
                : copy.next.continueBody}
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
                  ? copy.next.start
                  : copy.next.continue}
              </Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <h2 className="text-sm font-bold tracking-[0.14em]">
              {copy.week.title}
            </h2>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-x-5 gap-y-6">
            <WeeklyStat
              value={String(profile.weekly.practiceSessions)}
              label={copy.week.sessions}
            />
            <WeeklyStat
              value={copy.week.duration(Math.floor(minutes / 60), minutes % 60)}
              label={copy.week.studied}
            />
            <WeeklyStat
              value={String(profile.weekly.questionsReviewed)}
              label={copy.week.reviewed}
            />
            <WeeklyStat
              value={`${state.progress.courseCompletion}%`}
              label={copy.week.completion}
            />
          </CardContent>
        </Card>
      </div>

      <Card className="border-primary/20">
        <CardContent className="pt-6">
          <p className="text-xs font-bold tracking-[0.14em] text-muted-foreground">
            {copy.exam.eyebrow}
          </p>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-2xl font-bold">{activeExam}</h2>
            {user?.goal.target && (
              <p className="font-semibold">
                {copy.exam.target(
                  t.diagnostic.intake.targets[user.goal.target],
                )}
              </p>
            )}
          </div>
          <div className="mt-7 flex items-end justify-between gap-4 text-sm">
            <span className="font-semibold">
              {detailedReadiness ? copy.exam.readiness : copy.exam.accuracy}
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
                ? copy.exam.readinessUnavailable
                : detailedReadiness
                  ? copy.exam.readinessLabel(readiness ?? 0)
                  : copy.exam.accuracyLabel(state.progress.practiceAccuracy)
            }
          />
          <p className="mt-3 text-xs text-muted-foreground">
            {detailedReadiness
              ? readiness === null
                ? copy.exam.completeAssessment
                : copy.exam.provisional(shortName)
              : copy.exam.practiceCount(state.progress.practiceAnswered)}
          </p>
        </CardContent>
      </Card>

      <h2 className="mt-9 text-sm font-bold tracking-[0.14em]">
        {copy.skills.title}
      </h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {examSkillOrder.map((skill) => {
          const Icon = skillIcons[skill];
          const label = t.practice.skills[skill];
          const frenchLabel = t.practice.frenchSkills[skill];
          const productive = skill === "writing" || skill === "speaking";
          const score = productive ? null : profile.skills[skill].current;
          return (
            <Card key={skill}>
              <CardContent className="pt-6">
                <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <h3 className="mt-4 text-lg font-bold">{label}</h3>
                {frenchLabel !== label && (
                  <p className="text-sm text-muted-foreground" lang="fr">
                    {frenchLabel}
                  </p>
                )}
                <p className="mt-5 text-3xl font-bold">
                  {productive
                    ? copy.skills.notAssessed
                    : score === null
                      ? "—"
                      : `${score}%`}
                </p>
                <p className="mt-1 text-sm font-semibold text-muted-foreground">
                  {productive
                    ? copy.skills.selfPractice
                    : t.practice.status[getSkillStatus(score)]}
                </p>
                <Link
                  className="mt-6 inline-flex items-center gap-1 text-sm font-bold text-primary hover:underline"
                  href={`/practice/session?skill=${skill}`}
                >
                  {productive ? copy.skills.practiseNow : copy.skills.practice}{" "}
                  <ArrowRight className="size-4" />
                </Link>
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
