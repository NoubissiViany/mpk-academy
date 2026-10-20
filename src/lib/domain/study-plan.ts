import { currentWeeklyStats } from "@/lib/domain/exam-progress";
import { targetAccuracy } from "@/lib/domain/readiness";
import type { NclcTarget, WeeklyExamStats } from "@/types/domain";

// A weekly practice rhythm from the exam date. Counts practice sessions only,
// because that is what the weekly totals record.

const baseSessions: Record<NclcTarget, number> = {
  "NCLC 5": 3,
  "NCLC 7": 4,
  "NCLC 9+": 5,
  "I'm not sure": 4,
};

export type StudyPlan =
  | { status: "noDate" }
  | { status: "past"; daysLeft: number }
  | {
      status: "onTrack" | "behind";
      daysLeft: number;
      weeksLeft: number;
      sessionsPerWeek: number;
      sessionsThisWeek: number;
      expectedByToday: number;
    };

const startOfLocalDay = (value: Date) =>
  new Date(value.getFullYear(), value.getMonth(), value.getDate());

/** Days from today to a YYYY-MM-DD date, both in the learner's time zone. */
export function daysUntil(date: string, now: Date) {
  const [year, month, day] = date.split("-").map(Number);
  const exam = new Date(year, month - 1, day);
  return Math.round(
    (exam.getTime() - startOfLocalDay(now).getTime()) / 86_400_000,
  );
}

export function getStudyPlan({
  targetDate,
  target,
  readiness,
  weekly,
  now,
}: {
  targetDate?: string;
  target: NclcTarget;
  readiness: number | null;
  weekly: WeeklyExamStats;
  now: Date;
}): StudyPlan {
  if (!targetDate || !/^\d{4}-\d{2}-\d{2}$/.test(targetDate))
    return { status: "noDate" };
  const daysLeft = daysUntil(targetDate, now);
  if (daysLeft < 0) return { status: "past", daysLeft };

  const weeksLeft = Math.max(1, Math.ceil(daysLeft / 7));
  const gap = readiness === null ? 0 : targetAccuracy[target] - readiness;
  const sessionsPerWeek = Math.min(
    7,
    baseSessions[target] +
      (gap > 10 && weeksLeft <= 8 ? 1 : 0) +
      (gap > 20 && weeksLeft <= 4 ? 1 : 0),
  );
  const weekday = now.getDay() || 7; // Monday 1 … Sunday 7
  const expectedByToday = Math.floor((sessionsPerWeek * weekday) / 7);
  const sessionsThisWeek = currentWeeklyStats(weekly, now).practiceSessions;
  return {
    status: sessionsThisWeek >= expectedByToday ? "onTrack" : "behind",
    daysLeft,
    weeksLeft,
    sessionsPerWeek,
    sessionsThisWeek,
    expectedByToday,
  };
}
