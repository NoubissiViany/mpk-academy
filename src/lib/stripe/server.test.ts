import { createHmac } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createStripeCheckoutSession,
  verifyStripeEvent,
} from "@/lib/stripe/server";

describe("Stripe server boundary", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://mpk-academy.vercel.app/");
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_example");
    vi.stubEnv("STRIPE_WEBHOOK_SECRET", "whsec_example");
    vi.stubEnv("STRIPE_PRICE_COMPLETE", "price_complete");
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("creates a server-owned, tax-enabled Checkout Session", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          id: "cs_test_123",
          url: "https://checkout.stripe.com/c/pay/test",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    await createStripeCheckoutSession({
      userId: "learner-id",
      email: "learner@example.com",
      planId: "complete",
    });

    const [, request] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = request.body as URLSearchParams;
    expect(body.get("line_items[0][price]")).toBe("price_complete");
    expect(body.get("automatic_tax[enabled]")).toBe("true");
    expect(body.get("client_reference_id")).toBe("learner-id");
    expect(body.get("metadata[plan_id]")).toBe("complete");
    expect(body.get("success_url")).toBe(
      "https://mpk-academy.vercel.app/checkout/success?session_id={CHECKOUT_SESSION_ID}",
    );
  });

  it("accepts a current valid signature and rejects tampering", () => {
    const payload = JSON.stringify({
      id: "evt_123",
      type: "checkout.session.completed",
      data: { object: { id: "cs_test_123" } },
    });
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signature = createHmac("sha256", "whsec_example")
      .update(`${timestamp}.${payload}`)
      .digest("hex");

    expect(
      verifyStripeEvent(payload, `t=${timestamp},v1=${signature}`).id,
    ).toBe("evt_123");
    expect(() =>
      verifyStripeEvent(`${payload} `, `t=${timestamp},v1=${signature}`),
    ).toThrow("Stripe signature is invalid.");
  });
});
