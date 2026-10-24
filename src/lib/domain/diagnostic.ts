import type { DiagnosticResult, Question } from "@/types/domain";
import {
  diagnosticSkillModules,
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
  let assessedItemCount = 0;
  let foundationCorrect = 0;
  let foundationCount = 0;
  for (const question of questions) {
    if (
      question.diagnosticSkill === "listening" &&
      question.metadata?.audio?.status !== "ready"
    )
      continue;
    assessedItemCount += 1;
    const isCorrect =
      answers[question.id]?.trim().toLowerCase() ===
      question.correctAnswer.trim().toLowerCase();
    if (isCorrect) correct += 1;
    if (
      ["grammar", "vocabulary", "sentence-structure"].includes(
        question.diagnosticSkill,
      )
    ) {
      foundationCount++;
      foundationCorrect += Number(isCorrect);
    }
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
        value.count ? clamp((value.correct / value.count) * 100) : null,
      ];
    }),
  ) as DiagnosticResult["skillScores"];
  const ranked = diagnosticSkillOrder
    .map((skill, order) => ({ skill, score: skillScores[skill], order }))
    .filter(
      (
        item,
      ): item is { skill: typeof item.skill; score: number; order: number } =>
        item.score !== null,
    )
    .sort((a, b) => b.score - a.score || a.order - b.order);
  const priority =
    [...ranked].sort((a, b) => a.score - b.score || a.order - b.order)[0]
      ?.skill ?? "grammar";
  const score = clamp((correct / Math.max(assessedItemCount, 1)) * 100);
  const level =
    score >= 85 ? "C1" : score >= 70 ? "B2" : score >= 45 ? "B1" : "A2";
  return {
    score,
    algorithmVersion: "mpk-diagnostic-v2",
    assessedItemCount,
    languageFoundation: Math.round(
      (100 * foundationCorrect) / Math.max(foundationCount, 1),
    ),
    level,
    competencyScores,
    skillScores,
    strength: ranked[0]?.skill ?? "grammar",
    priority,
    recommendedModuleId: diagnosticSkillModules[priority],
  };
}

/** A rough duration for the assessment: about 0.8 minute a question, to 5. */
export const diagnosticMinutes = (questions: number) =>
  Math.max(10, Math.round((questions * 0.8) / 5) * 5);
