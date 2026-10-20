import type { DiagnosticSkill } from "@/types/domain";

// Learner-facing labels and descriptions live in the `diagnostic` i18n namespace.

export const diagnosticSkillOrder: DiagnosticSkill[] = [
  "grammar",
  "vocabulary",
  "reading",
  "listening",
  "sentence-structure",
  "exam-strategy",
];

export const diagnosticSkillModules: Record<DiagnosticSkill, string> = {
  grammar: "grammar",
  vocabulary: "vocabulary",
  reading: "reading-strategies",
  listening: "listening-strategies",
  "sentence-structure": "grammar",
  "exam-strategy": "exam-strategies",
};
