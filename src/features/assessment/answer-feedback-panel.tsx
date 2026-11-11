"use client";

import { useEffect, useRef } from "react";
import { CheckCircle2, CircleX } from "lucide-react";
import { transcriptTurns } from "@/content/shared/audio";
import { useI18n } from "@/i18n/client";
import { cn } from "@/lib/utils";
import type { AnswerFeedback } from "@/types/domain";

/** Display strings are resolved by the caller: MCQs use IDs, lessons use labels. */
export function AnswerFeedbackPanel({
  feedback,
  answer,
  correctAnswer,
  autoReveal = true,
  answerLanguage = "fr",
}: {
  feedback: AnswerFeedback;
  answer: string;
  correctAnswer: string;
  autoReveal?: boolean;
  answerLanguage?: "en" | "fr";
}) {
  const { t } = useI18n();
  const copy = t.assessment;
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!autoReveal) return;
    panel.current?.focus({ preventScroll: true });
    panel.current?.scrollIntoView?.({ block: "nearest", behavior: "instant" });
  }, [autoReveal]);
  const Icon = feedback.correct ? CheckCircle2 : CircleX;
  return (
    <div
      ref={panel}
      tabIndex={-1}
      role="status"
      className={cn(
        "mt-6 rounded-xl border p-5 outline-none focus-visible:ring-2 focus-visible:ring-primary",
        feedback.correct
          ? "border-primary/30 bg-primary/5"
          : "border-danger/30 bg-danger/5",
      )}
    >
      <p className="flex items-center gap-2 font-bold">
        <Icon className="size-5 shrink-0" aria-hidden="true" />
        {feedback.correct ? copy.correct : copy.notQuite}
      </p>
      <dl className="mt-4 space-y-3 text-sm">
        <div>
          <dt className="font-semibold">{copy.yourAnswer}</dt>
          <dd className="mt-1" lang={answerLanguage}>
            {answer}
          </dd>
        </div>
        <div>
          <dt className="font-semibold">{copy.correctAnswerLabel}</dt>
          <dd className="mt-1 font-semibold" lang={answerLanguage}>
            {correctAnswer}
          </dd>
        </div>
      </dl>
      <p className="mt-4 text-sm font-semibold">{copy.why}</p>
      <p className="mt-1 text-sm leading-6 text-muted-foreground">
        {feedback.explanation}
      </p>
      {feedback.transcript && (
        <details className="mt-3 text-sm">
          <summary className="cursor-pointer font-semibold text-primary">
            {copy.showTranscript}
          </summary>
          <div lang="fr" className="mt-2 space-y-1 leading-6">
            {transcriptTurns(feedback.transcript).map((turn, index, turns) => (
              <p key={index}>
                {turns.length > 1 && `${turn.speaker} : `}
                {turn.text}
              </p>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
