"use server";

import { after } from "next/server";
import { z } from "zod";
import { aiFeedbackNoticeVersion } from "@/config/privacy";
import { hasPlanFeature } from "@/config/product";
import { getMessages } from "@/i18n/server";
import {
  storedFeedbackSchema,
  type WritingFeedback,
} from "@/lib/domain/writing-feedback";
import { isAiSpeakingConfigured } from "@/lib/server/ai/groq";
import { getErrorDetails, logServerError } from "@/lib/server/diagnostics";
import { processSpeakingQueue } from "@/lib/server/speaking/worker";
import { createAdminClient } from "@/lib/supabase/admin";
import { getLearnerAccess, requireUserId } from "@/lib/supabase/learner";

type SpeakingFailureReason =
  | "consent_required"
  | "not_included"
  | "unavailable"
  | "daily_limit"
  | "busy_today"
  | "invalid"
  | "not_found";

type SpeakingFailure = {
  ok: false;
  reason: SpeakingFailureReason;
  message: string;
  reference?: string;
};

async function fail(
  reason: SpeakingFailureReason,
  error?: unknown,
  operation?: string,
): Promise<SpeakingFailure> {
  const message = (await getMessages()).speaking.errors[reason];
  if (!error) return { ok: false, reason, message };
  const reference = logServerError("Speaking feedback request failed", error, {
    operation,
    reason,
  });
  return { ok: false, reason, message, reference };
}

function kickQueue() {
  if (!isAiSpeakingConfigured()) return;
  after(() => processSpeakingQueue({ maxJobs: 1 }).catch(() => undefined));
}

/**
 * Whether the learner can send a recording now, checked before they record so
 * nobody records an answer that cannot be reviewed.
 */
export async function getSpeakingAllowanceAction(): Promise<
  { ok: true; allowance: "allowed" | SpeakingFailureReason } | SpeakingFailure
> {
  try {
    const { planAccess } = await getLearnerAccess();
    if (!hasPlanFeature(planAccess, "aiSpeakingFeedback"))
      return { ok: true, allowance: "not_included" };
    if (!isAiSpeakingConfigured())
      return { ok: true, allowance: "unavailable" };
    const { supabase, userId } = await requireUserId();
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("ai_feedback_consent_version")
      .eq("id", userId)
      .single();
    if (profileError) throw profileError;
    if (profile.ai_feedback_consent_version !== aiFeedbackNoticeVersion)
      return { ok: true, allowance: "consent_required" };
    const { data, error } = await createAdminClient().rpc(
      "mpk_speaking_allowance",
      { p_user_id: userId, p_audio_seconds: 0 },
    );
    if (error) throw error;
    return {
      ok: true,
      allowance: data as "allowed" | SpeakingFailureReason,
    };
  } catch (error) {
    return fail("unavailable", error, "speaking_allowance");
  }
}

export type SpeakingStatus = {
  status: "queued" | "processing" | "done" | "failed";
  ahead: number;
  capReached: boolean;
  feedback: WritingFeedback | null;
};

export async function getSpeakingStatusAction(
  id: string,
): Promise<({ ok: true } & SpeakingStatus) | SpeakingFailure> {
  if (!z.uuid().safeParse(id).success) return fail("not_found");
  try {
    const { supabase } = await requireUserId();
    const { data, error } = await supabase.rpc("mpk_speaking_status", {
      p_id: id,
    });
    if (error) {
      if (getErrorDetails(error).code === "P0002") return fail("not_found");
      throw error;
    }
    const status = data as {
      status: SpeakingStatus["status"];
      ahead: number;
      notBefore: string;
    };
    let feedback: WritingFeedback | null = null;
    if (status.status === "done") {
      const { data: row, error: rowError } = await supabase
        .from("speaking_submissions")
        .select("feedback")
        .eq("id", id)
        .single();
      if (rowError) throw rowError;
      const stored = storedFeedbackSchema.safeParse(row.feedback);
      feedback = stored.success ? (stored.data as WritingFeedback) : null;
    }
    // While a learner waits, their visit also moves the queue along.
    if (
      status.status === "queued" &&
      Date.parse(status.notBefore) <= Date.now()
    )
      kickQueue();
    return {
      ok: true,
      status: status.status,
      ahead: status.ahead,
      capReached: false,
      feedback,
    };
  } catch (error) {
    return fail("unavailable", error, "get_speaking_status");
  }
}

/** Asks again for feedback on a failed review, from the kept transcript. */
export async function requeueSpeakingAction(
  id: string,
): Promise<{ ok: true } | SpeakingFailure> {
  if (!z.uuid().safeParse(id).success) return fail("not_found");
  try {
    const { supabase } = await requireUserId();
    const { error } = await supabase.rpc("mpk_requeue_speaking", { p_id: id });
    if (error) {
      if (getErrorDetails(error).code === "P0002") return fail("not_found");
      throw error;
    }
    kickQueue();
    return { ok: true };
  } catch (error) {
    return fail("unavailable", error, "requeue_speaking");
  }
}

export async function flagSpeakingFixAction(
  id: string,
  fixIndex: number,
): Promise<{ ok: true } | SpeakingFailure> {
  if (
    !z.uuid().safeParse(id).success ||
    !Number.isInteger(fixIndex) ||
    fixIndex < 0 ||
    fixIndex > 49
  )
    return fail("invalid");
  try {
    const { supabase } = await requireUserId();
    const { error } = await supabase.rpc("mpk_flag_speaking_fix", {
      p_submission_id: id,
      p_fix_index: fixIndex,
      p_note: null,
    });
    if (error) throw error;
    return { ok: true };
  } catch (error) {
    return fail("unavailable", error, "flag_speaking_fix");
  }
}
