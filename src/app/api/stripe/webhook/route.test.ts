import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

const mocks = vi.hoisted(() => ({
  verify: vi.fn(),
  retrieve: vi.fn(),
  fulfill: vi.fn(),
  revoke: vi.fn(),
}));

vi.mock("@/lib/stripe/server", () => ({
  verifyStripeEvent: mocks.verify,
  retrieveStripeCheckoutSession: mocks.retrieve,
  paymentIntentId: (value: string | { id: string } | null) =>
    typeof value === "string" ? value : (value?.id ?? null),
}));
vi.mock("@/lib/payments", () => ({
  fulfillStripeCheckout: mocks.fulfill,
  revokeFullyRefundedStripePayment: mocks.revoke,
}));

function request() {
  return new Request("https://mpk-academy.vercel.app/api/stripe/webhook", {
    method: "POST",
    headers: { "stripe-signature": "t=1,v1=signature" },
    body: "{}",
  });
}

describe("Stripe webhook", () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mock) => mock.mockReset());
    mocks.fulfill.mockResolvedValue(undefined);
    mocks.revoke.mockResolvedValue(undefined);
  });

  it("rejects a request without a Stripe signature", async () => {
    const response = await POST(
      new Request("https://mpk-academy.vercel.app/api/stripe/webhook", {
        method: "POST",
        body: "{}",
      }),
    );
    expect(response.status).toBe(400);
    expect(mocks.verify).not.toHaveBeenCalled();
  });

  it("fulfills a paid Checkout Session", async () => {
    mocks.verify.mockReturnValue({
      id: "evt_checkout",
      type: "checkout.session.completed",
      data: { object: { id: "cs_test_123" } },
    });
    const session = { id: "cs_test_123", payment_status: "paid" };
    mocks.retrieve.mockResolvedValue(session);

    const response = await POST(request());
    expect(response.status).toBe(200);
    expect(mocks.fulfill).toHaveBeenCalledWith(session);
  });

  it("revokes only a fully refunded payment", async () => {
    mocks.verify.mockReturnValue({
      id: "evt_partial_refund",
      type: "charge.refunded",
      data: {
        object: {
          amount: 28_137,
          amount_refunded: 10_000,
          refunded: false,
          payment_intent: "pi_test_123",
        },
      },
    });
    expect((await POST(request())).status).toBe(200);
    expect(mocks.revoke).not.toHaveBeenCalled();

    mocks.verify.mockReturnValue({
      id: "evt_full_refund",
      type: "charge.refunded",
      data: {
        object: {
          amount: 28_137,
          amount_refunded: 28_137,
          refunded: true,
          payment_intent: "pi_test_123",
        },
      },
    });
    expect((await POST(request())).status).toBe(200);
    expect(mocks.revoke).toHaveBeenCalledWith("pi_test_123");
  });

  it("returns a retryable error when fulfillment fails", async () => {
    mocks.verify.mockReturnValue({
      id: "evt_checkout",
      type: "checkout.session.completed",
      data: { object: { id: "cs_test_123" } },
    });
    mocks.retrieve.mockRejectedValue(new Error("temporary failure"));
    expect((await POST(request())).status).toBe(500);
  });
});
