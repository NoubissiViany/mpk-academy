"use server";

import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { generateInviteCode, inviteCodeSchema } from "@/lib/beta";
import { getAdminEmail } from "@/lib/server/admin";
import { logServerError } from "@/lib/server/diagnostics";
import { createAdminClient } from "@/lib/supabase/admin";

async function requireAdmin() {
  if (!(await getAdminEmail())) notFound();
  return createAdminClient();
}

function done(error?: string): never {
  revalidatePath("/admin");
  redirect(error ? `/admin?error=${encodeURIComponent(error)}` : "/admin");
}

const inviteSchema = z.object({
  code: z.union([z.literal(""), inviteCodeSchema]),
  label: z.string().trim().max(120),
  maxUses: z.coerce.number().int().min(1).max(1000),
  expiresInDays: z.union([
    z.literal(""),
    z.coerce.number().int().min(1).max(365),
  ]),
});

export async function createBetaInviteAction(formData: FormData) {
  const admin = await requireAdmin();
  const parsed = inviteSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) done("Check the invite fields and try again.");
  const { code, label, maxUses, expiresInDays } = parsed.data;
  const { error } = await admin.rpc("mpk_admin_create_beta_invite", {
    p_code: code || generateInviteCode(),
    p_label: label,
    p_max_uses: maxUses,
    p_expires_at:
      expiresInDays === ""
        ? null
        : new Date(Date.now() + expiresInDays * 86_400_000).toISOString(),
  });
  if (error) {
    logServerError("Beta invite creation failed", error, {
      operation: "admin_create_invite",
    });
    done(
      error.code === "23505"
        ? "That code already exists."
        : "The invite could not be created.",
    );
  }
  done();
}

export async function revokeBetaInviteAction(formData: FormData) {
  const admin = await requireAdmin();
  const code = inviteCodeSchema.safeParse(formData.get("code"));
  if (!code.success) done("Unknown invite code.");
  const { error } = await admin.rpc("mpk_admin_revoke_beta_invite", {
    p_code: code.data,
  });
  if (error) {
    logServerError("Beta invite revocation failed", error, {
      operation: "admin_revoke_invite",
    });
    done("The invite could not be revoked.");
  }
  done();
}

const settingsSchema = z.object({
  seatLimit: z.coerce.number().int().min(0).max(10000),
  accessDays: z.coerce.number().int().min(1).max(365),
});

export async function updateBetaSettingsAction(formData: FormData) {
  const admin = await requireAdmin();
  const parsed = settingsSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success)
    done("Seat limit must be 0–10000 and access 1–365 days.");
  const { error } = await admin.rpc("mpk_admin_update_beta_settings", {
    p_seat_limit: parsed.data.seatLimit,
    p_access_days: parsed.data.accessDays,
  });
  if (error) {
    logServerError("Beta settings update failed", error, {
      operation: "admin_update_settings",
    });
    done("The settings could not be saved.");
  }
  done();
}
