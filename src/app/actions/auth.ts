"use server";

import { z } from "zod";
import { getAppUrl } from "@/lib/app-url";
import { getErrorDetails, logServerError } from "@/lib/server/diagnostics";
import { createClient } from "@/lib/supabase/server";

const password = z
  .string()
  .min(8)
  .regex(/[A-Za-z]/, "Password must include a letter")
  .regex(/[0-9]/, "Password must include a number");
const paidPlanSchema = z.enum(["essential", "complete", "intensive"]);

const signUpSchema = z.object({
  firstName: z.string().trim().min(2).max(100),
  lastName: z.string().trim().min(1).max(100),
  email: z.email().trim().toLowerCase(),
  password,
  locale: z.enum(["en", "fr"]),
  exam: z.enum(["TEF Canada", "TCF Canada"]),
  target: z.enum(["NCLC 5", "NCLC 7", "NCLC 9+", "I'm not sure"]),
  planId: paidPlanSchema.optional(),
});

const signInSchema = z.object({
  email: z.email().trim().toLowerCase(),
  password: z.string().min(8),
});

export type AuthFailureReason =
  | "invalid_submission"
  | "email_not_confirmed"
  | "invalid_credentials"
  | "account_exists"
  | "rate_limited"
  | "service_unavailable";

export type AuthActionResult =
  | { ok: true; confirmationRequired?: boolean }
  | {
      ok: false;
      reason: AuthFailureReason;
      message: string;
      reference?: string;
    };

export type CheckoutIntentActionResult =
  | { ok: true; planId: z.infer<typeof paidPlanSchema> }
  | {
      ok: false;
      reason: "invalid_plan" | "unauthenticated" | "service_unavailable";
      message: string;
      reference: string;
    };

function authFailure(
  operation: string,
  error: unknown,
  fallbackReason: AuthFailureReason = "service_unavailable",
): Extract<AuthActionResult, { ok: false }> {
  const { code, status } = getErrorDetails(error);
  const normalizedCode = code?.toLowerCase();
  const reason: AuthFailureReason =
    status === 429 ||
    normalizedCode === "over_email_send_rate_limit" ||
    normalizedCode === "over_request_rate_limit"
      ? "rate_limited"
      : normalizedCode === "email_not_confirmed"
        ? "email_not_confirmed"
        : normalizedCode === "invalid_credentials"
          ? "invalid_credentials"
          : normalizedCode === "user_already_exists"
            ? "account_exists"
            : fallbackReason;
  const messages: Record<AuthFailureReason, string> = {
    invalid_submission: "Check the information you entered and try again.",
    email_not_confirmed:
      "Confirm your email before signing in. Check your inbox and spam folder.",
    invalid_credentials: "The email or password is incorrect.",
    account_exists:
      "An account already exists for this email. Sign in instead.",
    rate_limited:
      "Too many email or sign-in attempts were made. Wait a few minutes and try again.",
    service_unavailable:
      "Authentication is temporarily unavailable. Please try again.",
  };
  const reference = logServerError("Authentication operation failed", error, {
    operation,
    reason,
  });
  return { ok: false, reason, message: messages[reason], reference };
}

export async function signUpAction(
  input: z.input<typeof signUpSchema>,
): Promise<AuthActionResult> {
  const parsed = signUpSchema.safeParse(input);
  if (!parsed.success)
    return {
      ok: false,
      reason: "invalid_submission",
      message: "Check your account details and password.",
    };

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: `${getAppUrl()}/auth/confirm`,
        data: {
          first_name: parsed.data.firstName,
          last_name: parsed.data.lastName,
          locale: parsed.data.locale,
          assistance: "full",
          exam: parsed.data.exam,
          target: parsed.data.target,
          ...(parsed.data.planId
            ? { checkout_intent_plan_id: parsed.data.planId }
            : {}),
        },
      },
    });
    if (error) return authFailure("sign_up", error);
    return { ok: true, confirmationRequired: !data.session };
  } catch (error) {
    return authFailure("sign_up", error);
  }
}

