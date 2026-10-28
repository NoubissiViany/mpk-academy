import "server-only";
import { diagnosticWritingVersion } from "@/lib/domain/diagnostic-writing";

import {
  storedFeedbackSchema,
  type WritingFeedback,
} from "@/lib/domain/writing-feedback";
import type { WritingChecks } from "@/lib/domain/writing-checks";
import { requireUserId } from "@/lib/supabase/learner";
import type { ExamId } from "@/types/domain";

export type WritingSubmissionStatus =
  "queued" | "processing" | "done" | "failed";

export interface WritingSubmission {
  id: string;
  exam: ExamId;
  taskId: string;
  parentId: string | null;
  body: string;
  wordCount: number;
  checks: WritingChecks | null;
  status: WritingSubmissionStatus;
  feedback: WritingFeedback | null;
  createdAt: string;
  flaggedFixes: number[];
}

/** One of the learner's own submissions (row-level security applies). */
export async function getWritingSubmission(
  id: string,
): Promise<WritingSubmission | null> {
  const { supabase } = await requireUserId();
  const [submission, flags] = await Promise.all([
    supabase
      .from("writing_submissions")
      .select(
        "id, exam, task_id, parent_id, body, word_count, checks, status, feedback, created_at",
      )
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("writing_feedback_flags")
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
    parentId: row.parent_id,
    body: row.body,
    wordCount: row.word_count,
    checks:
      row.checks && typeof row.checks === "object" && "words" in row.checks
        ? (row.checks as unknown as WritingChecks)
        : null,
    status: row.status as WritingSubmissionStatus,
    feedback: feedback.success ? (feedback.data as WritingFeedback) : null,
    createdAt: row.created_at,
    flaggedFixes: flags.data.map((flag) => flag.fix_index),
  };
}

export async function listWritingSubmissions() {
  const { supabase } = await requireUserId();
  const { data, error } = await supabase
    .from("writing_submissions")
    .select("id, task_id, parent_id, status, word_count, created_at")
    .neq("task_id", diagnosticWritingVersion)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return data.map((row) => ({
    id: row.id,
    taskId: row.task_id,
    parentId: row.parent_id,
    status: row.status as WritingSubmissionStatus,
    wordCount: row.word_count,
    createdAt: row.created_at,
  }));
}
