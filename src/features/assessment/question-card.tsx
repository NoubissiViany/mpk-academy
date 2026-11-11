"use client";
import { useI18n } from "@/i18n/client";
import { AnswerFeedbackPanel } from "./answer-feedback-panel";
import { competencyLabel } from "@/i18n/format";
import { cn } from "@/lib/utils";
import type { AnswerFeedback, PublicQuestion } from "@/types/domain";

/**
 * Renders a question without its answer key. Correctness comes only from
 * `feedback`, which the server returns after the learner answers.
 */
export function QuestionCard({
  question,
  value,
  onChange,
  feedback = null,
  exam = false,
  disabled = false,
}: {
  question: PublicQuestion;
  value?: string;
  onChange: (answer: string) => void;
  feedback?: AnswerFeedback | null;
  exam?: boolean;
  disabled?: boolean;
}) {
  const { t } = useI18n();
  const copy = t.assessment;
  const reveal = Boolean(feedback) && !exam;
  const correct = feedback?.correct ?? false;
  const audio = question.metadata?.audio;
  return (
    <div>
      <div className="mb-7">
        {question.metadata?.passage && (
          <blockquote
            lang="fr"
            className="mb-6 rounded-xl border-l-4 border-primary bg-muted/60 p-5 text-base leading-7"
          >
            {question.metadata.passage}
          </blockquote>
        )}
        {audio &&
          !exam &&
          (audio.status === "ready" ? (
            <audio
              controls
              src={audio.path}
              aria-label={question.metadata?.audioLabel}
              className="mb-6 w-full"
            />
          ) : (
            <section className="mb-6 rounded-xl border bg-muted/50 p-4">
              <p className="font-bold">{copy.audioPending}</p>
              <p className="text-sm text-muted-foreground">
                {copy.audioPendingNote}
              </p>
              <p className="mt-3 whitespace-pre-line" lang="fr">
                {audio.transcript}
              </p>
            </section>
          ))}
        <h2
          tabIndex={-1}
          lang="fr"
          className="text-xl font-bold leading-8 outline-none sm:text-2xl"
        >
          {question.prompt}
        </h2>
      </div>
      {question.type === "fill_blank" ? (
        <label className="block">
          <span className="sr-only">{copy.yourAnswer}</span>
          <input
            value={value ?? ""}
            onChange={(event) => onChange(event.target.value)}
            disabled={reveal || disabled}
            lang="fr"
            className="min-h-12 w-full rounded-xl border bg-background px-4 outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
            placeholder={copy.answerPlaceholder}
            autoComplete="off"
          />
        </label>
      ) : (
        <fieldset className="space-y-3">
          <legend className="sr-only">{copy.options}</legend>
          {question.options.map((option, index) => {
            const selected = value === option.id;
            const isCorrect = reveal && option.id === feedback?.correctAnswer;
            return (
              <label
                key={option.id}
                className={cn(
                  "flex min-h-14 cursor-pointer items-center gap-4 rounded-xl border p-4 transition-colors focus-within:ring-2 focus-within:ring-primary",
                  selected && !reveal && "border-primary bg-primary/5",
                  isCorrect && "border-primary bg-primary/10",
                  reveal && selected && !correct && "border-danger bg-danger/5",
                )}
              >
                <input
                  type="radio"
                  name={question.id}
                  value={option.id}
                  aria-label={option.label}
                  checked={selected}
                  onChange={() => onChange(option.id)}
                  disabled={reveal || disabled}
                  className="sr-only"
                />
                <span
                  className={cn(
                    "grid size-7 shrink-0 place-items-center rounded-full border text-xs font-bold",
                    selected
                      ? "border-primary bg-primary text-primary-foreground"
                      : "bg-card",
                  )}
                >
                  {String.fromCharCode(65 + index)}
                </span>
                <span lang="fr" className="text-sm font-medium sm:text-base">
                  {option.label}
                </span>
                {isCorrect && (
                  <span className="ml-auto text-xs font-bold text-primary">
                    {copy.correct}
                  </span>
                )}
              </label>
            );
          })}
        </fieldset>
      )}
      {reveal && feedback && (
        <>
          <AnswerFeedbackPanel
            feedback={feedback}
            answer={
              question.type === "multiple_choice"
                ? (question.options.find((option) => option.id === value)
                    ?.label ??
                  value ??
                  "")
                : (value ?? "")
            }
            correctAnswer={
              question.type === "multiple_choice"
                ? (question.options.find(
                    (option) => option.id === feedback.correctAnswer,
                  )?.label ?? feedback.correctAnswer)
                : feedback.correctAnswer
            }
          />
          {question.competencies[0] && (
            <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {copy.competency(competencyLabel(t, question.competencies[0]))}
            </p>
          )}
        </>
      )}
    </div>
  );
}
