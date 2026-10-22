import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  access: vi.fn(),
  rpc: vi.fn(),
  consentVersion: { value: "2026-10-21" as string | null },
  feedbackRow: { value: null as unknown },
  after: vi.fn(),
  process: vi.fn(),
}));

vi.mock("next/server", () => ({ after: mocks.after }));
vi.mock("@/i18n/server", async () => {
  const { messagesFor } = await import("@/i18n/messages");
  return {
    getLocale: async () => "fr",
    getMessages: async () => messagesFor("en"),
  };
});
vi.mock("@/lib/server/writing/worker", () => ({
  processWritingQueue: mocks.process,
}));
vi.mock("@/lib/supabase/learner", () => ({
  getLearnerAccess: mocks.access,
  requireUserId: async () => ({
    userId: "user-1",
    supabase: {
      rpc: mocks.rpc,
      from: (table: string) => ({
        select: () => ({
          eq: () => ({
            single: async () =>
              table === "profiles"
                ? {
                    data: {
                      ai_feedback_consent_version: mocks.consentVersion.value,
                    },
                    error: null,
                  }
                : { data: { feedback: mocks.feedbackRow.value }, error: null },
          }),
        }),
      }),
    },
  }),
}));

import {
  getWritingStatusAction,
  requestWritingFeedbackAction,
} from "./writing";

const complete = {
  planAccess: { planId: "complete", purchasedAt: null, accessUntil: null },
  exam: "TEF Canada",
};
const text = Array.from({ length: 30 }, () => "mot").join(" ");
const request = {
  taskId: "tef-writing-section-a-001",
  text,
  clientKey: "6f1c5f3e-2d7a-4b1e-9c4a-1d2e3f4a5b6c",
  practice: {
    submissionId: "7a1c5f3e-2d7a-4b1e-9c4a-1d2e3f4a5b6c",
    durationSeconds: 900,
  },
};

describe("requesting AI writing feedback", () => {
  beforeEach(() => {
    vi.stubEnv("GROQ_API_KEY", "gsk_test");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service");
    mocks.access.mockResolvedValue(complete);
    mocks.consentVersion.value = "2026-10-21";
    mocks.rpc.mockImplementation(async (name: string) =>
      name === "mpk_submit_writing"
        ? { data: { id: "sub-1", status: "queued" }, error: null }
        : { data: { id: "practice-1" }, error: null },
    );
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    mocks.rpc.mockReset();
    mocks.after.mockReset();
  });

  it("is limited to plans that include it", async () => {
    mocks.access.mockResolvedValue({
      ...complete,
      planAccess: { ...complete.planAccess, planId: "essential" },
    });
    await expect(requestWritingFeedbackAction(request)).resolves.toMatchObject({
      ok: false,
      reason: "not_included",
    });
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("sends nothing when the provider is not configured", async () => {
    vi.stubEnv("GROQ_API_KEY", "");
    await expect(requestWritingFeedbackAction(request)).resolves.toMatchObject({
      ok: false,
      reason: "unavailable",
    });
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("requires agreement to the current AI notice", async () => {
    mocks.consentVersion.value = "2025-01-01";
    await expect(requestWritingFeedbackAction(request)).resolves.toMatchObject({
      ok: false,
      reason: "consent_required",
    });
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("records the practice session, queues the essay, and works the queue later", async () => {
    await expect(requestWritingFeedbackAction(request)).resolves.toEqual({
      ok: true,
      id: "sub-1",
    });
    expect(mocks.rpc).toHaveBeenCalledWith(
      "mpk_submit_practice",
      expect.objectContaining({ p_skill: "writing", p_duration_seconds: 900 }),
    );
    expect(mocks.rpc).toHaveBeenCalledWith(
      "mpk_submit_writing",
      expect.objectContaining({
        p_exam: "TEF Canada",
        p_locale: "fr",
        p_parent_id: null,
        p_checks: expect.objectContaining({
          words: 30,
          range: { min: 80, max: null },
          length: "under",
        }),
      }),
    );
    expect(mocks.after).toHaveBeenCalledTimes(1);
  });

  it("explains the daily limit", async () => {
    mocks.rpc.mockImplementation(async (name: string) =>
      name === "mpk_submit_writing"
        ? {
            data: null,
            error: {
              code: "54000",
              message: "Daily writing feedback limit reached",
            },
          }
        : { data: {}, error: null },
    );
    await expect(requestWritingFeedbackAction(request)).resolves.toMatchObject({
      ok: false,
      reason: "daily_limit",
      message: expect.stringContaining("today’s AI reviews"),
    });
    expect(mocks.after).not.toHaveBeenCalled();
  });
});

describe("checking a review", () => {
  const id = "6f1c5f3e-2d7a-4b1e-9c4a-1d2e3f4a5b6c";
  beforeEach(() => {
    vi.stubEnv("GROQ_API_KEY", "gsk_test");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service");
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    mocks.rpc.mockReset();
    mocks.after.mockReset();
  });

  it("returns stored feedback once done", async () => {
    mocks.rpc.mockResolvedValue({
      data: { status: "done", ahead: 0, capReached: false, notBefore: "" },
      error: null,
    });
    mocks.feedbackRow.value = {
      version: 1,
      criteria: [],
      fixes: [],
      rewrite: null,
      summary: "Bien.",
      dropped: 0,
    };
    await expect(getWritingStatusAction(id)).resolves.toMatchObject({
      ok: true,
      status: "done",
      feedback: { summary: "Bien." },
    });
    expect(mocks.after).not.toHaveBeenCalled();
  });

  it("moves the queue along while the learner waits", async () => {
    mocks.rpc.mockResolvedValue({
      data: {
        status: "queued",
        ahead: 2,
        capReached: false,
        notBefore: "2026-01-01T00:00:00Z",
      },
      error: null,
    });
    await expect(getWritingStatusAction(id)).resolves.toMatchObject({
      ok: true,
      status: "queued",
      ahead: 2,
      feedback: null,
    });
    expect(mocks.after).toHaveBeenCalledTimes(1);
  });

  it("does not call the provider past today's cap", async () => {
    mocks.rpc.mockResolvedValue({
      data: {
        status: "queued",
        ahead: 0,
        capReached: true,
        notBefore: "2026-01-01T00:00:00Z",
      },
      error: null,
    });
    await getWritingStatusAction(id);
    expect(mocks.after).not.toHaveBeenCalled();
  });

  it("rejects ids that are not uuids", async () => {
    await expect(getWritingStatusAction("../../etc")).resolves.toMatchObject({
      ok: false,
      reason: "not_found",
    });
  });
});
