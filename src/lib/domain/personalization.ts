import { diagnosticSkillContent } from "@/config/diagnostic";
import { examSkillContent } from "@/config/exams";
import { allLessons, courseModules } from "@/data/course";
import { canAccessLesson } from "@/lib/domain/access";
import {
  aggregateMistakePatterns,
  getWeakestExamSkill,
} from "@/lib/domain/exam-progress";
import type {
  AppState,
  CompetencyId,
  DiagnosticResult,
  ExamId,
  ExamSkill,
  Lesson,
  Mistake,
} from "@/types/domain";

const competencyLabels: Partial<Record<CompetencyId, string>> = {
  "reading-main-idea": "Main ideas",
  "reading-detail": "Specific details",
  "reading-inference": "Inferences",
  "listening-main-idea": "Main ideas",
  "listening-detail": "Specific details",
  "grammar-tense": "Verb tense and agreement",
  "grammar-prepositions": "Prepositions",
  "vocabulary-context": "Vocabulary in context",
  connectors: "Connectors",
  "time-expressions": "Time expressions",
};

const lessonByCompetency: Partial<
  Record<CompetencyId, { moduleId: string; lessonId: string }>
> = {
  "reading-main-idea": {
    moduleId: "reading-strategies",
    lessonId: "reading-strategies-1",
  },
  "reading-detail": {
    moduleId: "reading-strategies",
    lessonId: "reading-strategies-2",
  },
  "reading-inference": {
    moduleId: "reading-strategies",
    lessonId: "reading-strategies-3",
  },
  "listening-main-idea": {
    moduleId: "listening-strategies",
    lessonId: "listening-strategies-1",
  },
  "listening-detail": {
    moduleId: "listening-strategies",
    lessonId: "listening-strategies-2",
  },
  "grammar-tense": { moduleId: "grammar", lessonId: "grammar-3" },
  "grammar-prepositions": { moduleId: "grammar", lessonId: "grammar-1" },
  "vocabulary-context": {
    moduleId: "vocabulary",
    lessonId: "vocabulary-1",
  },
  connectors: { moduleId: "grammar", lessonId: "connectors" },
  "time-expressions": { moduleId: "grammar", lessonId: "grammar-1" },
};

function activeExam(state: AppState): ExamId | null {
  const exam = state.user?.goal.exam;
  return exam === "TEF Canada" || exam === "TCF Canada" ? exam : null;
}

function patternKey(mistake: Mistake) {
  return mistake.pattern ?? mistake.mistakeCategory;
}

export function focusAreaLabel(mistake: Mistake) {
  if (patternKey(mistake) === "Understanding specific details")
    return "Specific details";
  if (patternKey(mistake) === mistake.competencyId.replaceAll("-", " "))
    return competencyFocusLabel(mistake.competencyId);
  return (
    patternKey(mistake) || competencyLabels[mistake.competencyId] || "Review"
  );
}

export function competencyFocusLabel(competencyId: CompetencyId) {
  return competencyLabels[competencyId] ?? competencyId.replaceAll("-", " ");
}

function lessonFromReference(reference?: {
  moduleId: string;
  lessonId: string;
}) {
  return reference
    ? (allLessons.find(
        (lesson) =>
          lesson.moduleId === reference.moduleId &&
          lesson.id === reference.lessonId,
      ) ?? null)
    : null;
}

export function getWeaknessLesson(mistake: Mistake): Lesson | null {
  const pattern = patternKey(mistake).toLowerCase();
  if (pattern.includes("number"))
    return lessonFromReference(lessonByCompetency["listening-detail"]);
  if (pattern.includes("specific detail"))
    return lessonFromReference(
      lessonByCompetency[
        mistake.examSkill === "reading" ? "reading-detail" : "listening-detail"
      ],
    );
  if (pattern.includes("inference") && mistake.examSkill === "listening")
    return (
      allLessons.find(
        (lesson) =>
          lesson.moduleId === "listening-strategies" && lesson.sequence === 3,
      ) ?? null
    );
  if (pattern.includes("connector"))
    return lessonFromReference(lessonByCompetency.connectors);
  if (pattern.includes("register"))
    return (
      allLessons.find(
        (lesson) =>
          lesson.moduleId === "writing-techniques" && lesson.sequence === 3,
      ) ?? null
    );
  return lessonFromReference(lessonByCompetency[mistake.competencyId]);
}

const competenciesBySkill: Partial<Record<ExamSkill, CompetencyId[]>> = {
  reading: ["reading-main-idea", "reading-detail", "reading-inference"],
  listening: ["listening-main-idea", "listening-detail"],
};

function lowestDiagnosticCompetency(
  result: DiagnosticResult | null,
  skill: ExamSkill,
) {
  const candidates = competenciesBySkill[skill] ?? [];
  return candidates
    .map((competencyId) => ({
      competencyId,
      score: result?.competencyScores[competencyId],
    }))
    .filter(
      (item): item is { competencyId: CompetencyId; score: number } =>
        typeof item.score === "number",
    )
    .sort((a, b) => a.score - b.score)[0]?.competencyId;
}

