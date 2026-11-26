import { calendarDaysUntil } from "@/lib/reminders/time";
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

/** Calendar days, without DST-dependent 23/25-hour-day arithmetic. */
export function daysUntil(
  date: string,
  now: Date,
  timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone,
) {
  return calendarDaysUntil(date, now, timeZone);
}

export function getStudyPlan({
  targetDate,
  target,
  readiness,
  weekly,
  now,
  timeZone,
}: {
  targetDate?: string;
  target: NclcTarget;
  readiness: number | null;
  weekly: WeeklyExamStats;
  now: Date;
  timeZone?: string;
}): StudyPlan {
  if (!targetDate || !/^\d{4}-\d{2}-\d{2}$/.test(targetDate))
    return { status: "noDate" };
  const daysLeft = daysUntil(targetDate, now, timeZone);
  if (daysLeft < 0) return { status: "past", daysLeft };

  const weeksLeft = Math.max(1, Math.ceil(daysLeft / 7));
  const gap = readiness === null ? 0 : targetAccuracy[target] - readiness;
  const sessionsPerWeek = Math.min(
    7,
    baseSessions[target] +
      (gap > 10 && weeksLeft <= 8 ? 1 : 0) +
      (gap > 20 && weeksLeft <= 4 ? 1 : 0),
  );
  const weekday = now.getUTCDay() || 7; // Monday 1 … Sunday 7
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
