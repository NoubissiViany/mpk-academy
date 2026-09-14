"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Clock3, Send } from "lucide-react";
import { useApp } from "@/components/providers/app-provider";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { examConfigurations, productiveTasks } from "@/config/exams";
import { getExamQuestionPool } from "@/data/exam-question-pools";
import { QuestionCard } from "@/features/assessment/question-card";
import {
  createEmptyExamProfile,
  updateMockReadiness,
} from "@/lib/domain/exam-progress";
import type { ExamId, ProductivePracticeTask, Question } from "@/types/domain";

type MockItem =
  | { key: string; section: "reading" | "listening"; question: Question }
  | {
      key: string;
      section: "writing" | "speaking";
      task: ProductivePracticeTask;
    };

export function ScaledMockSession() {
  const router = useRouter();
  const { state, setState } = useApp();
  const exam: ExamId =
    state.user?.goal.exam === "TCF Canada" ? "TCF Canada" : "TEF Canada";
  const config = examConfigurations[exam];
  const items = useMemo(() => buildItems(exam), [exam]);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [seconds, setSeconds] = useState(
    config.scaledMock.durationMinutes * 60,
  );
  const item = items[index];

  useEffect(() => {
    const timer = window.setInterval(
      () => setSeconds((value) => Math.max(0, value - 1)),
      1000,
    );
    return () => window.clearInterval(timer);
  }, []);

  const submit = () => {
    const comprehension = items.filter(
      (entry): entry is Extract<MockItem, { question: Question }> =>
        "question" in entry,
    );
    const productive = items.filter(
      (entry): entry is Extract<MockItem, { task: ProductivePracticeTask }> =>
        "task" in entry,
    );
    const correct = comprehension.filter(
      (entry) =>
        answers[entry.key]?.trim().toLowerCase() ===
        entry.question.correctAnswer.toLowerCase(),
    ).length;
    const productiveCompleted = productive.filter((entry) =>
      answers[entry.key]?.trim(),
    ).length;
    const score = Math.round(
      ((correct + productiveCompleted) / items.length) * 100,
    );
    setState((current) => {
      const profile =
        current.examProfiles[exam] ?? createEmptyExamProfile(exam);
      return {
        ...current,
        lastExamScore: score,
        examProfiles: {
          ...current.examProfiles,
          [exam]: updateMockReadiness(
            profile,
            score,
            config.scaledMock.durationMinutes,
          ),
        },
        progress: {
          ...current.progress,
          simulationsCompleted: current.progress.simulationsCompleted + 1,
          simulationAverage: Math.round(
            (current.progress.simulationAverage + score) / 2,
          ),
        },
        activities: [
          {
            id: crypto.randomUUID(),
            label: `${exam} shortened mock`,
            detail: `${score}% MPK simulation result`,
            timestamp: new Date().toISOString(),
          },
          ...current.activities,
        ],
      };
    });
    router.push("/exam/results");
  };

  const oneWayListening =
    config.navigationRules.listeningOneWay && item.section === "listening";
  const previousIsLocked =
    config.navigationRules.listeningOneWay &&
    index > 0 &&
    items[index - 1].section === "listening";
  const minutes = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const secs = (seconds % 60).toString().padStart(2, "0");
  return (
    <div className="min-h-screen bg-[#f5f3ed] text-[#17251f] dark:bg-[#0d1411] dark:text-white">
      <header className="sticky top-0 z-20 border-b bg-inherit">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#8d3438] dark:text-[#ef989b]">
              {exam} · simulation MPK raccourcie
            </p>
            <p className="text-sm font-semibold capitalize">{item.section}</p>
          </div>
          <div
            className="flex items-center gap-2 rounded-lg border px-3 py-2 font-mono font-bold"
            aria-live="polite"
          >
            <Clock3 className="size-4" />
            {minutes}:{secs}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-7">
        <div className="flex justify-between text-sm">
          <span>
            Étape {index + 1} sur {items.length}
          </span>
          <span>{Object.values(answers).filter(Boolean).length} réponses</span>
        </div>
        <Progress
          value={((index + 1) / items.length) * 100}
          label="Progression de l’examen"
          className="mt-3"
        />
        {oneWayListening && (
          <p className="mt-4 rounded-xl bg-exam/10 p-3 text-sm font-semibold">
            Écoute TEF à sens unique : après Suivant, cette question ne sera
            plus accessible.
          </p>
        )}
        <div className="mt-7 rounded-2xl border bg-card p-5 sm:p-8">
          {"question" in item ? (
            <QuestionCard
              exam
              question={item.question}
              value={answers[item.key]}
              onChange={(value) =>
                setAnswers({ ...answers, [item.key]: value })
              }
            />
          ) : (
            <ProductiveMockItem
              item={item}
              value={answers[item.key] ?? ""}
              onChange={(value) =>
                setAnswers({ ...answers, [item.key]: value })
              }
            />
          )}
        </div>
        <div className="mt-6 flex justify-between">
          <Button
            variant="secondary"
            disabled={index === 0 || oneWayListening || previousIsLocked}
            onClick={() => setIndex(index - 1)}
          >
            Précédent
          </Button>
          {index < items.length - 1 ? (
            <Button onClick={() => setIndex(index + 1)}>Suivant</Button>
          ) : (
            <Button onClick={submit}>
              <Send className="size-4" />
              Soumettre
            </Button>
          )}
        </div>
        <p className="mt-5 text-center text-xs text-muted-foreground">
          Simulation indépendante MPK raccourcie — aucun résultat officiel
          TEF/TCF.
        </p>
      </main>
    </div>
  );
}

function ProductiveMockItem({
  item,
  value,
  onChange,
}: {
  item: Extract<MockItem, { task: ProductivePracticeTask }>;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <>
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-exam">
        {item.task.title}
      </p>
      <h1 className="mt-4 text-2xl font-bold leading-9">{item.task.prompt}</h1>
      <p className="mt-4 text-sm text-muted-foreground">{item.task.guidance}</p>
      {item.section === "writing" ? (
        <textarea
          className="mt-6 min-h-56 w-full rounded-xl border bg-background p-4"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Rédigez en français…"
        />
      ) : (
        <label className="mt-6 flex gap-3 rounded-xl border p-4">
          <input
            type="checkbox"
            checked={value === "completed"}
            onChange={(event) =>
              onChange(event.target.checked ? "completed" : "")
            }
          />
          <span>
            <strong>J’ai terminé ma réponse orale chronométrée</strong>
            <span className="mt-1 block text-sm text-muted-foreground">
              Aucun audio n’est enregistré.
            </span>
          </span>
        </label>
      )}
    </>
  );
}

function buildItems(exam: ExamId): MockItem[] {
  const comprehension = (skill: "reading" | "listening") => {
    const pool = getExamQuestionPool(exam, skill);
    return Array.from({ length: 5 }, (_, index): MockItem => ({
      key: `${skill}-${index}`,
      section: skill,
      question: pool[index % pool.length],
    }));
  };
  return [
    ...comprehension("reading"),
    ...comprehension("listening"),
    ...productiveTasks[exam].map((task): MockItem => ({
      key: task.id,
      section: task.skill,
      task,
    })),
  ];
}
