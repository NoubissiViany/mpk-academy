"use server";

import { z } from "zod";
import { getMessages } from "@/i18n/server";
import { inviteCodeSchema } from "@/lib/beta";
import { logServerError } from "@/lib/server/diagnostics";
import { getLearnerSnapshot, requireUserId } from "@/lib/supabase/learner";
import type { AppState } from "@/types/domain";

export type BetaInviteStatus =
  | "redeemed"
  | "already_active"
  | "invalid"
  | "expired"
  | "exhausted"
  | "beta_full";

export type RedeemBetaInviteResult =
  | { ok: true; status: "redeemed" | "already_active"; snapshot: AppState }
  | {
      ok: false;
      status:
        | Exclude<BetaInviteStatus, "redeemed" | "already_active">
        | "required"
        | "unavailable";
      message: string;
      reference?: string;
    };

const statusSchema = z.object({
  status: z.enum([
    "redeemed",
    "already_active",
    "invalid",
    "expired",
    "exhausted",
    "beta_full",
  ]),
});

export async function redeemBetaInviteAction(
  code: string,
): Promise<RedeemBetaInviteResult> {
  const t = (await getMessages()).beta.status;
  const parsed = inviteCodeSchema.safeParse(code);
  if (!parsed.success)
    return {
      ok: false,
      status: code.trim() ? "invalid" : "required",
      message: code.trim() ? t.invalid : t.required,
    };

  try {
    const { supabase } = await requireUserId();
    const { data, error } = await supabase.rpc("mpk_redeem_beta_invite", {
      p_code: parsed.data,
    });
    if (error) throw error;
    const { status } = statusSchema.parse(data);
    if (status === "redeemed" || status === "already_active")
      return { ok: true, status, snapshot: await getLearnerSnapshot() };
    return { ok: false, status, message: t[status] };
  } catch (error) {
    const reference = logServerError("Beta invite redemption failed", error, {
      operation: "redeem_beta_invite",
    });
    return {
      ok: false,
      status: "unavailable",
      message: t.unavailable,
      reference,
    };
  }
}
