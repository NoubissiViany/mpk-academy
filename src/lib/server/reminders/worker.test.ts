import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ReminderContext } from "@/lib/reminders/types";
import { processStudyReminders } from "./worker";
const { rpc, send } = vi.hoisted(() => ({ rpc: vi.fn(), send: vi.fn() }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => ({ rpc }) }));
vi.mock("resend", () => ({
  Resend: class {
    emails = { send };
  },
}));
const now = new Date("2026-11-26T23:00:00Z");
const context: ReminderContext = {
  userId: "00000000-0000-4000-8000-000000000001",
  email: "learner@example.test",
  firstName: "Camille",
  locale: "en",
  createdAt: "2026-10-01T00:00:00Z",
  lastActiveAt: "2026-11-20T00:00:00Z",
  lastLearningAt: null,
  enabled: true,
  verified: true,
  suppressed: false,
  timeZone: "America/Toronto",
  version: "00000000-0000-4000-8000-000000000002",
  unsubscribeVersion: "00000000-0000-4000-8000-000000000003",
  goalRevision: null,
  targetDate: null,
  target: "NCLC 7",
  readiness: null,
  weekStartedAt: "2026-11-23",
  sessions: 0,
  hasAccess: true,
  hasDiagnostic: true,
  pastExamNotified: null,
  attempts: [],
  pending: null,
};
const frozen = {
  from: "MPK <no-reply@mpkacademy.com>",
  to: [context.email],
  subject: "Original subject",
  html: "Original HTML",
  text: "Original text",
  headers: {},
  tags: [],
};
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(now);
  vi.stubEnv("STUDY_REMINDERS_ENABLED", "true");
  vi.stubEnv("RESEND_REMINDER_API_KEY", "test-only");
  vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://mpkacademy.com");
  vi.stubEnv(
    "STUDY_REMINDER_UNSUBSCRIBE_SECRET",
    "long-test-secret-with-at-least-thirty-two-characters",
  );
  vi.stubEnv("STUDY_REMINDER_ALLOWED_EMAILS", "");
  send.mockResolvedValue({ data: { id: "provider-id" }, error: null });
  rpc.mockImplementation(async (name: string) => ({
    error: null,
    data:
      name === "mpk_reminder_candidates"
        ? [structuredClone(context)]
        : name === "mpk_claim_reminder"
          ? { id: "delivery-id", lease: "lease", payload: frozen }
          : name === "mpk_reminder_send_context"
            ? structuredClone(context)
            : null,
  }));
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});
async function run() {
  const promise = processStudyReminders({ dryRun: false });
  await vi.runAllTimersAsync();
  return promise;
}
describe("reminder worker", () => {
  it("never sends when disabled or previewing", async () => {
    vi.stubEnv("STUDY_REMINDERS_ENABLED", "false");
    expect(await run()).toMatchObject({ disabled: true });
    const preview = await processStudyReminders({ dryRun: true });
    expect(preview).toMatchObject({
      dryRun: true,
      sent: 0,
      previews: [
        expect.objectContaining({ email: context.email, kind: "inactive" }),
      ],
    });
    expect(send).not.toHaveBeenCalled();
    expect(rpc.mock.calls.some(([name]) => name === "mpk_claim_reminder")).toBe(
      false,
    );
  });
  it("uses the claimed frozen payload and stable key, not a newly rendered retry", async () => {
    expect(await run()).toMatchObject({ sent: 1 });
    expect(send).toHaveBeenCalledWith(
      frozen,
      expect.objectContaining({ idempotencyKey: "study-reminder/delivery-id" }),
    );
  });
  it("does not send after another worker wins or preferences change", async () => {
    rpc.mockImplementation(async (name: string) => ({
      error: null,
      data: name === "mpk_reminder_candidates" ? [context] : null,
    }));
    await run();
    expect(send).not.toHaveBeenCalled();
    rpc.mockImplementation(async (name: string) => ({
      error: null,
      data:
        name === "mpk_reminder_candidates"
          ? [context]
          : name === "mpk_claim_reminder"
            ? { id: "delivery-id", lease: "lease", payload: frozen }
            : name === "mpk_reminder_send_context"
              ? { ...context, enabled: false }
              : null,
    }));
    await run();
    expect(send).not.toHaveBeenCalled();
    expect(rpc).toHaveBeenCalledWith(
      "mpk_finish_reminder",
      expect.objectContaining({ p_error: "eligibility_changed" }),
    );
  });
  it("retains uncertain sends for idempotent retry", async () => {
    send.mockRejectedValueOnce(new Error("timeout"));
    await run();
    expect(rpc).toHaveBeenCalledWith(
      "mpk_finish_reminder",
      expect.objectContaining({
        p_status: "retry",
        p_error: "transport_unknown",
      }),
    );
  });
  it("pauses on quota exhaustion and only sends to the controlled allowlist", async () => {
    send.mockResolvedValueOnce({
      error: { name: "monthly_quota_exceeded", statusCode: 429 },
      data: null,
    });
    await run();
    expect(rpc).toHaveBeenCalledWith(
      "mpk_finish_reminder",
      expect.objectContaining({ p_pause_until: "2026-12-01T00:00:00.000Z" }),
    );
    send.mockClear();
    vi.stubEnv("STUDY_REMINDER_ALLOWED_EMAILS", "controlled@example.test");
    await run();
    expect(send).not.toHaveBeenCalled();
  });
  it("requires an explicit allowlist before sending a controlled test", async () => {
    await expect(
      processStudyReminders({
        dryRun: false,
        controlledRecipient: context.email,
      }),
    ).rejects.toThrow("explicitly allowlisted recipient");
    expect(send).not.toHaveBeenCalled();
  });
  it("sends only the selected controlled recipient outside the delivery window", async () => {
    vi.setSystemTime(new Date("2026-11-26T21:00:00Z"));
    vi.stubEnv(
      "STUDY_REMINDER_ALLOWED_EMAILS",
      context.email + ",other@example.test",
    );
    rpc.mockImplementation(async (name: string) => ({
      error: null,
      data:
        name === "mpk_reminder_candidates"
          ? [context, { ...context, email: "other@example.test" }]
          : name === "mpk_claim_reminder"
            ? { id: "delivery-id", lease: "lease", payload: frozen }
            : name === "mpk_reminder_send_context"
              ? context
              : null,
    }));
    const promise = processStudyReminders({
      dryRun: false,
      controlledRecipient: context.email,
    });
    await vi.runAllTimersAsync();
    expect(await promise).toMatchObject({ sent: 1 });
    expect(send).toHaveBeenCalledTimes(1);
    expect(rpc).toHaveBeenCalledWith(
      "mpk_claim_reminder",
      expect.objectContaining({
        p_controlled_recipient: context.email,
      }),
    );
    send.mockClear();
    await run();
    expect(send).not.toHaveBeenCalled();
  });
  it("keeps consent and frequency checks for controlled tests", async () => {
    vi.setSystemTime(new Date("2026-11-26T21:00:00Z"));
    vi.stubEnv("STUDY_REMINDER_ALLOWED_EMAILS", context.email);
    for (const change of [
      { enabled: false },
      { verified: false },
      { suppressed: true },
      { lastActiveAt: "2026-11-26T20:59:00Z" },
      { attempts: [{ at: "2026-11-26T20:00:00Z", localDate: "2026-11-26" }] },
    ]) {
      rpc.mockImplementation(async (name: string) => ({
        error: null,
        data:
          name === "mpk_reminder_candidates"
            ? [{ ...context, ...change }]
            : null,
      }));
      await processStudyReminders({
        dryRun: false,
        controlledRecipient: context.email,
      });
    }
    expect(send).not.toHaveBeenCalled();
    expect(rpc.mock.calls.some(([name]) => name === "mpk_claim_reminder")).toBe(
      false,
    );
  });
});
