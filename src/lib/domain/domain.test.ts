import { describe, expect, it } from "vitest";
import { mockCourse } from "@/data/course";
import { defaultProgress } from "@/test/fixtures";
import { diagnosticQuestions } from "@/data/questions";
import { diagnosticSkillOrder } from "@/config/diagnostic";
import { canAccessCertificate, canAccessExam, canAccessLesson } from "./access";
import { isCertificateEligible } from "./certificate";
import { scoreDiagnostic } from "./diagnostic";
import { calculateReadiness, READINESS_ALGORITHM_VERSION } from "./readiness";
import { generateRecommendations } from "./recommendations";

describe("diagnostic readiness", () => {
  it("returns no score until a diagnostic exists", () => {
    expect(
      calculateReadiness({ ...defaultProgress, diagnosticScore: null }).overall,
    ).toBeNull();
  });
  it("uses the diagnostic result without mock activity weighting", () => {
    const result = calculateReadiness(defaultProgress);
    expect(result.algorithmVersion).toBe(READINESS_ALGORITHM_VERSION);
    expect(result.overall).toBe(defaultProgress.diagnosticScore);
  });
});
describe("diagnostic scoring", () => {
  it("contains 15 questions covering every reportable skill", () => {
    expect(diagnosticQuestions).toHaveLength(15);
    expect(
      new Set(diagnosticQuestions.map((question) => question.diagnosticSkill)),
    ).toEqual(new Set(diagnosticSkillOrder));
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
      100, 100, 100, 100, 100, 100,
    ]);
  });
  it("calculates a skill-specific priority without changing overall thresholds", () => {
    const answers = Object.fromEntries(
      diagnosticQuestions
        .filter(
          (question) =>
            question.diagnosticSkill !== "listening" && question.id !== "d15",
        )
        .map((question) => [question.id, question.correctAnswer]),
    );
    const result = scoreDiagnostic(diagnosticQuestions, answers);
    expect(result.skillScores.listening).toBe(0);
    expect(result.priority).toBe("listening");
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
  const paidLesson = { isFree: false };
  it("allows free preview and protects premium activities", () => {
    expect(canAccessLesson("free_student", { isFree: true })).toBe(true);
    expect(canAccessLesson("free_student", paidLesson)).toBe(false);
    expect(canAccessExam("free_student")).toBe(false);
    expect(canAccessExam("paid_student")).toBe(true);
    expect(canAccessCertificate("paid_student", true)).toBe(true);
  });
});
describe("recommendations and certificate", () => {
  it("prioritizes a missing diagnostic", () => {
    expect(
      generateRecommendations(
        { ...defaultProgress, diagnosticScore: null },
        [],
      )[0].type,
    ).toBe("diagnostic");
  });
  it("requires all lessons and a passing quiz average", () => {
    expect(isCertificateEligible(mockCourse, defaultProgress)).toBe(false);
    const ids = mockCourse.modules.flatMap((m) => m.lessons).map((l) => l.id);
    expect(
      isCertificateEligible(mockCourse, {
        ...defaultProgress,
        completedLessonIds: ids,
        quizAverage: 70,
      }),
    ).toBe(true);
  });
});
