import { NextResponse } from "next/server";
import {
  fulfillStripeCheckout,
  revokeFullyRefundedStripePayment,
} from "@/lib/payments";
import {
  paymentIntentId,
  retrieveStripeCheckoutSession,
  verifyStripeEvent,
  type StripeCharge,
  type StripeCheckoutSession,
} from "@/lib/stripe/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  if (!signature)
    return NextResponse.json(
      { error: "Missing Stripe signature." },
      { status: 400 },
    );

  const payload = await request.text();
  let event;
  try {
    event = verifyStripeEvent(payload, signature);
  } catch {
    return NextResponse.json(
      { error: "Invalid Stripe signature." },
      { status: 400 },
    );
  }

  try {
    if (
      event.type === "checkout.session.completed" ||
      event.type === "checkout.session.async_payment_succeeded"
    ) {
      const eventSession = event.data.object as StripeCheckoutSession;
      const session = await retrieveStripeCheckoutSession(eventSession.id);
      if (session.payment_status === "paid")
        await fulfillStripeCheckout(session);
    }

    if (event.type === "charge.refunded") {
      const charge = event.data.object as StripeCharge;
      const paymentId = paymentIntentId(charge.payment_intent);
      if (
        charge.refunded &&
        charge.amount_refunded >= charge.amount &&
        paymentId
      )
        await revokeFullyRefundedStripePayment(paymentId);
    }
  } catch (error) {
    console.error("Stripe webhook processing failed", {
      eventId: event.id,
      eventType: event.type,
      source: error instanceof Error ? error.name : "unknown",
    });
    return NextResponse.json(
      { error: "Webhook processing failed." },
      { status: 500 },
    );
  }

  return NextResponse.json({ received: true });
}
