"use client";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { checkLessonCheckpointAction } from "@/app/actions/content";
import { completeLessonAction } from "@/app/actions/learner";
import { useApp } from "@/components/providers/app-provider";
import { ModeBadge } from "@/components/shared";
import { Button } from "@/components/ui/button";
import type { PublicLessonContent } from "@/content/shared/types";
import { useI18n } from "@/i18n/client";
import { lessonTitle } from "@/i18n/format";
import { cn } from "@/lib/utils";
import type { AnswerFeedback, Lesson } from "@/types/domain";

export function LessonView({
  lesson,
  content,
  next,
}: {
  lesson: Lesson;
  content: PublicLessonContent;
  next: { id: string; moduleId: string } | null;
}) {
  const { state, replaceState } = useApp();
  const { t, locale } = useI18n();
  const copy = t.learn.lesson;
  const [answer, setAnswer] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<AnswerFeedback | null>(null);
  const [checking, setChecking] = useState(false);
  const [saving, setSaving] = useState(false);
  const completed = state.progress.completedLessonIds.includes(lesson.id);
  const errorText = (result: { message: string; reference?: string }) =>
    result.reference
      ? t.common.errorReference(result.message, result.reference)
      : result.message;

  const check = async () => {
    if (answer === null) return;
    setChecking(true);
    const result = await checkLessonCheckpointAction(lesson.id, answer);
    setChecking(false);
    if (!result.ok) return toast.error(errorText(result));
    setFeedback(result.feedback);
  };
  const save = async () => {
    setSaving(true);
    const result = await completeLessonAction(lesson.id);
    setSaving(false);
    if (!result.ok) return toast.error(result.message);
    replaceState(result.snapshot);
    toast.success(copy.saved);
  };

  return (
    <article className="mx-auto max-w-3xl space-y-8">
      <ModeBadge mode="learn" />
      <header>
        <p className="text-sm text-muted-foreground">
          {copy.duration(
            lesson.duration,
            content.exam === "shared" ? copy.shared : `${content.exam} Canada`,
          )}
        </p>
        <h1 className="mt-3 text-3xl font-bold">
          {lessonTitle(locale, lesson)}
        </h1>
      </header>
      {copy.englishOnly && (
        <p className="rounded-xl border border-dashed p-4 text-sm leading-6 text-muted-foreground">
          {copy.englishOnly}
        </p>
      )}
      <section>
        <h2 className="text-xl font-bold">{copy.understand}</h2>
        <p className="mt-3 leading-8">{content.explanation}</p>
      </section>
      <section className="rounded-xl border bg-learn/5 p-6">
        <h2 className="font-bold">{copy.examples}</h2>
        {content.examples.map((example) => (
          <p key={example} lang="fr" className="mt-3 text-lg">
            {example}
          </p>
        ))}
      </section>
      <section>
        <h2 className="text-xl font-bold">{copy.tryIt}</h2>
        <p className="mt-3 leading-7">{content.guidedApplication}</p>
      </section>
      <section>
        <h2 className="text-xl font-bold">{copy.commonErrors}</h2>
        <ul className="mt-3 list-inside list-disc space-y-2 leading-7">
          {content.commonErrors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      </section>
      <section className="rounded-xl border p-6">
        <h2 className="text-xl font-bold">{copy.checkpoint}</h2>
        <p className="mt-3" lang="fr">
          {content.checkpoint.prompt}
        </p>
        <fieldset className="my-5 space-y-3">
          <legend className="sr-only">{copy.chooseAnswer}</legend>
          {content.checkpoint.options.map((option, index) => (
            <label
              key={option}
              className={cn(
                "flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 focus-within:ring-2 focus-within:ring-primary",
                answer === index && !feedback && "border-primary bg-primary/5",
                feedback &&
                  option === feedback.correctAnswer &&
                  "border-primary bg-primary/10",
                feedback &&
                  answer === index &&
                  !feedback.correct &&
                  "border-danger bg-danger/5",
              )}
            >
              <input
                type="radio"
                name={lesson.id}
                className="size-4 accent-primary"
                checked={answer === index}
                disabled={Boolean(feedback)}
                onChange={() => setAnswer(index)}
              />
              <span lang="fr">{option}</span>
            </label>
          ))}
        </fieldset>
        {!feedback ? (
          <Button disabled={answer === null || checking} onClick={check}>
            {checking ? t.assessment.checking : copy.check}
          </Button>
        ) : (
          <p role="status" className="leading-7">
            <strong>{feedback.correct ? copy.correct : copy.review}</strong>{" "}
            {feedback.explanation}
          </p>
        )}
        <Button
          className="mt-6"
          disabled={!feedback || completed || saving}
          onClick={save}
        >
          {completed
            ? copy.completed
            : saving
              ? t.common.saving
              : copy.complete}
        </Button>
      </section>
      {next && (
        <Button asChild>
          <Link href={`/learn/${next.moduleId}/${next.id}`}>{copy.next}</Link>
        </Button>
      )}
    </article>
  );
}
