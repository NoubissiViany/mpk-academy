"use server";

import { after } from "next/server";
import { z } from "zod";
import { aiFeedbackNoticeVersion } from "@/config/privacy";
import { hasPlanFeature } from "@/config/product";
import { getLocale, getMessages } from "@/i18n/server";
import { checkWriting } from "@/lib/domain/writing-checks";
import {
  storedFeedbackSchema,
  type WritingFeedback,
} from "@/lib/domain/writing-feedback";
import { isAiWritingConfigured } from "@/lib/server/ai/groq";
import { getPublicWritingTask } from "@/lib/server/content";
import { getErrorDetails, logServerError } from "@/lib/server/diagnostics";
import { processWritingQueue } from "@/lib/server/writing/worker";
import { getLearnerAccess, requireUserId } from "@/lib/supabase/learner";

type WritingFailureReason =
  | "consent_required"
  | "not_included"
  | "unavailable"
  | "daily_limit"
  | "too_short"
  | "invalid"
  | "not_found";

type WritingFailure = {
  ok: false;
  reason: WritingFailureReason;
  message: string;
  reference?: string;
};

async function fail(
  reason: WritingFailureReason,
  error?: unknown,
  operation?: string,
): Promise<WritingFailure> {
  const message = (await getMessages()).writing.errors[reason];
  if (!error) return { ok: false, reason, message };
  const reference = logServerError("Writing feedback request failed", error, {
    operation,
    reason,
  });
  return { ok: false, reason, message, reference };
}

/** Work the queue after the response, so learners never wait on the AI call. */
function kickQueue() {
  if (!isAiWritingConfigured()) return;
  after(() => processWritingQueue({ maxJobs: 1 }).catch(() => undefined));
}

async function hasCurrentConsent() {
  const { supabase, userId } = await requireUserId();
  const { data, error } = await supabase
    .from("profiles")
    .select("ai_feedback_consent_version")
    .eq("id", userId)
    .single();
  if (error) throw error;
  return data.ai_feedback_consent_version === aiFeedbackNoticeVersion;
}

export async function setAiFeedbackConsentAction(
  granted: boolean,
): Promise<{ ok: true } | WritingFailure> {
  try {
    const { supabase } = await requireUserId();
    const { error } = await supabase.rpc("mpk_set_ai_feedback_consent", {
      p_version: granted ? aiFeedbackNoticeVersion : null,
    });
    if (error) throw error;
    return { ok: true };
  } catch (error) {
    return fail("unavailable", error, "set_ai_consent");
  }
}

const requestSchema = z.object({
  taskId: z.string().regex(/^[a-z0-9-]{1,100}$/),
  text: z.string().max(8000),
  clientKey: z.uuid(),
  parentId: z.uuid().nullable().optional(),
  practice: z
    .object({
      submissionId: z.uuid(),
      durationSeconds: z.number().int().min(0).max(36_000),
    })
    .optional(),
});

/**
 * Queues an essay for AI feedback. From a timed practice session it also
 * records the session, as saving without feedback does.
 */
export async function requestWritingFeedbackAction(
  input: z.input<typeof requestSchema>,
): Promise<{ ok: true; id: string } | WritingFailure> {
  const parsed = requestSchema.safeParse(input);
  if (!parsed.success) return fail("invalid");
  const { taskId, text, clientKey, parentId, practice } = parsed.data;
  try {
    const { planAccess, exam } = await getLearnerAccess();
    if (!hasPlanFeature(planAccess, "aiWritingFeedback"))
      return fail("not_included");
    if (!isAiWritingConfigured()) return fail("unavailable");
    const task = exam ? getPublicWritingTask(exam, taskId) : null;
    if (!exam || !task) return fail("invalid");
    if (!(await hasCurrentConsent())) return fail("consent_required");

    const { supabase } = await requireUserId();
    if (practice) {
      const { error } = await supabase.rpc("mpk_submit_practice", {
        p_exam: exam,
        p_skill: "writing",
        p_focus_competency: "",
        p_duration_seconds: practice.durationSeconds,
        p_answers: [
          {
            question_id: taskId,
            sequence: 0,
            answer: text,
            submission_id: practice.submissionId,
          },
        ],
      });
      // Progress is secondary to the feedback the learner asked for.
      if (error)
        logServerError("Writing practice session not saved", error, {
          operation: "request_writing_feedback",
        });
    }

    const { data, error } = await supabase.rpc("mpk_submit_writing", {
      p_exam: exam,
      p_task_id: taskId,
      p_body: text,
      p_locale: await getLocale(),
      p_checks: JSON.parse(JSON.stringify(checkWriting(text, task.wordCount))),
      p_client_key: clientKey,
      p_parent_id: parentId ?? null,
    });
    if (error) {
      const { code } = getErrorDetails(error);
      if (code === "54000") return fail("daily_limit");
      if (code === "42501")
        return fail(
          error.message.includes("consent")
            ? "consent_required"
            : "not_included",
        );
      if (code === "22023")
        return fail(
          error.message.includes("20 words") ? "too_short" : "invalid",
        );
      throw error;
    }
    kickQueue();
    return { ok: true, id: (data as { id: string }).id };
  } catch (error) {
    return fail("unavailable", error, "request_writing_feedback");
  }
}

export type WritingStatus = {
  status: "queued" | "processing" | "done" | "failed";
  ahead: number;
  capReached: boolean;
  feedback: WritingFeedback | null;
};

export async function getWritingStatusAction(
  id: string,
): Promise<({ ok: true } & WritingStatus) | WritingFailure> {
  if (!z.uuid().safeParse(id).success) return fail("not_found");
  try {
    const { supabase } = await requireUserId();
    const { data, error } = await supabase.rpc("mpk_writing_status", {
      p_id: id,
    });
    if (error) {
      if (getErrorDetails(error).code === "P0002") return fail("not_found");
      throw error;
    }
    const status = data as {
      status: WritingStatus["status"];
      ahead: number;
      capReached: boolean;
      notBefore: string;
    };
    let feedback: WritingFeedback | null = null;
    if (status.status === "done") {
      const { data: row, error: rowError } = await supabase
        .from("writing_submissions")
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
      !status.capReached &&
      Date.parse(status.notBefore) <= Date.now()
    )
      kickQueue();
    return {
      ok: true,
      status: status.status,
      ahead: status.ahead,
      capReached: status.capReached,
      feedback,
    };
  } catch (error) {
    return fail("unavailable", error, "get_writing_status");
  }
}

export async function flagWritingFixAction(
  id: string,
  fixIndex: number,
): Promise<{ ok: true } | WritingFailure> {
  if (
    !z.uuid().safeParse(id).success ||
    !Number.isInteger(fixIndex) ||
    fixIndex < 0 ||
    fixIndex > 49
  )
    return fail("invalid");
  try {
    const { supabase } = await requireUserId();
    const { error } = await supabase.rpc("mpk_flag_writing_fix", {
      p_submission_id: id,
      p_fix_index: fixIndex,
      p_note: null,
    });
    if (error) throw error;
    return { ok: true };
  } catch (error) {
    return fail("unavailable", error, "flag_writing_fix");
  }
}
