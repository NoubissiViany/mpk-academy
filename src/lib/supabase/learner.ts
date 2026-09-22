import "server-only";

import { defaultState, emptyProgress } from "@/data/mock-state";
import { createEmptyExamProfile } from "@/lib/domain/exam-progress";
import { createClient } from "@/lib/supabase/server";
import type {
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
} from "@/types/domain";
import type { Tables } from "@/types/database";

export async function requireUserId() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (error) throw error;
  if (typeof userId !== "string") throw new Error("Unauthorized");
  return { supabase, userId };
}

export async function getPracticeResult(sessionId: string) {
  const { supabase, userId } = await requireUserId();
  const { data, error } = await supabase
    .from("practice_sessions")
    .select(
      "id, exam, skill, score, correct_count, question_count, completed_at",
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

export async function getLearnerSnapshot(): Promise<AppState> {
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
  const resultRow = diagnosticResultResponse.data;
  const diagnosticResult: DiagnosticResult | null = resultRow
    ? {
        score: resultRow.score,
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
          courseCompletion: activeProgress.course_completion,
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
    activities: (historyResponse.data ?? []).map((event) => ({
      id: event.id,
      label: event.label,
      detail: event.detail,
      timestamp: event.created_at,
    })),
    ...(practiceResponse.data
      ? { lastPracticeScore: practiceResponse.data.score }
      : {}),
    ...(mockResultResponse.data
      ? { lastExamScore: mockResultResponse.data.score }
      : {}),
  };
}
