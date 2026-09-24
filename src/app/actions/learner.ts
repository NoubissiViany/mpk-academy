"use server";

import { z } from "zod";
import { cookies } from "next/headers";
import { getErrorDetails, logServerError } from "@/lib/server/diagnostics";
import { getLearnerSnapshot, requireUserId } from "@/lib/supabase/learner";
import type {
  AppState,
  DiagnosticResult,
  GuestAssessmentSession,
} from "@/types/domain";

type AssessmentSubmission = {
  id: string;
  score: number;
  level: string | null;
};
type PracticeSubmission = {
  id: string;
  score: number;
  questionCount: number;
  correctCount: number;
};
type LessonCompletion = { lessonId: string; courseCompletion: number };

export type MutationFailureReason =
  "unauthenticated" | "invalid_submission" | "conflict" | "unavailable";

export type SnapshotFailureReason =
  "unauthenticated" | "profile_unavailable" | "service_unavailable";

export type SnapshotActionResult =
  | { ok: true; snapshot: AppState }
  | {
      ok: false;
      reason: SnapshotFailureReason;
      message: string;
      reference: string;
    };

type MutationFailure = {
  ok: false;
  reason: MutationFailureReason;
  message: string;
};

type DiagnosticMutationFailure = MutationFailure & { reference: string };

export type DiagnosticSubmissionResult =
  | {
      ok: true;
      data: { id: string; result: DiagnosticResult };
    }
  | DiagnosticMutationFailure;

export type MutationResult<T = undefined> =
  { ok: true; data: T; snapshot: AppState } | MutationFailure;

const examSchema = z.enum(["TEF Canada", "TCF Canada"]);
const answersSchema = z.record(z.string(), z.string());
const sessionAnswersSchema = z.array(
  z.object({
    questionId: z.string().min(1),
    sequence: z.number().int().min(0),
    answer: z.string(),
  }),
);
const intakeSchema = z.object({
  goal: z.enum(["TEF Canada", "TCF Canada", "Not sure yet"]),
  target: z.enum(["NCLC 5", "NCLC 7", "NCLC 9+", "I'm not sure"]),
  frenchExperience: z.enum([
    "I'm just starting",
    "I know some French",
    "I can communicate in French",
    "I'm already comfortable in French",
    "I'm not sure",
  ]),
});
const diagnosticSkillSchema = z.enum([
  "grammar",
  "vocabulary",
  "reading",
  "listening",
  "sentence-structure",
  "exam-strategy",
]);
const diagnosticResultSchema = z.object({
  id: z.string().uuid(),
  score: z.number().int().min(0).max(100),
  level: z.enum(["A2", "B1", "B2", "C1"]),
  competencyScores: z
    .object({
      "reading-main-idea": z.number(),
      "reading-detail": z.number(),
      "reading-inference": z.number(),
      "listening-main-idea": z.number(),
      "listening-detail": z.number(),
      "grammar-tense": z.number(),
      "grammar-prepositions": z.number(),
      "vocabulary-context": z.number(),
      connectors: z.number(),
      "time-expressions": z.number(),
    })
    .partial(),
  skillScores: z.object({
    grammar: z.number(),
    vocabulary: z.number(),
    reading: z.number(),
    listening: z.number(),
    "sentence-structure": z.number(),
    "exam-strategy": z.number(),
  }),
  strength: diagnosticSkillSchema,
  priority: diagnosticSkillSchema,
  recommendedModuleId: z.string().min(1),
});

function answerRows(answers: Record<string, string>) {
  return Object.entries(answers).map(([question_id, answer], sequence) => ({
    question_id,
    sequence,
    answer,
  }));
}

async function snapshotResult<T>(data: T): Promise<MutationResult<T>> {
  return { ok: true, data, snapshot: await getLearnerSnapshot() };
}

function invalidSubmission(message: string): MutationFailure {
  return { ok: false, reason: "invalid_submission", message };
}

function errorFields(error: unknown) {
  if (error instanceof Error)
    return { code: undefined, message: error.message };
  if (!error || typeof error !== "object")
    return { code: undefined, message: "" };
  const candidate = error as { code?: unknown; message?: unknown };
  return {
    code: typeof candidate.code === "string" ? candidate.code : undefined,
    message: typeof candidate.message === "string" ? candidate.message : "",
  };
}

function failure(operation: string, error: unknown): MutationFailure {
  const { code, message } = errorFields(error);
  const normalizedMessage = message.toLowerCase();
  const unauthenticated =
    normalizedMessage === "unauthorized" ||
    normalizedMessage.includes("authentication required") ||
    normalizedMessage.includes("jwt expired") ||
    code === "PGRST301";
  const reason: MutationFailureReason = unauthenticated
    ? "unauthenticated"
    : code === "22023"
      ? "invalid_submission"
      : code === "23505"
        ? "conflict"
        : "unavailable";

  console.error("Learner mutation failed", {
    operation,
    reason,
    code: code ?? "unknown",
    source: error instanceof Error ? error.name : "structured_server_error",
  });

  const publicMessage = {
    unauthenticated:
      "Your session has expired. Sign in again to save your progress.",
    invalid_submission:
      "The submitted information is invalid. Review it and try again.",
    conflict: "This update was already processed. Refresh and try again.",
    unavailable: "We could not save this update. Please try again.",
  } satisfies Record<MutationFailureReason, string>;

  return { ok: false, reason, message: publicMessage[reason] };
}

