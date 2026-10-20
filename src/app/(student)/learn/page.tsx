"use client";

import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Clock3,
  LockKeyhole,
  Sparkles,
} from "lucide-react";
import { useApp } from "@/components/providers/app-provider";
import { ModeBadge, PageHeader } from "@/components/shared";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { hasPlanFeature } from "@/config/product";
import { getCourseModules, learningCategories } from "@/data/course";
import { useI18n } from "@/i18n/client";
import type { Messages } from "@/i18n/messages";
import { focusLabel, lessonTitle, moduleTitle } from "@/i18n/format";
import {
  getRecommendedLessons,
  type LessonReason,
} from "@/lib/domain/personalization";
import type { CourseModule, Locale } from "@/types/domain";

function reasonText(t: Messages, reason: LessonReason) {
  if (reason.type === "diagnostic")
    return t.learn.reasons.diagnostic(t.diagnostic.skills[reason.skill].label);
  if (reason.type === "mistake")
    return t.learn.reasons.supports(focusLabel(t, reason.focus));
  return t.learn.reasons.next;
}

export default function LearnPage() {
  const { state } = useApp();
  const { t, locale } = useI18n();
  const copy = t.learn.page;
  const activeExam = state.user?.goal.exam === "TCF Canada" ? "TCF" : "TEF";
  const courseModules = getCourseModules(activeExam);
  const recommendations = getRecommendedLessons(state);
  const personalized = hasPlanFeature(
    state.planAccess,
    "personalizedRecommendations",
  );
  const examStrategies = hasPlanFeature(state.planAccess, "examStrategies");
  const completedCount = courseModules
    .flatMap((m) => m.lessons)
    .filter((l) => state.progress.completedLessonIds.includes(l.id)).length;

  return (
    <>
      <PageHeader
        eyebrow={copy.eyebrow}
        title={copy.title}
        description={copy.description}
        action={<ModeBadge mode="learn" />}
      />
      <Card className="mb-7">
        <CardContent className="flex flex-col gap-4 pt-5 sm:flex-row sm:items-center">
          <div className="flex-1">
            <div className="flex justify-between text-sm">
              <strong>{copy.completion}</strong>
              <span>{state.progress.courseCompletion}%</span>
            </div>
            <Progress
              value={state.progress.courseCompletion}
              label={copy.completionLabel}
              className="mt-3"
            />
          </div>
          <Badge>{copy.completed(completedCount)}</Badge>
        </CardContent>
      </Card>

      {personalized && recommendations.length > 0 && (
        <section aria-labelledby="recommended-lessons">
          <div className="flex items-center gap-2">
            <Sparkles className="size-5 text-primary" aria-hidden="true" />
            <h2 id="recommended-lessons" className="text-xl font-bold">
              {copy.recommendedTitle}
            </h2>
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            {recommendations.map(({ lesson, reason }) => (
              <Card key={lesson.id} className="border-primary/20">
                <CardContent className="flex h-full flex-col pt-6">
                  <Badge className="w-fit">{copy.recommended}</Badge>
                  <h3 className="mt-4 text-lg font-bold">
                    {lessonTitle(locale, lesson)}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {reasonText(t, reason)}
                  </p>
                  <Link
                    href={`/learn/${lesson.moduleId}/${lesson.id}`}
                    className="mt-auto inline-flex items-center gap-1 pt-5 text-sm font-bold text-primary hover:underline"
                  >
                    {copy.startLesson} <ArrowRight className="size-4" />
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      <div className="mt-10 space-y-10">
        {learningCategories.map((category) => {
          const modules = category.moduleIds
            .map((moduleId) =>
              courseModules.find((module) => module.id === moduleId),
            )
            .filter((module): module is CourseModule => Boolean(module));
          return (
            <section key={category.id} aria-labelledby={category.id}>
              <h2
                id={category.id}
                className="text-2xl font-bold uppercase tracking-tight"
              >
                {t.learn.categories[category.id]}
              </h2>
              <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {modules.map((module) => (
                  <ModuleCard
                    key={module.id}
                    module={module}
                    activeExam={activeExam}
                    examStrategies={examStrategies}
                    completedLessonIds={state.progress.completedLessonIds}
                    t={t}
                    locale={locale}
                  />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}

function ModuleCard({
  module,
  activeExam,
  examStrategies,
  completedLessonIds,
  t,
  locale,
}: {
  module: CourseModule;
  activeExam: "TEF" | "TCF";
  examStrategies: boolean;
  completedLessonIds: string[];
  t: Messages;
  locale: Locale;
}) {
  const strategies = module.id === "exam-strategies";
  const locked = strategies && !examStrategies;
  const title = strategies
    ? t.learn.strategiesTitle(activeExam)
    : moduleTitle(t, module.id);
  const nextLesson =
    module.lessons.find((lesson) => !completedLessonIds.includes(lesson.id)) ??
    module.lessons[0];
  const complete = module.lessons.every((lesson) =>
    completedLessonIds.includes(lesson.id),
  );
  return (
    <Card className={`h-full ${locked ? "bg-muted/40" : ""}`}>
      <CardContent className="flex h-full flex-col pt-6">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-lg font-bold">{title}</h3>
          {locked ? (
            <LockKeyhole
              className="size-5 text-muted-foreground"
              aria-hidden="true"
            />
          ) : complete ? (
            <CheckCircle2 className="size-5 text-primary" aria-hidden="true" />
          ) : null}
        </div>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {strategies
            ? t.learn.strategiesDescription(activeExam)
            : t.learn.moduleDescription}
        </p>
        <p className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
          <Clock3 className="size-4" aria-hidden="true" />
          {t.learn.page.lessonsNext(
            module.lessons.length,
            lessonTitle(locale, nextLesson),
          )}
        </p>
        {!locked && (
          <Link
            href={`/learn/${module.id}`}
            aria-label={t.learn.page.exploreLabel(title)}
            className="mt-auto inline-flex items-center gap-1 pt-5 text-sm font-bold text-primary hover:underline"
          >
            {t.learn.page.explore} <ChevronRight className="size-4" />
          </Link>
        )}
      </CardContent>
    </Card>
  );
}
