import { lessonSummaries } from "@/content/summaries";
import type { CourseModule, Lesson } from "@/types/domain";

// Built from generated summaries so lesson listings never carry lesson bodies
// or checkpoint answers into the browser.

export const learningCategories = [
  {
    id: "foundations",
    moduleIds: ["grammar", "vocabulary", "pronunciation"],
  },
  {
    id: "examSkills",
    moduleIds: [
      "reading-strategies",
      "listening-strategies",
      "writing-techniques",
      "speaking-techniques",
    ],
  },
  {
    id: "examStrategy",
    moduleIds: ["exam-strategies"],
  },
] as const;

export const allLessons: Lesson[] = lessonSummaries.map((item, index) => ({
  id: item.id,
  exam: item.exam,
  skill: item.skill,
  moduleId: item.moduleId,
  sequence: index + 1,
  title: item.title,
  titleFr: item.titleFr,
  description: item.objectives.join(" · "),
  duration: item.estimatedTime / 60,
  isFree: item.isFree,
  status: "available",
  competencies: item.competencies,
}));

export function getCourseModules(exam: "TEF" | "TCF"): CourseModule[] {
  return [...new Set(allLessons.map((l) => l.moduleId))].map((id, index) => ({
    id,
    sequence: index + 1,
    title: id.replaceAll("-", " ").replace(/^./, (c) => c.toUpperCase()),
    titleFr: id.replaceAll("-", " "),
    description: "",
    lessons: allLessons
      .filter(
        (l) => l.moduleId === id && (l.exam === "shared" || l.exam === exam),
      )
      .map((l, i) => ({ ...l, sequence: i + 1 })),
  }));
}

export const courseModules = getCourseModules("TEF");
