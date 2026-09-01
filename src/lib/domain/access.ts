import type { Lesson, UserTier } from "@/types/domain";

export const canAccessLesson = (tier: UserTier, lesson: Pick<Lesson, "isFree">) =>
  tier === "paid_student" || lesson.isFree;
export const canAccessPractice = (tier: UserTier, premium = false) =>
  tier === "paid_student" || (tier === "free_student" && !premium);
export const canAccessExam = (tier: UserTier) => tier === "paid_student";
export const canAccessCertificate = (tier: UserTier, eligible: boolean) => tier === "paid_student" && eligible;
