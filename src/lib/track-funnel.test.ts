import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { funnelDay, prefersNoTracking } from "./funnel";
import { trackFunnelStep } from "./track-funnel";

const mocks = vi.hoisted(() => ({ record: vi.fn() }));
vi.mock("@/app/actions/analytics", () => ({
  recordFunnelStepAction: mocks.record,
}));

describe("funnel day and opt-out", () => {
  it("buckets days in Toronto time, matching the database", () => {
    // 03:30 UTC on Oct 20 is still the evening of Oct 19 in Toronto.
    expect(funnelDay(new Date("2026-10-20T03:30:00Z"))).toBe("2026-10-19");
    expect(funnelDay(new Date("2026-10-20T05:00:00Z"))).toBe("2026-10-20");
  });

  it("respects Do Not Track and Global Privacy Control", () => {
    expect(prefersNoTracking({ doNotTrack: "1" })).toBe(true);
    expect(
      prefersNoTracking({ doNotTrack: null, globalPrivacyControl: true }),
    ).toBe(true);
    expect(prefersNoTracking({ doNotTrack: "0" })).toBe(false);
  });
});

describe("trackFunnelStep", () => {
  beforeEach(() => {
    localStorage.clear();
    mocks.record.mockReset().mockResolvedValue(undefined);
  });
  afterEach(() => vi.unstubAllGlobals());

  it("counts a step once per browser per day", () => {
    const day = new Date("2026-10-19T15:00:00Z");
    trackFunnelStep("landing_view", day);
    trackFunnelStep("landing_view", day);
    expect(mocks.record).toHaveBeenCalledTimes(1);
    expect(mocks.record).toHaveBeenCalledWith("landing_view");

    trackFunnelStep("diagnostic_started", day);
    trackFunnelStep("landing_view", new Date("2026-10-20T15:00:00Z"));
    expect(mocks.record).toHaveBeenCalledTimes(3);
  });

  it("sends only the step name", () => {
    trackFunnelStep("register_view", new Date("2026-10-19T15:00:00Z"));
    expect(mocks.record.mock.calls[0]).toEqual(["register_view"]);
  });

  it("does not count visitors who opt out of tracking", () => {
    vi.stubGlobal("navigator", { ...navigator, globalPrivacyControl: true });
    trackFunnelStep("landing_view");
    expect(mocks.record).not.toHaveBeenCalled();
  });

  it("still counts when browser storage is blocked", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    trackFunnelStep("sample_answered");
    expect(mocks.record).toHaveBeenCalledWith("sample_answered");
    vi.restoreAllMocks();
  });
});
