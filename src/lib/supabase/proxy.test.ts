import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ getClaims: vi.fn() }));
vi.mock("@supabase/ssr", () => ({
  createServerClient: () => ({ auth: { getClaims: mocks.getClaims } }),
}));

import { requiresSignIn, updateSession } from "./proxy";

describe("session proxy", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_test");
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    mocks.getClaims.mockReset();
  });

  it("sends signed-out visitors from learner areas to sign-in", async () => {
    mocks.getClaims.mockResolvedValue({ data: null, error: null });
    const response = await updateSession(
      new NextRequest("http://localhost:3000/practice/session?skill=reading"),
    );
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/login?next=%2Fpractice%2Fsession%3Fskill%3Dreading",
    );
  });

  it("does not treat an auth outage as a sign-out", async () => {
    mocks.getClaims.mockResolvedValue({
      data: null,
      error: new Error("fetch failed"),
    });
    const response = await updateSession(
      new NextRequest("http://localhost:3000/dashboard"),
    );
    expect(response.headers.get("location")).toBeNull();
  });

  it("lets signed-in learners through", async () => {
    mocks.getClaims.mockResolvedValue({
      data: { claims: { sub: "user-1" } },
      error: null,
    });
    const response = await updateSession(
      new NextRequest("http://localhost:3000/dashboard"),
    );
    expect(response.headers.get("location")).toBeNull();
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  });

  it("leaves callbacks, checkout, beta, and admin to their pages", () => {
    for (const path of ["/auth/confirm", "/checkout", "/beta", "/admin"])
      expect(requiresSignIn(path)).toBe(false);
    expect(requiresSignIn("/learn/grammar/g-1")).toBe(true);
    expect(requiresSignIn("/learning-tips")).toBe(false);
  });
});
