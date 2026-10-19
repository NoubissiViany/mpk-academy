"use client";
import { cn } from "@/lib/utils";
import type { Question } from "@/types/domain";

export function QuestionCard({
  question,
  value,
  onChange,
  reveal = false,
  exam = false,
}: {
  question: Question;
  value?: string;
  onChange: (answer: string) => void;
  reveal?: boolean;
  exam?: boolean;
}) {
  const correct =
    value?.trim().toLowerCase() === question.correctAnswer.toLowerCase();
  return (
    <div>
      <div className="mb-7">
        {question.metadata?.passage && (
          <blockquote className="mb-6 rounded-xl border-l-4 border-primary bg-muted/60 p-5 text-base leading-7">
            {question.metadata.passage}
          </blockquote>
        )}
        {question.metadata?.audio &&
          !exam &&
          (question.metadata.audio.status === "ready" ? (
            <audio
              controls
              src={question.metadata.audio.path}
              aria-label={question.metadata.audioLabel}
            />
          ) : (
            <section className="mb-6 rounded-xl border bg-muted/50 p-4">
              <p className="font-bold">
                Audio pending · Transcript-based exercise
              </p>
              <p className="text-sm text-muted-foreground">
                This exercise does not measure listening performance.
              </p>
              <p className="mt-3 whitespace-pre-line" lang="fr">
                {question.metadata.audio.transcript}
              </p>
            </section>
          ))}
        <h2 className="text-xl font-bold leading-8 sm:text-2xl">
          {question.prompt}
        </h2>
      </div>
      {question.type === "fill_blank" ? (
        <label className="block">
          <span className="sr-only">Your answer</span>
          <input
            value={value ?? ""}
            onChange={(event) => onChange(event.target.value)}
            disabled={reveal}
            className="min-h-12 w-full rounded-xl border bg-background px-4 outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
            placeholder="Votre réponse"
            autoComplete="off"
          />
        </label>
      ) : (
        <fieldset className="space-y-3">
          <legend className="sr-only">Answer options</legend>
          {question.options.map((option, index) => {
            const selected = value === option.id;
            const isCorrect = option.id === question.correctAnswer;
            return (
              <label
                key={option.id}
                className={cn(
                  "flex min-h-14 cursor-pointer items-center gap-4 rounded-xl border p-4 transition-colors focus-within:ring-2 focus-within:ring-primary",
                  selected && !reveal && "border-primary bg-primary/5",
                  reveal &&
                    !exam &&
                    isCorrect &&
                    "border-primary bg-primary/10",
                  reveal &&
                    !exam &&
                    selected &&
                    !correct &&
                    "border-danger bg-danger/5",
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
                <span className="text-sm font-medium sm:text-base">
                  {option.label}
                </span>
                {reveal && !exam && isCorrect && (
                  <span className="ml-auto text-xs font-bold text-primary">
                    Correct
                  </span>
                )}
              </label>
            );
          })}
        </fieldset>
      )}
      {reveal && !exam && (
        <div
          role="status"
          className={cn(
            "mt-6 rounded-xl border p-5",
            correct
              ? "border-primary/30 bg-primary/5"
              : "border-danger/30 bg-danger/5",
          )}
        >
          <p className="font-bold">{correct ? "Correct" : "Not quite"}</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {question.explanation}
          </p>
          <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Competency · {question.competencies[0].replaceAll("-", " ")}
          </p>
        </div>
      )}
    </div>
  );
}
