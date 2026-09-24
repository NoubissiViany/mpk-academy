import "server-only";

import { getPaidPlan, isPaidPlanId } from "@/config/product";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  paymentIntentId,
  stripePriceId,
  type StripeCheckoutSession,
} from "@/lib/stripe/server";

function paidSessionDetails(
  session: StripeCheckoutSession,
  expectedUserId?: string,
) {
  const planId = session.metadata.plan_id;
  const userId = session.metadata.user_id;
  if (!isPaidPlanId(planId) || !userId)
    throw new Error("Checkout metadata is invalid.");
  if (
    expectedUserId &&
    (userId !== expectedUserId ||
      session.client_reference_id !== expectedUserId)
  )
    throw new Error("Checkout does not belong to this learner.");
  if (session.client_reference_id !== userId)
    throw new Error("Checkout learner identifiers do not match.");
  if (session.payment_status !== "paid")
    throw new Error("Checkout payment is not complete.");

  const plan = getPaidPlan(planId)!;
  const lineItems = session.line_items?.data ?? [];
  if (
    lineItems.length !== 1 ||
    lineItems[0].quantity !== 1 ||
    lineItems[0].price?.id !== stripePriceId(planId)
  )
    throw new Error("Checkout line item does not match the selected plan.");
  if (
    session.currency?.toLowerCase() !== "cad" ||
    session.amount_subtotal !== plan.price * 100 ||
    session.amount_total === null ||
    session.amount_total < session.amount_subtotal
  )
    throw new Error("Checkout amount does not match the selected plan.");

  const paymentId = paymentIntentId(session.payment_intent);
  if (!paymentId) throw new Error("Checkout payment identifier is missing.");
  const latestCharge =
    session.payment_intent &&
    typeof session.payment_intent === "object" &&
    typeof session.payment_intent.latest_charge === "object"
      ? session.payment_intent.latest_charge
      : null;
  const fullyRefunded = Boolean(
    latestCharge?.refunded &&
    latestCharge.amount_refunded >= latestCharge.amount,
  );
  const taxMinor = session.total_details?.amount_tax ?? 0;
  if (session.amount_total !== session.amount_subtotal + taxMinor)
    throw new Error("Checkout tax total is invalid.");

  return {
    planId,
    userId,
    paymentId,
    subtotalMinor: session.amount_subtotal,
    taxMinor,
    totalMinor: session.amount_total,
    fullyRefunded,
  };
}

export async function fulfillStripeCheckout(
  session: StripeCheckoutSession,
  expectedUserId?: string,
) {
  const details = paidSessionDetails(session, expectedUserId);
  const admin = createAdminClient();
  const { error } = await admin.rpc("mpk_fulfill_stripe_purchase", {
    p_user_id: details.userId,
    p_checkout_session_id: session.id,
    p_payment_intent_id: details.paymentId,
    p_plan_id: details.planId,
    p_subtotal_minor: details.subtotalMinor,
    p_tax_minor: details.taxMinor,
    p_total_minor: details.totalMinor,
    p_currency: "CAD",
    p_purchased_at: new Date(session.created * 1000).toISOString(),
  });
  if (error) throw error;
  if (details.fullyRefunded)
    await revokeFullyRefundedStripePayment(details.paymentId);
}

export async function revokeFullyRefundedStripePayment(paymentId: string) {
  const admin = createAdminClient();
  const { error } = await admin.rpc("mpk_revoke_stripe_purchase", {
    p_payment_intent_id: paymentId,
  });
  if (error) throw error;
}
