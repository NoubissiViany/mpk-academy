import { describe, expect, it } from "vitest";
import { diagnosticQuestions } from "@/data/questions";
import { canAccessExam, canAccessLesson } from "./access";
import { scoreDiagnostic } from "./diagnostic";

describe("diagnostic scoring", () => {
  it("contains 20 questions sampling four objective categories", () => {
    expect(diagnosticQuestions).toHaveLength(20);
    expect(
      new Set(diagnosticQuestions.map((question) => question.diagnosticSkill)),
    ).toEqual(new Set(["reading", "listening", "grammar", "vocabulary"]));
  });
  it("maps a perfect result to C1 with six complete skill scores", () => {
    const answers = Object.fromEntries(
      diagnosticQuestions.map((question) => [
        question.id,
        question.correctAnswer,
      ]),
    );
    const result = scoreDiagnostic(diagnosticQuestions, answers);
    expect(result.score).toBe(100);
    expect(result.level).toBe("C1");
    expect(Object.keys(result.skillScores)).toHaveLength(6);
    expect(Object.values(result.skillScores)).toEqual([
      100,
      100,
      100,
      null,
      null,
      null,
    ]);
  });
  it("calculates a skill-specific priority without changing overall thresholds", () => {
    const answers = Object.fromEntries(
      diagnosticQuestions
        .filter((question) => question.diagnosticSkill !== "vocabulary")
        .map((question) => [question.id, question.correctAnswer]),
    );
    const result = scoreDiagnostic(diagnosticQuestions, answers);
    expect(result.skillScores.vocabulary).toBe(0);
    expect(result.priority).toBe("vocabulary");
    expect(result.level).toBe("B2");
  });
  it("uses display order to resolve equal scores deterministically", () => {
    const result = scoreDiagnostic(diagnosticQuestions, {});
    expect(result.level).toBe("A2");
    expect(result.strength).toBe("grammar");
    expect(result.priority).toBe("grammar");
  });
});
describe("access policies", () => {
  const essential = {
    planId: "essential" as const,
    purchasedAt: null,
    accessUntil: null,
  };
  const complete = { ...essential, planId: "complete" as const };
  it("enforces plan-specific learning and exam access", () => {
    expect(
      canAccessLesson(essential, {
        isFree: false,
        moduleId: "grammar",
      }),
    ).toBe(true);
    expect(
      canAccessLesson(essential, {
        isFree: false,
        moduleId: "exam-strategies",
      }),
    ).toBe(false);
    expect(canAccessExam(essential)).toBe(false);
    expect(canAccessExam(complete)).toBe(true);
  });
});
