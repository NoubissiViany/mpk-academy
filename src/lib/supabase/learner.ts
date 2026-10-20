import "server-only";
import { cache } from "react";
import { getCourseModules } from "@/data/course";

import { defaultState, emptyProgress } from "@/data/mock-state";
import { isPaidPlanId } from "@/config/product";
import { createEmptyExamProfile } from "@/lib/domain/exam-progress";
import type { PracticeAnswerRecord } from "@/lib/domain/practice-selection";
import { logServerError } from "@/lib/server/diagnostics";
import { createClient } from "@/lib/supabase/server";
import type {
  Activity,
  AppState,
  AssistanceLevel,
  CompetencyId,
  DiagnosticIntake,
  DiagnosticResult,
  DiagnosticSkill,
  ExamId,
  ExamPreparationProfile,
  ExamSkill,
  ExamType,
  Locale,
  MistakeCategory,
  NclcTarget,
  PaidPlanId,
  ReviewItem,
} from "@/types/domain";
import type { Tables } from "@/types/database";

export async function requireUserId() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;
  const userId = claims?.sub;
  if (error) throw error;
  if (!claims || typeof userId !== "string") throw new Error("Unauthorized");
  return { supabase, userId, claims };
}

/** Past answers to these practice items and the reviews due now, oldest first. */
export async function getPracticeHistory(
  exam: ExamId,
  skill: "reading" | "listening",
  questionIds: string[],
): Promise<{ answers: PracticeAnswerRecord[]; dueIds: string[] }> {
  const { supabase, userId } = await requireUserId();
  const [answers, due] = await Promise.all([
    supabase
      .from("practice_answers")
      .select("question_id, is_correct, answered_at")
      .eq("user_id", userId)
      .in("question_id", questionIds)
      .order("answered_at", { ascending: false })
      .limit(2000),
    supabase
      .from("review_items")
      .select("question_id")
      .eq("user_id", userId)
      .eq("exam", exam)
      .eq("skill", skill)
      .lte("due_at", new Date().toISOString())
      .order("due_at"),
  ]);
  if (answers.error) throw answers.error;
  if (due.error) throw due.error;
  return {
    answers: answers.data.flatMap((row) =>
      row.is_correct === null
        ? []
        : [
            {
              questionId: row.question_id,
              correct: row.is_correct,
              answeredAt: row.answered_at,
            },
          ],
    ),
    dueIds: due.data.map((row) => row.question_id),
  };
}

