import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fulfillStripeCheckout } from "@/lib/payments";
import type { StripeCheckoutSession } from "@/lib/stripe/server";

const mocks = vi.hoisted(() => ({ rpc: vi.fn() }));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({ rpc: mocks.rpc }),
}));

const session: StripeCheckoutSession = {
  id: "cs_test_complete",
  created: 1_790_078_400,
  url: null,
  client_reference_id: "learner-id",
  customer_details: { email: "learner@example.com" },
  metadata: { user_id: "learner-id", plan_id: "complete" },
  payment_status: "paid",
  payment_intent: {
    id: "pi_test_complete",
    latest_charge: {
      id: "ch_test_complete",
      amount: 28_137,
      amount_refunded: 0,
      refunded: false,
      payment_intent: "pi_test_complete",
    },
  },
  amount_subtotal: 24_900,
  amount_total: 28_137,
  currency: "cad",
  total_details: { amount_tax: 3_237 },
  line_items: {
    data: [{ quantity: 1, price: { id: "price_complete" } }],
  },
};

describe("Stripe fulfillment validation", () => {
  beforeEach(() => {
    vi.stubEnv("STRIPE_PRICE_COMPLETE", "price_complete");
    mocks.rpc.mockReset().mockResolvedValue({ error: null });
  });
  afterEach(() => vi.unstubAllEnvs());

  it("passes a verified purchase to the restricted database function", async () => {
    await fulfillStripeCheckout(session, "learner-id");
    expect(mocks.rpc).toHaveBeenCalledWith(
      "mpk_fulfill_stripe_purchase",
      expect.objectContaining({
        p_user_id: "learner-id",
        p_plan_id: "complete",
        p_subtotal_minor: 24_900,
        p_tax_minor: 3_237,
        p_total_minor: 28_137,
      }),
    );
  });

  it("rejects another learner's success URL", async () => {
    await expect(
      fulfillStripeCheckout(session, "different-learner"),
    ).rejects.toThrow("Checkout does not belong to this learner.");
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("rejects a mismatched price or amount", async () => {
    await expect(
      fulfillStripeCheckout(
        {
          ...session,
          line_items: {
            data: [{ quantity: 1, price: { id: "price_tampered" } }],
          },
        },
        "learner-id",
      ),
    ).rejects.toThrow("Checkout line item does not match the selected plan.");
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("immediately revokes a payment already fully refunded by Stripe", async () => {
    await fulfillStripeCheckout(
      {
        ...session,
        payment_intent: {
          id: "pi_test_complete",
          latest_charge: {
            id: "ch_test_complete",
            amount: 28_137,
            amount_refunded: 28_137,
            refunded: true,
            payment_intent: "pi_test_complete",
          },
        },
      },
      "learner-id",
    );
    expect(mocks.rpc).toHaveBeenNthCalledWith(2, "mpk_revoke_stripe_purchase", {
      p_payment_intent_id: "pi_test_complete",
    });
  });
});
