import {
  canonicalCompetency,
  competencyIds,
  type ContentCompetency,
} from "@/content/shared/competencies";
import { diagnosticSkillModules } from "@/config/diagnostic";
import { allLessons, getCourseModules } from "@/data/course";
import { canAccessLesson } from "@/lib/domain/access";
import { getWeakestExamSkill } from "@/lib/domain/exam-progress";
import type {
  AppState,
  DiagnosticResult,
  DiagnosticSkill,
  ExamId,
  ExamSkill,
  Lesson,
  Mistake,
} from "@/types/domain";

// Every recommendation keys on canonical competencies. Legacy ids from older
// rows are mapped through `canonicalCompetency`, so one taxonomy drives
// mistakes, focus areas, and lesson matching. Functions return data, not
// sentences; components translate it.

/** A weakness: a competency, and whether the evidence came from a transcript. */
export type FocusArea = { competency: string; transcript: boolean };

export type LessonReason =
  | { type: "diagnostic"; skill: DiagnosticSkill }
  | { type: "mistake"; focus: FocusArea }
  | { type: "next" };

const isCanonical = (id: string): id is ContentCompetency =>
  (competencyIds as readonly string[]).includes(id);

function activeExam(state: Pick<AppState, "user">): ExamId | null {
  const exam = state.user?.goal.exam;
  return exam === "TEF Canada" || exam === "TCF Canada" ? exam : null;
}

const examCode = (exam: ExamId | null) =>
  exam === "TCF Canada" ? "TCF" : "TEF";

export function mistakeFocus(mistake: Mistake): FocusArea {
  const pattern = mistake.pattern ?? "";
  const transcript = pattern.startsWith("Transcript exercise");
  const fromPattern = canonicalCompetency(
    transcript ? (pattern.split("·").pop()?.trim() ?? "") : pattern,
  );
  return {
    competency: isCanonical(fromPattern)
      ? fromPattern
      : canonicalCompetency(mistake.competencyId),
    transcript,
  };
}

const focusKey = (mistake: Mistake) => {
  const focus = mistakeFocus(mistake);
  return `${mistake.exam ?? "general"}:${mistake.examSkill ?? "other"}:${focus.transcript ? "transcript:" : ""}${focus.competency}`;
};

/** Mistakes grouped by canonical focus, most frequent first. */
export function groupMistakes(mistakes: Mistake[]) {
  const groups = new Map<string, Mistake>();
  for (const mistake of mistakes) {
    const key = focusKey(mistake);
    const existing = groups.get(key);
    groups.set(
      key,
      existing
        ? {
            ...existing,
            count: (existing.count ?? 1) + (mistake.count ?? 1),
            timestamp:
              existing.timestamp > mistake.timestamp
                ? existing.timestamp
                : mistake.timestamp,
          }
        : { ...mistake, count: mistake.count ?? 1 },
    );
  }
  return [...groups.values()].sort((a, b) => (b.count ?? 1) - (a.count ?? 1));
}

function lessonExamMatches(lesson: Lesson, exam: ExamId | null) {
  return (
    !lesson.exam || lesson.exam === "shared" || lesson.exam === examCode(exam)
  );
}

export function getWeaknessLesson(mistake: Mistake): Lesson | null {
  const { competency } = mistakeFocus(mistake);
  const candidates = allLessons.filter(
    (lesson) =>
      lessonExamMatches(lesson, mistake.exam ?? null) &&
      lesson.competencies.some((c) => canonicalCompetency(c) === competency),
  );
  return (
    candidates.find((lesson) => lesson.skill === mistake.examSkill) ??
    candidates[0] ??
    null
  );
}

const competenciesBySkill: Partial<Record<ExamSkill, ContentCompetency[]>> = {
  reading: [
    "main_idea",
    "specific_detail",
    "inference",
    "vocabulary_in_context",
    "reading_efficiency",
  ],
  listening: ["main_idea", "specific_detail", "inference", "speaker_intention"],
};

/** Diagnostic scores keyed by canonical competency (older results use legacy ids). */
function diagnosticCompetencyScores(result: DiagnosticResult | null) {
  const scores = new Map<string, number>();
  for (const [id, score] of Object.entries(result?.competencyScores ?? {}))
    if (typeof score === "number") {
      const key = canonicalCompetency(id);
      scores.set(key, Math.min(score, scores.get(key) ?? score));
    }
  return scores;
}

