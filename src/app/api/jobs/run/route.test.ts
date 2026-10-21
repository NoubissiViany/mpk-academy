import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ process: vi.fn() }));
vi.mock("@/lib/server/writing/worker", () => ({
  processWritingQueue: mocks.process,
}));

import { POST } from "./route";

const secret = "s".repeat(40);
const call = (authorization?: string) =>
  POST(
    new Request("http://localhost/api/jobs/run", {
      method: "POST",
      headers: authorization ? { authorization } : {},
    }),
  );

describe("job route", () => {
  beforeEach(() => {
    vi.stubEnv("JOBS_SECRET", secret);
    vi.stubEnv("GROQ_API_KEY", "gsk_test");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service");
    mocks.process.mockReset().mockResolvedValue({ processed: 2 });
  });
  afterEach(() => vi.unstubAllEnvs());

  it("refuses callers without the shared secret", async () => {
    expect((await call()).status).toBe(401);
    expect((await call("Bearer wrong")).status).toBe(401);
    expect(mocks.process).not.toHaveBeenCalled();
  });

  it("refuses everyone when the secret is missing or short", async () => {
    vi.stubEnv("JOBS_SECRET", "short");
    expect((await call("Bearer short")).status).toBe(401);
  });

  it("works the queue for the scheduler", async () => {
    const response = await call(`Bearer ${secret}`);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ processed: 2 });
    expect(mocks.process).toHaveBeenCalledWith({
      maxJobs: 3,
      deadlineMs: 45_000,
    });
  });

  it("does nothing until AI feedback is configured", async () => {
    vi.stubEnv("GROQ_API_KEY", "");
    expect((await call(`Bearer ${secret}`)).status).toBe(404);
  });
});
