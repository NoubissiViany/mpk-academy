"use client";
import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useApp } from "@/components/providers/app-provider";
import { ModeBadge } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { QuestionCard } from "@/features/assessment/question-card";
import { mistakeCategoryByQuestion, practiceQuestions } from "@/data/questions";

export function PracticeSession() {
  const router = useRouter(); const { setState } = useApp(); const [index, setIndex] = useState(0); const [answers, setAnswers] = useState<Record<string,string>>({}); const [revealed, setRevealed] = useState(false); const question = practiceQuestions[index]; const value = answers[question.id];
  const next = () => { if (index === practiceQuestions.length - 1) { const correct = practiceQuestions.filter((item) => answers[item.id]?.trim().toLowerCase() === item.correctAnswer.toLowerCase()).length; const score = Math.round((correct / practiceQuestions.length) * 100); setState((current) => { const newMistakes = practiceQuestions.filter((item) => answers[item.id]?.trim().toLowerCase() !== item.correctAnswer.toLowerCase()).map((item) => ({ id: crypto.randomUUID(), questionId: item.id, competencyId: item.competencies[0], mistakeCategory: mistakeCategoryByQuestion[item.id] ?? "Question misunderstanding" as const, learnerAnswer: answers[item.id] ?? "No answer", correctAnswer: item.correctAnswer, explanation: item.explanation, timestamp: new Date().toISOString(), reviewStatus: "new" as const })); return { ...current, lastPracticeScore: score, mistakes: [...newMistakes, ...current.mistakes], progress: { ...current.progress, practiceAnswered: current.progress.practiceAnswered + practiceQuestions.length, practiceAccuracy: Math.round((current.progress.practiceAccuracy + score) / 2) }, activities: [{ id: crypto.randomUUID(), label: "Practice session", detail: `${correct} of ${practiceQuestions.length} correct`, timestamp: new Date().toISOString() }, ...current.activities] }; }); router.push("/practice/results"); return; } setIndex(index + 1); setRevealed(false); };
  return <div className="mx-auto max-w-3xl"><div className="mb-7 flex items-center justify-between"><ModeBadge mode="practice" /><span className="text-sm font-semibold">{index + 1} / {practiceQuestions.length}</span></div><Progress value={((index + 1) / practiceQuestions.length) * 100} label="Practice progress" /><div className="mt-7 rounded-2xl border border-practice/20 bg-card p-5 sm:p-8"><QuestionCard question={question} value={value} onChange={(answer) => setAnswers({ ...answers, [question.id]: answer })} reveal={revealed} /></div><div className="mt-6 flex justify-end">{!revealed ? <Button disabled={!value} onClick={() => setRevealed(true)}>Check answer</Button> : <Button onClick={next}>{index === practiceQuestions.length - 1 ? "See results" : "Next question"}<ArrowRight className="size-4" /></Button>}</div></div>;
}
