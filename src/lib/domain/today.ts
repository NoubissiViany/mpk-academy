import { allLessons } from "@/data/course";
import { canAccessLesson } from "@/lib/domain/access";
import { createEmptyExamProfile } from "@/lib/domain/exam-progress";
import {
  getRecommendedLessons,
  getRecommendedPractice,
} from "@/lib/domain/personalization";
import type { ObjectiveSkill } from "@/lib/domain/readiness";
import type { AppState, ExamId, Lesson } from "@/types/domain";

// Today's plan: due reviews, one practice session, one lesson — about 20–30
// minutes. Steps return data; the dashboard translates them.

export type TodayStep =
  | {
      kind: "review";
      skill: ObjectiveSkill;
      count: number;
      minutes: number;
      href: string;
      done: false;
    }
  | {
      kind: "practice";
      skill: ObjectiveSkill;
      minutes: number;
      href: string;
      done: boolean;
    }
  | {
      kind: "lesson";
      lesson: Lesson;
      minutes: number;
      href: string;
      done: boolean;
    };

const PRACTICE_MINUTES = 12;

export const isSameLocalDay = (timestamp: string, now: Date) => {
  const date = new Date(timestamp);
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
};

const examCode = (exam: ExamId) => (exam === "TCF Canada" ? "TCF" : "TEF");

export function getTodayPlan(
  state: AppState,
  now: Date,
  features: { personalized: boolean; reviews: boolean },
) {
  const goal = state.user?.goal.exam;
  const exam: ExamId | null =
    goal === "TEF Canada" || goal === "TCF Canada" ? goal : null;
  if (!exam) return { steps: [] as TodayStep[], minutes: 0, next: null };
  const steps: TodayStep[] = [];

  if (features.reviews) {
    const due = state.reviews.filter(
      (review) =>
        review.exam === exam && Date.parse(review.dueAt) <= now.getTime(),
    );
    if (due.length) {
      const listening = due.filter((review) => review.skill === "listening");
      const skill: ObjectiveSkill =
        listening.length > due.length - listening.length
          ? "listening"
          : "reading";
      const count = due.filter((review) => review.skill === skill).length;
      steps.push({
        kind: "review",
        skill,
        count,
        minutes: Math.min(10, Math.max(3, count)),
        href: `/practice/session?skill=${skill}&review=1`,
        done: false,
      });
    }
  }

  const profile = state.examProfiles[exam] ?? createEmptyExamProfile(exam);
  const recommended = features.personalized
    ? getRecommendedPractice(state)
    : null;
  const leastRecent: ObjectiveSkill =
    (profile.skills.listening.lastPracticedAt ?? "") <
    (profile.skills.reading.lastPracticedAt ?? "")
      ? "listening"
      : "reading";
  const completedPractice = state.studyActivity?.practice.find(
    (session) =>
      session.exam === exam &&
      session.mode === "practice" &&
      (session.skill === "reading" || session.skill === "listening") &&
      isSameLocalDay(session.completedAt, now),
  );
  const practiceSkill =
    (completedPractice?.skill as ObjectiveSkill | undefined) ??
    recommended?.skill ??
    leastRecent;
  steps.push({
    kind: "practice",
    skill: practiceSkill,
    minutes: PRACTICE_MINUTES,
    href:
      (!completedPractice && recommended?.href) ||
      `/practice/session?skill=${practiceSkill}&count=10`,
    done: Boolean(completedPractice),
  });

  const completedLesson = state.studyActivity?.lessons
    .filter((item) => isSameLocalDay(item.completedAt, now))
    .map((item) =>
      allLessons.find((candidate) => candidate.id === item.lessonId),
    )
    .find(
      (candidate) =>
        candidate &&
        (!candidate.exam ||
          candidate.exam === "shared" ||
          candidate.exam === examCode(exam)) &&
        canAccessLesson(state.planAccess, candidate),
    );
  const lesson =
    completedLesson ??
    (features.personalized ? getRecommendedLessons(state)[0]?.lesson : null) ??
    allLessons.find(
      (candidate) =>
        (!candidate.exam ||
          candidate.exam === "shared" ||
          candidate.exam === examCode(exam)) &&
        canAccessLesson(state.planAccess, candidate) &&
        !state.progress.completedLessonIds.includes(candidate.id),
    );
  if (lesson)
    steps.push({
      kind: "lesson",
      lesson,
      minutes: lesson.duration,
      href: `/learn/${lesson.moduleId}/${lesson.id}`,
      done: Boolean(completedLesson),
    });

  return {
    steps,
    minutes: steps.reduce(
      (sum, step) => sum + (step.done ? 0 : step.minutes),
      0,
    ),
    next: steps.find((step) => !step.done) ?? null,
  };
}
