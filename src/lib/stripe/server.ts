import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { getAppUrl } from "@/lib/app-url";
import type { PaidPlanId } from "@/types/domain";

const STRIPE_API_URL = "https://api.stripe.com/v1";
const WEBHOOK_TOLERANCE_SECONDS = 300;

export interface StripeCheckoutSession {
  id: string;
  created: number;
  url: string | null;
  client_reference_id: string | null;
  customer_details: { email?: string | null } | null;
  metadata: Record<string, string>;
  payment_status: "paid" | "unpaid" | "no_payment_required";
  payment_intent:
    | string
    | {
        id: string;
        latest_charge: string | StripeCharge | null;
      }
    | null;
  amount_subtotal: number | null;
  amount_total: number | null;
  currency: string | null;
  total_details: { amount_tax: number | null } | null;
  line_items?: {
    data: Array<{
      quantity: number | null;
      price: { id: string } | null;
    }>;
  };
}

export interface StripeCharge {
  id: string;
  amount: number;
  amount_refunded: number;
  refunded: boolean;
  payment_intent: string | { id: string } | null;
}

export interface StripeEvent {
  id: string;
  type: string;
  data: { object: StripeCheckoutSession | StripeCharge };
}

function requiredEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is not configured.`);
  return value;
}

export function stripePriceId(planId: PaidPlanId) {
  const variable = {
    essential: "STRIPE_PRICE_ESSENTIAL",
    complete: "STRIPE_PRICE_COMPLETE",
    intensive: "STRIPE_PRICE_INTENSIVE",
  } satisfies Record<PaidPlanId, string>;
  return requiredEnv(variable[planId]);
}

async function stripeRequest<T>(
  path: string,
  options?: { body?: URLSearchParams; idempotencyKey?: string },
): Promise<T> {
  const response = await fetch(`${STRIPE_API_URL}${path}`, {
    method: options?.body ? "POST" : "GET",
    headers: {
      Authorization: `Bearer ${requiredEnv("STRIPE_SECRET_KEY")}`,
      ...(options?.body
        ? { "Content-Type": "application/x-www-form-urlencoded" }
        : {}),
      ...(options?.idempotencyKey
        ? { "Idempotency-Key": options.idempotencyKey }
        : {}),
    },
    body: options?.body,
    cache: "no-store",
  });
  const payload = (await response.json()) as T & {
    error?: { message?: string };
  };
  if (!response.ok)
    throw new Error(payload.error?.message ?? "Stripe request failed.");
  return payload;
}

export async function createStripeCheckoutSession(input: {
  userId: string;
  email: string;
  planId: PaidPlanId;
}) {
  const body = new URLSearchParams({
    mode: "payment",
    "payment_method_types[0]": "card",
    "line_items[0][price]": stripePriceId(input.planId),
    "line_items[0][quantity]": "1",
    "automatic_tax[enabled]": "true",
    customer_email: input.email,
    client_reference_id: input.userId,
    "metadata[user_id]": input.userId,
    "metadata[plan_id]": input.planId,
    "payment_intent_data[metadata][user_id]": input.userId,
    "payment_intent_data[metadata][plan_id]": input.planId,
    success_url: `${getAppUrl()}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${getAppUrl()}/checkout?plan=${input.planId}&cancelled=1`,
  });
  return stripeRequest<StripeCheckoutSession>("/checkout/sessions", {
    body,
    idempotencyKey: `checkout-${input.userId}-${input.planId}`,
  });
}

export async function retrieveStripeCheckoutSession(sessionId: string) {
  const query = new URLSearchParams();
  query.append("expand[]", "line_items.data.price");
  query.append("expand[]", "payment_intent.latest_charge");
  return stripeRequest<StripeCheckoutSession>(
    `/checkout/sessions/${encodeURIComponent(sessionId)}?${query}`,
  );
}

export function paymentIntentId(
  value:
    StripeCheckoutSession["payment_intent"] | StripeCharge["payment_intent"],
) {
  return typeof value === "string" ? value : (value?.id ?? null);
}

function signatureValues(header: string) {
  const values = new Map<string, string[]>();
  for (const part of header.split(",")) {
    const separator = part.indexOf("=");
    if (separator < 1) continue;
    const key = part.slice(0, separator);
    const value = part.slice(separator + 1);
    values.set(key, [...(values.get(key) ?? []), value]);
  }
  return values;
}

export function verifyStripeEvent(payload: string, signatureHeader: string) {
  const values = signatureValues(signatureHeader);
  const timestamp = values.get("t")?.[0];
  const signatures = values.get("v1") ?? [];
  if (!timestamp || signatures.length === 0)
    throw new Error("Stripe signature is missing.");

  const timestampSeconds = Number(timestamp);
  if (
    !Number.isFinite(timestampSeconds) ||
    Math.abs(Date.now() / 1000 - timestampSeconds) > WEBHOOK_TOLERANCE_SECONDS
  )
    throw new Error("Stripe signature timestamp is outside the tolerance.");

  const expected = createHmac("sha256", requiredEnv("STRIPE_WEBHOOK_SECRET"))
    .update(`${timestamp}.${payload}`)
    .digest();
  const verified = signatures.some((signature) => {
    if (!/^[a-f0-9]{64}$/i.test(signature)) return false;
    const candidate = Buffer.from(signature, "hex");
    return (
      candidate.length === expected.length &&
      timingSafeEqual(candidate, expected)
    );
  });
  if (!verified) throw new Error("Stripe signature is invalid.");

  const event = JSON.parse(payload) as StripeEvent;
  if (!event.id || !event.type || !event.data?.object)
    throw new Error("Stripe event is invalid.");
  return event;
}
