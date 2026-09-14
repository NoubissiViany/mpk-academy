import { describe, expect, it } from "vitest";
import { getExamQuestionPool } from "./exam-question-pools";

describe("exam-specific comprehension pools", () => {
  it("never mixes TEF and TCF question metadata", () => {
    for (const exam of ["TEF Canada", "TCF Canada"] as const) {
      const expected = exam === "TEF Canada" ? "TEF" : "TCF";
      for (const skill of ["reading", "listening"] as const) {
        const pool = getExamQuestionPool(exam, skill);
        expect(pool.length).toBeGreaterThan(0);
        expect(new Set(pool.map((question) => question.examType))).toEqual(
          new Set([expected]),
        );
        expect(
          pool.every((question) => question.diagnosticSkill === skill),
        ).toBe(true);
      }
    }
  });
});
