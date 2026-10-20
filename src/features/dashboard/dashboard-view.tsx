"use client";
import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Check,
  Headphones,
  Mic2,
  PenLine,
} from "lucide-react";
import { useApp } from "@/components/providers/app-provider";
import { updateExamGoalAction } from "@/app/actions/learner";
import { PageHeader } from "@/components/shared";
import { TargetBar } from "@/components/target-bar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { examConfigurations, examSkillOrder } from "@/config/exams";
import { hasPlanFeature, isBetaMode } from "@/config/product";
import { useI18n } from "@/i18n/client";
import { lessonTitle } from "@/i18n/format";
import {
  createEmptyExamProfile,
  currentWeeklyStats,
  getSkillStatus,
} from "@/lib/domain/exam-progress";
import { getReadiness } from "@/lib/domain/readiness";
import { getStudyPlan, type StudyPlan } from "@/lib/domain/study-plan";
import { getTodayPlan, type TodayStep } from "@/lib/domain/today";
import { cn } from "@/lib/utils";
import type {
  ExamId,
  ExamSkill,
  NclcTarget,
  WeeklyExamStats,
} from "@/types/domain";

const skillIcons = {
  reading: BookOpen,
  listening: Headphones,
  writing: PenLine,
  speaking: Mic2,
} satisfies Record<ExamSkill, typeof BookOpen>;

export function DashboardView() {
  const { state, hydrated, replaceState } = useApp();
  const { t } = useI18n();
  // Fixed for the visit, so "today" does not shift between renders.
  const [now] = useState(() => new Date());
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
  const target = user?.goal.target ?? "I'm not sure";
  const features = {
    personalized: hasPlanFeature(
      state.planAccess,
      "personalizedRecommendations",
    ),
    reviews: hasPlanFeature(state.planAccess, "mistakeReview"),
  };
  const today = getTodayPlan(state, now, features);
  const readiness = getReadiness(profile, target);
  const plan = getStudyPlan({
    targetDate: user?.goal.targetDate,
    target,
    readiness: readiness.overall,
    weekly: profile.weekly,
    now,
  });

  return (
    <>
      <PageHeader
        eyebrow={copy.eyebrow}
        title={copy.welcomeBack(name)}
        description={copy.description}
      />
      <div className="grid gap-5 lg:grid-cols-[1.25fr_.75fr]">
        <TodayCard today={today} personalized={features.personalized} />
        <StudyPlanCard
          plan={plan}
          weekly={currentWeeklyStats(profile.weekly, now)}
        />
      </div>
      <ReadinessSection
        exam={activeExam}
        target={target}
        readiness={readiness}
        detailed={hasPlanFeature(state.planAccess, "detailedReadiness")}
        practiceAccuracy={state.progress.practiceAccuracy}
        practiceAnswered={state.progress.practiceAnswered}
      />
    </>
  );
}

