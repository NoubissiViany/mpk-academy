import { after } from "next/server";
import { z } from "zod";
import { aiFeedbackNoticeVersion } from "@/config/privacy";
import { MAX_AUDIO_BYTES } from "@/config/speaking";
import { hasPlanFeature } from "@/config/product";
import { getLocale, getMessages } from "@/i18n/server";
import { cleanTranscript, measureSpeech } from "@/lib/domain/speaking-metrics";
import { countWords } from "@/lib/domain/writing-checks";
import {
  GroqError,
  groqTranscribe,
  isAiSpeakingConfigured,
  speechToTextModel,
} from "@/lib/server/ai/groq";
import { getPublicSpeakingTask } from "@/lib/server/content";
import { getErrorDetails, logServerError } from "@/lib/server/diagnostics";
import { processSpeakingQueue } from "@/lib/server/speaking/worker";
import { createAdminClient } from "@/lib/supabase/admin";
import { getLearnerAccess, requireUserId } from "@/lib/supabase/learner";

// A recording lives only in this request: it is sent for transcription and
// never written anywhere. Vercel caps request bodies at 4.5 MB.
export const maxDuration = 60;

const audioTypes: Record<string, string> = {
  "audio/webm": "webm",
  "audio/ogg": "ogg",
  "audio/mp4": "m4a",
  "audio/x-m4a": "m4a",
  "audio/m4a": "m4a",
  "audio/aac": "m4a",
  "audio/mpeg": "mp3",
  "audio/wav": "wav",
  "audio/x-wav": "wav",
};

type Reason =
  | "unauthenticated"
  | "consent_required"
  | "not_included"
  | "unavailable"
  | "daily_limit"
  | "busy_today"
  | "busy"
  | "too_short"
  | "too_large"
  | "invalid";

async function failure(
  reason: Reason,
  status: number,
  extra: { error?: unknown; retryAfterSeconds?: number } = {},
) {
  const message = (await getMessages()).speaking.errors[reason];
  const reference = extra.error
    ? logServerError("Speaking submission failed", extra.error, {
        operation: "submit_speaking",
        reason,
      })
    : undefined;
  return Response.json(
    {
      ok: false,
      reason,
      message,
      ...(reference ? { reference } : {}),
      ...(extra.retryAfterSeconds
        ? { retryAfterSeconds: extra.retryAfterSeconds }
        : {}),
    },
    { status },
  );
}

const fieldsSchema = z.object({
  taskId: z.string().regex(/^[a-z0-9-]{1,100}$/),
  clientKey: z.uuid(),
  durationSeconds: z.number().min(1).max(900),
  practiceSubmissionId: z.uuid().optional(),
});

const allowanceStatus: Record<string, number> = {
  consent_required: 403,
  not_included: 403,
  daily_limit: 429,
  busy_today: 429,
};

