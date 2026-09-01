import type { Course, Progress } from "@/types/domain";

export function isCertificateEligible(course: Course, progress: Progress) {
  const required = course.modules.flatMap((module) => module.lessons).map((lesson) => lesson.id);
  return required.every((id) => progress.completedLessonIds.includes(id)) && progress.quizAverage >= 70;
}
