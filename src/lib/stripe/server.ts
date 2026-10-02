import "server-only";

import { randomUUID } from "node:crypto";
import Stripe from "stripe";
import { getAppUrl } from "@/lib/app-url";
import type { PaidPlanId } from "@/types/domain";

const STRIPE_API_VERSION = "2026-08-26.dahlia";
const WEBHOOK_TOLERANCE_SECONDS = 300;

export type StripeCheckoutSession = Stripe.Checkout.Session;
export type StripeCharge = Stripe.Charge;
export type StripeEvent = Stripe.Event;

function requiredEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is not configured.`);
  return value;
}

function stripeClient() {
  return new Stripe(requiredEnv("STRIPE_SECRET_KEY"), {
    apiVersion: STRIPE_API_VERSION,
    maxNetworkRetries: 2,
    typescript: true,
  });
}

export function stripePriceId(planId: PaidPlanId) {
  const variable = {
    essential: "STRIPE_PRICE_ESSENTIAL",
    complete: "STRIPE_PRICE_COMPLETE",
    intensive: "STRIPE_PRICE_INTENSIVE",
  } satisfies Record<PaidPlanId, string>;
  return requiredEnv(variable[planId]);
}

export async function createStripeCheckoutSession(input: {
  userId: string;
  email: string;
  planId: PaidPlanId;
}) {
  const metadata = { user_id: input.userId, plan_id: input.planId };
  return stripeClient().checkout.sessions.create(
    {
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [{ price: stripePriceId(input.planId), quantity: 1 }],
      automatic_tax: { enabled: true },
      customer_email: input.email,
      client_reference_id: input.userId,
      metadata,
      payment_intent_data: { metadata },
      success_url: `${getAppUrl()}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${getAppUrl()}/checkout?plan=${input.planId}&cancelled=1`,
    },
    {
      idempotencyKey: `checkout-${input.userId}-${input.planId}-${randomUUID()}`,
    },
  );
}

export async function retrieveStripeCheckoutSession(sessionId: string) {
  return stripeClient().checkout.sessions.retrieve(sessionId, {
    expand: ["line_items.data.price", "payment_intent.latest_charge"],
  });
}

export function paymentIntentId(
  value:
    StripeCheckoutSession["payment_intent"] | StripeCharge["payment_intent"],
) {
  return typeof value === "string" ? value : (value?.id ?? null);
}

export function verifyStripeEvent(payload: string, signatureHeader: string) {
  return stripeClient().webhooks.constructEvent(
    payload,
    signatureHeader,
    requiredEnv("STRIPE_WEBHOOK_SECRET"),
    WEBHOOK_TOLERANCE_SECONDS,
  );
}