export async function setCheckoutIntentAction(
  planId: unknown,
): Promise<CheckoutIntentActionResult> {
  const parsed = paidPlanSchema.safeParse(planId);
  if (!parsed.success) {
    const reference = logServerError(
      "Checkout intent update failed",
      new Error("Invalid checkout plan intent"),
      { operation: "set_checkout_intent", reason: "invalid_plan" },
    );
    return {
      ok: false,
      reason: "invalid_plan",
      message: "Choose a valid preparation plan.",
      reference,
    };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.updateUser({
      data: { checkout_intent_plan_id: parsed.data },
    });
    if (error) {
      const { code, status } = getErrorDetails(error);
      const unauthenticated =
        status === 401 ||
        code === "session_not_found" ||
        code === "refresh_token_not_found";
      const reason = unauthenticated
        ? "unauthenticated"
        : "service_unavailable";
      const reference = logServerError("Checkout intent update failed", error, {
        operation: "set_checkout_intent",
        reason,
      });
      return {
        ok: false,
        reason,
        message: unauthenticated
          ? "Sign in again to choose a plan."
          : "We could not save your plan selection. Please try again.",
        reference,
      };
    }
    return { ok: true, planId: parsed.data };
  } catch (error) {
    const reference = logServerError("Checkout intent update failed", error, {
      operation: "set_checkout_intent",
      reason: "service_unavailable",
    });
    return {
      ok: false,
      reason: "service_unavailable",
      message: "We could not save your plan selection. Please try again.",
      reference,
    };
  }
}

export async function signInAction(
  input: z.input<typeof signInSchema>,
): Promise<AuthActionResult> {
  const parsed = signInSchema.safeParse(input);
  if (!parsed.success)
    return {
      ok: false,
      reason: "invalid_submission",
      message: "Enter a valid email and password.",
    };

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword(parsed.data);
    if (error) return authFailure("sign_in", error, "invalid_credentials");
    return { ok: true };
  } catch (error) {
    return authFailure("sign_in", error);
  }
}

export async function signOutAction() {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch {
    // Clearing the UI session still leaves the app in a safe signed-out state.
  }
}

export async function requestPasswordResetAction(
  email: string,
): Promise<AuthActionResult> {
  const parsed = z.email().trim().toLowerCase().safeParse(email);
  if (!parsed.success)
    return {
      ok: false,
      reason: "invalid_submission",
      message: "Enter a valid email address.",
    };
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(parsed.data, {
      redirectTo: `${getAppUrl()}/auth/confirm`,
    });
    if (error) return authFailure("password_reset", error);
    return { ok: true };
  } catch (error) {
    return authFailure("password_reset", error);
  }
}

export async function resendConfirmationAction(
  email: string,
): Promise<AuthActionResult> {
  const parsed = z.email().trim().toLowerCase().safeParse(email);
  if (!parsed.success)
    return {
      ok: false,
      reason: "invalid_submission",
      message: "Enter a valid email address.",
    };
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: parsed.data,
      options: {
        emailRedirectTo: `${getAppUrl()}/auth/confirm`,
      },
    });
    if (error) return authFailure("resend_confirmation", error);
    return { ok: true, confirmationRequired: true };
  } catch (error) {
    return authFailure("resend_confirmation", error);
  }
}

export async function updatePasswordAction(
  nextPassword: string,
): Promise<AuthActionResult> {
  const parsed = password.safeParse(nextPassword);
  if (!parsed.success)
    return {
      ok: false,
      reason: "invalid_submission",
      message: "Use at least 8 characters with a letter and a number.",
    };
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.updateUser({ password: parsed.data });
    if (error) return authFailure("update_password", error);
    return { ok: true };
  } catch (error) {
    return authFailure("update_password", error);
  }
}
