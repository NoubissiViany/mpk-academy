"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const password = z
  .string()
  .min(8)
  .regex(/[A-Za-z]/, "Password must include a letter")
  .regex(/[0-9]/, "Password must include a number");

const signUpSchema = z.object({
  firstName: z.string().trim().min(2).max(100),
  lastName: z.string().trim().min(1).max(100),
  email: z.email().trim().toLowerCase(),
  password,
  locale: z.enum(["en", "fr"]),
  exam: z.enum(["TEF Canada", "TCF Canada"]),
  target: z.enum(["NCLC 5", "NCLC 7", "NCLC 9+", "I'm not sure"]),
});

const signInSchema = z.object({
  email: z.email().trim().toLowerCase(),
  password: z.string().min(8),
});

export type AuthActionResult =
  { ok: true; confirmationRequired?: boolean } | { ok: false; message: string };

function appUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "") ||
    "http://localhost:3000"
  );
}

export async function signUpAction(
  input: z.input<typeof signUpSchema>,
): Promise<AuthActionResult> {
  const parsed = signUpSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, message: "Check your account details and password." };

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: `${appUrl()}/auth/confirm?next=/auth/complete`,
        data: {
          first_name: parsed.data.firstName,
          last_name: parsed.data.lastName,
          locale: parsed.data.locale,
          assistance: "full",
          exam: parsed.data.exam,
          target: parsed.data.target,
        },
      },
    });
    if (error) return { ok: false, message: error.message };
    return { ok: true, confirmationRequired: !data.session };
  } catch {
    return {
      ok: false,
      message: "Supabase is unavailable or has not been configured yet.",
    };
  }
}

export async function signInAction(
  input: z.input<typeof signInSchema>,
): Promise<AuthActionResult> {
  const parsed = signInSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, message: "Enter a valid email and password." };

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword(parsed.data);
    if (error)
      return { ok: false, message: "The email or password is incorrect." };
    return { ok: true };
  } catch {
    return {
      ok: false,
      message: "Supabase is unavailable or has not been configured yet.",
    };
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
    return { ok: false, message: "Enter a valid email address." };
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(parsed.data, {
      redirectTo: `${appUrl()}/auth/confirm?next=/update-password`,
    });
    if (error) return { ok: false, message: error.message };
    return { ok: true };
  } catch {
    return { ok: false, message: "Password recovery is unavailable." };
  }
}

export async function updatePasswordAction(
  nextPassword: string,
): Promise<AuthActionResult> {
  const parsed = password.safeParse(nextPassword);
  if (!parsed.success)
    return {
      ok: false,
      message: "Use at least 8 characters with a letter and a number.",
    };
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.updateUser({ password: parsed.data });
    if (error) return { ok: false, message: error.message };
    return { ok: true };
  } catch {
    return { ok: false, message: "Your password could not be updated." };
  }
}
