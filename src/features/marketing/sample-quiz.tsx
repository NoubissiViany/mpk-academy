"use client";

import { shuffleQuestions } from "@/lib/domain/question-order";
import { useClientReady } from "@/lib/use-client-ready";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, RotateCcw } from "lucide-react";
import { checkSampleAnswerAction } from "@/app/actions/content";
import { Button } from "@/components/ui/button";
import { QuestionCard } from "@/features/assessment/question-card";
import { CheckedProgress } from "@/features/assessment/checked-progress";
import { useI18n } from "@/i18n/client";
import { trackFunnelStep } from "@/lib/track-funnel";
import type { AnswerFeedback, PublicQuestion } from "@/types/domain";

/** Four public questions (one listening) checked on the server, ending on the assessment CTA. */
export function SampleQuiz(props: { questions: PublicQuestion[] }) {
  const ready = useClientReady();
  return ready ? (
    <SampleQuizAttempt {...props} />
  ) : (
    <div className="h-72 animate-pulse rounded-2xl bg-muted" aria-busy="true" />
  );
}

function SampleQuizAttempt({
  questions: sourceQuestions,
}: {
  questions: PublicQuestion[];
}) {
  const [questions, setQuestions] = useState(() =>
    shuffleQuestions(sourceQuestions),
  );
  const { t } = useI18n();
  const copy = t.landing.sample;
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<Record<string, AnswerFeedback>>({});
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pending = useRef(false);
  const [submitted, setSubmitted] = useState<Record<string, string>>({});
  const questionContainer = useRef<HTMLDivElement>(null);
  const focusNext = useRef(false);
  useEffect(() => {
    if (!focusNext.current) return;
    questionContainer.current
      ?.querySelector<HTMLElement>("h2, [role=status]")
      ?.focus();
    focusNext.current = false;
  }, [index]);
  const question = questions[index];
  const done = index >= questions.length;
  const correct = Object.values(feedback).filter((item) => item.correct).length;

  const check = async () => {
    if (
      pending.current ||
      !answers[question.id]?.trim() ||
      feedback[question.id]
    )
      return;
    const submittedAnswer = submitted[question.id] ?? answers[question.id];
    setSubmitted((current) => ({ ...current, [question.id]: submittedAnswer }));
    pending.current = true;
    setChecking(true);
    setError(null);
    try {
      const result = await checkSampleAnswerAction(
        question.id,
        submittedAnswer,
      );
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setFeedback((current) => ({
        ...current,
        [question.id]: result.feedback,
      }));
      trackFunnelStep("sample_answered");
    } catch {
      setError(t.assessment.feedbackError);
    } finally {
      pending.current = false;
      setChecking(false);
    }
  };

  return (
    <section
      aria-labelledby="sample-title"
      className="rounded-2xl border bg-card p-5 shadow-sm sm:p-7"
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="eyebrow">{copy.eyebrow}</p>
          <h2 id="sample-title" className="mt-1 text-lg font-bold">
            {copy.title}
          </h2>
        </div>
      </div>
      <div ref={questionContainer}>
        {done ? (
          <div className="mt-6 outline-none" role="status" tabIndex={-1}>
            <p className="text-3xl font-black">
              {copy.scoreTitle(correct, questions.length)}
            </p>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {copy.scoreBody}
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Button asChild>
                <Link href="/diagnostic">
                  {copy.cta} <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setQuestions(shuffleQuestions(sourceQuestions));
                  setIndex(0);
                  setAnswers({});
                  setFeedback({});
                  setSubmitted({});
                  setError(null);
                  focusNext.current = true;
                }}
              >
                <RotateCcw className="size-4" aria-hidden="true" />
                {copy.restart}
              </Button>
            </div>
          </div>
        ) : (
          <div className="mt-6">
            <p className="mb-4 text-sm text-muted-foreground">
              {t.assessment.instruction}
            </p>
            <CheckedProgress
              position={index + 1}
              total={questions.length}
              checked={Object.keys(feedback).length}
              correct={correct}
            />
            <div className="mt-6">
              <QuestionCard
                key={question.id}
                question={question}
                value={answers[question.id]}
                onChange={(value) => {
                  if (
                    pending.current ||
                    submitted[question.id] !== undefined ||
                    feedback[question.id]
                  )
                    return;
                  setAnswers((current) => ({
                    ...current,
                    [question.id]: value,
                  }));
                }}
                feedback={feedback[question.id]}
                disabled={checking || submitted[question.id] !== undefined}
              />
            </div>
            {error && (
              <p role="alert" className="mt-4 text-sm text-danger">
                {error}
              </p>
            )}
            <div className="mt-5 flex justify-end">
              {feedback[question.id] ? (
                <Button
                  onClick={(event) => {
                    if (pending.current || event.detail > 1) return;
                    focusNext.current = true;
                    setIndex(index + 1);
                  }}
                >
                  {index === questions.length - 1
                    ? t.assessment.seeResults
                    : t.assessment.continue}{" "}
                  <ArrowRight className="size-4" />
                </Button>
              ) : (
                <Button
                  disabled={!answers[question.id]?.trim() || checking}
                  onClick={check}
                >
                  {checking
                    ? t.assessment.checking
                    : error
                      ? t.assessment.retry
                      : t.assessment.next}
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
      <p className="mt-6 text-xs text-muted-foreground">{copy.note}</p>
    </section>
  );
}
