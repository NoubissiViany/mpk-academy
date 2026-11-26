import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";
const { processStudyReminders } = vi.hoisted(() => ({
  processStudyReminders: vi.fn(),
}));
vi.mock("@/lib/server/reminders/worker", () => ({ processStudyReminders }));
const secret = "controlled-job-test-secret-with-thirty-two-characters";
beforeEach(() => {
  vi.stubEnv("JOBS_SECRET", secret);
  vi.stubEnv("STUDY_REMINDERS_ENABLED", "true");
  processStudyReminders.mockResolvedValue({ sent: 1 });
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});
function request(body: unknown, authorized = true) {
  return new Request("https://mpkacademy.com/api/jobs/study-reminders", {
    method: "POST",
    body: JSON.stringify(body),
    headers: authorized ? { authorization: `Bearer ${secret}` } : {},
  });
}
describe("reminder job authorization", () => {
  it("never forwards unauthorized requests or invalid inputs", async () => {
    expect(
      (
        await POST(
          request({ controlledRecipient: "learner@example.test" }, false),
        )
      ).status,
    ).toBe(401);
    for (const body of [
      null,
      { controlledRecipient: true },
      { controlledRecipient: "invalid" },
      { force: true },
    ])
      expect((await POST(request(body))).status).toBe(400);
    expect(processStudyReminders).not.toHaveBeenCalled();
  });
  it("forwards the explicitly selected recipient but retains the deployment sending guard", async () => {
    vi.stubEnv("STUDY_REMINDERS_ENABLED", "false");
    expect(
      (
        await POST(
          request({
            dryRun: false,
            controlledRecipient: "learner@example.test",
          }),
        )
      ).status,
    ).toBe(200);
    expect(processStudyReminders).toHaveBeenCalledWith({
      dryRun: true,
      previewOutsideWindow: false,
      controlledRecipient: "learner@example.test",
    });
  });
});
