"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, BookOpen, Target } from "lucide-react";
import { useApp } from "@/components/providers/app-provider";
import { EmptyState, PageHeader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useI18n } from "@/i18n/client";
import { focusLabel, lessonTitle } from "@/i18n/format";
import { getMistakeDetail } from "@/lib/domain/personalization";

export function MistakeDetail({
  mistakeId,
  optionLabels = {},
  explanations = {},
}: {
  mistakeId: string;
  optionLabels?: Record<string, Record<string, string>>;
  /** Explanations in the learner's language, by question id. */
  explanations?: Record<string, string>;
}) {
  const { state } = useApp();
  const { t, locale } = useI18n();
  const copy = t.mistakes.detail;
  const detail = getMistakeDetail(state, mistakeId);
  if (!detail)
    return (
      <>
        <EmptyState
          title={copy.notFoundTitle}
          description={copy.notFoundBody}
        />
        <Button asChild variant="secondary" className="mt-6">
          <Link href="/mistakes">{copy.returnTo}</Link>
        </Button>
      </>
    );

  const skill = detail.anchor.examSkill ?? "reading";
  const practiceHref = `/practice/session?skill=${skill}&focus=${detail.focus.competency}&count=10`;
  const answerText = (questionId: string, answer: string) =>
    answer ? (optionLabels[questionId]?.[answer] ?? answer) : copy.noAnswer;
  return (
    <>
      <Link
        href="/mistakes"
        className="mb-5 inline-flex items-center gap-1 text-sm font-bold text-primary hover:underline"
      >
        <ArrowLeft className="size-4" aria-hidden="true" /> {copy.back}
      </Link>
      <PageHeader
        eyebrow={
          detail.anchor.examSkill
            ? t.practice.skills[detail.anchor.examSkill]
            : copy.eyebrow
        }
        title={focusLabel(t, detail.focus)}
        description={copy.struggled(detail.count)}
      />

      <section aria-labelledby="recent-examples">
        <h2 id="recent-examples" className="text-xl font-bold">
          {copy.examples}
        </h2>
        <div className="mt-4 space-y-4">
          {detail.examples.map((example) => (
            <Card key={example.id}>
              <CardContent className="grid gap-4 pt-6 md:grid-cols-2">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
                    {copy.yourAnswer}
                  </p>
                  <p className="mt-2 font-semibold" lang="fr">
                    {answerText(example.questionId, example.learnerAnswer)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
                    {copy.correctAnswer}
                  </p>
                  <p className="mt-2 font-semibold" lang="fr">
                    {answerText(example.questionId, example.correctAnswer)}
                  </p>
                </div>
                <p className="text-sm leading-6 text-muted-foreground md:col-span-2">
                  {explanations[example.questionId] ?? example.explanation}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <div className="mt-7 grid gap-5 md:grid-cols-2">
        <Card className="border-learn/20">
          <CardContent className="flex h-full flex-col pt-6">
            <BookOpen className="size-5 text-learn" aria-hidden="true" />
            <p className="mt-4 text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
              {copy.lessonEyebrow}
            </p>
            <h2 className="mt-2 text-xl font-bold">
              {detail.lesson
                ? lessonTitle(locale, detail.lesson)
                : copy.lessonFallback}
            </h2>
            {detail.lesson && (
              <Button asChild className="mt-6 w-fit">
                <Link
                  href={`/learn/${detail.lesson.moduleId}/${detail.lesson.id}`}
                >
                  {copy.reviewLesson} <ArrowRight className="size-4" />
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
        <Card className="border-practice/20">
          <CardContent className="flex h-full flex-col pt-6">
            <Target className="size-5 text-practice" aria-hidden="true" />
            <p className="mt-4 text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
              {copy.practiceEyebrow}
            </p>
            <h2 className="mt-2 text-xl font-bold">{copy.practiceTitle}</h2>
            <Button asChild className="mt-6 w-fit">
              <Link href={practiceHref}>
                {copy.practiceCta} <ArrowRight className="size-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
