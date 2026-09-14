import { productConfig } from "@/config/product";
import { defaultState } from "@/data/mock-state";
import { diagnosticQuestions } from "@/data/questions";
import { scoreDiagnostic } from "@/lib/domain/diagnostic";
import { createEmptyExamProfile } from "@/lib/domain/exam-progress";
import type {
  AppState,
  ExamPreparationProfile,
  NclcTarget,
} from "@/types/domain";

function migrateTarget(value: unknown): NclcTarget {
  if (value === "B1" || value === "NCLC 5") return "NCLC 5";
  if (value === "C1" || value === "NCLC 9+") return "NCLC 9+";
  if (value === "I'm not sure" || value === "Not sure") return "I'm not sure";
  return "NCLC 7";
}

function migrateExamProfile(
  value: Record<string, unknown>,
): ExamPreparationProfile | null {
  const user = value.user as AppState["user"] | null;
  const exam = user?.goal.exam;
  if (exam !== "TEF Canada" && exam !== "TCF Canada") return null;

  const progress = value.progress as AppState["progress"];
  const profile = createEmptyExamProfile(exam);
  const reading = progress?.competencyScores?.["reading-main-idea"];
  const listening = progress?.competencyScores?.["listening-detail"];
  const readiness = progress?.simulationAverage || null;

  return {
    ...profile,
    readinessBaseline30Days: readiness,
    readiness,
    skills: {
      reading: {
        baseline30Days: reading ?? null,
        current: reading ?? null,
        attempts: reading == null ? 0 : 1,
      },
      listening: {
        baseline30Days: listening ?? null,
        current: listening ?? null,
        attempts: listening == null ? 0 : 1,
      },
      writing: profile.skills.writing,
      speaking: profile.skills.speaking,
    },
    mockAverage: progress?.simulationAverage || null,
    mockAttempts: progress?.simulationsCompleted ?? 0,
  };
}

function migrateToV3(value: Record<string, unknown>): AppState {
  const schemaVersion = value.schemaVersion;
  const user = value.user as AppState["user"] | null;
  const migratedUser = user
    ? {
        ...user,
        goal: { ...user.goal, target: migrateTarget(user.goal.target) },
      }
    : null;
  const legacyProfile = migrateExamProfile({ ...value, user: migratedUser });
  const diagnosticResult =
    schemaVersion === 1 && value.diagnosticResult
      ? scoreDiagnostic(
          diagnosticQuestions,
          (value.diagnosticAnswers as Record<string, string>) ?? {},
        )
      : (value.diagnosticResult as AppState["diagnosticResult"]);

  return {
    ...structuredClone(defaultState),
    ...(value as unknown as Partial<AppState>),
    schemaVersion: 3,
    user: migratedUser,
    examProfiles:
      (value.examProfiles as AppState["examProfiles"] | undefined) ??
      (legacyProfile ? { [legacyProfile.exam]: legacyProfile } : {}),
    diagnosticIntake: value.diagnosticIntake
      ? {
          ...(value.diagnosticIntake as NonNullable<
            AppState["diagnosticIntake"]
          >),
          target: migrateTarget(
            (value.diagnosticIntake as { target?: unknown }).target,
          ),
        }
      : null,
    diagnosticResult: diagnosticResult ?? null,
  };
}

export function loadState(): AppState {
  if (typeof window === "undefined") return structuredClone(defaultState);
  try {
    const value: unknown = JSON.parse(
      localStorage.getItem(productConfig.storageKey) ?? "null",
    );
    if (value && typeof value === "object" && "schemaVersion" in value) {
      if (value.schemaVersion === 3)
        return migrateToV3(value as Record<string, unknown>);
      if (value.schemaVersion === 1 || value.schemaVersion === 2)
        return migrateToV3(value as Record<string, unknown>);
    }
  } catch {
    /* Invalid mock data falls back to a safe seed. */
  }
  return structuredClone(defaultState);
}

export const persistenceMigration = { migrateTarget, migrateToV3 };

export function saveState(state: AppState) {
  if (typeof window !== "undefined")
    localStorage.setItem(productConfig.storageKey, JSON.stringify(state));
}
