"use server";

import { after } from "next/server";
import { z } from "zod";
import { getLocale, getMessages } from "@/i18n/server";
import { isDiagnosticWritingSample } from "@/lib/domain/diagnostic-writing";
import { isAiWritingConfigured } from "@/lib/server/ai/groq";
import { getErrorDetails, logServerError } from "@/lib/server/diagnostics";
import { processWritingQueue } from "@/lib/server/writing/worker";
import { requireUserId } from "@/lib/supabase/learner";
import { getWritingSubmission } from "@/lib/supabase/writing";

async function failure(error: unknown) {
  const { code } = getErrorDetails(error);
  const copy = (await getMessages()).writing.errors;
  const message =
    code === "54000"
      ? copy.daily_limit
      : code === "42501"
        ? copy.consent_required
        : copy.unavailable;
  const reference = logServerError("Diagnostic writing request failed", error, {
    operation: "diagnostic_writing",
  });
  return { ok: false as const, message, reference };
}

/** Load only the signed-in learner's latest completed diagnostic sample. */
export async function getDiagnosticWritingAction() {
  try {
    const { supabase, userId } = await requireUserId();
    const { data: assessment, error } = await supabase
      .from("assessments")
      .select("id, intake")
      .eq("user_id", userId)
      .eq("kind", "diagnostic")
      .eq("status", "completed")
      .order("completed_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    const intake = assessment?.intake as { writingSample?: unknown } | null;
    if (!assessment || !isDiagnosticWritingSample(intake?.writingSample))
      return { ok: true as const, data: null };
    const { data: row, error: rowError } = await supabase
      .from("writing_submissions")
      .select("id")
      .eq("user_id", userId)
      .eq("client_key", `diagnostic:${assessment.id}`)
      .maybeSingle();
    if (rowError) throw rowError;
    return {
      ok: true as const,
      data: {
        assessmentId: assessment.id,
        sample: intake.writingSample,
        configured: isAiWritingConfigured(),
        submission: row ? await getWritingSubmission(row.id) : null,
      },
    };
  } catch (error) {
    return failure(error);
  }
}

export async function requestDiagnosticWritingFeedbackAction(
  assessmentId: string,
  retry = false,
) {
  if (!z.uuid().safeParse(assessmentId).success || typeof retry !== "boolean")
    return {
      ok: false as const,
      message: (await getMessages()).writing.errors.invalid,
    };
  try {
    if (!isAiWritingConfigured())
      return {
        ok: false as const,
        message: (await getMessages()).writing.errors.unavailable,
      };
    const { supabase } = await requireUserId();
    const { data, error } = await supabase.rpc(
      "mpk_submit_diagnostic_writing",
      {
        p_assessment_id: assessmentId,
        p_locale: await getLocale(),
        p_retry: retry,
      },
    );
    if (error) throw error;
    const id = z.object({ id: z.uuid() }).parse(data).id;
    const submission = await getWritingSubmission(id);
    if (!submission)
      throw new Error("Saved diagnostic writing could not be loaded");
    after(() => processWritingQueue({ maxJobs: 1 }).catch(() => undefined));
    return { ok: true as const, submission };
  } catch (error) {
    return failure(error);
  }
}
