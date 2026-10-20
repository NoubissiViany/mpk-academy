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
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [feedback, setFeedback] = useState<Record<number, AnswerFeedback>>({});
  const [checking, setChecking] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const completed = state.progress.completedLessonIds.includes(lesson.id);
  const total = content.checkpoints.length;
  const allAnswered = Object.keys(feedback).length === total;
  // French bodies are shown when they exist; otherwise the English text.
  const french = locale === "fr" && Boolean(content.explanationFr);
  const body = {
    explanation: french ? content.explanationFr! : content.explanation,
    guidedApplication:
      (french && content.guidedApplicationFr) || content.guidedApplication,
    commonErrors: (french && content.commonErrorsFr) || content.commonErrors,
  };
  const errorText = (result: { message: string; reference?: string }) =>
    result.reference
      ? t.common.errorReference(result.message, result.reference)
      : result.message;

  const check = async (checkpoint: number) => {
    const answer = answers[checkpoint];
    if (answer === undefined) return;
    setChecking(checkpoint);
    const result = await checkLessonCheckpointAction(
      lesson.id,
      checkpoint,
      answer,
    );
    setChecking(null);
    if (!result.ok) return toast.error(errorText(result));
    setFeedback((current) => ({ ...current, [checkpoint]: result.feedback }));
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
      {copy.englishOnly && !french && (
        <p className="rounded-xl border border-dashed p-4 text-sm leading-6 text-muted-foreground">
          {copy.englishOnly}
        </p>
      )}
      <section>
        <h2 className="text-xl font-bold">{copy.understand}</h2>
        <p className="mt-3 leading-8">{body.explanation}</p>
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
        <p className="mt-3 leading-7">{body.guidedApplication}</p>
      </section>
      <section>
        <h2 className="text-xl font-bold">{copy.commonErrors}</h2>
        <ul className="mt-3 list-inside list-disc space-y-2 leading-7">
          {body.commonErrors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      </section>
      <section className="rounded-xl border p-6">
        <h2 className="text-xl font-bold">{copy.checkpoint}</h2>
        <ol className="mt-4 space-y-8">
          {content.checkpoints.map((checkpoint, position) => {
            const answer = answers[position];
            const verdict = feedback[position];
            return (
              <li key={checkpoint.prompt}>
                {total > 1 && (
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
                    {copy.checkpointProgress(position + 1, total)}
                  </p>
                )}
                <p className="mt-2" lang="fr">
                  {checkpoint.prompt}
                </p>
                <fieldset className="my-5 space-y-3">
                  <legend className="sr-only">{copy.chooseAnswer}</legend>
                  {checkpoint.options.map((option) => (
                    <label
                      key={option.index}
                      className={cn(
                        "flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 focus-within:ring-2 focus-within:ring-primary",
                        answer === option.index &&
                          !verdict &&
                          "border-primary bg-primary/5",
                        verdict &&
                          option.label === verdict.correctAnswer &&
                          "border-primary bg-primary/10",
                        verdict &&
                          answer === option.index &&
                          !verdict.correct &&
                          "border-danger bg-danger/5",
                      )}
                    >
                      <input
                        type="radio"
                        name={`${lesson.id}-${position}`}
                        className="size-4 accent-primary"
                        checked={answer === option.index}
                        disabled={Boolean(verdict)}
                        onChange={() =>
                          setAnswers((current) => ({
                            ...current,
                            [position]: option.index,
                          }))
                        }
                      />
                      <span lang="fr">{option.label}</span>
                    </label>
                  ))}
                </fieldset>
                {!verdict ? (
                  <Button
                    disabled={answer === undefined || checking !== null}
                    onClick={() => check(position)}
                  >
                    {checking === position ? t.assessment.checking : copy.check}
                  </Button>
                ) : (
                  <p role="status" className="leading-7">
                    <strong>
                      {verdict.correct ? copy.correct : copy.review}
                    </strong>{" "}
                    {verdict.explanation}
                  </p>
                )}
              </li>
            );
          })}
        </ol>
        {!allAnswered && !completed && total > 1 && (
          <p className="mt-6 text-sm text-muted-foreground">{copy.answerAll}</p>
        )}
        <Button
          className="mt-6"
          disabled={!allAnswered || completed || saving}
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
