import "server-only";

import type { SpeakingMetrics } from "@/lib/domain/speaking-metrics";
import {
  storedFeedbackSchema,
  type WritingFeedback,
} from "@/lib/domain/writing-feedback";
import { requireUserId } from "@/lib/supabase/learner";
import type { ExamId } from "@/types/domain";

export type SpeakingSubmissionStatus =
  "queued" | "processing" | "done" | "failed";

export interface SpeakingSubmission {
  id: string;
  exam: ExamId;
  taskId: string;
  transcript: string;
  metrics: SpeakingMetrics | null;
  status: SpeakingSubmissionStatus;
  feedback: WritingFeedback | null;
  createdAt: string;
  flaggedFixes: number[];
}

/** One of the learner's own recordings (row-level security applies). */
export async function getSpeakingSubmission(
  id: string,
): Promise<SpeakingSubmission | null> {
  const { supabase } = await requireUserId();
  const [submission, flags] = await Promise.all([
    supabase
      .from("speaking_submissions")
      .select(
        "id, exam, task_id, transcript, metrics, status, feedback, created_at",
      )
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("speaking_feedback_flags")
      .select("fix_index")
      .eq("submission_id", id),
  ]);
  if (submission.error) throw submission.error;
  if (flags.error) throw flags.error;
  const row = submission.data;
  if (!row) return null;
  const feedback = storedFeedbackSchema.safeParse(row.feedback);
  return {
    id: row.id,
    exam: row.exam as ExamId,
    taskId: row.task_id,
    transcript: row.transcript,
    metrics:
      row.metrics && typeof row.metrics === "object" && "words" in row.metrics
        ? (row.metrics as unknown as SpeakingMetrics)
        : null,
    status: row.status as SpeakingSubmissionStatus,
    feedback: feedback.success ? (feedback.data as WritingFeedback) : null,
    createdAt: row.created_at,
    flaggedFixes: flags.data.map((flag) => flag.fix_index),
  };
}

export async function listSpeakingSubmissions() {
  const { supabase } = await requireUserId();
  const { data, error } = await supabase
    .from("speaking_submissions")
    .select("id, task_id, status, audio_seconds, created_at")
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return data.map((row) => ({
    id: row.id,
    taskId: row.task_id,
    status: row.status as SpeakingSubmissionStatus,
    audioSeconds: row.audio_seconds,
    createdAt: row.created_at,
  }));
}
