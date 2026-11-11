"use client";
import Link from "next/link";
import { NextStudyAction } from "@/features/dashboard/next-study-action";
import { useEffect, useRef, useState } from "react";
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
import { AnswerFeedbackPanel } from "@/features/assessment/answer-feedback-panel";
import { CheckedProgress } from "@/features/assessment/checked-progress";

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
  const [presentation] = useState(() =>
    content.checkpoints.map((c) => ({
      index: c.index,
      options: c.options.map((o) => o.index),
    })),
  );
  const checkpoints = presentation.flatMap((order) => {
    const checkpoint = content.checkpoints.find((c) => c.index === order.index);
    return checkpoint
      ? [
          {
            ...checkpoint,
            options: order.options.flatMap(
              (index) =>
                checkpoint.options.find((o) => o.index === index) ?? [],
            ),
          },
        ]
      : [];
  });
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [feedback, setFeedback] = useState<Record<number, AnswerFeedback>>({});
  const [checking, setChecking] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [position, setPosition] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const pending = useRef(false);
  const [submitted, setSubmitted] = useState<Record<number, number>>({});
  const prompt = useRef<HTMLHeadingElement>(null);
  const focusNext = useRef(false);
  useEffect(() => {
    if (!focusNext.current) return;
    prompt.current?.focus();
    focusNext.current = false;
  }, [position]);
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
    const answer = submitted[checkpoint] ?? answers[checkpoint];
    if (answer === undefined || pending.current || feedback[checkpoint]) return;
    setSubmitted((current) => ({ ...current, [checkpoint]: answer }));
    pending.current = true;
    setError(null);
    setChecking(checkpoint);
    try {
      const result = await checkLessonCheckpointAction(
        lesson.id,
        checkpoint,
        answer,
      );
      if (!result.ok) {
        setError(errorText(result));
        return;
      }
      setFeedback((current) => ({ ...current, [checkpoint]: result.feedback }));
    } catch {
      setError(t.assessment.feedbackError);
    } finally {
      pending.current = false;
      setChecking(null);
    }
  };
  const save = async () => {
    if (pending.current || !allAnswered || completed) return;
    pending.current = true;
    setSaving(true);
    try {
      const result = await completeLessonAction(lesson.id);
      if (!result.ok) return toast.error(result.message);
      replaceState(result.snapshot);
      toast.success(copy.saved);
    } catch {
      toast.error(t.common.errors.unavailable);
    } finally {
      pending.current = false;
      setSaving(false);
    }
  };
  const navigate = (nextPosition: number) => {
    if (pending.current) return;
    setError(null);
    focusNext.current = true;
    setPosition(nextPosition);
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
        <p className="my-4 text-sm text-muted-foreground">
          {t.assessment.instruction}
        </p>
        <CheckedProgress
          position={position + 1}
          total={total}
          checked={Object.keys(feedback).length}
          correct={
            Object.values(feedback).filter((item) => item.correct).length
          }
        />
        <ol className="mt-4 space-y-8">
          {checkpoints.map((checkpoint, checkpointPosition) => {
            if (checkpointPosition !== position) return null;
            const answer = answers[checkpoint.index];
            const verdict = feedback[checkpoint.index];
            return (
              <li key={checkpoint.index}>
                <h3
                  ref={prompt}
                  tabIndex={-1}
                  className="mt-2 outline-none"
                  lang={locale}
                >
                  {checkpoint.prompt}
                </h3>
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
                        disabled={
                          Boolean(verdict) ||
                          checking !== null ||
                          saving ||
                          submitted[checkpoint.index] !== undefined
                        }
                        onChange={() => {
                          if (
                            pending.current ||
                            submitted[checkpoint.index] !== undefined ||
                            verdict
                          )
                            return;
                          setAnswers((current) => ({
                            ...current,
                            [checkpoint.index]: option.index,
                          }));
                        }}
                      />
                      <span lang={locale}>{option.label}</span>
                    </label>
                  ))}
                </fieldset>
                {verdict && (
                  <AnswerFeedbackPanel
                    answerLanguage={locale}
                    feedback={verdict}
                    answer={
                      checkpoint.options.find(
                        (option) => option.index === answer,
                      )?.label ?? ""
                    }
                    correctAnswer={verdict.correctAnswer}
                  />
                )}
                {error && (
                  <p role="alert" className="mt-4 text-sm text-danger">
                    {error}
                  </p>
                )}
                <div className="mt-5 flex justify-between gap-3">
                  <Button
                    variant="ghost"
                    disabled={position === 0 || checking !== null || saving}
                    onClick={(event) => {
                      if (event.detail <= 1) navigate(position - 1);
                    }}
                  >
                    {t.common.previous}
                  </Button>
                  {!verdict ? (
                    <Button
                      disabled={answer === undefined || checking !== null}
                      onClick={() => check(checkpoint.index)}
                    >
                      {checking === checkpoint.index
                        ? t.assessment.checking
                        : error
                          ? t.assessment.retry
                          : t.assessment.next}
                    </Button>
                  ) : position < total - 1 ? (
                    <Button
                      disabled={saving}
                      onClick={(event) => {
                        if (event.detail <= 1) navigate(position + 1);
                      }}
                    >
                      {t.assessment.continue}
                    </Button>
                  ) : null}
                </div>
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
      {completed && <NextStudyAction />}
      {next && !completed && (
        <Button asChild>
          <Link href={`/learn/${next.moduleId}/${next.id}`}>{copy.next}</Link>
        </Button>
      )}
    </article>
  );
}
