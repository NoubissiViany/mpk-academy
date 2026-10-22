"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { checkSampleAnswerAction } from "@/app/actions/content";
import { Button } from "@/components/ui/button";
import { QuestionCard } from "@/features/assessment/question-card";
import { useI18n } from "@/i18n/client";
import { trackFunnelStep } from "@/lib/track-funnel";
import type { AnswerFeedback, PublicQuestion } from "@/types/domain";

/** Four public questions (one listening) checked on the server, ending on the assessment CTA. */
export function SampleQuiz({ questions }: { questions: PublicQuestion[] }) {
  const { t } = useI18n();
  const copy = t.landing.sample;
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<Record<string, AnswerFeedback>>({});
  const [checking, setChecking] = useState(false);
  const question = questions[index];
  const done = index >= questions.length;
  const correct = Object.values(feedback).filter((item) => item.correct).length;

  const check = async () => {
    setChecking(true);
    const result = await checkSampleAnswerAction(
      question.id,
      answers[question.id] ?? "",
    );
    setChecking(false);
    if (!result.ok) return toast.error(result.message);
    setFeedback((current) => ({ ...current, [question.id]: result.feedback }));
    trackFunnelStep("sample_answered");
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
        {!done && (
          <span className="text-sm font-semibold text-muted-foreground">
            {copy.progress(index + 1, questions.length)}
          </span>
        )}
      </div>
      {done ? (
        <div className="mt-6" role="status">
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
                setIndex(0);
                setAnswers({});
                setFeedback({});
              }}
            >
              <RotateCcw className="size-4" aria-hidden="true" />
              {copy.restart}
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-6">
          <QuestionCard
            question={question}
            value={answers[question.id]}
            onChange={(value) =>
              setAnswers((current) => ({ ...current, [question.id]: value }))
            }
            feedback={feedback[question.id]}
          />
          <div className="mt-5 flex justify-end">
            {feedback[question.id] ? (
              <Button onClick={() => setIndex(index + 1)}>
                {copy.next} <ArrowRight className="size-4" />
              </Button>
            ) : (
              <Button
                disabled={!answers[question.id] || checking}
                onClick={check}
              >
                {checking ? t.assessment.checking : copy.check}
              </Button>
            )}
          </div>
        </div>
      )}
      <p className="mt-6 text-xs text-muted-foreground">{copy.note}</p>
    </section>
  );
}