export function getSkillFocusAreas(state: AppState, skill: ExamSkill) {
  const exam = activeExam(state);
  const mistakeAreas = aggregateMistakePatterns(
    state.mistakes.filter(
      (mistake) =>
        mistake.examSkill === skill && (!mistake.exam || mistake.exam === exam),
    ),
  ).map((mistake) => ({
    label: focusAreaLabel(mistake),
    competencyId: mistake.competencyId,
  }));
  const uniqueMistakes = mistakeAreas.filter(
    (item, index, items) =>
      items.findIndex((candidate) => candidate.label === item.label) === index,
  );
  const diagnosticAreas = (competenciesBySkill[skill] ?? [])
    .map((competencyId) => ({
      competencyId,
      score: state.diagnosticResult?.competencyScores[competencyId],
      label: competencyLabels[competencyId] ?? competencyId,
    }))
    .filter(
      (
        item,
      ): item is {
        competencyId: CompetencyId;
        score: number;
        label: string;
      } => typeof item.score === "number",
    )
    .sort((a, b) => a.score - b.score)
    .slice(0, 2)
    .map(({ competencyId, label }) => ({ competencyId, label }));
  return [...uniqueMistakes, ...diagnosticAreas]
    .filter(
      (item, index, items) =>
        items.findIndex((candidate) => candidate.label === item.label) ===
        index,
    )
    .slice(0, 2);
}

export function getRecommendedPractice(state: AppState) {
  const exam = activeExam(state);
  if (!exam) return null;
  const profile = state.examProfiles[exam];
  const weakest = profile ? getWeakestExamSkill(profile) : null;
  const skill =
    weakest === "reading" || weakest === "listening"
      ? weakest
      : state.diagnosticResult?.priority === "listening"
        ? "listening"
        : state.diagnosticResult
          ? "reading"
          : null;
  if (!skill) return null;
  const focus = getSkillFocusAreas(state, skill)[0]?.competencyId;
  const query = new URLSearchParams({ skill, count: "10" });
  if (focus) query.set("focus", focus);
  return {
    skill,
    label: examSkillContent[skill].label,
    href: `/practice/session?${query.toString()}`,
  };
}

function firstIncompleteLesson(state: AppState, moduleId: string) {
  const courseModule = courseModules.find((item) => item.id === moduleId);
  if (!courseModule) return null;
  return (
    courseModule.lessons.find(
      (lesson) => !state.progress.completedLessonIds.includes(lesson.id),
    ) ?? courseModule.lessons[0]
  );
}

export function getRecommendedLessons(state: AppState) {
  const recommendations: Array<{ lesson: Lesson; reason: string }> = [];
  const add = (lesson: Lesson | null, reason: string) => {
    if (
      lesson &&
      canAccessLesson(state.planAccess, lesson) &&
      !recommendations.some((item) => item.lesson.id === lesson.id)
    )
      recommendations.push({ lesson, reason });
  };
  if (state.diagnosticResult)
    add(
      firstIncompleteLesson(state, state.diagnosticResult.recommendedModuleId),
      `Recommended from your ${diagnosticSkillContent[state.diagnosticResult.priority].label.toLowerCase()} assessment priority.`,
    );

  const exam = activeExam(state);
  for (const mistake of aggregateMistakePatterns(
    state.mistakes.filter((item) => !item.exam || !exam || item.exam === exam),
  ))
    add(getWeaknessLesson(mistake), `Supports ${focusAreaLabel(mistake)}.`);

  if (!recommendations.length)
    add(
      allLessons.find(
        (lesson) =>
          canAccessLesson(state.planAccess, lesson) &&
          !state.progress.completedLessonIds.includes(lesson.id),
      ) ?? null,
      "A useful next lesson for your preparation.",
    );
  return recommendations.slice(0, 3);
}

export function getDiagnosticNextActivity(result: DiagnosticResult) {
  const label = diagnosticSkillContent[result.priority].label;
  if (result.priority === "reading" || result.priority === "listening") {
    const skill = result.priority;
    const focus = lowestDiagnosticCompetency(result, skill);
    const query = new URLSearchParams({ skill });
    if (focus) query.set("focus", focus);
    return {
      label,
      href: `/practice/session?${query.toString()}`,
    };
  }
  const lesson =
    courseModules.find((module) => module.id === result.recommendedModuleId)
      ?.lessons[0] ?? allLessons[0];
  return {
    label,
    href: `/learn/${lesson.moduleId}/${lesson.id}`,
  };
}

export function getMistakeDetail(state: AppState, mistakeId: string) {
  const anchor = state.mistakes.find((mistake) => mistake.id === mistakeId);
  if (!anchor) return null;
  const matches = state.mistakes
    .filter(
      (mistake) =>
        mistake.exam === anchor.exam &&
        mistake.examSkill === anchor.examSkill &&
        patternKey(mistake) === patternKey(anchor),
    )
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  return {
    anchor,
    title: patternKey(anchor),
    count: matches.reduce((sum, mistake) => sum + (mistake.count ?? 1), 0),
    examples: matches.slice(0, 3),
    lesson: getWeaknessLesson(anchor),
  };
}
