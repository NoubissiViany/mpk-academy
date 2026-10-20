import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createStripeCheckoutSession,
  retrieveStripeCheckoutSession,
  verifyStripeEvent,
} from "@/lib/stripe/server";

const mocks = vi.hoisted(() => ({
  constructEvent: vi.fn(),
  create: vi.fn(),
  retrieve: vi.fn(),
  stripeConstructor: vi.fn(),
}));

vi.mock("stripe", () => ({
  default: class Stripe {
    checkout = {
      sessions: {
        create: mocks.create,
        retrieve: mocks.retrieve,
      },
    };
    webhooks = { constructEvent: mocks.constructEvent };

    constructor(secret: string, config: unknown) {
      mocks.stripeConstructor(secret, config);
    }
  },
}));

describe("Stripe server boundary", () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mock) => mock.mockReset());
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://mpk-academy.vercel.app/");
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_example");
    vi.stubEnv("STRIPE_WEBHOOK_SECRET", "whsec_example");
    vi.stubEnv("STRIPE_PRICE_ESSENTIAL", "price_essential");
    vi.stubEnv("STRIPE_PRICE_COMPLETE", "price_complete");
    vi.stubEnv("STRIPE_PRICE_INTENSIVE", "price_intensive");
    mocks.create.mockResolvedValue({
      id: "cs_test_123",
      url: "https://checkout.stripe.com/c/pay/test",
    });
  });

  afterEach(() => vi.unstubAllEnvs());

  it.each([
    ["essential", "price_essential"],
    ["complete", "price_complete"],
    ["intensive", "price_intensive"],
  ] as const)(
    "creates a tax-enabled %s Checkout Session",
    async (planId, price) => {
      await createStripeCheckoutSession({
        userId: "learner-id",
        email: "learner@example.com",
        planId,
      });

      expect(mocks.create).toHaveBeenCalledWith(
        expect.objectContaining({
          mode: "payment",
          payment_method_types: ["card"],
          line_items: [{ price, quantity: 1 }],
          automatic_tax: { enabled: true },
          client_reference_id: "learner-id",
          metadata: { user_id: "learner-id", plan_id: planId },
          payment_intent_data: {
            metadata: { user_id: "learner-id", plan_id: planId },
          },
          success_url:
            "https://mpk-academy.vercel.app/checkout/success?session_id={CHECKOUT_SESSION_ID}",
          cancel_url: `https://mpk-academy.vercel.app/checkout?plan=${planId}&cancelled=1`,
        }),
        expect.objectContaining({
          idempotencyKey: expect.stringMatching(
            new RegExp(`^checkout-learner-id-${planId}-`),
          ),
        }),
      );
      expect(mocks.stripeConstructor).toHaveBeenCalledWith(
        "sk_test_example",
        expect.objectContaining({
          apiVersion: "2026-08-26.dahlia",
          maxNetworkRetries: 2,
        }),
      );
    },
  );

  it("uses a new idempotency key for each payment attempt", async () => {
    const input = {
      userId: "learner-id",
      email: "learner@example.com",
      planId: "complete" as const,
    };
    await createStripeCheckoutSession(input);
    await createStripeCheckoutSession(input);

    const firstOptions = mocks.create.mock.calls[0][1] as {
      idempotencyKey: string;
    };
    const secondOptions = mocks.create.mock.calls[1][1] as {
      idempotencyKey: string;
    };
    expect(firstOptions.idempotencyKey).not.toBe(secondOptions.idempotencyKey);
  });

  it("retrieves the trusted payment and line-item objects", async () => {
    mocks.retrieve.mockResolvedValue({ id: "cs_test_123" });
    await retrieveStripeCheckoutSession("cs_test_123");
    expect(mocks.retrieve).toHaveBeenCalledWith("cs_test_123", {
      expand: ["line_items.data.price", "payment_intent.latest_charge"],
    });
  });

  it("delegates raw webhook verification to the Stripe SDK", () => {
    const event = {
      id: "evt_123",
      type: "checkout.session.completed",
      data: { object: { id: "cs_test_123" } },
    };
    mocks.constructEvent.mockReturnValue(event);

    expect(verifyStripeEvent("raw payload", "stripe signature")).toBe(event);
    expect(mocks.constructEvent).toHaveBeenCalledWith(
      "raw payload",
      "stripe signature",
      "whsec_example",
      300,
    );
  });
});