function TodayCard({
  today,
  personalized,
}: {
  today: ReturnType<typeof getTodayPlan>;
  personalized: boolean;
}) {
  const { t, locale } = useI18n();
  const copy = t.dashboard.today;
  const title = (step: TodayStep) =>
    step.kind === "review"
      ? copy.review(step.count, t.practice.skills[step.skill])
      : step.kind === "practice"
        ? copy.practice(t.practice.skills[step.skill])
        : copy.lesson(lessonTitle(locale, step.lesson));
  const hint = (step: TodayStep) =>
    step.kind === "review"
      ? copy.reviewHint
      : step.kind === "practice"
        ? personalized
          ? copy.practiceHint
          : copy.practiceHintGeneral
        : personalized
          ? copy.lessonHint
          : null;
  const started = today.steps.some((step) => step.done);
  return (
    <Card className="border-primary/20">
      <CardContent className="pt-6">
        <p className="eyebrow">{copy.eyebrow}</p>
        <h2 className="mt-2 text-2xl font-bold">
          {today.next ? copy.title(today.minutes) : copy.allDone}
        </h2>
        {!today.next && (
          <p className="mt-2 text-sm text-muted-foreground">
            {copy.allDoneBody}
          </p>
        )}
        <ol className="mt-5 space-y-3">
          {today.steps.map((step, index) => (
            <li key={step.kind}>
              <Link
                href={step.href}
                className={cn(
                  "flex items-start gap-3 rounded-xl border p-4 transition-colors hover:border-primary/40",
                  step.done && "bg-muted/40",
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 grid size-7 shrink-0 place-items-center rounded-full border text-sm font-bold",
                    step.done &&
                      "border-primary bg-primary text-primary-foreground",
                  )}
                  aria-hidden="true"
                >
                  {step.done ? <Check className="size-4" /> : index + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">{title(step)}</span>
                  {hint(step) && (
                    <span className="mt-1 block text-sm text-muted-foreground">
                      {hint(step)}
                    </span>
                  )}
                </span>
                <span className="shrink-0 text-sm font-semibold text-muted-foreground">
                  {step.done ? copy.done : copy.minutes(step.minutes)}
                </span>
              </Link>
            </li>
          ))}
        </ol>
        <Button asChild className="mt-6">
          <Link href={today.next?.href ?? "/practice"}>
            {today.next ? (started ? copy.continue : copy.start) : copy.extra}
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function StudyPlanCard({
  plan,
  weekly,
}: {
  plan: StudyPlan;
  weekly: WeeklyExamStats;
}) {
  const { t } = useI18n();
  const copy = t.dashboard.plan;
  return (
    <Card>
      <CardContent className="flex h-full flex-col pt-6">
        <p className="eyebrow">{copy.eyebrow}</p>
        {plan.status === "noDate" ? (
          <>
            <h2 className="mt-2 text-xl font-bold">{copy.noDateTitle}</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {copy.noDateBody}
            </p>
            <Button asChild variant="secondary" className="mt-5 w-fit">
              <Link href="/settings">{copy.setDate}</Link>
            </Button>
          </>
        ) : plan.status === "past" ? (
          <>
            <p className="mt-2 text-sm leading-6">{copy.past}</p>
            <Button asChild variant="secondary" className="mt-5 w-fit">
              <Link href="/settings">{copy.change}</Link>
            </Button>
          </>
        ) : (
          <>
            <h2 className="mt-2 text-xl font-bold">
              {copy.daysLeft(plan.daysLeft)}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {copy.rhythm(plan.sessionsPerWeek)}
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-between gap-2 text-sm">
              <span className="font-semibold">
                {copy.thisWeek(plan.sessionsThisWeek)}
              </span>
              <Badge
                className={cn(
                  plan.status === "onTrack"
                    ? "border-primary/30 bg-primary/10 text-primary"
                    : "border-accent/30 bg-accent/10 text-accent",
                )}
              >
                {plan.status === "onTrack"
                  ? copy.onTrack
                  : copy.behind(plan.expectedByToday - plan.sessionsThisWeek)}
              </Badge>
            </div>
            <Progress
              className="mt-3"
              value={Math.min(
                100,
                (100 * plan.sessionsThisWeek) / plan.sessionsPerWeek,
              )}
              label={copy.thisWeek(plan.sessionsThisWeek)}
            />
            <Link
              href="/settings"
              className="mt-4 w-fit text-sm font-bold text-primary hover:underline"
            >
              {copy.change}
            </Link>
          </>
        )}
        <p className="mt-auto pt-5 text-xs text-muted-foreground">
          {copy.week(
            Math.floor(weekly.minutesStudied / 60),
            weekly.minutesStudied % 60,
            weekly.questionsReviewed,
          )}
        </p>
      </CardContent>
    </Card>
  );
}

function ReadinessSection({
  exam,
  target,
  readiness,
  detailed,
  practiceAccuracy,
  practiceAnswered,
}: {
  exam: ExamId;
  target: NclcTarget;
  readiness: ReturnType<typeof getReadiness>;
  detailed: boolean;
  practiceAccuracy: number;
  practiceAnswered: number;
}) {
  const { t } = useI18n();
  const copy = t.dashboard.readiness;
  const targetLabel = t.diagnostic.intake.targets[target];
  const shortName = examConfigurations[exam].shortName;
  return (
    <section className="mt-9" aria-labelledby="readiness-title">
      <p className="eyebrow">{copy.eyebrow}</p>
      <h2 id="readiness-title" className="mt-1 text-2xl font-bold">
        {exam} · {targetLabel}
      </h2>
      <Card className="mt-4">
        <CardContent className="pt-6">
          {!detailed ? (
            <>
              <div className="flex items-end justify-between gap-4 text-sm">
                <span className="font-semibold">{copy.accuracy}</span>
                <strong className="text-2xl">{practiceAccuracy}%</strong>
              </div>
              <Progress
                className="mt-3"
                value={practiceAccuracy}
                label={`${copy.accuracy} ${practiceAccuracy}%`}
              />
              <p className="mt-3 text-xs text-muted-foreground">
                {copy.practiceCount(practiceAnswered)}
              </p>
            </>
          ) : readiness.overall === null || readiness.band === null ? (
            <p className="text-sm leading-6">{copy.unavailable}</p>
          ) : (
            <>
              <div className="flex items-end justify-between gap-4">
                <span className="font-semibold">{copy.title}</span>
                <strong className="text-3xl">{readiness.overall}%</strong>
              </div>
              <div className="mt-3">
                <TargetBar
                  value={readiness.overall}
                  goal={readiness.goal}
                  label={`${copy.title} ${readiness.overall}%`}
                  goalLabel={copy.goalLine(readiness.goal)}
                />
              </div>
              <p className="mt-3 text-sm">
                <strong>{copy.bands[readiness.band]}</strong> ·{" "}
                {copy.evidence[readiness.evidence]}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {copy.goal(readiness.goal, targetLabel)}
              </p>
            </>
          )}
          <p className="mt-4 text-xs leading-5 text-muted-foreground">
            {copy.disclaimer(shortName)}
          </p>
        </CardContent>
      </Card>
      <h3 className="mt-7 text-sm font-bold tracking-[0.14em]">
        {t.dashboard.skills.title}
      </h3>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {examSkillOrder.map((skill) => (
          <SkillCard
            key={skill}
            skill={skill}
            readiness={readiness}
            detailed={detailed}
          />
        ))}
      </div>
    </section>
  );
}

function SkillCard({
  skill,
  readiness,
  detailed,
}: {
  skill: ExamSkill;
  readiness: ReturnType<typeof getReadiness>;
  detailed: boolean;
}) {
  const { t } = useI18n();
  const copy = t.dashboard.skills;
  const readinessCopy = t.dashboard.readiness;
  const Icon = skillIcons[skill];
  const label = t.practice.skills[skill];
  const frenchLabel = t.practice.frenchSkills[skill];
  const objective = readiness.skills.find((item) => item.skill === skill);
  const focus = detailed && readiness.weakest === skill;
  const score = objective?.score ?? null;
  return (
    <Card className={cn(focus && "border-accent/40")}>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
            <Icon className="size-5" aria-hidden="true" />
          </span>
          {focus && (
            <Badge className="border-accent/30 bg-accent/10 text-accent">
              {copy.focus}
            </Badge>
          )}
        </div>
        <h4 className="mt-4 text-lg font-bold">{label}</h4>
        {frenchLabel !== label && (
          <p className="text-sm text-muted-foreground" lang="fr">
            {frenchLabel}
          </p>
        )}
        {!objective ? (
          <>
            <p className="mt-5 text-2xl font-bold">{copy.notScored}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {copy.selfPractice}
            </p>
          </>
        ) : (
          <>
            <p className="mt-5 text-3xl font-bold">
              {score === null ? "—" : `${score}%`}
            </p>
            <div className="mt-3">
              {detailed ? (
                <TargetBar
                  value={score}
                  goal={readiness.goal}
                  label={`${label} ${score ?? 0}%`}
                  goalLabel={readinessCopy.goalLine(readiness.goal)}
                />
              ) : (
                <Progress
                  value={score ?? 0}
                  label={`${label} ${score ?? 0}%`}
                />
              )}
            </div>
            <p className="mt-3 text-sm font-semibold text-muted-foreground">
              {score === null
                ? copy.notAssessed
                : detailed && objective.band
                  ? readinessCopy.bands[objective.band]
                  : t.practice.status[getSkillStatus(score)]}
            </p>
            {detailed && score !== null && (
              <p className="mt-1 text-xs text-muted-foreground">
                {objective.change === null
                  ? null
                  : `${readinessCopy.change(objective.change)} · `}
                {readinessCopy.evidence[objective.evidence]}
              </p>
            )}
          </>
        )}
        <Link
          className="mt-6 inline-flex items-center gap-1 text-sm font-bold text-primary hover:underline"
          href={`/practice/session?skill=${skill}`}
        >
          {objective ? copy.practice : copy.practiseNow}{" "}
          <ArrowRight className="size-4" />
        </Link>
      </CardContent>
    </Card>
  );
}
