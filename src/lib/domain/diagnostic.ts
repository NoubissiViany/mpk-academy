import type { DiagnosticResult, Question } from "@/types/domain";
import {
  diagnosticSkillContent,
  diagnosticSkillOrder,
} from "@/config/diagnostic";
import { clamp } from "@/lib/utils";

export function scoreDiagnostic(
  questions: Question[],
  answers: Record<string, string>,
): DiagnosticResult {
  const totals = new Map<string, { correct: number; count: number }>();
  const skillTotals = new Map(
    diagnosticSkillOrder.map((skill) => [skill, { correct: 0, count: 0 }]),
  );
  let correct = 0;
  for (const question of questions) {
    const isCorrect =
      answers[question.id]?.trim().toLowerCase() ===
      question.correctAnswer.trim().toLowerCase();
    if (isCorrect) correct += 1;
    const skillTotal = skillTotals.get(question.diagnosticSkill)!;
    skillTotals.set(question.diagnosticSkill, {
      correct: skillTotal.correct + Number(isCorrect),
      count: skillTotal.count + 1,
    });
    for (const competency of question.competencies) {
      const current = totals.get(competency) ?? { correct: 0, count: 0 };
      totals.set(competency, {
        correct: current.correct + Number(isCorrect),
        count: current.count + 1,
      });
    }
  }
  const competencyScores = Object.fromEntries(
    [...totals].map(([id, value]) => [
      id,
      clamp((value.correct / value.count) * 100),
    ]),
  ) as DiagnosticResult["competencyScores"];
  const skillScores = Object.fromEntries(
    diagnosticSkillOrder.map((skill) => {
      const value = skillTotals.get(skill)!;
      return [
        skill,
        value.count ? clamp((value.correct / value.count) * 100) : 0,
      ];
    }),
  ) as DiagnosticResult["skillScores"];
  const ranked = diagnosticSkillOrder
    .map((skill, order) => ({ skill, score: skillScores[skill], order }))
    .sort((a, b) => b.score - a.score || a.order - b.order);
  const priority = [...ranked].sort(
    (a, b) => a.score - b.score || a.order - b.order,
  )[0].skill;
  const score = clamp((correct / Math.max(questions.length, 1)) * 100);
  const level =
    score >= 85 ? "C1" : score >= 70 ? "B2" : score >= 45 ? "B1" : "A2";
  return {
    score,
    level,
    competencyScores,
    skillScores,
    strength: ranked[0].skill,
    priority,
    recommendedModuleId: diagnosticSkillContent[priority].moduleId,
  };
}
