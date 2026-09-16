import { describe, expect, it } from "vitest";
import type { ProductivePracticeTask, Question } from "@/types/domain";
import { scoreMockComprehension } from "./scaled-mock-session";

const question: Question = {
  id: "reading-one",
  source: "mpk_mock",
  examType: "TEF",
  type: "multiple_choice",
  prompt: "Question",
  explanation: "Explanation",
  explanationFr: "Explication",
  competencies: ["reading-detail"],
  diagnosticSkill: "reading",
  difficulty: "B1",
  options: [
    { id: "a", label: "A" },
    { id: "b", label: "B" },
  ],
  correctAnswer: "a",
};

const writingTask: ProductivePracticeTask = {
  id: "writing-one",
  exam: "TEF Canada",
  skill: "writing",
  title: "Writing",
  prompt: "Write a response.",
  guidance: "Write in French.",
  durationMinutes: 10,
  minimumWords: 80,
  rubric: [],
};

describe("shortened mock comprehension scoring", () => {
  it("ignores productive-task completion and scores objective questions only", () => {
    const items = [
      { key: "reading", section: "reading" as const, question },
      { key: "writing", section: "writing" as const, task: writingTask },
    ];
    expect(
      scoreMockComprehension(items, { reading: "a", writing: "completed" }),
    ).toBe(100);
    expect(
      scoreMockComprehension(items, { reading: "b", writing: "completed" }),
    ).toBe(0);
  });
});
