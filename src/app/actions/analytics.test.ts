import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ rpc: vi.fn() }));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({ rpc: mocks.rpc }),
}));
vi.mock("@/i18n/server", () => ({ getLocale: async () => "fr" }));

import { recordFunnelStepAction } from "./analytics";

describe("recordFunnelStepAction", () => {
  beforeEach(() => {
    mocks.rpc.mockReset().mockResolvedValue({ error: null });
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-role-key");
  });
  afterEach(() => vi.unstubAllEnvs());

  it("adds one to today's total with the visitor's interface language", async () => {
    await recordFunnelStepAction("diagnostic_started");
    await vi.waitFor(() =>
      expect(mocks.rpc).toHaveBeenCalledWith("mpk_record_funnel_step", {
        p_step: "diagnostic_started",
        p_locale: "fr",
      }),
    );
  });

  it("ignores step names outside the whitelist", async () => {
    await recordFunnelStepAction("page_scroll");
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("never throws when the database write fails", async () => {
    mocks.rpc.mockRejectedValue(new Error("offline"));
    await expect(
      recordFunnelStepAction("landing_view"),
    ).resolves.toBeUndefined();
  });

  it("does nothing without the server key", async () => {
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
    await recordFunnelStepAction("landing_view");
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
});
