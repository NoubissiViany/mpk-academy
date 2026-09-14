import { examSkillOrder } from "@/config/exams";
import { clamp } from "@/lib/utils";
import type {
  AppState,
  ExamId,
  ExamPreparationProfile,
  ExamSkill,
  Mistake,
  WeeklyExamStats,
} from "@/types/domain";

export function activateExamProfile(state: AppState, exam: ExamId): AppState {
  return {
    ...state,
    user: state.user
      ? { ...state.user, goal: { ...state.user.goal, exam } }
      : null,
    examProfiles: {
      ...state.examProfiles,
      [exam]: state.examProfiles[exam] ?? createEmptyExamProfile(exam),
    },
  };
}

export function getIsoWeekStart(value = new Date()) {
  const date = new Date(
    Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()),
  );
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() - day + 1);
  return date.toISOString().slice(0, 10);
}

export function emptyWeeklyStats(value = new Date()): WeeklyExamStats {
  return {
    weekStartedAt: getIsoWeekStart(value),
    practiceSessions: 0,
    minutesStudied: 0,
    questionsReviewed: 0,
    readinessChange: 0,
  };
}

export function createEmptyExamProfile(
  exam: ExamId,
  value = new Date(),
): ExamPreparationProfile {
  return {
    exam,
    readinessBaseline30Days: null,
    readiness: null,
    skills: {
      reading: { baseline30Days: null, current: null, attempts: 0 },
      listening: { baseline30Days: null, current: null, attempts: 0 },
      writing: { baseline30Days: null, current: null, attempts: 0 },
      speaking: { baseline30Days: null, current: null, attempts: 0 },
    },
    weekly: emptyWeeklyStats(value),
    mockAverage: null,
    mockAttempts: 0,
  };
}

export function currentWeeklyStats(stats: WeeklyExamStats, value = new Date()) {
  return stats.weekStartedAt === getIsoWeekStart(value)
    ? stats
    : emptyWeeklyStats(value);
}

export function getSkillStatus(score: number | null) {
  if (score === null) return "Not assessed yet";
  if (score >= 70) return "On track";
  if (score >= 55) return "Improving";
  if (score >= 50) return "Needs attention";
  return "Priority";
}

export function getWeakestExamSkill(profile: ExamPreparationProfile) {
  return (
    examSkillOrder
      .map((skill, order) => ({
        skill,
        score: profile.skills[skill].current,
        order,
      }))
      .filter(
        (item): item is { skill: ExamSkill; score: number; order: number } =>
          item.score !== null,
      )
      .sort((a, b) => a.score - b.score || a.order - b.order)[0]?.skill ?? null
  );
}

export function aggregateMistakePatterns(mistakes: Mistake[]) {
  const patterns = new Map<string, Mistake>();
  for (const mistake of mistakes) {
    const key = `${mistake.exam ?? "general"}:${mistake.examSkill ?? "other"}:${mistake.pattern ?? mistake.mistakeCategory}`;
    const existing = patterns.get(key);
    patterns.set(
      key,
      existing
        ? {
            ...existing,
            count: (existing.count ?? 1) + (mistake.count ?? 1),
            timestamp:
              existing.timestamp > mistake.timestamp
                ? existing.timestamp
                : mistake.timestamp,
          }
        : { ...mistake, count: mistake.count ?? 1 },
    );
  }
  return [...patterns.values()].sort((a, b) => (b.count ?? 1) - (a.count ?? 1));
}

export function updateExamSkill(
  profile: ExamPreparationProfile,
  skill: ExamSkill,
  sessionScore: number,
  options: { minutes?: number; questionsReviewed?: number; now?: Date } = {},
) {
  const now = options.now ?? new Date();
  const previous = profile.skills[skill];
  const normalizedScore = clamp(sessionScore);
  const current =
    previous.current === null
      ? normalizedScore
      : clamp(previous.current * 0.75 + normalizedScore * 0.25);
  const skills = {
    ...profile.skills,
    [skill]: {
      ...previous,
      baseline30Days: previous.baseline30Days ?? previous.current,
      current,
      attempts: previous.attempts + 1,
      lastPracticedAt: now.toISOString(),
    },
  };
  const allScores = examSkillOrder.map((item) => skills[item].current);
  const previousReadiness = profile.readiness;
  let readiness = previousReadiness;
  if (allScores.every((score): score is number => score !== null)) {
    readiness =
      previousReadiness === null
        ? clamp(
            allScores.reduce((sum, score) => sum + score, 0) / allScores.length,
          )
        : clamp(
            previousReadiness + (current - (previous.current ?? current)) / 4,
          );
  }
  const readinessDelta =
    (readiness ?? 0) - (previousReadiness ?? readiness ?? 0);
  const weekly = currentWeeklyStats(profile.weekly, now);
  return {
    ...profile,
    readiness,
    readinessBaseline30Days:
      profile.readinessBaseline30Days ?? previousReadiness,
    skills,
    weekly: {
      ...weekly,
      practiceSessions: weekly.practiceSessions + 1,
      minutesStudied: weekly.minutesStudied + (options.minutes ?? 0),
      questionsReviewed:
        weekly.questionsReviewed + (options.questionsReviewed ?? 0),
      readinessChange: weekly.readinessChange + readinessDelta,
    },
  } satisfies ExamPreparationProfile;
}

export function updateMockReadiness(
  profile: ExamPreparationProfile,
  mockScore: number,
  minutes: number,
  now = new Date(),
) {
  const normalizedScore = clamp(mockScore);
  const readiness =
    profile.readiness === null
      ? normalizedScore
      : clamp(profile.readiness * 0.7 + normalizedScore * 0.3);
  const mockAverage =
    profile.mockAverage === null
      ? normalizedScore
      : clamp(
          (profile.mockAverage * profile.mockAttempts + normalizedScore) /
            (profile.mockAttempts + 1),
        );
  const weekly = currentWeeklyStats(profile.weekly, now);
  return {
    ...profile,
    readiness,
    readinessBaseline30Days:
      profile.readinessBaseline30Days ?? profile.readiness,
    mockAverage,
    mockAttempts: profile.mockAttempts + 1,
    weekly: {
      ...weekly,
      minutesStudied: weekly.minutesStudied + minutes,
      readinessChange:
        weekly.readinessChange + readiness - (profile.readiness ?? readiness),
    },
  } satisfies ExamPreparationProfile;
}