function diagnosticFailure(
  operation: "persist_assessment" | "load_assessment_result",
  error: unknown,
): DiagnosticMutationFailure {
  const { code, message } = errorFields(error);
  const normalizedMessage = message.toLowerCase();
  const unauthenticated =
    normalizedMessage === "unauthorized" ||
    normalizedMessage.includes("authentication required") ||
    normalizedMessage.includes("jwt expired") ||
    code === "PGRST301";
  const reason: MutationFailureReason = unauthenticated
    ? "unauthenticated"
    : code === "22023"
      ? "invalid_submission"
      : code === "23505"
        ? "conflict"
        : "unavailable";
  const publicMessage = {
    unauthenticated:
      "Your session has expired. Sign in again to save your progress.",
    invalid_submission:
      "The submitted information is invalid. Review it and try again.",
    conflict: "This update was already processed. Refresh and try again.",
    unavailable: "We could not save this update. Please try again.",
  } satisfies Record<MutationFailureReason, string>;
  const reference = logServerError("Diagnostic submission failed", error, {
    operation,
    reason,
  });
  return { ok: false, reason, message: publicMessage[reason], reference };
}

export async function getLearnerSnapshotAction(): Promise<SnapshotActionResult> {
  try {
    return { ok: true, snapshot: await getLearnerSnapshot() };
  } catch (error) {
    const { code } = getErrorDetails(error);
    const message = error instanceof Error ? error.message.toLowerCase() : "";
    const reason: SnapshotFailureReason =
      message.includes("unauthorized") ||
      message.includes("authentication required") ||
      message.includes("jwt expired") ||
      code === "PGRST301"
        ? "unauthenticated"
        : message.includes("learner profile") || code === "PGRST116"
          ? "profile_unavailable"
          : "service_unavailable";
    const publicMessage = {
      unauthenticated: "Your session has expired. Sign in again.",
      profile_unavailable:
        "Your account is signed in, but its learning profile could not be loaded.",
      service_unavailable:
        "Your learning profile is temporarily unavailable. Please try again.",
    } satisfies Record<SnapshotFailureReason, string>;
    const reference = logServerError("Learner snapshot failed", error, {
      operation: "load_learner_snapshot",
      reason,
    });
    return { ok: false, reason, message: publicMessage[reason], reference };
  }
}

export async function claimGuestAssessmentAction(
  session: GuestAssessmentSession,
): Promise<MutationResult<AssessmentSubmission>> {
  const parsed = z
    .object({
      id: z.string().uuid(),
      intake: intakeSchema,
      answers: answersSchema,
    })
    .safeParse(session);
  if (!parsed.success)
    return invalidSubmission("The saved assessment is invalid.");
  try {
    const { supabase } = await requireUserId();
    const exam =
      parsed.data.intake.goal === "TCF Canada" ? "TCF Canada" : "TEF Canada";
    const { data, error } = await supabase.rpc("mpk_submit_assessment", {
      p_guest_session_id: parsed.data.id,
      p_kind: "diagnostic",
      p_exam: exam,
      p_intake: parsed.data.intake,
      p_answers: answerRows(parsed.data.answers),
    });
    if (error) throw error;
    return await snapshotResult(data as unknown as AssessmentSubmission);
  } catch (error) {
    return failure("claim_guest_assessment", error);
  }
}

export async function submitDiagnosticAction(input: {
  submissionId: string;
  intake: unknown;
  answers: Record<string, string>;
}): Promise<DiagnosticSubmissionResult> {
  const parsed = z
    .object({
      submissionId: z.string().uuid(),
      intake: intakeSchema,
      answers: answersSchema,
    })
    .safeParse(input);
  if (!parsed.success) {
    const reference = logServerError(
      "Diagnostic submission failed",
      new Error("Diagnostic input validation failed"),
      { operation: "persist_assessment", reason: "invalid_submission" },
    );
    return {
      ok: false,
      reason: "invalid_submission",
      message: "Complete every assessment question.",
      reference,
    };
  }
  try {
    const { supabase } = await requireUserId();
    const exam =
      parsed.data.intake.goal === "TCF Canada" ? "TCF Canada" : "TEF Canada";
    const { data, error } = await supabase.rpc("mpk_submit_assessment", {
      p_guest_session_id: parsed.data.submissionId,
      p_kind: "diagnostic",
      p_exam: exam,
      p_intake: parsed.data.intake,
      p_answers: answerRows(parsed.data.answers),
    });
    if (error) return diagnosticFailure("persist_assessment", error);
    const saved = diagnosticResultSchema.safeParse(data);
    if (!saved.success)
      return diagnosticFailure(
        "load_assessment_result",
        new Error("The assessment RPC returned an invalid result."),
      );
    const { id, ...result } = saved.data;
    return { ok: true, data: { id, result } };
  } catch (error) {
    return diagnosticFailure("persist_assessment", error);
  }
}

