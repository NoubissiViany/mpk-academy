import { afterEach, describe, expect, it, vi } from "vitest";
import { getAppUrl, productionAppUrl } from "@/lib/app-url";

describe("getAppUrl", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("uses localhost when configured for local development", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "http://localhost:3000/");
    expect(getAppUrl()).toBe("http://localhost:3000");
  });

  it("uses the canonical production URL when configured for deployment", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", productionAppUrl);
    expect(getAppUrl()).toBe("https://mpk-academy.vercel.app");
  });
});
