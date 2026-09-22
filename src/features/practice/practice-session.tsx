"use client";

import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { submitPracticeAction } from "@/app/actions/learner";
import { useApp } from "@/components/providers/app-provider";
import { ModeBadge } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { practiceQuestions } from "@/data/questions";
import { QuestionCard } from "@/features/assessment/question-card";

export function PracticeSession() {
  const router = useRouter();
  const { state, replaceState } = useApp();
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [revealed, setRevealed] = useState(false);
  const [saving, setSaving] = useState(false);
  const question = practiceQuestions[index];
  const value = answers[question.id];

  const next = async () => {
    if (index !== practiceQuestions.length - 1) {
      setIndex(index + 1);
      setRevealed(false);
      return;
    }
    setSaving(true);
    const result = await submitPracticeAction({
      exam:
        state.user?.goal.exam === "TCF Canada" ? "TCF Canada" : "TEF Canada",
      skill: "reading",
      durationSeconds: 15 * 60,
      answers: practiceQuestions.map((item, sequence) => ({
        questionId: item.id,
        sequence,
        answer: answers[item.id] ?? "",
      })),
    });
    setSaving(false);
    if (!result.ok) return toast.error(result.message);
    replaceState(result.snapshot);
    router.push(`/practice/results?session=${result.data.id}`);
    router.refresh();
  };

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-7 flex items-center justify-between">
        <ModeBadge mode="practice" />
        <span className="text-sm font-semibold">
          {index + 1} / {practiceQuestions.length}
        </span>
      </div>
      <Progress
        value={((index + 1) / practiceQuestions.length) * 100}
        label="Practice progress"
      />
      <div className="mt-7 rounded-2xl border border-practice/20 bg-card p-5 sm:p-8">
        <QuestionCard
          question={question}
          value={value}
          onChange={(answer) =>
            setAnswers({ ...answers, [question.id]: answer })
          }
          reveal={revealed}
        />
      </div>
      <div className="mt-6 flex justify-end">
        {!revealed ? (
          <Button disabled={!value} onClick={() => setRevealed(true)}>
            Check answer
          </Button>
        ) : (
          <Button disabled={saving} onClick={next}>
            {saving
              ? "Saving…"
              : index === practiceQuestions.length - 1
                ? "See results"
                : "Next question"}
            <ArrowRight className="size-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
