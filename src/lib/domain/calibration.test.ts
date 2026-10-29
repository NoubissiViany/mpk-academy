import { describe, expect, it } from "vitest";
import {
  evaluateWritingCalibration,
  type WritingCalibration,
} from "./calibration";

function cohort(): WritingCalibration {
  return {
    model: "synthetic-test",
    promptRevision: "test-only",
    samples: Array.from({ length: 40 }, (_, i) => ({
      sampleId: `synthetic-${i}`,
      exam: i < 20 ? "TEF" : "TCF",
      target: (["NCLC 5", "NCLC 7", "NCLC 9+"] as const)[i % 3],
      consentConfirmed: true,
      independentTeacherReview: true,
      teacher: { task: "B1", coherence: "B1", vocabulary: "B1", grammar: "B1" },
      ai: { task: "B1", coherence: "B1", vocabulary: "B1", grammar: "B1" },
    })),
  };
}

describe("writing calibration agreement", () => {
  it("accepts the exact 60% / 90% boundaries and reports direction of disagreement", () => {
    const data = cohort();
    data.samples.slice(24, 36).forEach((s) => {
      s.ai.task = "B2";
    });
    data.samples.slice(36).forEach((s) => {
      s.ai.task = "C1";
    });
    const result = evaluateWritingCalibration(data);
    expect(result.meetsTargets).toBe(true);
    expect(result.criteria[0]).toMatchObject({
      exact: 24,
      withinOne: 36,
      exactPercent: 60,
      withinOnePercent: 90,
      aiHigher: 16,
      aiLower: 0,
    });
  });
  it("fails when one criterion misses agreement even if the others are perfect", () => {
    const data = cohort();
    data.samples.slice(35).forEach((s) => {
      s.ai.grammar = "C1";
    });
    const result = evaluateWritingCalibration(data);
    expect(result.meetsTargets).toBe(false);
    expect(result.criteria[3].withinOnePercent).toBe(87.5);
  });
  it("requires enough essays even when all available ratings agree", () => {
    const data = cohort();
    data.samples.pop();
    expect(evaluateWritingCalibration(data).meetsTargets).toBe(false);
  });
  it("excludes unconsented, incomplete and non-independent entries", () => {
    const data = cohort();
    data.samples[0].consentConfirmed = false;
    data.samples[1].independentTeacherReview = false;
    data.samples[2].teacher.grammar = null;
    expect(evaluateWritingCalibration(data)).toMatchObject({
      completeSamples: 37,
      meetsTargets: false,
    });
  });
  it("requires both exams and all three learner targets", () => {
    const data = cohort();
    data.samples.forEach((s) => {
      s.exam = "TEF";
      s.target = "NCLC 7";
    });
    const result = evaluateWritingCalibration(data);
    expect(result.issues).toContain("Missing TCF samples.");
    expect(result.issues).toContain("Missing NCLC 5 samples.");
    expect(result.meetsTargets).toBe(false);
  });
  it("rejects duplicate IDs and unsupported levels", () => {
    const data = cohort();
    data.samples[1].sampleId = data.samples[0].sampleId;
    expect(() => evaluateWritingCalibration(data)).toThrow(/unique/);
    expect(() =>
      evaluateWritingCalibration({
        ...cohort(),
        samples: [{ ...cohort().samples[0], teacher: { task: "C2" } }],
      }),
    ).toThrow();
  });
  it("keeps an empty or blank template incomplete, without NaN statistics", () => {
    const data = cohort();
    data.samples.forEach((s) => {
      s.teacher.task = null;
    });
    const result = evaluateWritingCalibration(data);
    expect(result).toMatchObject({ completeSamples: 0, meetsTargets: false });
    expect(result.criteria[0].exactPercent).toBeNull();
  });
});
