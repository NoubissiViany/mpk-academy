"use server";

import { isPaidPlanId } from "@/config/product";
import { createStripeCheckoutSession } from "@/lib/stripe/server";
import { requireUserId } from "@/lib/supabase/learner";

export type CheckoutActionResult =
  | { ok: true; url: string }
  | {
      ok: false;
      reason:
        | "unauthenticated"
        | "assessment_required"
        | "active_entitlement"
        | "invalid_plan"
        | "unavailable";
      message: string;
    };

export async function createCheckoutSessionAction(
  planId: string,
): Promise<CheckoutActionResult> {
  if (!isPaidPlanId(planId))
    return {
      ok: false,
      reason: "invalid_plan",
      message: "Choose a valid preparation plan.",
    };

  try {
    const { supabase, userId } = await requireUserId();
    const now = new Date().toISOString();
    const [userResponse, entitlementResponse, assessmentResponse] =
      await Promise.all([
        supabase.auth.getUser(),
        supabase
          .from("entitlements")
          .select("id, ends_at")
          .eq("user_id", userId)
          .eq("status", "active"),
        supabase
          .from("assessments")
          .select("id")
          .eq("user_id", userId)
          .eq("kind", "diagnostic")
          .eq("status", "completed")
          .limit(1)
          .maybeSingle(),
      ]);

    if (entitlementResponse.error || assessmentResponse.error)
      throw new Error("Checkout eligibility could not be verified.");

    const hasActiveEntitlement = (entitlementResponse.data ?? []).some(
      (entitlement) =>
        !entitlement.ends_at || entitlement.ends_at.localeCompare(now) > 0,
    );
    if (hasActiveEntitlement)
      return {
        ok: false,
        reason: "active_entitlement",
        message: "Your paid plan is already active.",
      };
    if (!assessmentResponse.data)
      return {
        ok: false,
        reason: "assessment_required",
        message: "Complete your assessment before choosing a paid plan.",
      };

    const email = userResponse.data.user?.email;
    if (userResponse.error || !email)
      return {
        ok: false,
        reason: "unauthenticated",
        message: "Sign in again to continue to checkout.",
      };

    const session = await createStripeCheckoutSession({
      userId,
      email,
      planId,
    });
    if (!session.url) throw new Error("Stripe did not return a checkout URL.");
    return { ok: true, url: session.url };
  } catch (error) {
    const unauthenticated =
      error instanceof Error && error.message === "Unauthorized";
    if (!unauthenticated)
      console.error("Checkout session creation failed", {
        source: error instanceof Error ? error.name : "unknown",
      });
    return {
      ok: false,
      reason: unauthenticated ? "unauthenticated" : "unavailable",
      message: unauthenticated
        ? "Sign in again to continue to checkout."
        : "Checkout is temporarily unavailable. Please try again.",
    };
  }
}
