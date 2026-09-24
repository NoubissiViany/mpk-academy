import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getSnapshot: vi.fn(),
  requireUser: vi.fn(),
  rpc: vi.fn(),
}));

vi.mock("@/lib/supabase/learner", () => ({
  getLearnerSnapshot: mocks.getSnapshot,
  requireUserId: mocks.requireUser,
}));

import { getLearnerSnapshotAction, submitDiagnosticAction } from "./learner";

const submission = {
  submissionId: "30000000-0000-4000-8000-000000000003",
  intake: {
    goal: "TEF Canada",
    target: "NCLC 7",
    frenchExperience: "I know some French",
  },
  answers: { d1: "a" },
} as const;

const authoritativeResult = {
  id: "40000000-0000-4000-8000-000000000004",
  score: 80,
  level: "B2",
  competencyScores: { "grammar-tense": 75 },
  skillScores: {
    grammar: 75,
    vocabulary: 100,
    reading: 75,
    listening: 50,
    "sentence-structure": 100,
    "exam-strategy": 50,
  },
  strength: "vocabulary",
  priority: "listening",
  recommendedModuleId: "listening-strategies",
} as const;

describe("learner action failures", () => {
  beforeEach(() => {
    mocks.getSnapshot.mockReset();
    mocks.requireUser.mockReset();
    mocks.rpc.mockReset();
    mocks.requireUser.mockResolvedValue({
      userId: "user-1",
      supabase: { rpc: mocks.rpc },
    });
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => vi.restoreAllMocks());

  it("normalizes a structured Supabase authentication error", async () => {
    mocks.rpc.mockResolvedValue({
      data: null,
      error: { code: "42501", message: "Authentication required" },
    });

    await expect(submitDiagnosticAction(submission)).resolves.toMatchObject({
      ok: false,
      reason: "unauthenticated",
      message: "Your session has expired. Sign in again to save your progress.",
      reference: expect.any(String),
    });
    expect(console.error).toHaveBeenCalledWith(
      "Diagnostic submission failed",
      expect.objectContaining({
        operation: "persist_assessment",
        reason: "unauthenticated",
        code: "42501",
      }),
    );
  });

  it("logs an invalid RPC result separately from persistence failures", async () => {
    mocks.rpc.mockResolvedValue({
      data: { id: "assessment-1", score: 80, level: "B2" },
      error: null,
    });

    await expect(submitDiagnosticAction(submission)).resolves.toMatchObject({
      ok: false,
      reason: "unavailable",
      reference: expect.any(String),
    });
    expect(console.error).toHaveBeenCalledWith(
      "Diagnostic submission failed",
      expect.objectContaining({ operation: "load_assessment_result" }),
    );
  });

  it("returns the complete authoritative result without loading a snapshot", async () => {
    mocks.rpc.mockResolvedValue({
      data: authoritativeResult,
      error: null,
    });

    await expect(submitDiagnosticAction(submission)).resolves.toEqual({
      ok: true,
      data: {
        id: authoritativeResult.id,
        result: {
          score: 80,
          level: "B2",
          competencyScores: { "grammar-tense": 75 },
          skillScores: authoritativeResult.skillScores,
          strength: "vocabulary",
          priority: "listening",
          recommendedModuleId: "listening-strategies",
        },
      },
    });
    expect(mocks.getSnapshot).not.toHaveBeenCalled();
    expect(mocks.rpc).toHaveBeenCalledWith(
      "mpk_submit_assessment",
      expect.objectContaining({ p_guest_session_id: submission.submissionId }),
    );
  });

  it("returns a referenced learner-profile failure instead of null", async () => {
    mocks.getSnapshot.mockRejectedValue(
      Object.assign(new Error("Learner profile is unavailable."), {
        code: "PGRST116",
      }),
    );

    await expect(getLearnerSnapshotAction()).resolves.toMatchObject({
      ok: false,
      reason: "profile_unavailable",
      message: expect.stringContaining("learning profile"),
      reference: expect.any(String),
    });
  });
});
