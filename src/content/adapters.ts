import type { MCQ } from "./shared/types";
import type { Question } from "../types/domain";
export function toQuestion(item: MCQ): Question {
  return {
    id: item.id,
    source: "mpk_mock",
    examType: item.exam === "shared" ? "general" : item.exam,
    type: "multiple_choice",
    prompt: item.prompt,
    options: item.options,
    correctAnswer: item.correction.answer,
    explanation: item.correction.explanation,
    explanationFr: item.correction.explanationFr ?? "",
    competencies: item.competencies,
    diagnosticSkill: item.skill,
    difficulty: item.level,
    metadata: {
      passage: item.passage,
      ...(item.audio ? { audioLabel: item.topic, audio: item.audio } : {}),
    },
  };
}
