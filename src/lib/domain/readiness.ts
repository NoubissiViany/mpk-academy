import type { Progress, Readiness } from "@/types/domain";

export const READINESS_ALGORITHM_VERSION = "diagnostic-v1";

export function calculateReadiness(progress: Progress): Readiness {
  if (progress.diagnosticScore === null) {
    return {
      overall: null,
      evidence: "insufficient",
      competencies: progress.competencyScores,
      trend: 0,
      algorithmVersion: READINESS_ALGORITHM_VERSION,
    };
  }

  return {
    overall: progress.diagnosticScore,
    evidence: "sufficient",
    competencies: progress.competencyScores,
    trend: 0,
    algorithmVersion: READINESS_ALGORITHM_VERSION,
  };
}
