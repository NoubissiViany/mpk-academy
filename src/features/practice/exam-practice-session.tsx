"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { checkPracticeAnswerAction } from "@/app/actions/content";
import { submitPracticeAction } from "@/app/actions/learner";
import { useApp } from "@/components/providers/app-provider";
import { ModeBadge } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
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
  pool,
}: {
  exam: ExamId;
  skill: "reading" | "listening";
  focus: CompetencyId | null;
  pool: PublicQuestion[];
}) {
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
  const question = pool[index];
  if (!question) return <p>{copy.empty}</p>;
  const value = answers[question.id];
  const revealed = feedback[question.id];

  const check = async () => {
    setChecking(true);
    const result = await checkPracticeAnswerAction(question.id, value);
    setChecking(false);
    if (!result.ok) {
      toast.error(
        result.reference
          ? t.common.errorReference(result.message, result.reference)
          : result.message,
      );
      return;
    }
    setFeedback((current) => ({ ...current, [question.id]: result.feedback }));
  };

  const finish = async () => {
    setSaving(true);
    const result = await submitPracticeAction({
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
  };

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-7 flex items-center justify-between">
        <ModeBadge mode="practice" />
        <span className="text-sm font-semibold">
          {exam} · {index + 1} / {pool.length}
        </span>
      </div>
      <p className="mb-3 text-sm font-bold">
        {t.practice.skills[skill]}
        {t.practice.skills[skill] !== t.practice.frenchSkills[skill] &&
          ` · ${t.practice.frenchSkills[skill]}`}
        {focus ? ` · ${copy.focus(competencyLabel(t, focus))}` : ""}
      </p>
      <Progress
        value={((index + 1) / pool.length) * 100}
        label={copy.progress}
      />
      <div className="mt-7 rounded-2xl border border-practice/20 bg-card p-5 sm:p-8">
        <QuestionCard
          question={question}
          value={value}
          onChange={(answer) =>
            setAnswers((current) => ({ ...current, [question.id]: answer }))
          }
          feedback={revealed}
        />
      </div>
      <div className="mt-6 flex justify-between">
        <Button
          variant="ghost"
          disabled={index === 0}
          onClick={() => setIndex(index - 1)}
        >
          <ArrowLeft className="size-4" />
          {t.common.previous}
        </Button>
        {!revealed ? (
          <Button disabled={!value || checking} onClick={check}>
            {checking ? t.assessment.checking : copy.check}
          </Button>
        ) : (
          <Button
            disabled={saving}
            onClick={() =>
              index === pool.length - 1 ? finish() : setIndex(index + 1)
            }
          >
            {saving
              ? copy.saving
              : index === pool.length - 1
                ? copy.results
                : copy.next}
            <ArrowRight className="size-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