export async function getPracticeResult(sessionId: string) {
  const { supabase, userId } = await requireUserId();
  const { data, error } = await supabase
    .from("practice_sessions")
    .select(
      "id, exam, skill, score, correct_count, question_count, completed_at, evidence_mode",
    )
    .eq("id", sessionId)
    .eq("user_id", userId)
    .eq("status", "completed")
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getAssessmentResult(assessmentId: string) {
  const { supabase, userId } = await requireUserId();
  const { data: assessment, error: assessmentError } = await supabase
    .from("assessments")
    .select("id, exam, kind, completed_at")
    .eq("id", assessmentId)
    .eq("user_id", userId)
    .eq("status", "completed")
    .maybeSingle();
  if (assessmentError) throw assessmentError;
  if (!assessment) return null;
  const { data: result, error: resultError } = await supabase
    .from("assessment_results")
    .select("score, level, skill_scores")
    .eq("assessment_id", assessmentId)
    .eq("user_id", userId)
    .maybeSingle();
  if (resultError) throw resultError;
  return result ? { ...assessment, ...result } : null;
}

function activeEntitlement(rows: Tables<"entitlements">[]) {
  const now = Date.now();
  return rows.find(
    (row) =>
      row.status === "active" &&
      Date.parse(row.starts_at) <= now &&
      (!row.ends_at || Date.parse(row.ends_at) > now),
  );
}

/** Entitlement and exam goal only: enough to authorize a content request. */
export async function getLearnerAccess(): Promise<{
  planAccess: AppState["planAccess"];
  exam: ExamId | null;
}> {
  const { supabase, userId } = await requireUserId();
  const [entitlementResponse, goalResponse] = await Promise.all([
    supabase.from("entitlements").select("*").eq("user_id", userId),
    supabase.from("exam_goals").select("exam").eq("user_id", userId).single(),
  ]);
  if (entitlementResponse.error) throw entitlementResponse.error;
  if (goalResponse.error) throw goalResponse.error;
  const entitlement = activeEntitlement(entitlementResponse.data ?? []);
  const exam = goalResponse.data.exam;
  return {
    planAccess: entitlement
      ? {
          planId: entitlement.plan_id as PaidPlanId,
          purchasedAt: entitlement.starts_at,
          accessUntil: entitlement.ends_at,
        }
      : null,
    exam: exam === "TEF Canada" || exam === "TCF Canada" ? exam : null,
  };
}

/** Deduplicated per request: the student layout and its page share one load. */
export const getLearnerSnapshot = cache(loadLearnerSnapshot);

async function loadLearnerSnapshot(): Promise<AppState> {
  const { supabase, userId } = await requireUserId();
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  if (!authData.user) throw new Error("Unauthorized");

  const [
    profileResponse,
    goalResponse,
    entitlementResponse,
    progressResponse,
    skillsResponse,
    mistakesResponse,
    historyResponse,
    lessonsResponse,
    diagnosticResponse,
    practiceResponse,
    mockResponse,
    reviewsResponse,
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).single(),
    supabase.from("exam_goals").select("*").eq("user_id", userId).single(),
    supabase
      .from("entitlements")
      .select("*")
      .eq("user_id", userId)
      .order("starts_at", { ascending: false }),
    supabase.from("learner_progress").select("*").eq("user_id", userId),
    supabase.from("skill_scores").select("*").eq("user_id", userId),
    supabase
      .from("mistakes")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
    supabase
      .from("progress_history")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("lesson_progress")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "completed"),
    supabase
      .from("assessments")
      .select("*")
      .eq("user_id", userId)
      .eq("kind", "diagnostic")
      .eq("status", "completed")
      .order("completed_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("practice_sessions")
      .select("score")
      .eq("user_id", userId)
      .eq("status", "completed")
      .order("completed_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("assessments")
      .select("id")
      .eq("user_id", userId)
      .eq("kind", "mock_exam")
      .eq("status", "completed")
      .order("completed_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("review_items")
      .select("question_id, exam, skill, step, due_at")
      .eq("user_id", userId)
      .order("due_at"),
  ]);

  if (
    profileResponse.error ||
    goalResponse.error ||
    !profileResponse.data ||
    !goalResponse.data
  )
    throw Object.assign(new Error("Learner profile is unavailable."), {
      code: profileResponse.error?.code ?? goalResponse.error?.code,
      status: profileResponse.error
        ? profileResponse.status
        : goalResponse.status,
      name: "LearnerProfileError",
    });

  const relatedError = [
    entitlementResponse,
    progressResponse,
    skillsResponse,
    mistakesResponse,
    historyResponse,
    lessonsResponse,
    diagnosticResponse,
    practiceResponse,
    mockResponse,
  ].find((response) => response.error)?.error;
  if (relatedError) throw relatedError;
  // The review queue is an aid, not a requirement: without it (for example
  // before its migration reaches a project) learners still get their pages.
  if (reviewsResponse.error)
    logServerError("Review queue unavailable", reviewsResponse.error);

  const diagnostic = diagnosticResponse.data;
  const [
    diagnosticResultResponse,
    diagnosticAnswersResponse,
    mockResultResponse,
  ] = await Promise.all([
    diagnostic
      ? supabase
          .from("assessment_results")
          .select("*")
          .eq("assessment_id", diagnostic.id)
          .single()
      : Promise.resolve({ data: null, error: null }),
    diagnostic
      ? supabase
          .from("assessment_answers")
          .select("question_id, answer")
          .eq("assessment_id", diagnostic.id)
      : Promise.resolve({ data: [], error: null }),
    mockResponse.data
      ? supabase
          .from("assessment_results")
          .select("score")
          .eq("assessment_id", mockResponse.data.id)
          .single()
      : Promise.resolve({ data: null, error: null }),
  ]);

  const profile = profileResponse.data;
  const goal = goalResponse.data;
  const entitlements = entitlementResponse.data ?? [];
  const entitlement = activeEntitlement(entitlements);
  const checkoutIntentCandidate =
    authData.user.user_metadata.checkout_intent_plan_id;
  const checkoutIntentPlanId = isPaidPlanId(checkoutIntentCandidate)
    ? checkoutIntentCandidate
    : null;
  const progressRows = progressResponse.data ?? [];
  const skillRows = skillsResponse.data ?? [];
  const examProfiles: Partial<Record<ExamId, ExamPreparationProfile>> = {};

  for (const row of progressRows) {
    const exam = row.exam as ExamId;
    const base = createEmptyExamProfile(exam);
    const skills = { ...base.skills };
    for (const score of skillRows.filter((item) => item.exam === exam)) {
      skills[score.skill as ExamSkill] = {
        baseline30Days: score.baseline_30_days,
        current: score.current_score,
        attempts: score.attempts,
        ...(score.last_practiced_at
          ? { lastPracticedAt: score.last_practiced_at }
          : {}),
      };
    }
    examProfiles[exam] = {
      exam,
      readinessSource: row.readiness_source as "diagnostic" | null,
      readinessBaseline30Days: row.readiness_baseline_30_days,
      readiness: row.readiness,
      skills,
      weekly: {
        weekStartedAt: row.week_started_at,
        practiceSessions: row.weekly_practice_sessions,
        minutesStudied: row.weekly_minutes_studied,
        questionsReviewed: row.weekly_questions_reviewed,
        readinessChange: row.weekly_readiness_change,
      },
      mockAverage: row.mock_average,
      mockAttempts: row.mock_attempts,
    };
  }

  const activeExam: ExamId =
    goal.exam === "TCF Canada" ? "TCF Canada" : "TEF Canada";
  const activeProgress = progressRows.find((row) => row.exam === activeExam);
  const activeLessons = getCourseModules(
    activeExam === "TCF Canada" ? "TCF" : "TEF",
  ).flatMap((module) => module.lessons);
  const completedCurrentLessons = activeLessons.filter((lesson) =>
    (lessonsResponse.data ?? []).some((saved) => saved.lesson_id === lesson.id),
  );
  const resultRow = diagnosticResultResponse.data;
  const diagnosticResult: DiagnosticResult | null = resultRow
    ? {
        score: resultRow.score,
        algorithmVersion: resultRow.algorithm_version,
        assessedItemCount: resultRow.assessed_item_count ?? undefined,
        languageFoundation: resultRow.language_foundation ?? undefined,
        level: resultRow.level as DiagnosticResult["level"],
        competencyScores:
          resultRow.competency_scores as DiagnosticResult["competencyScores"],
        skillScores: resultRow.skill_scores as DiagnosticResult["skillScores"],
        strength: resultRow.strength as DiagnosticSkill,
        priority: resultRow.priority as DiagnosticSkill,
        recommendedModuleId: resultRow.recommended_module_id ?? "core-grammar",
      }
    : null;

  return {
    ...structuredClone(defaultState),
    user: {
      id: userId,
      firstName: profile.first_name,
      lastName: profile.last_name,
      email: authData.user.email ?? "",
      tier: entitlement ? "paid_student" : "free_student",
      locale: profile.locale as Locale,
      assistance: profile.assistance as AssistanceLevel,
      goal: {
        exam: goal.exam as ExamType,
        target: goal.target as NclcTarget,
        ...(goal.target_date ? { targetDate: goal.target_date } : {}),
      },
    },
    planAccess: entitlement
      ? {
          planId: entitlement.plan_id as PaidPlanId,
          purchasedAt: entitlement.starts_at,
          accessUntil: entitlement.ends_at,
        }
      : null,
    checkoutIntentPlanId: entitlement ? null : checkoutIntentPlanId,
    postCheckoutWelcomePending: false,
    examProfiles,
    diagnosticIntake:
      (diagnostic?.intake as DiagnosticIntake | undefined) ?? null,
    diagnosticAnswers: Object.fromEntries(
      (diagnosticAnswersResponse.data ?? []).map((answer) => [
        answer.question_id,
        answer.answer,
      ]),
    ),
    diagnosticResult,
    progress: activeProgress
      ? {
          completedLessonIds: (lessonsResponse.data ?? []).map(
            (lesson) => lesson.lesson_id,
          ),
          quizAverage: activeProgress.quiz_average,
          practiceAnswered: activeProgress.practice_answered,
          practiceAccuracy: activeProgress.practice_accuracy,
          simulationsCompleted: activeProgress.simulations_completed,
          simulationAverage: activeProgress.simulation_average,
          diagnosticScore: activeProgress.diagnostic_score,
          courseCompletion: Math.round(
            (100 * completedCurrentLessons.length) /
              Math.max(activeLessons.length, 1),
          ),
          competencyScores: activeProgress.competency_scores as Partial<
            Record<CompetencyId, number>
          >,
        }
      : structuredClone(emptyProgress),
    mistakes: (mistakesResponse.data ?? []).map((mistake) => ({
      id: mistake.id,
      questionId: mistake.question_id,
      competencyId: mistake.competency_id as CompetencyId,
      mistakeCategory: mistake.category as MistakeCategory,
      learnerAnswer: mistake.learner_answer,
      correctAnswer: mistake.correct_answer,
      explanation: mistake.explanation,
      timestamp: mistake.created_at,
      reviewStatus: mistake.review_status as "new" | "reviewing" | "resolved",
      exam: (mistake.exam as ExamId | null) ?? undefined,
      examSkill: (mistake.exam_skill as ExamSkill | null) ?? undefined,
      pattern: mistake.pattern ?? undefined,
      count: mistake.occurrence_count,
    })),
    reviews: (reviewsResponse.error ? [] : (reviewsResponse.data ?? [])).map(
      (review) => ({
        questionId: review.question_id,
        exam: review.exam as ExamId,
        skill: review.skill as ReviewItem["skill"],
        step: review.step,
        dueAt: review.due_at,
      }),
    ),
    activities: (historyResponse.data ?? []).map((event) => ({
      id: event.id,
      label: event.label,
      detail: event.detail,
      timestamp: event.created_at,
      kind: event.event_type as Activity["kind"],
    })),
    ...(practiceResponse.data
      ? { lastPracticeScore: practiceResponse.data.score ?? undefined }
      : {}),
    ...(mockResultResponse.data
      ? { lastExamScore: mockResultResponse.data.score }
      : {}),
  };
}

/** Only completed, owned assessments expose their answers for correction. */
export async function getCompletedAssessmentAnswers(assessmentId: string) {
  const result = await getAssessmentResult(assessmentId);
  if (!result) return [];
  const { supabase, userId } = await requireUserId();
  const { data, error } = await supabase
    .from("assessment_answers")
    .select("question_id, answer, is_correct, sequence")
    .eq("assessment_id", assessmentId)
    .eq("user_id", userId)
    .order("sequence");
  if (error) throw error;
  return data ?? [];
}
