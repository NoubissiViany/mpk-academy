import type { DiagnosticResult, Question } from "@/types/domain";
import { clamp } from "@/lib/utils";

export function scoreDiagnostic(questions: Question[], answers: Record<string, string>): DiagnosticResult {
  const totals = new Map<string, { correct: number; count: number }>();
  let correct = 0;
  for (const question of questions) {
    const isCorrect = answers[question.id]?.trim().toLowerCase() === question.correctAnswer.trim().toLowerCase();
    if (isCorrect) correct += 1;
    for (const competency of question.competencies) {
      const current = totals.get(competency) ?? { correct: 0, count: 0 };
      totals.set(competency, { correct: current.correct + Number(isCorrect), count: current.count + 1 });
    }
  }
  const competencyScores = Object.fromEntries(
    [...totals].map(([id, value]) => [id, clamp((value.correct / value.count) * 100)]),
  ) as DiagnosticResult["competencyScores"];
  const ranked = Object.entries(competencyScores).sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0));
  const score = clamp((correct / Math.max(questions.length, 1)) * 100);
  const level = score >= 85 ? "C1" : score >= 70 ? "B2" : score >= 45 ? "B1" : "A2";
  return {
    score,
    level,
    competencyScores,
    strengths: ranked.slice(0, 2).map(([id]) => id as DiagnosticResult["strengths"][number]),
    weaknesses: ranked.slice(-2).reverse().map(([id]) => id as DiagnosticResult["weaknesses"][number]),
    recommendedModuleId: score < 45 ? "core-grammar" : score < 70 ? "reading" : "exam-strategies",
  };
}
