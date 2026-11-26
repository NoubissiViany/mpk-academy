import { getStudyPlan } from "@/lib/domain/study-plan";
import { localClock } from "./time";
import type { ReminderContext, ReminderDecision } from "./types";

const hour = 3_600_000;
export function chooseReminder(
  c: ReminderContext,
  now: Date,
  preview = false,
): ReminderDecision | null {
  const local = localClock(now, c.timeZone);
  const age = now.getTime() - Date.parse(c.createdAt);
  const inactive = now.getTime() - Date.parse(c.lastActiveAt);
  if (!c.enabled || !c.verified || c.suppressed || age < 24 * hour) return null;
  if (!preview && (local.hour < 18 || local.hour >= 20)) return null;
  if (inactive < hour / 2) return null;
  const pending = c.pending;
  if (
    pending &&
    (pending.eligibility.locale !== c.locale ||
      pending.eligibility.hasAccess !== c.hasAccess ||
      pending.eligibility.hasDiagnostic !== c.hasDiagnostic ||
      pending.eligibility.timeZone !== c.timeZone ||
      pending.version !== c.version ||
      pending.goalRevision !== c.goalRevision ||
      pending.email !== c.email ||
      pending.localDate !== local.date ||
      now.getTime() - Date.parse(pending.attemptedAt) >= 2 * hour)
  )
    return null;
  // A retry is the same delivery, so exclude only that reservation from limits.
  const attempts = c.attempts.filter(
    (a) => !pending || a.at !== pending.attemptedAt,
  );
  if (
    attempts.some(
      (a) =>
        now.getTime() - Date.parse(a.at) < 48 * hour ||
        a.localDate === local.date,
    )
  )
    return null;
  if (
    attempts.filter((a) => now.getTime() - Date.parse(a.at) < 7 * 24 * hour)
      .length >= (inactive >= 30 * 24 * hour ? 1 : 3)
  )
    return null;
  const plan = getStudyPlan({
    targetDate: c.targetDate ?? undefined,
    target: c.target,
    readiness: c.readiness,
    weekly: {
      weekStartedAt: c.weekStartedAt,
      practiceSessions: c.sessions,
      minutesStudied: 0,
      questionsReviewed: 0,
      readinessChange: 0,
    },
    now,
    timeZone: c.timeZone,
  });
  if (plan.status === "past") {
    return c.pastExamNotified === c.goalRevision &&
      pending?.kind !== "exam_update"
      ? null
      : { kind: "exam_update" };
  }
  if (plan.status !== "noDate" && plan.daysLeft === 0) return null;
  if (
    c.lastLearningAt &&
    localClock(new Date(c.lastLearningAt), c.timeZone).date === local.date
  )
    return null;
  if (plan.status !== "noDate" && plan.daysLeft <= 14)
    return {
      kind: "countdown",
      daysLeft: plan.daysLeft,
      sessions: plan.sessionsThisWeek,
      target: plan.sessionsPerWeek,
    };
  if (plan.status === "behind")
    return {
      kind: "behind",
      sessions: plan.sessionsThisWeek,
      target: plan.sessionsPerWeek,
    };
  if (inactive >= 72 * hour) return { kind: "inactive" };
  return null;
}
