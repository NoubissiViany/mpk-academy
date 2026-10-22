"use server";

import { z } from "zod";
import { hasPlanFeature } from "@/config/product";
import { lessonSummaries } from "@/content/summaries";
import { getLocale, getMessages } from "@/i18n/server";
import { canAccessLesson } from "@/lib/domain/access";
import {
  checkLessonCheckpoint,
  checkPracticeAnswer,
  checkSampleAnswer,
  getModelResponse,
  scoreGuestDiagnostic,
} from "@/lib/server/content";
import { logServerError } from "@/lib/server/diagnostics";
import { getLearnerAccess } from "@/lib/supabase/learner";
import type { AnswerFeedback, DiagnosticResult } from "@/types/domain";

type Failure = {
  ok: false;
  reason:
    "unauthenticated" | "locked" | "not_found" | "invalid" | "unavailable";
  message: string;
  reference?: string;
};

async function fail(
  reason: Failure["reason"],
  error?: unknown,
  operation?: string,
): Promise<Failure> {
  const errors = (await getMessages()).common.errors;
  const message = {
    unauthenticated: errors.unauthenticated,
    locked: errors.locked,
    not_found: errors.notFound,
    invalid: errors.invalid,
    unavailable: errors.unavailable,
  }[reason];
  if (reason !== "unavailable") return { ok: false, reason, message };
  const reference = logServerError("Content request failed", error, {
    operation,
  });
  return { ok: false, reason, message, reference };
}

function isUnauthenticated(error: unknown) {
  const message = error instanceof Error ? error.message.toLowerCase() : "";
  return message.includes("unauthorized") || message.includes("jwt expired");
}

async function access(operation: string) {
  try {
    return { ok: true as const, ...(await getLearnerAccess()) };
  } catch (error) {
    return isUnauthenticated(error)
      ? fail("unauthenticated")
      : fail("unavailable", error, operation);
  }
}

const answersSchema = z
  .record(z.string().max(100), z.string().max(500))
  .refine((answers) => Object.keys(answers).length <= 60);

/** Guests are scored on the server so the answer key never reaches the browser. */
export async function scoreGuestDiagnosticAction(
  answers: Record<string, string>,
): Promise<{ ok: true; result: DiagnosticResult } | Failure> {
  const parsed = answersSchema.safeParse(answers);
  if (!parsed.success) return fail("invalid");
  return { ok: true, result: scoreGuestDiagnostic(parsed.data) };
}

/** The public landing sample: no account needed, same server-side checking. */
export async function checkSampleAnswerAction(
  questionId: string,
  answer: string,
): Promise<{ ok: true; feedback: AnswerFeedback } | Failure> {
  const parsed = z
    .object({
      questionId: z.string().min(1).max(100),
      answer: z.string().max(500),
    })
    .safeParse({ questionId, answer });
  if (!parsed.success) return fail("invalid");
  const feedback = checkSampleAnswer(
    parsed.data.questionId,
    parsed.data.answer,
    await getLocale(),
  );
  return feedback ? { ok: true, feedback } : fail("not_found");
}

export async function checkPracticeAnswerAction(
  questionId: string,
  answer: string,
): Promise<{ ok: true; feedback: AnswerFeedback } | Failure> {
  const parsed = z
    .object({
      questionId: z.string().min(1).max(100),
      answer: z.string().max(500),
    })
    .safeParse({ questionId, answer });
  if (!parsed.success) return fail("invalid");
  const learner = await access("check_practice_answer");
  if (!learner.ok) return learner;
  if (!hasPlanFeature(learner.planAccess, "practice")) return fail("locked");
  const feedback = checkPracticeAnswer(
    learner.exam ?? "TEF Canada",
    parsed.data.questionId,
    parsed.data.answer,
    await getLocale(),
  );
  return feedback ? { ok: true, feedback } : fail("not_found");
}

export async function checkLessonCheckpointAction(
  lessonId: string,
  checkpointIndex: number,
  answerIndex: number,
): Promise<{ ok: true; feedback: AnswerFeedback } | Failure> {
  const summary = lessonSummaries.find((lesson) => lesson.id === lessonId);
  if (
    !summary ||
    ![checkpointIndex, answerIndex].every(
      (value) => Number.isInteger(value) && value >= 0,
    )
  )
    return fail("invalid");
  const learner = await access("check_lesson_checkpoint");
  if (!learner.ok) return learner;
  if (!canAccessLesson(learner.planAccess, summary)) return fail("locked");
  const feedback = checkLessonCheckpoint(
    lessonId,
    checkpointIndex,
    answerIndex,
    await getLocale(),
  );
  return feedback ? { ok: true, feedback } : fail("not_found");
}

export async function getModelResponseAction(
  taskId: string,
): Promise<{ ok: true; modelResponse: string; audio?: string } | Failure> {
  if (!/^[a-z0-9-]{1,100}$/.test(taskId)) return fail("invalid");
  const learner = await access("get_model_response");
  if (!learner.ok) return learner;
  if (!hasPlanFeature(learner.planAccess, "practice")) return fail("locked");
  const model = getModelResponse(learner.exam ?? "TEF Canada", taskId);
  return model
    ? { ok: true, modelResponse: model.text, audio: model.audio }
    : fail("not_found");
}