export function getSkillFocusAreas(state: AppState, skill: ExamSkill) {
  const exam = activeExam(state);
  const fromMistakes = groupMistakes(
    state.mistakes.filter(
      (mistake) =>
        mistake.examSkill === skill && (!mistake.exam || mistake.exam === exam),
    ),
  ).map(mistakeFocus);
  const scores = diagnosticCompetencyScores(state.diagnosticResult);
  const fromDiagnostic = (competenciesBySkill[skill] ?? [])
    .filter((competency) => scores.has(competency))
    .sort((a, b) => scores.get(a)! - scores.get(b)!)
    .slice(0, 2)
    .map((competency) => ({ competency, transcript: false }));
  return [...fromMistakes, ...fromDiagnostic]
    .filter(
      (item, index, items) =>
        items.findIndex(
          (candidate) => candidate.competency === item.competency,
        ) === index,
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
  const focus = getSkillFocusAreas(state, skill)[0]?.competency;
  const query = new URLSearchParams({ skill, count: "10" });
  if (focus) query.set("focus", focus);
  return { skill, href: `/practice/session?${query.toString()}` };
}

function firstIncompleteLesson(state: AppState, moduleId: string) {
  const courseModule = getCourseModules(examCode(activeExam(state))).find(
    (item) => item.id === moduleId,
  );
  if (!courseModule) return null;
  return (
    courseModule.lessons.find(
      (lesson) => !state.progress.completedLessonIds.includes(lesson.id),
    ) ?? courseModule.lessons[0]
  );
}

export function getRecommendedLessons(state: AppState) {
  const exam = activeExam(state);
  const recommendations: Array<{ lesson: Lesson; reason: LessonReason }> = [];
  const add = (lesson: Lesson | null, reason: LessonReason) => {
    if (
      lesson &&
      lessonExamMatches(lesson, exam) &&
      canAccessLesson(state.planAccess, lesson) &&
      !recommendations.some((item) => item.lesson.id === lesson.id)
    )
      recommendations.push({ lesson, reason });
  };
  if (state.diagnosticResult)
    add(
      firstIncompleteLesson(state, state.diagnosticResult.recommendedModuleId),
      {
        type: "diagnostic",
        skill: state.diagnosticResult.priority,
      },
    );

  for (const mistake of groupMistakes(
    state.mistakes.filter((item) => !item.exam || !exam || item.exam === exam),
  ))
    add(getWeaknessLesson(mistake), {
      type: "mistake",
      focus: mistakeFocus(mistake),
    });

  if (!recommendations.length)
    add(
      allLessons.find(
        (lesson) =>
          lessonExamMatches(lesson, exam) &&
          canAccessLesson(state.planAccess, lesson) &&
          !state.progress.completedLessonIds.includes(lesson.id),
      ) ?? null,
      { type: "next" },
    );
  return recommendations.slice(0, 3);
}

export function getDiagnosticNextActivity(
  result: DiagnosticResult,
  exam: ExamId | null = null,
) {
  const skill = result.priority;
  if (skill === "reading" || skill === "listening") {
    const scores = diagnosticCompetencyScores(result);
    const focus = (competenciesBySkill[skill] ?? [])
      .filter((competency) => scores.has(competency))
      .sort((a, b) => scores.get(a)! - scores.get(b)!)[0];
    const query = new URLSearchParams({ skill });
    if (focus) query.set("focus", focus);
    return { skill, href: `/practice/session?${query.toString()}` };
  }
  const lesson =
    getCourseModules(examCode(exam)).find(
      (module) => module.id === diagnosticSkillModules[skill],
    )?.lessons[0] ?? allLessons[0];
  return { skill, href: `/learn/${lesson.moduleId}/${lesson.id}` };
}

export function getMistakeDetail(state: AppState, mistakeId: string) {
  const anchor = state.mistakes.find((mistake) => mistake.id === mistakeId);
  if (!anchor) return null;
  const key = focusKey(anchor);
  const matches = state.mistakes
    .filter((mistake) => focusKey(mistake) === key)
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  return {
    anchor,
    focus: mistakeFocus(anchor),
    count: matches.reduce((sum, mistake) => sum + (mistake.count ?? 1), 0),
    examples: matches.slice(0, 3),
    lesson: getWeaknessLesson(anchor),
  };
}
