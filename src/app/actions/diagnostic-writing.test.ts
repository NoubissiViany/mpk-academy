import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  rpc: vi.fn(),
  requireUser: vi.fn(),
  submission: vi.fn(),
  after: vi.fn(),
}));
vi.mock("next/server", () => ({ after: mocks.after }));
vi.mock("@/lib/server/diagnostics", async (original) => ({
  ...(await original<typeof import("@/lib/server/diagnostics")>()),
  logServerError: vi.fn(() => "test-reference"),
}));
vi.mock("@/lib/supabase/learner", () => ({ requireUserId: mocks.requireUser }));
vi.mock("@/lib/supabase/writing", () => ({
  getWritingSubmission: mocks.submission,
}));
vi.mock("@/lib/server/writing/worker", () => ({
  processWritingQueue: vi.fn(),
}));
vi.mock("@/i18n/server", async () => {
  const { messagesFor } = await import("@/i18n/messages");
  return {
    getLocale: async () => "fr",
    getMessages: async () => messagesFor("en"),
  };
});
import { requestDiagnosticWritingFeedbackAction } from "./diagnostic-writing";
const assessmentId = "30000000-0000-4000-8000-000000000003";
const submissionId = "40000000-0000-4000-8000-000000000004";
describe("diagnostic writing feedback requests", () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mock) => mock.mockReset());
    vi.stubEnv("GROQ_API_KEY", "test-only");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test-only");
    mocks.requireUser.mockResolvedValue({
      supabase: { rpc: mocks.rpc },
      userId: "user",
    });
    mocks.rpc.mockResolvedValue({
      data: { id: submissionId, status: "queued" },
      error: null,
    });
    mocks.submission.mockResolvedValue({ id: submissionId, status: "queued" });
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });
  it("queues only a saved assessment ID, not client-supplied writing or feedback", async () => {
    expect(
      await requestDiagnosticWritingFeedbackAction(assessmentId),
    ).toMatchObject({ ok: true, submission: { id: submissionId } });
    expect(mocks.rpc).toHaveBeenCalledWith("mpk_submit_diagnostic_writing", {
      p_assessment_id: assessmentId,
      p_locale: "fr",
      p_retry: false,
    });
    expect(mocks.after).toHaveBeenCalledOnce();
  });
  it("sends no request without configuration or a verified session", async () => {
    vi.stubEnv("GROQ_API_KEY", "");
    expect(
      await requestDiagnosticWritingFeedbackAction(assessmentId),
    ).toMatchObject({ ok: false });
    expect(mocks.rpc).not.toHaveBeenCalled();
    vi.stubEnv("GROQ_API_KEY", "test-only");
    mocks.requireUser.mockRejectedValue(new Error("Unauthorized"));
    expect(
      await requestDiagnosticWritingFeedbackAction(assessmentId),
    ).toMatchObject({ ok: false });
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it.each(["42501", "54000", "P0002"])(
    "preserves database consent, quota and ownership failures (%s)",
    async (code) => {
      mocks.rpc.mockResolvedValue({
        data: null,
        error: { code, message: "Rejected" },
      });
      expect(
        await requestDiagnosticWritingFeedbackAction(assessmentId),
      ).toMatchObject({ ok: false, message: expect.any(String) });
      expect(mocks.after).not.toHaveBeenCalled();
    },
  );
  it("requests a retry of the same saved sample", async () => {
    await requestDiagnosticWritingFeedbackAction(assessmentId, true);
    expect(mocks.rpc).toHaveBeenCalledWith(
      "mpk_submit_diagnostic_writing",
      expect.objectContaining({ p_retry: true }),
    );
  });
});
