"use client";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useApp } from "@/components/providers/app-provider";
import { QuestionCard } from "@/features/assessment/question-card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { diagnosticQuestions } from "@/data/questions";
import { scoreDiagnostic } from "@/lib/domain/diagnostic";

export function DiagnosticFlow() {
  const router = useRouter(); const { state, setState } = useApp(); const [index, setIndex] = useState(0); const question = diagnosticQuestions[index]; const answers = state.diagnosticAnswers;
  const answer = (value: string) => setState((current) => ({ ...current, diagnosticAnswers: { ...current.diagnosticAnswers, [question.id]: value } }));
  const finish = () => { const result = scoreDiagnostic(diagnosticQuestions, answers); setState((current) => ({ ...current, diagnosticResult: result, progress: { ...current.progress, diagnosticScore: result.score }, activities: [{ id: crypto.randomUUID(), label: "Diagnostic completed", detail: `${result.level} estimated level`, timestamp: new Date().toISOString() }, ...current.activities] })); router.push("/diagnostic/results"); };
  return <div className="mx-auto max-w-3xl"><div className="mb-8"><div className="mb-3 flex items-center justify-between text-sm"><span className="font-semibold">Question {index + 1} of {diagnosticQuestions.length}</span><span className="text-muted-foreground">About {Math.max(1, diagnosticQuestions.length - index)} min left</span></div><Progress value={((index + 1) / diagnosticQuestions.length) * 100} label={`Diagnostic progress: ${index + 1} of ${diagnosticQuestions.length}`} /></div><div className="rounded-2xl border bg-card p-5 sm:p-8"><QuestionCard question={question} value={answers[question.id]} onChange={answer} /></div><div className="mt-6 flex items-center justify-between"><Button variant="ghost" disabled={index === 0} onClick={() => setIndex(index - 1)}><ArrowLeft className="size-4" /> Previous</Button>{index < diagnosticQuestions.length - 1 ? <Button disabled={!answers[question.id]} onClick={() => setIndex(index + 1)}>Next <ArrowRight className="size-4" /></Button> : <Button disabled={!answers[question.id]} onClick={finish}>Finish diagnostic</Button>}</div><p className="mt-8 text-center text-xs text-muted-foreground">Independent mock practice content · not official TEF/TCF questions</p></div>;
}
