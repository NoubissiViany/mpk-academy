import { beforeEach, describe, expect, it } from "vitest";
import { productConfig } from "@/config/product";
import { defaultState } from "@/data/mock-state";
import { diagnosticQuestions } from "@/data/questions";
import { loadState, saveState } from "./persistence";
describe("versioned persistence", () => {
  beforeEach(() => localStorage.clear());
  it("falls back when stored data is invalid or obsolete", () => {
    localStorage.setItem(
      productConfig.storageKey,
      JSON.stringify({ schemaVersion: 0 }),
    );
    expect(loadState().schemaVersion).toBe(2);
  });
  it("migrates version 1 without discarding learner data", () => {
    const versionOne = { ...defaultState, schemaVersion: 1 };
    delete (versionOne as Partial<typeof versionOne>).diagnosticIntake;
    localStorage.setItem(productConfig.storageKey, JSON.stringify(versionOne));
    const result = loadState();
    expect(result.schemaVersion).toBe(2);
    expect(result.user?.firstName).toBe("Alex");
    expect(result.progress.courseCompletion).toBe(
      defaultState.progress.courseCompletion,
    );
    expect(result.diagnosticIntake).toBeNull();
  });
  it("rebuilds a legacy result with the six-skill profile", () => {
    const versionOne = { ...defaultState, schemaVersion: 1 };
    delete (versionOne as Partial<typeof versionOne>).diagnosticIntake;
    const diagnosticAnswers = Object.fromEntries(
      diagnosticQuestions.map((question) => [
        question.id,
        question.correctAnswer,
      ]),
    );
    localStorage.setItem(
      productConfig.storageKey,
      JSON.stringify({
        ...versionOne,
        diagnosticAnswers,
        diagnosticResult: {
          score: 100,
          level: "C1",
          competencyScores: {},
          strengths: [],
          weaknesses: [],
          recommendedModuleId: "exam-strategies",
        },
      }),
    );
    const result = loadState();
    expect(result.diagnosticResult?.level).toBe("C1");
    expect(Object.values(result.diagnosticResult?.skillScores ?? {})).toEqual([
      100, 100, 100, 100, 100, 100,
    ]);
  });
  it("round-trips valid state", () => {
    saveState(defaultState);
    expect(loadState().user?.firstName).toBe("Alex");
  });
});