export async function POST(request: Request) {
  if (
    Number(request.headers.get("content-length") ?? 0) >
    MAX_AUDIO_BYTES + 65_536
  )
    return failure("too_large", 413);
  let session: Awaited<ReturnType<typeof requireUserId>>;
  try {
    session = await requireUserId();
  } catch {
    return failure("unauthenticated", 401);
  }
  const { supabase, userId } = session;
  try {
    const { planAccess, exam } = await getLearnerAccess();
    if (!hasPlanFeature(planAccess, "aiSpeakingFeedback"))
      return failure("not_included", 403);
    if (!isAiSpeakingConfigured()) return failure("unavailable", 503);

    const form = await request.formData().catch(() => null);
    const audio = form?.get("audio");
    const fields = fieldsSchema.safeParse({
      taskId: form?.get("taskId"),
      clientKey: form?.get("clientKey"),
      durationSeconds: Number(form?.get("durationSeconds")),
      practiceSubmissionId: form?.get("practiceSubmissionId") || undefined,
    });
    if (!fields.success || !(audio instanceof Blob))
      return failure("invalid", 400);
    if (audio.size > MAX_AUDIO_BYTES) return failure("too_large", 413);
    const extension = audioTypes[audio.type.split(";")[0].trim()];
    if (!extension) return failure("invalid", 415);
    if (audio.size < 1_000) return failure("too_short", 422);
    const task = exam ? getPublicSpeakingTask(exam, fields.data.taskId) : null;
    if (!exam || !task) return failure("invalid", 400);

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("ai_feedback_consent_version")
      .eq("id", userId)
      .single();
    if (profileError) throw profileError;
    if (profile.ai_feedback_consent_version !== aiFeedbackNoticeVersion)
      return failure("consent_required", 403);

    // A retried upload with the same key returns the first submission.
    const { data: existing, error: existingError } = await supabase
      .from("speaking_submissions")
      .select("id")
      .eq("client_key", fields.data.clientKey)
      .maybeSingle();
    if (existingError) throw existingError;
    if (existing) return Response.json({ ok: true, id: existing.id });

    const admin = createAdminClient();
    const { data: allowance, error: allowanceError } = await admin.rpc(
      "mpk_speaking_allowance",
      {
        p_user_id: userId,
        p_audio_seconds: Math.ceil(fields.data.durationSeconds),
      },
    );
    if (allowanceError) throw allowanceError;
    if (allowance !== "allowed")
      return failure(allowance as Reason, allowanceStatus[allowance] ?? 403);

    let transcription;
    try {
      transcription = await groqTranscribe(audio, `answer.${extension}`);
    } catch (error) {
      if (error instanceof GroqError && error.kind === "rate_limited")
        return failure("busy", 503, {
          retryAfterSeconds: error.retryAfterSeconds ?? 60,
        });
      if (error instanceof GroqError && error.kind === "rejected")
        return failure("invalid", 422);
      throw error;
    }
    const audioSeconds = Math.min(
      900,
      Math.max(
        1,
        Math.round(transcription.duration ?? fields.data.durationSeconds),
      ),
    );
    // Groq bills at least 10 seconds per request.
    const { error: usageError } = await admin.rpc("mpk_record_transcription", {
      p_model: speechToTextModel(),
      p_audio_seconds: Math.max(10, audioSeconds),
      p_failed: false,
    });
    if (usageError)
      logServerError("Transcription usage not recorded", usageError, {
        operation: "submit_speaking",
      });

    const cleaned = cleanTranscript(
      transcription.segments,
      transcription.words,
    );
    const transcript = (cleaned.text || transcription.text).trim();
    if (countWords(transcript) < 10) return failure("too_short", 422);
    const metrics = measureSpeech(cleaned.words, audioSeconds);

    if (fields.data.practiceSubmissionId) {
      const { error } = await supabase.rpc("mpk_submit_practice", {
        p_exam: exam,
        p_skill: "speaking",
        p_focus_competency: "",
        p_duration_seconds: audioSeconds,
        p_answers: [
          {
            question_id: task.id,
            sequence: 0,
            answer: "self_practice_completed",
            submission_id: fields.data.practiceSubmissionId,
          },
        ],
      });
      // Progress is secondary to the feedback the learner asked for.
      if (error)
        logServerError("Speaking practice session not saved", error, {
          operation: "submit_speaking",
        });
    }

    const { data, error } = await admin.rpc("mpk_submit_speaking", {
      p_user_id: userId,
      p_exam: exam,
      p_task_id: task.id,
      p_transcript: transcript.slice(0, 20_000),
      p_locale: await getLocale(),
      p_metrics: JSON.parse(JSON.stringify(metrics)),
      p_audio_seconds: audioSeconds,
      p_client_key: fields.data.clientKey,
    });
    if (error) {
      const { code } = getErrorDetails(error);
      if (code === "54000") return failure("daily_limit", 429);
      if (code === "22023")
        return failure(
          error.message.includes("speech") ? "too_short" : "invalid",
          422,
        );
      if (code === "42501")
        return failure(
          error.message.includes("consent")
            ? "consent_required"
            : "not_included",
          403,
        );
      throw error;
    }
    after(() => processSpeakingQueue({ maxJobs: 1 }).catch(() => undefined));
    return Response.json({ ok: true, id: (data as { id: string }).id });
  } catch (error) {
    return failure("unavailable", 500, { error });
  }
}
