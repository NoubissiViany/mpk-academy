"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useApp } from "@/components/providers/app-provider";
import { ModeBadge } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { examSkillContent } from "@/config/exams";
import { getExamQuestionPool } from "@/data/exam-question-pools";
import { mistakeCategoryByQuestion } from "@/data/questions";
import { QuestionCard } from "@/features/assessment/question-card";
import {
  createEmptyExamProfile,
  updateExamSkill,
} from "@/lib/domain/exam-progress";
import { competencyFocusLabel } from "@/lib/domain/personalization";
import type { CompetencyId, ExamId, ExamSkill, Mistake } from "@/types/domain";

function activeExam(value: string | undefined): ExamId {
  return value === "TCF Canada" ? "TCF Canada" : "TEF Canada";
}

export function ExamPracticeSession() {
  const router = useRouter();
  const search = useSearchParams();
  const { state, setState } = useApp();
  const exam = activeExam(state.user?.goal.exam);
  const requested = search.get("skill");
  const requestedFocus = search.get("focus") as CompetencyId | null;
  const questionCount = search.get("count") === "10" ? 10 : 5;
  const skill: ExamSkill =
    requested === "listening" ||
    requested === "writing" ||
    requested === "speaking"
      ? requested
      : "reading";

  if (skill === "writing" || skill === "speaking")
    return (
      <div className="mx-auto max-w-2xl rounded-2xl border bg-card p-7 text-center sm:p-10">
        <p className="eyebrow">Coming soon</p>
        <h1 className="mt-3 text-3xl font-bold">
          Corrected {examSkillContent[skill].label.toLowerCase()} practice is
          not available yet.
        </h1>
        <p className="mx-auto mt-4 max-w-lg text-sm leading-6 text-muted-foreground">
          You can continue learning this skill in Lessons. MPK will not create a
          score until a supported correction experience is available.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Button asChild>
            <Link href="/learn">Explore lessons</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/practice">Back to practice</Link>
          </Button>
        </div>
      </div>
    );
  return (
    <ComprehensionSession
      exam={exam}
      skill={skill}
      focus={requestedFocus}
      questionCount={questionCount}
      onSave={(score, reviewed, mistakes) => {
        persistSession(setState, exam, skill, score, 15, reviewed, mistakes);
        router.push("/practice/results");
      }}
    />
  );
}

function ComprehensionSession({
  exam,
  skill,
  focus,
  questionCount,
  onSave,
}: {
  exam: ExamId;
  skill: "reading" | "listening";
  focus: CompetencyId | null;
  questionCount: 5 | 10;
  onSave: (score: number, reviewed: number, mistakes: Mistake[]) => void;
}) {
  const pool = useMemo(() => {
    const source = getExamQuestionPool(exam, skill);
    const focused = focus
      ? source.filter((question) => question.competencies.includes(focus))
      : source;
    const available = focused.length ? focused : source;
    return Array.from(
      { length: questionCount },
      (_, index) => available[index % available.length],
    );
  }, [exam, focus, questionCount, skill]);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [revealed, setRevealed] = useState(false);
  const question = pool[index];
  const answerKey = `${index}-${question.id}`;
  const value = answers[answerKey];
  const finish = () => {
    const correct = pool.filter(
      (item, itemIndex) =>
        answers[`${itemIndex}-${item.id}`]?.trim().toLowerCase() ===
        item.correctAnswer.toLowerCase(),
    ).length;
    const mistakes = pool.flatMap((item, itemIndex): Mistake[] => {
      const learnerAnswer = answers[`${itemIndex}-${item.id}`];
      if (
        learnerAnswer?.trim().toLowerCase() === item.correctAnswer.toLowerCase()
      )
        return [];
      return [
        {
          id: crypto.randomUUID(),
          questionId: item.id,
          competencyId: item.competencies[0],
          mistakeCategory:
            mistakeCategoryByQuestion[item.id] ?? "Question misunderstanding",
          learnerAnswer: learnerAnswer ?? "No answer",
          correctAnswer: item.correctAnswer,
          explanation: item.explanation,
          timestamp: new Date().toISOString(),
          reviewStatus: "new",
          exam,
          examSkill: skill,
          pattern: competencyFocusLabel(item.competencies[0]),
          count: 1,
        },
      ];
    });
    onSave(Math.round((correct / pool.length) * 100), pool.length, mistakes);
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
        {examSkillContent[skill].label} · {examSkillContent[skill].labelFr}
        {focus ? ` · Focus: ${competencyFocusLabel(focus)}` : ""}
      </p>
      <Progress
        value={((index + 1) / pool.length) * 100}
        label="Practice progress"
      />
      <div className="mt-7 rounded-2xl border border-practice/20 bg-card p-5 sm:p-8">
        <QuestionCard
          question={question}
          value={value}
          onChange={(answer) => setAnswers({ ...answers, [answerKey]: answer })}
          reveal={revealed}
        />
      </div>
      <div className="mt-6 flex justify-between">
        <Button
          variant="ghost"
          disabled={index === 0}
          onClick={() => {
            setIndex(index - 1);
            setRevealed(false);
          }}
        >
          <ArrowLeft className="size-4" />
          Previous
        </Button>
        {!revealed ? (
          <Button disabled={!value} onClick={() => setRevealed(true)}>
            Check answer
          </Button>
        ) : (
          <Button
            onClick={() =>
              index === pool.length - 1
                ? finish()
                : (setIndex(index + 1), setRevealed(false))
            }
          >
            {index === pool.length - 1 ? "See results" : "Next question"}
            <ArrowRight className="size-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

function persistSession(
  setState: ReturnType<typeof useApp>["setState"],
  exam: ExamId,
  skill: ExamSkill,
  score: number,
  minutes: number,
  reviewed: number,
  mistakes: Mistake[],
) {
  setState((current) => {
    const profile = current.examProfiles[exam] ?? createEmptyExamProfile(exam);
    const updated = updateExamSkill(profile, skill, score, {
      minutes,
      questionsReviewed: reviewed,
    });
    const replacedIds = new Set(mistakes.map((item) => item.id));
    return {
      ...current,
      lastPracticeScore: score,
      examProfiles: { ...current.examProfiles, [exam]: updated },
      mistakes: [
        ...mistakes,
        ...current.mistakes.filter((item) => !replacedIds.has(item.id)),
      ],
      progress: {
        ...current.progress,
        practiceAnswered:
          current.progress.practiceAnswered + Math.max(reviewed, 1),
        practiceAccuracy: Math.round(
          (current.progress.practiceAccuracy + score) / 2,
        ),
      },
      activities: [
        {
          id: crypto.randomUUID(),
          label: `${exam} ${examSkillContent[skill].label} practice`,
          detail: `${score}% accuracy`,
          timestamp: new Date().toISOString(),
        },
        ...current.activities,
      ],
    };
  });
}