export async function submitPracticeAction(input: {
  exam: unknown;
  skill: unknown;
  focus?: string | null;
  durationSeconds: number;
  answers: Array<{ questionId: string; sequence: number; answer: string }>;
}): Promise<MutationResult<PracticeSubmission>> {
  const parsed = z
    .object({
      exam: examSchema,
      skill: z.enum(["reading", "listening", "writing", "speaking"]),
      focus: z.string().nullable().optional(),
      durationSeconds: z
        .number()
        .int()
        .min(0)
        .max(24 * 60 * 60),
      answers: sessionAnswersSchema.min(1),
    })
    .safeParse(input);
  if (!parsed.success)
    return invalidSubmission("The practice submission is invalid.");
  try {
    const { supabase } = await requireUserId();
    const { data, error } = await supabase.rpc("mpk_submit_practice", {
      p_exam: parsed.data.exam,
      p_skill: parsed.data.skill,
      p_focus_competency: parsed.data.focus ?? "",
      p_duration_seconds: parsed.data.durationSeconds,
      p_answers: parsed.data.answers.map((answer) => ({
        question_id: answer.questionId,
        sequence: answer.sequence,
        answer: answer.answer,
      })),
    });
    if (error) throw error;
    return await snapshotResult(data as unknown as PracticeSubmission);
  } catch (error) {
    return failure("submit_practice", error);
  }
}

export async function submitMockExamAction(input: {
  exam: unknown;
  answers: Array<{ questionId: string; sequence: number; answer: string }>;
}): Promise<MutationResult<AssessmentSubmission>> {
  const parsed = z
    .object({ exam: examSchema, answers: sessionAnswersSchema.min(1) })
    .safeParse(input);
  if (!parsed.success)
    return invalidSubmission("The exam submission is invalid.");
  try {
    const { supabase } = await requireUserId();
    const { data, error } = await supabase.rpc("mpk_submit_assessment", {
      p_guest_session_id: "",
      p_kind: "mock_exam",
      p_exam: parsed.data.exam,
      p_intake: {},
      p_answers: parsed.data.answers.map((answer) => ({
        question_id: answer.questionId,
        sequence: answer.sequence,
        answer: answer.answer,
      })),
    });
    if (error) throw error;
    return await snapshotResult(data as unknown as AssessmentSubmission);
  } catch (error) {
    return failure("submit_mock_exam", error);
  }
}

export async function completeLessonAction(
  lessonId: string,
): Promise<MutationResult<LessonCompletion>> {
  if (!z.string().min(1).max(200).safeParse(lessonId).success)
    return invalidSubmission("Unknown lesson.");
  try {
    const { supabase } = await requireUserId();
    const { data, error } = await supabase.rpc("mpk_complete_lesson", {
      p_lesson_id: lessonId,
    });
    if (error) throw error;
    return await snapshotResult(data as unknown as LessonCompletion);
  } catch (error) {
    return failure("complete_lesson", error);
  }
}

export async function updateProfileAction(input: {
  firstName: string;
  lastName: string;
  locale: "en" | "fr";
  assistance: "full" | "on_request" | "minimal";
}): Promise<MutationResult> {
  try {
    const { supabase } = await requireUserId();
    const { error } = await supabase.rpc("mpk_update_profile", {
      p_first_name: input.firstName,
      p_last_name: input.lastName,
      p_locale: input.locale,
      p_assistance: input.assistance,
    });
    if (error) throw error;
    const cookieStore = await cookies();
    cookieStore.set("mpk_locale", input.locale, {
      path: "/",
      maxAge: 31_536_000,
      sameSite: "lax",
    });
    return await snapshotResult(undefined);
  } catch (error) {
    return failure("update_profile", error);
  }
}

export async function updateExamGoalAction(input: {
  exam: "TEF Canada" | "TCF Canada";
  target: "NCLC 5" | "NCLC 7" | "NCLC 9+" | "I'm not sure";
  targetDate?: string;
}): Promise<MutationResult> {
  try {
    const { supabase } = await requireUserId();
    const goalArgs = {
      p_exam: input.exam,
      p_target: input.target,
      ...(input.targetDate ? { p_target_date: input.targetDate } : {}),
    };
    const { error } = await supabase.rpc("mpk_update_exam_goal", goalArgs);
    if (error) throw error;
    return await snapshotResult(undefined);
  } catch (error) {
    return failure("update_exam_goal", error);
  }
}

export async function updateMistakeStatusAction(
  mistakeId: string,
  status: "new" | "reviewing" | "resolved",
): Promise<MutationResult> {
  try {
    const { supabase } = await requireUserId();
    const { error } = await supabase.rpc("mpk_update_mistake_status", {
      p_mistake_id: mistakeId,
      p_status: status,
    });
    if (error) throw error;
    return await snapshotResult(undefined);
  } catch (error) {
    return failure("update_mistake_status", error);
  }
}
