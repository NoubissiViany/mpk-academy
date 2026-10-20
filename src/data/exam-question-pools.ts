import { findPractice } from "@/content/catalog";
import { toQuestion } from "@/content/adapters";
import type { ExamId } from "@/types/domain";
export function getExamQuestionPool(
  exam: ExamId,
  skill: "reading" | "listening",
  competency?: string | null,
) {
  return findPractice(
    exam === "TEF Canada" ? "TEF" : "TCF",
    skill,
    competency,
  ).flatMap((i) => (i.kind === "mcq" ? [toQuestion(i)] : []));
}
