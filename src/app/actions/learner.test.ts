import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { demoState } from "@/test/fixtures";

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
  intake: {
    goal: "TEF Canada",
    target: "NCLC 7",
    frenchExperience: "I know some French",
  },
  answers: { d1: "a" },
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

    await expect(submitDiagnosticAction(submission)).resolves.toEqual({
      ok: false,
      reason: "unauthenticated",
      message: "Your session has expired. Sign in again to save your progress.",
    });
    expect(console.error).toHaveBeenCalledWith("Learner mutation failed", {
      operation: "submit_diagnostic",
      reason: "unauthenticated",
      code: "42501",
      source: "structured_server_error",
    });
  });

  it("normalizes snapshot failures inside the action boundary", async () => {
    mocks.rpc.mockResolvedValue({
      data: { id: "assessment-1", score: 80, level: "B2" },
      error: null,
    });
    mocks.getSnapshot.mockRejectedValue({
      code: "PGRST301",
      message: "JWT expired",
    });

    await expect(submitDiagnosticAction(submission)).resolves.toMatchObject({
      ok: false,
      reason: "unauthenticated",
    });
  });

  it("returns the saved assessment and refreshed snapshot", async () => {
    mocks.rpc.mockResolvedValue({
      data: { id: "assessment-1", score: 80, level: "B2" },
      error: null,
    });
    mocks.getSnapshot.mockResolvedValue(demoState);

    await expect(submitDiagnosticAction(submission)).resolves.toEqual({
      ok: true,
      data: { id: "assessment-1", score: 80, level: "B2" },
      snapshot: demoState,
    });
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
