import { redirect } from "next/navigation";
import { CheckoutSuccessView } from "@/features/checkout/checkout-success-view";
import { fulfillStripeCheckout } from "@/lib/payments";
import { retrieveStripeCheckoutSession } from "@/lib/stripe/server";
import { requireUserId } from "@/lib/supabase/learner";

export const metadata = {
  title: "Payment confirmation",
  robots: { index: false },
};

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string | string[] }>;
}) {
  const value = (await searchParams).session_id;
  const sessionId = Array.isArray(value) ? value[0] : value;
  if (!sessionId || !/^cs_[A-Za-z0-9_]{1,200}$/.test(sessionId))
    return (
      <div className="container-page py-16">
        <CheckoutSuccessView status="invalid" />
      </div>
    );

  let userId: string;
  try {
    ({ userId } = await requireUserId());
  } catch {
    redirect(
      `/login?next=${encodeURIComponent(`/checkout/success?session_id=${sessionId}`)}`,
    );
  }

  let status: "pending" | "invalid" = "invalid";
  let paid = false;
  try {
    const session = await retrieveStripeCheckoutSession(sessionId);
    const belongsToUser =
      session.client_reference_id === userId &&
      session.metadata.user_id === userId;
    if (!belongsToUser) throw new Error("Checkout owner mismatch.");
    if (session.payment_status === "paid") {
      await fulfillStripeCheckout(session, userId);
      paid = true;
    } else {
      status = "pending";
    }
  } catch (error) {
    console.error("Checkout reconciliation failed", {
      source: error instanceof Error ? error.name : "unknown",
    });
  }

  if (paid) redirect("/dashboard?welcome=1");
  return (
    <div className="container-page py-16">
      <CheckoutSuccessView
        status={status}
        retryHref={`/checkout/success?session_id=${sessionId}`}
      />
    </div>
  );
}
