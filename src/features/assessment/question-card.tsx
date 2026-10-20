"use client";
import { useI18n } from "@/i18n/client";
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
}: {
  question: PublicQuestion;
  value?: string;
  onChange: (answer: string) => void;
  feedback?: AnswerFeedback | null;
  exam?: boolean;
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
        <h2 lang="fr" className="text-xl font-bold leading-8 sm:text-2xl">
          {question.prompt}
        </h2>
      </div>
      {question.type === "fill_blank" ? (
        <label className="block">
          <span className="sr-only">{copy.yourAnswer}</span>
          <input
            value={value ?? ""}
            onChange={(event) => onChange(event.target.value)}
            disabled={reveal}
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
                  disabled={reveal}
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
        <div
          role="status"
          className={cn(
            "mt-6 rounded-xl border p-5",
            correct
              ? "border-primary/30 bg-primary/5"
              : "border-danger/30 bg-danger/5",
          )}
        >
          <p className="font-bold">{correct ? copy.correct : copy.notQuite}</p>
          {question.type === "fill_blank" && !correct && (
            <p className="mt-2 text-sm font-semibold" lang="fr">
              {copy.correctAnswer(feedback.correctAnswer)}
            </p>
          )}
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {feedback.explanation}
          </p>
          {question.competencies[0] && (
            <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {copy.competency(competencyLabel(t, question.competencies[0]))}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
