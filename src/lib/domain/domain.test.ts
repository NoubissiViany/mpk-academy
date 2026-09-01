import { describe, expect, it } from "vitest";
import { mockCourse } from "@/data/course";
import { defaultProgress } from "@/data/mock-state";
import { diagnosticQuestions } from "@/data/questions";
import { canAccessCertificate, canAccessExam, canAccessLesson } from "./access";
import { isCertificateEligible } from "./certificate";
import { scoreDiagnostic } from "./diagnostic";
import { calculateReadiness, READINESS_ALGORITHM_VERSION } from "./readiness";
import { generateRecommendations } from "./recommendations";

describe("readiness v1", () => {
  it("returns no score until minimum evidence exists", () => { expect(calculateReadiness({ ...defaultProgress, simulationsCompleted: 0 }).overall).toBeNull(); });
  it("returns an explainable bounded score", () => { const result = calculateReadiness(defaultProgress); expect(result.algorithmVersion).toBe(READINESS_ALGORITHM_VERSION); expect(result.overall).toBeGreaterThan(0); expect(result.overall).toBeLessThanOrEqual(100); });
});
describe("diagnostic scoring", () => {
  it("maps a perfect result to C1", () => { const answers = Object.fromEntries(diagnosticQuestions.map((q) => [q.id, q.correctAnswer])); const result = scoreDiagnostic(diagnosticQuestions, answers); expect(result.score).toBe(100); expect(result.level).toBe("C1"); });
  it("maps an empty result to A2", () => { expect(scoreDiagnostic(diagnosticQuestions, {}).level).toBe("A2"); });
});
describe("access policies", () => {
  const paidLesson = { isFree: false };
  it("allows free preview and protects premium activities", () => { expect(canAccessLesson("free_student", { isFree: true })).toBe(true); expect(canAccessLesson("free_student", paidLesson)).toBe(false); expect(canAccessExam("free_student")).toBe(false); expect(canAccessExam("paid_student")).toBe(true); expect(canAccessCertificate("paid_student", true)).toBe(true); });
});
describe("recommendations and certificate", () => {
  it("prioritizes a missing diagnostic", () => { expect(generateRecommendations({ ...defaultProgress, diagnosticScore: null }, [])[0].type).toBe("diagnostic"); });
  it("requires all lessons and a passing quiz average", () => { expect(isCertificateEligible(mockCourse, defaultProgress)).toBe(false); const ids = mockCourse.modules.flatMap((m) => m.lessons).map((l) => l.id); expect(isCertificateEligible(mockCourse, { ...defaultProgress, completedLessonIds: ids, quizAverage: 70 })).toBe(true); });
});
