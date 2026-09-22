import { hasPlanFeature, type PlanFeature } from "@/config/product";
import type { Lesson, PlanAccess } from "@/types/domain";

export const canAccessLesson = (
  planAccess: PlanAccess | null,
  lesson: Pick<Lesson, "isFree" | "moduleId">,
) =>
  hasPlanFeature(planAccess, "learning") &&
  (lesson.moduleId !== "exam-strategies" ||
    hasPlanFeature(planAccess, "examStrategies"));

export const canAccessPractice = (planAccess: PlanAccess | null) =>
  hasPlanFeature(planAccess, "practice");
export const canAccessExam = (planAccess: PlanAccess | null) =>
  hasPlanFeature(planAccess, "mockExams");
export const canAccessCertificate = (
  planAccess: PlanAccess | null,
  eligible: boolean,
) => hasPlanFeature(planAccess, "certificate") && eligible;

export const requiredFeatureForPath = (
  pathname: string,
): PlanFeature | null => {
  if (pathname.startsWith("/learn/exam-strategies")) return "examStrategies";
  if (pathname === "/learn" || pathname.startsWith("/learn/"))
    return "learning";
  if (pathname === "/practice" || pathname.startsWith("/practice/"))
    return "practice";
  if (pathname === "/progress") return "basicProgress";
  if (
    pathname === "/mistakes" ||
    pathname.startsWith("/mistakes/") ||
    pathname === "/weaknesses"
  )
    return "mistakeReview";
  if (pathname === "/exam" || pathname.startsWith("/exam/")) return "mockExams";
  if (pathname === "/certificate") return "certificate";
  return null;
};
