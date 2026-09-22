import { beforeEach, describe, expect, it, vi } from "vitest";
import { createCheckoutSessionAction } from "./checkout";

const mocks = vi.hoisted(() => ({
  requireUser: vi.fn(),
  createStripeSession: vi.fn(),
}));

vi.mock("@/lib/supabase/learner", () => ({
  requireUserId: mocks.requireUser,
}));
vi.mock("@/lib/stripe/server", () => ({
  createStripeCheckoutSession: mocks.createStripeSession,
}));

function supabaseState(input?: {
  activeEntitlement?: boolean;
  assessment?: boolean;
}) {
  const entitlementSecondEq = vi.fn().mockResolvedValue({
    data: input?.activeEntitlement
      ? [{ id: "entitlement-id", ends_at: "2099-01-01T00:00:00.000Z" }]
      : [],
  });
  const entitlementFirstEq = vi.fn(() => ({ eq: entitlementSecondEq }));
  const assessmentMaybeSingle = vi.fn().mockResolvedValue({
    data: input?.assessment === false ? null : { id: "assessment-id" },
  });
  const assessmentQuery = {
    eq: vi.fn(() => assessmentQuery),
    limit: vi.fn(() => assessmentQuery),
    maybeSingle: assessmentMaybeSingle,
  };
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { email: "learner@example.com" } },
        error: null,
      }),
    },
    from: vi.fn((table: string) => ({
      select:
        table === "entitlements"
          ? vi.fn(() => ({ eq: entitlementFirstEq }))
          : vi.fn(() => assessmentQuery),
    })),
  };
}

describe("createCheckoutSessionAction", () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mock) => mock.mockReset());
    mocks.createStripeSession.mockResolvedValue({
      url: "https://checkout.stripe.com/c/pay/test",
    });
  });

  it("rejects an unrecognized plan before accessing account data", async () => {
    expect(await createCheckoutSessionAction("free")).toMatchObject({
      ok: false,
      reason: "invalid_plan",
    });
    expect(mocks.requireUser).not.toHaveBeenCalled();
  });

  it("requires a completed assessment", async () => {
    mocks.requireUser.mockResolvedValue({
      userId: "learner-id",
      supabase: supabaseState({ assessment: false }),
    });
    expect(await createCheckoutSessionAction("complete")).toMatchObject({
      ok: false,
      reason: "assessment_required",
    });
    expect(mocks.createStripeSession).not.toHaveBeenCalled();
  });

  it("blocks a learner with active paid access", async () => {
    mocks.requireUser.mockResolvedValue({
      userId: "learner-id",
      supabase: supabaseState({ activeEntitlement: true }),
    });
    expect(await createCheckoutSessionAction("complete")).toMatchObject({
      ok: false,
      reason: "active_entitlement",
    });
    expect(mocks.createStripeSession).not.toHaveBeenCalled();
  });

  it("creates checkout from trusted account and plan data", async () => {
    mocks.requireUser.mockResolvedValue({
      userId: "learner-id",
      supabase: supabaseState(),
    });
    expect(await createCheckoutSessionAction("complete")).toEqual({
      ok: true,
      url: "https://checkout.stripe.com/c/pay/test",
    });
    expect(mocks.createStripeSession).toHaveBeenCalledWith({
      userId: "learner-id",
      email: "learner@example.com",
      planId: "complete",
    });
  });
});
