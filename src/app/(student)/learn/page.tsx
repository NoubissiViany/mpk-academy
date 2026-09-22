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
import { courseModules, learningCategories } from "@/data/course";
import { hasPlanFeature } from "@/config/product";
import { getRecommendedLessons } from "@/lib/domain/personalization";
import type { CourseModule } from "@/types/domain";

export default function LearnPage() {
  const { state } = useApp();
  const activeExam = state.user?.goal.exam === "TCF Canada" ? "TCF" : "TEF";
  const recommendations = getRecommendedLessons(state);
  const personalized = hasPlanFeature(
    state.planAccess,
    "personalizedRecommendations",
  );
  const examStrategies = hasPlanFeature(state.planAccess, "examStrategies");

  return (
    <>
      <PageHeader
        eyebrow="Explore lessons"
        title="Learn"
        description="Build your French foundations, strengthen each exam skill, and study strategies for your active exam."
        action={<ModeBadge mode="learn" />}
      />
      <Card className="mb-7">
        <CardContent className="flex flex-col gap-4 pt-5 sm:flex-row sm:items-center">
          <div className="flex-1">
            <div className="flex justify-between text-sm">
              <strong>Overall course completion</strong>
              <span>{state.progress.courseCompletion}%</span>
            </div>
            <Progress
              value={state.progress.courseCompletion}
              label="Course completion"
              className="mt-3"
            />
          </div>
          <Badge>
            {state.progress.completedLessonIds.length} lessons completed
          </Badge>
        </CardContent>
      </Card>

      {personalized && (
        <section aria-labelledby="recommended-lessons">
          <div className="flex items-center gap-2">
            <Sparkles className="size-5 text-primary" aria-hidden="true" />
            <h2 id="recommended-lessons" className="text-xl font-bold">
              Recommended lessons
            </h2>
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            {recommendations.map(({ lesson, reason }) => (
              <Card key={lesson.id} className="border-primary/20">
                <CardContent className="flex h-full flex-col pt-6">
                  <Badge className="w-fit">Recommended</Badge>
                  <h3 className="mt-4 text-lg font-bold">{lesson.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {reason}
                  </p>
                  <Link
                    href={`/learn/${lesson.moduleId}/${lesson.id}`}
                    className="mt-auto inline-flex items-center gap-1 pt-5 text-sm font-bold text-primary hover:underline"
                  >
                    Start lesson <ArrowRight className="size-4" />
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
                {category.title}
              </h2>
              <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {modules.map((module) => (
                  <ModuleCard
                    key={module.id}
                    module={module}
                    activeExam={activeExam}
                    examStrategies={examStrategies}
                    completedLessonIds={state.progress.completedLessonIds}
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
}: {
  module: CourseModule;
  activeExam: "TEF" | "TCF";
  examStrategies: boolean;
  completedLessonIds: string[];
}) {
  const locked = module.id === "exam-strategies" && !examStrategies;
  const title =
    module.id === "exam-strategies"
      ? `${activeExam} format and strategies`
      : module.title;
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
            <LockKeyhole className="size-5 text-muted-foreground" />
          ) : complete ? (
            <CheckCircle2 className="size-5 text-primary" />
          ) : module.sequence === 1 ? (
            <Badge>Free</Badge>
          ) : null}
        </div>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {module.id === "exam-strategies"
            ? `Formats, timing, and examples designed for ${activeExam} Canada.`
            : module.description}
        </p>
        <p className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
          <Clock3 className="size-4" />
          {module.lessons.length} lessons · Next: {nextLesson.title}
        </p>
        {!locked && (
          <Link
            href={`/learn/${module.id}`}
            aria-label={`Explore ${title}`}
            className="mt-auto inline-flex items-center gap-1 pt-5 text-sm font-bold text-primary hover:underline"
          >
            Explore category <ChevronRight className="size-4" />
          </Link>
        )}
      </CardContent>
    </Card>
  );
}
