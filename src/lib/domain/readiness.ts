import type { Progress, Readiness } from "@/types/domain";
import { clamp } from "@/lib/utils";

export const READINESS_ALGORITHM_VERSION = "v1";

export function calculateReadiness(progress: Progress): Readiness {
  const sufficient =
    progress.diagnosticScore !== null && progress.practiceAnswered >= 10 && progress.simulationsCompleted >= 1;

  if (!sufficient) {
    return {
      overall: null,
      evidence: "insufficient",
      competencies: progress.competencyScores,
      trend: 0,
      algorithmVersion: READINESS_ALGORITHM_VERSION,
    };
  }

  const competencyValues = Object.values(progress.competencyScores);
  const competencyAverage = competencyValues.length
    ? competencyValues.reduce((total, value) => total + value, 0) / competencyValues.length
    : 0;
  const overall = clamp(
    progress.diagnosticScore! * 0.15 +
      progress.quizAverage * 0.15 +
      progress.practiceAccuracy * 0.25 +
      competencyAverage * 0.15 +
      progress.simulationAverage * 0.25 +
      progress.courseCompletion * 0.05,
  );

  return {
    overall,
    evidence: "sufficient",
    competencies: progress.competencyScores,
    trend: 4,
    algorithmVersion: READINESS_ALGORITHM_VERSION,
  };
}
