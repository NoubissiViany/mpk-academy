import { emptyProgress } from "@/data/mock-state";
import { createEmptyExamProfile } from "@/lib/domain/exam-progress";
import type {
  Activity,
  AppState,
  DiagnosticIntake,
  DiagnosticResult,
  ExamId,
  ExamPreparationProfile,
  GuestAssessmentSession,
  User,
} from "@/types/domain";

export function createDiagnosticExamProfile(
  exam: ExamId,
  result: DiagnosticResult,
): ExamPreparationProfile {
  const profile = createEmptyExamProfile(exam);
  const reading = result.skillScores.reading;
  const listening = result.skillScores.listening;
  return {
    ...profile,
    readinessSource: "diagnostic",
    readinessBaseline30Days: result.score,
    readiness: result.score,
    skills: {
      ...profile.skills,
      reading: {
        baseline30Days: reading,
        current: reading,
        attempts: 1,
      },
      listening: {
        baseline30Days: listening,
        current: listening,
        attempts: 1,
      },
    },
  };
}

function userExam(user: User): ExamId | null {
  return user.goal.exam === "TEF Canada" || user.goal.exam === "TCF Canada"
    ? user.goal.exam
    : null;
}

export function createRegisteredLearnerState(
  user: User,
  session: GuestAssessmentSession | null,
): AppState {
  const exam = userExam(user);
  const profile = exam
    ? session
      ? createDiagnosticExamProfile(exam, session.result)
      : createEmptyExamProfile(exam)
    : null;
  return {
    schemaVersion: 5,
    user,
    planAccess: null,
    postCheckoutWelcomePending: false,
    examProfiles: exam && profile ? { [exam]: profile } : {},
    diagnosticIntake: session?.intake ?? null,
    diagnosticAnswers: session?.answers ?? {},
    diagnosticResult: session?.result ?? null,
    progress: {
      ...structuredClone(emptyProgress),
      diagnosticScore: session?.result.score ?? null,
      competencyScores: session?.result.competencyScores ?? {},
    },
    mistakes: [],
    activities: session ? [session.activity] : [],
  };
}

export function attachAssessmentToExistingState(
  state: AppState,
  user: User,
  session: GuestAssessmentSession | null,
): AppState {
  if (!session) return { ...state, user };
  const exam = userExam(user);
  const existingProfile = exam
    ? (state.examProfiles[exam] ?? createEmptyExamProfile(exam))
    : null;
  const diagnosticProfile = exam
    ? createDiagnosticExamProfile(exam, session.result)
    : null;
  const mergedProfile =
    existingProfile && diagnosticProfile
      ? {
          ...existingProfile,
          readinessSource: "diagnostic" as const,
          readinessBaseline30Days:
            existingProfile.readinessBaseline30Days ?? session.result.score,
          readiness: session.result.score,
          skills: {
            ...existingProfile.skills,
            reading:
              existingProfile.skills.reading.current === null
                ? diagnosticProfile.skills.reading
                : existingProfile.skills.reading,
            listening:
              existingProfile.skills.listening.current === null
                ? diagnosticProfile.skills.listening
                : existingProfile.skills.listening,
          },
        }
      : null;
  return {
    ...state,
    user,
    examProfiles:
      exam && mergedProfile
        ? { ...state.examProfiles, [exam]: mergedProfile }
        : state.examProfiles,
    diagnosticIntake: session.intake,
    diagnosticAnswers: session.answers,
    diagnosticResult: session.result,
    progress: {
      ...state.progress,
      diagnosticScore: session.result.score,
      competencyScores: {
        ...state.progress.competencyScores,
        ...session.result.competencyScores,
      },
    },
    activities: [
      session.activity,
      ...state.activities.filter(
        (activity) => activity.id !== session.activity.id,
      ),
    ],
  };
}

export function applyDiagnosticResult(
  state: AppState,
  intake: DiagnosticIntake,
  result: DiagnosticResult,
  activity: Activity,
): AppState {
  const exam =
    intake.goal === "TEF Canada" || intake.goal === "TCF Canada"
      ? intake.goal
      : state.user?.goal.exam === "TEF Canada" ||
          state.user?.goal.exam === "TCF Canada"
        ? state.user.goal.exam
        : null;
  const currentProfile = exam
    ? (state.examProfiles[exam] ?? createEmptyExamProfile(exam))
    : null;
  const diagnosticProfile = exam
    ? createDiagnosticExamProfile(exam, result)
    : null;
  const nextProfile =
    currentProfile && diagnosticProfile
      ? {
          ...currentProfile,
          readinessSource: "diagnostic" as const,
          readinessBaseline30Days:
            currentProfile.readinessBaseline30Days ?? result.score,
          readiness: result.score,
          skills: {
            ...currentProfile.skills,
            reading: {
              ...currentProfile.skills.reading,
              baseline30Days:
                currentProfile.skills.reading.baseline30Days ??
                diagnosticProfile.skills.reading.current,
              current: diagnosticProfile.skills.reading.current,
              attempts: currentProfile.skills.reading.attempts + 1,
            },
            listening: {
              ...currentProfile.skills.listening,
              baseline30Days:
                currentProfile.skills.listening.baseline30Days ??
                diagnosticProfile.skills.listening.current,
              current: diagnosticProfile.skills.listening.current,
              attempts: currentProfile.skills.listening.attempts + 1,
            },
          },
        }
      : null;
  return {
    ...state,
    postCheckoutWelcomePending: Boolean(state.planAccess),
    diagnosticIntake: intake,
    diagnosticResult: result,
    examProfiles:
      exam && nextProfile
        ? { ...state.examProfiles, [exam]: nextProfile }
        : state.examProfiles,
    progress: {
      ...state.progress,
      diagnosticScore: result.score,
      competencyScores: {
        ...state.progress.competencyScores,
        ...result.competencyScores,
      },
    },
    activities: [
      activity,
      ...state.activities.filter((item) => item.id !== activity.id),
    ],
  };
}
