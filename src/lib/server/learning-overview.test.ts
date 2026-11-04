import { beforeEach, describe, expect, it, vi } from "vitest";
import { demoState } from "@/test/fixtures";
const mocks = vi.hoisted(() => ({
  access: vi.fn(),
  auth: vi.fn(),
  configured: vi.fn(),
  from: vi.fn(),
}));
vi.mock("@/lib/supabase/learner", () => ({
  getLearnerAccess: mocks.access,
  requireUserId: mocks.auth,
}));
vi.mock("@/lib/server/ai/groq", () => ({
  isAiWritingConfigured: mocks.configured,
  isAiSpeakingConfigured: mocks.configured,
}));
vi.mock("@/lib/server/diagnostics", () => ({ logServerError: vi.fn() }));
import { getLearningOverview } from "./learning-overview";
let feedback: { id: string; status: string } | null;
let failure: boolean;
const queries: { table: string; columns?: string; filters: unknown[][] }[] = [];
beforeEach(() => {
  queries.length = 0;
  feedback = null;
  failure = false;
  mocks.access.mockResolvedValue({
    exam: "TCF Canada",
    planAccess: demoState.planAccess,
  });
  mocks.configured.mockReturnValue(true);
  mocks.auth.mockResolvedValue({ supabase: { from: mocks.from } });
  mocks.from.mockImplementation((table: string) => {
    const query: (typeof queries)[number] = { table, filters: [] };
    queries.push(query);
    const chain = {
      select: (columns: string) => {
        query.columns = columns;
        return chain;
      },
      eq: (...args: unknown[]) => {
        query.filters.push(args);
        return chain;
      },
      neq: (...args: unknown[]) => {
        query.filters.push(["neq", ...args]);
        return chain;
      },
      order: () => chain,
      limit: () => chain,
      maybeSingle: async () => ({
        data:
          table === "practice_sessions"
            ? { completed_at: "2026-11-04T12:00:00Z" }
            : feedback,
        error: failure ? new Error("offline") : null,
      }),
    };
    return chain;
  });
});
describe("productive skill summaries", () => {
  it.each(["queued", "processing", "done", "failed"])(
    "returns %s with direct links and no answer bodies",
    async (status) => {
      feedback = { id: "feedback-id", status };
      const result = await getLearningOverview();
      expect(result.writing).toMatchObject({
        available: true,
        status,
        href: "/writing/feedback-id",
        lastPracticeAt: "2026-11-04T12:00:00Z",
      });
      expect(result.speaking.href).toBe("/speaking/feedback-id");
      for (const query of queries) {
        expect(query.filters).toContainEqual(["exam", "TCF Canada"]);
        expect(query.columns).not.toMatch(/body|transcript/);
      }
      expect(
        queries.find((q) => q.table === "writing_submissions")?.filters,
      ).toContainEqual(["neq", "task_id", "mpk-diagnostic-writing-v1"]);
    },
  );
  it("distinguishes empty, unavailable and self-practice entitlement", async () => {
    expect((await getLearningOverview()).writing.status).toBe("empty");
    mocks.configured.mockReturnValue(false);
    expect((await getLearningOverview()).writing).toMatchObject({
      available: false,
      status: "unavailable",
    });
    mocks.access.mockResolvedValue({
      exam: "TEF Canada",
      planAccess: { ...demoState.planAccess, planId: "essential" },
    });
    expect((await getLearningOverview()).speaking).toMatchObject({
      available: false,
      status: "self",
    });
    failure = true;
    expect((await getLearningOverview()).speaking.status).toBe("unavailable");
  });
});
