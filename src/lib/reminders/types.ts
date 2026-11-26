import type { Locale, NclcTarget } from "@/types/domain";

export interface ReminderPreferences {
  enabled: boolean;
  timeZone: string;
  timeZoneSource: "auto" | "manual";
  targetDate: string | null;
}
export type ReminderKind = "exam_update" | "countdown" | "behind" | "inactive";
export interface ReminderContext {
  userId: string;
  email: string;
  firstName: string;
  locale: Locale;
  createdAt: string;
  lastActiveAt: string;
  lastLearningAt: string | null;
  enabled: boolean;
  verified: boolean;
  suppressed: boolean;
  timeZone: string;
  version: string;
  unsubscribeVersion: string;
  goalRevision: string | null;
  targetDate: string | null;
  target: NclcTarget;
  readiness: number | null;
  weekStartedAt: string;
  sessions: number;
  hasAccess: boolean;
  hasDiagnostic: boolean;
  pastExamNotified: string | null;
  attempts: { at: string; localDate: string }[];
  pending: {
    id: string;
    kind: ReminderKind;
    version: string;
    goalRevision: string | null;
    email: string;
    localDate: string;
    attemptedAt: string;
    eligibility: {
      locale: string;
      hasAccess: boolean;
      hasDiagnostic: boolean;
      timeZone: string;
    };
  } | null;
}
export interface ReminderDecision {
  kind: ReminderKind;
  daysLeft?: number;
  sessions?: number;
  target?: number;
}
export interface ReminderMessage {
  from: string;
  to: string[];
  subject: string;
  html: string;
  text: string;
  headers: Record<string, string>;
  tags: { name: string; value: string }[];
}
export interface ReminderClaim {
  id: string;
  lease: string;
  payload: ReminderMessage;
}
