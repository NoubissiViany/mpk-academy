"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { checkPracticeAnswerAction } from "@/app/actions/content";
import { submitPracticeAction } from "@/app/actions/learner";
import { useApp } from "@/components/providers/app-provider";
import { EmptyState, ModeBadge } from "@/components/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckedProgress } from "@/features/assessment/checked-progress";
import { QuestionCard } from "@/features/assessment/question-card";
import { useI18n } from "@/i18n/client";
import { competencyLabel } from "@/i18n/format";
import type {
  AnswerFeedback,
  CompetencyId,
  ExamId,
  PublicQuestion,
} from "@/types/domain";

export function ExamPracticeSession({
  exam,
  skill,
  focus,
  pool: initialPool,
  reviewIds = [],
  mode = "practice",
}: {
  exam: ExamId;
  skill: "reading" | "listening";
  focus: CompetencyId | null;
  pool: PublicQuestion[];
  /** Questions in `pool` that are due spaced reviews. */
  reviewIds?: string[];
  mode?: "practice" | "review";
}) {
  const [pool] = useState(initialPool);
  const [submissionId] = useState(() => crypto.randomUUID());
  const [startedAt] = useState(() => Date.now());
  const router = useRouter();
  const { replaceState } = useApp();
  const { t } = useI18n();
  const copy = t.practice.session;
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<Record<string, AnswerFeedback>>({});
  const [checking, setChecking] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pending = useRef(false);
  const [submitted, setSubmitted] = useState<Record<string, string>>({});
  const questionContainer = useRef<HTMLDivElement>(null);
  const focusNext = useRef(false);
  useEffect(() => {
    if (!focusNext.current) return;
    questionContainer.current?.querySelector("h2")?.focus();
    focusNext.current = false;
  }, [index]);
  const question = pool[index];
  if (!question)
    return mode === "review" ? (
      <div className="mx-auto max-w-3xl">
        <EmptyState
          title={copy.reviewTitle(t.practice.skills[skill])}
          description={copy.reviewEmpty}
        />
        <Button asChild variant="secondary" className="mt-6">
          <Link href="/practice">{copy.backToPractice}</Link>
        </Button>
      </div>
    ) : (
      <p>{copy.empty}</p>
    );
  const isReview = reviewIds.includes(question.id);
  const value = answers[question.id];
  const revealed = feedback[question.id];

  const check = async () => {
    if (pending.current || !value?.trim() || revealed) return;
    const submittedAnswer = submitted[question.id] ?? value;
    setSubmitted((current) => ({ ...current, [question.id]: submittedAnswer }));
    pending.current = true;
    setError(null);
    setChecking(true);
    try {
      const result = await checkPracticeAnswerAction(
        question.id,
        submittedAnswer,
      );
      if (!result.ok) {
        setError(
          result.reference
            ? t.common.errorReference(result.message, result.reference)
            : result.message,
        );
        return;
      }
      setFeedback((current) => ({
        ...current,
        [question.id]: result.feedback,
      }));
    } catch {
      setError(t.assessment.feedbackError);
    } finally {
      pending.current = false;
      setChecking(false);
    }
  };

  const finish = async () => {
    if (pending.current || saving) return;
    pending.current = true;
    setSaving(true);
    try {
      const result = await submitPracticeAction({
        mode,
        exam,
        skill,
        focus,
        durationSeconds: Math.floor((Date.now() - startedAt) / 1000),
        submissionId,
        answers: pool.map((item, sequence) => ({
          questionId: item.id,
          sequence,
          answer: answers[item.id] ?? "",
        })),
      });
      if (!result.ok) {
        setSaving(false);
        toast.error(result.message);
        return;
      }
      replaceState(result.snapshot);
      router.push(`/practice/results?session=${result.data.id}`);
      router.refresh();
    } catch {
      setSaving(false);
      toast.error(t.common.errors.unavailable);
    } finally {
      pending.current = false;
    }
  };
  const navigate = (nextIndex: number) => {
    if (pending.current || saving) return;
    setError(null);
    focusNext.current = true;
    setIndex(nextIndex);
  };

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-7 flex items-center justify-between">
        <ModeBadge mode="practice" />
        <span className="text-sm font-semibold">{exam}</span>
      </div>
      <p className="mb-3 text-sm font-bold">
        {mode === "review"
          ? copy.reviewTitle(t.practice.skills[skill])
          : t.practice.skills[skill]}
        {mode !== "review" &&
          t.practice.skills[skill] !== t.practice.frenchSkills[skill] &&
          ` · ${t.practice.frenchSkills[skill]}`}
        {focus ? ` · ${copy.focus(competencyLabel(t, focus))}` : ""}
      </p>
      {mode === "review" && index === 0 && (
        <p className="mb-3 text-sm text-muted-foreground">{copy.reviewIntro}</p>
      )}
      <p className="mb-4 text-sm text-muted-foreground">
        {t.assessment.instruction}
      </p>
      <CheckedProgress
        position={index + 1}
        total={pool.length}
        checked={Object.keys(feedback).length}
        correct={Object.values(feedback).filter((item) => item.correct).length}
      />
      <div
        ref={questionContainer}
        className="mt-7 rounded-2xl border border-practice/20 bg-card p-5 sm:p-8"
      >
        {isReview && (
          <p className="mb-4 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <Badge className="gap-1">
              <RotateCcw className="size-3.5" aria-hidden="true" />
              {copy.reviewBadge}
            </Badge>
            {copy.reviewHint}
          </p>
        )}
        <QuestionCard
          key={question.id}
          question={question}
          value={value}
          onChange={(answer) => {
            if (
              pending.current ||
              submitted[question.id] !== undefined ||
              revealed
            )
              return;
            setAnswers((current) => ({ ...current, [question.id]: answer }));
          }}
          feedback={revealed}
          disabled={checking || saving || submitted[question.id] !== undefined}
        />
      </div>
      {error && (
        <p role="alert" className="mt-4 text-sm text-danger">
          {error}
        </p>
      )}
      <div className="mt-6 flex justify-between">
        <Button
          variant="ghost"
          disabled={index === 0 || checking || saving}
          onClick={(event) => {
            if (event.detail <= 1) navigate(index - 1);
          }}
        >
          <ArrowLeft className="size-4" />
          {t.common.previous}
        </Button>
        {!revealed ? (
          <Button disabled={!value?.trim() || checking} onClick={check}>
            {checking
              ? t.assessment.checking
              : error
                ? t.assessment.retry
                : t.assessment.next}
          </Button>
        ) : (
          <Button
            disabled={saving}
            onClick={(event) => {
              if (event.detail > 1) return;
              if (index === pool.length - 1) void finish();
              else navigate(index + 1);
            }}
          >
            {saving
              ? copy.saving
              : index === pool.length - 1
                ? t.assessment.seeResults
                : t.assessment.continue}
            <ArrowRight className="size-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
