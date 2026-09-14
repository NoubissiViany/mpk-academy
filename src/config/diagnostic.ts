import type { DiagnosticResult, DiagnosticSkill } from "@/types/domain";

export const diagnosticSkillOrder: DiagnosticSkill[] = [
  "grammar",
  "vocabulary",
  "reading",
  "listening",
  "sentence-structure",
  "exam-strategy",
];

export const diagnosticSkillContent: Record<
  DiagnosticSkill,
  { label: string; strength: string; priority: string; moduleId: string }
> = {
  grammar: {
    label: "Grammar",
    strength: "You apply common French grammar patterns accurately.",
    priority: "Grammar patterns are making some answers less reliable.",
    moduleId: "core-grammar",
  },
  vocabulary: {
    label: "Vocabulary",
    strength: "You understand common words and expressions well.",
    priority:
      "Unfamiliar words and expressions are limiting your understanding.",
    moduleId: "vocabulary",
  },
  reading: {
    label: "Reading",
    strength:
      "You identify important ideas and details in written French well.",
    priority:
      "You had more difficulty finding meaning and details in written French.",
    moduleId: "reading",
  },
  listening: {
    label: "Listening",
    strength: "You identify spoken ideas and details in French well.",
    priority:
      "You had more difficulty identifying specific information in spoken French.",
    moduleId: "listening",
  },
  "sentence-structure": {
    label: "Sentence structure",
    strength: "You connect and organize ideas in French sentences well.",
    priority:
      "Sentence order and connectors are making some ideas harder to express clearly.",
    moduleId: "core-grammar",
  },
  "exam-strategy": {
    label: "Exam strategy",
    strength:
      "You choose effective strategies when time or uncertainty creates pressure.",
    priority:
      "A more deliberate approach to timing, context, and distractors will help your performance.",
    moduleId: "exam-strategies",
  },
};

export const diagnosticLevelContent: Record<
  DiagnosticResult["level"],
  { descriptor: string; summary: string }
> = {
  A2: {
    descriptor: "Elementary French",
    summary:
      "You're building a good foundation, but a few skills are limiting your progress.",
  },
  B1: {
    descriptor: "Intermediate French",
    summary:
      "You can handle familiar French, and focused practice will make your communication more reliable.",
  },
  B2: {
    descriptor: "Upper-intermediate French",
    summary:
      "You have a strong working level of French, with a few skills to sharpen for exam performance.",
  },
  C1: {
    descriptor: "Advanced French",
    summary:
      "You understand complex French well and can now focus on precision, speed, and exam technique.",
  },
};
