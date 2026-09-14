"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, Clock3 } from "lucide-react";
import { useApp } from "@/components/providers/app-provider";
import { ModeBadge } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  examConfigurations,
  examSkillContent,
  productiveTasks,
} from "@/config/exams";
import { getExamQuestionPool } from "@/data/exam-question-pools";
import { mistakeCategoryByQuestion } from "@/data/questions";
import { QuestionCard } from "@/features/assessment/question-card";
import {
  createEmptyExamProfile,
  updateExamSkill,
} from "@/lib/domain/exam-progress";
import type {
  ExamId,
  ExamSkill,
  Mistake,
  RubricResponse,
} from "@/types/domain";

function activeExam(value: string | undefined): ExamId {
  return value === "TCF Canada" ? "TCF Canada" : "TEF Canada";
}

export function ExamPracticeSession() {
  const router = useRouter();
  const search = useSearchParams();
  const { state, setState } = useApp();
  const exam = activeExam(state.user?.goal.exam);
  const requested = search.get("skill");
  const skill: ExamSkill =
    requested === "listening" ||
    requested === "writing" ||
    requested === "speaking"
      ? requested
      : "reading";

  if (skill === "writing" || skill === "speaking")
    return (
      <ProductiveSession
        exam={exam}
        skill={skill}
        onSave={(score, minutes, patterns) => {
          persistSession(setState, exam, skill, score, minutes, 0, patterns);
          router.push("/practice/results");
        }}
      />
    );
  return (
    <ComprehensionSession
      exam={exam}
      skill={skill}
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
  onSave,
}: {
  exam: ExamId;
  skill: "reading" | "listening";
  onSave: (score: number, reviewed: number, mistakes: Mistake[]) => void;
}) {
  const pool = useMemo(() => {
    const source = getExamQuestionPool(exam, skill);
    return Array.from(
      { length: 5 },
      (_, index) => source[index % source.length],
    );
  }, [exam, skill]);
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
          pattern: item.competencies[0].replaceAll("-", " "),
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

function ProductiveSession({
  exam,
  skill,
  onSave,
}: {
  exam: ExamId;
  skill: "writing" | "speaking";
  onSave: (score: number, minutes: number, patterns: string[]) => void;
}) {
  const tasks = productiveTasks[exam].filter((item) => item.skill === skill);
  const task = tasks[0];
  const [draft, setDraft] = useState("");
  const [completedSpeaking, setCompletedSpeaking] = useState(false);
  const [speakingSeconds, setSpeakingSeconds] = useState(
    task.durationMinutes * 60,
  );
  const [timerRunning, setTimerRunning] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [rubric, setRubric] = useState<Record<number, RubricResponse>>({});
  const words = draft.trim() ? draft.trim().split(/\s+/).length : 0;
  const canReview =
    skill === "writing" ? words >= (task.minimumWords ?? 0) : completedSpeaking;
  const allReviewed = task.rubric.every((_, index) => rubric[index]);
  useEffect(() => {
    if (!timerRunning || speakingSeconds === 0) return;
    const timer = window.setInterval(
      () => setSpeakingSeconds((value) => Math.max(0, value - 1)),
      1000,
    );
    return () => window.clearInterval(timer);
  }, [speakingSeconds, timerRunning]);
  const finish = () => {
    const values = task.rubric.map((_, index) => rubric[index]);
    const score = Math.round(
      values.reduce(
        (sum, value) =>
          sum + (value === "yes" ? 100 : value === "partly" ? 50 : 0),
        0,
      ) / values.length,
    );
    const patterns = task.rubric.filter((_, index) => rubric[index] !== "yes");
    onSave(score, task.durationMinutes, patterns);
  };
  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-7 flex items-center justify-between">
        <ModeBadge mode="practice" />
        <span className="text-sm font-semibold">
          {exam} · {skill === "writing" ? "Writing" : "Speaking"}
        </span>
      </div>
      <Progress
        value={reviewing ? 100 : 50}
        label="Productive practice progress"
      />
      <div className="mt-7 rounded-2xl border bg-card p-5 sm:p-8">
        {!reviewing ? (
          <>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">
              {task.title}
            </p>
            <h1 className="mt-4 text-2xl font-bold leading-9">{task.prompt}</h1>
            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              {task.guidance}
            </p>
            <p className="mt-4 flex items-center gap-2 text-sm font-semibold">
              <Clock3 className="size-4" />
              {task.durationMinutes} minutes
            </p>
            {skill === "writing" ? (
              <div className="mt-6">
                <textarea
                  className="min-h-64 w-full rounded-xl border bg-background p-4 outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder="Rédigez votre réponse en français…"
                />
                <p className="mt-2 text-right text-xs font-semibold text-muted-foreground">
                  {words} / {task.minimumWords} minimum words
                </p>
              </div>
            ) : (
              <div className="mt-6 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-muted p-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
                      Timed response
                    </p>
                    <p className="mt-1 font-mono text-2xl font-bold">
                      {Math.floor(speakingSeconds / 60)
                        .toString()
                        .padStart(2, "0")}
                      :{(speakingSeconds % 60).toString().padStart(2, "0")}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setTimerRunning((value) => !value)}
                  >
                    {timerRunning
                      ? "Pause timer"
                      : speakingSeconds === task.durationMinutes * 60
                        ? "Start response timer"
                        : "Resume timer"}
                  </Button>
                </div>
                <label className="flex cursor-pointer items-start gap-3 rounded-xl border p-4">
                  <input
                    className="mt-1"
                    type="checkbox"
                    checked={completedSpeaking}
                    onChange={(event) =>
                      setCompletedSpeaking(event.target.checked)
                    }
                  />
                  <span>
                    <strong className="block">
                      I completed my timed spoken response
                    </strong>
                    <span className="mt-1 block text-sm text-muted-foreground">
                      No audio is recorded or uploaded. Use the prompt and
                      preparation cues, then self-review honestly.
                    </span>
                  </span>
                </label>
              </div>
            )}
            <Button
              className="mt-6"
              disabled={!canReview}
              onClick={() => setReviewing(true)}
            >
              Review my response
            </Button>
          </>
        ) : (
          <>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">
              LEARNER SELF-REVIEW
            </p>
            <h1 className="mt-3 text-2xl font-bold">
              How did your response meet the{" "}
              {examConfigurations[exam].shortName} task?
            </h1>
            <p className="mt-3 text-sm text-muted-foreground">
              Yes = 100, Partly = 50, Not yet = 0. This is your own practice
              indicator, not an automated or official score.
            </p>
            <div className="mt-7 space-y-5">
              {task.rubric.map((criterion, criterionIndex) => (
                <fieldset key={criterion}>
                  <legend className="font-semibold">{criterion}</legend>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(["yes", "partly", "not-yet"] as const).map((value) => (
                      <label
                        key={value}
                        className="cursor-pointer rounded-full border px-4 py-2 text-sm capitalize has-checked:border-primary has-checked:bg-primary/5"
                      >
                        <input
                          type="radio"
                          className="sr-only"
                          name={`criterion-${criterionIndex}`}
                          checked={rubric[criterionIndex] === value}
                          onChange={() =>
                            setRubric({ ...rubric, [criterionIndex]: value })
                          }
                        />
                        {value.replace("-", " ")}
                      </label>
                    ))}
                  </div>
                </fieldset>
              ))}
            </div>
            <div className="mt-7 flex justify-between">
              <Button variant="ghost" onClick={() => setReviewing(false)}>
                <ArrowLeft className="size-4" />
                Back to response
              </Button>
              <Button disabled={!allReviewed} onClick={finish}>
                Save self-review
                <ArrowRight className="size-4" />
              </Button>
            </div>
          </>
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
  newItems: Mistake[] | string[],
) {
  setState((current) => {
    const profile = current.examProfiles[exam] ?? createEmptyExamProfile(exam);
    const updated = updateExamSkill(profile, skill, score, {
      minutes,
      questionsReviewed: reviewed,
    });
    const mistakes: Mistake[] =
      typeof newItems[0] === "string"
        ? (newItems as string[]).map((pattern) => {
            const existing = current.mistakes.find(
              (item) =>
                item.exam === exam &&
                item.examSkill === skill &&
                item.pattern === pattern,
            );
            return {
              id: existing?.id ?? crypto.randomUUID(),
              questionId: `${exam}-${skill}-rubric`,
              competencyId:
                skill === "writing" ? "grammar-tense" : "vocabulary-context",
              mistakeCategory: "Question misunderstanding",
              learnerAnswer: "Learner self-review",
              correctAnswer: "Criterion met",
              explanation:
                "This pattern came from your productive-task self-review.",
              timestamp: new Date().toISOString(),
              reviewStatus: "new",
              exam,
              examSkill: skill,
              pattern,
              count: (existing?.count ?? 0) + 1,
            };
          })
        : (newItems as Mistake[]);
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
          detail: `${score}% ${skill === "writing" || skill === "speaking" ? "learner self-review" : "accuracy"}`,
          timestamp: new Date().toISOString(),
        },
        ...current.activities,
      ],
    };
  });
}
