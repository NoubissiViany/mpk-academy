import { afterEach, describe, expect, it, vi } from "vitest";
import { signUnsubscribe, verifyUnsubscribe } from "./token";
import { providerFailure } from "./worker";
afterEach(() => vi.unstubAllEnvs());
describe("unsubscribe signatures", () => {
  it("authenticates user, version, and language and rejects tampering", () => {
    vi.stubEnv(
      "STUDY_REMINDER_UNSUBSCRIBE_SECRET",
      "a-long-test-secret-that-is-at-least-32-characters",
    );
    const claims = {
      userId: "00000000-0000-4000-8000-000000000001",
      version: "00000000-0000-4000-8000-000000000002",
      locale: "fr" as const,
    };
    const token = signUnsubscribe(claims);
    expect(verifyUnsubscribe(token)).toEqual(claims);
    expect(verifyUnsubscribe(token + ".extra")).toBeNull();
    expect(verifyUnsubscribe("changed." + token.split(".")[1])).toBeNull();
    expect(verifyUnsubscribe("x".repeat(1025))).toBeNull();
  });
  it("refuses unconfigured signing", () => {
    vi.stubEnv("STUDY_REMINDER_UNSUBSCRIBE_SECRET", "short");
    expect(() => verifyUnsubscribe("payload.signature")).toThrow();
  });
});
describe("provider quota handling", () => {
  const now = new Date("2026-11-26T23:00:00Z");
  it("waits for the correct UTC quota reset without any upgrade path", () => {
    expect(providerFailure("daily_quota_exceeded", 429, now)).toEqual({
      status: "retry",
      pauseUntil: "2026-11-27T00:00:00.000Z",
    });
    expect(providerFailure("monthly_quota_exceeded", 429, now).pauseUntil).toBe(
      "2026-12-01T00:00:00.000Z",
    );
    expect(
      providerFailure("rate_limit_exceeded", 429, now, "120").pauseUntil,
    ).toBe("2026-11-26T23:02:00.000Z");
  });
  it("retries ambiguous responses and stops invalid requests", () => {
    expect(providerFailure("unknown", 500, now).status).toBe("retry");
    expect(providerFailure("unknown", null, now).status).toBe("retry");
    expect(providerFailure("invalid", 422, now).status).toBe("failed");
    expect(
      providerFailure("invalid_api_key", 401, now).pauseUntil,
    ).toBeDefined();
  });
});
