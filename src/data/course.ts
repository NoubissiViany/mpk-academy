import { lessons } from "@/content/catalog";
import type { Course, CourseModule, Lesson } from "@/types/domain";
import { learningCategories } from "@/content/legacy/course";
export { learningCategories };
export const allLessons: Lesson[] = lessons.map((item, index) => ({
  id: item.id,
  moduleId: item.moduleId,
  sequence: index + 1,
  title: item.title,
  titleFr: item.titleFr,
  description: item.objectives.join(" · "),
  duration: item.estimatedTime / 60,
  isFree: item.isFree,
  status: "available",
  competencies: item.competencies,
  example: item.examples[0],
  explanation: item.explanation,
  content: item,
}));
export function getCourseModules(exam: "TEF" | "TCF"): CourseModule[] {
  return [...new Set(allLessons.map((l) => l.moduleId))].map((id, index) => ({
    id,
    sequence: index + 1,
    title: id.replaceAll("-", " ").replace(/^./, (c) => c.toUpperCase()),
    titleFr: id.replaceAll("-", " "),
    description: "Understand in English. Learn in French. Perform in French.",
    lessons: allLessons
      .filter(
        (l) =>
          l.moduleId === id &&
          (l.content?.exam === "shared" || l.content?.exam === exam),
      )
      .map((l, i) => ({ ...l, sequence: i + 1 })),
  }));
}
export const courseModules = getCourseModules("TEF");
export const mockCourse: Course = {
  id: "french-canadian-immigration",
  title: "MPK French preparation",
  modules: courseModules,
};
