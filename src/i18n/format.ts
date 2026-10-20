import { canonicalCompetency } from "@/content/shared/competencies";
import type { Messages } from "@/i18n/messages";

/** Localized label for a canonical or legacy competency id. */
export function competencyLabel(t: Messages, id: string) {
  const canonical = canonicalCompetency(id) as keyof Messages["competencies"];
  return t.competencies[canonical] ?? id.replaceAll(/[-_]/g, " ");
}

/** Localized module title; unknown module ids fall back to a readable id. */
export function moduleTitle(t: Messages, moduleId: string) {
  return (
    t.learn.modules[moduleId as keyof Messages["learn"]["modules"]] ??
    moduleId.replaceAll("-", " ")
  );
}

/** The lesson title in the reader's language when one is authored. */
export function lessonTitle(
  locale: "en" | "fr",
  lesson: { title: string; titleFr: string },
) {
  return locale === "fr" && lesson.titleFr ? lesson.titleFr : lesson.title;
}

/** Label for a weakness, marking evidence that came from a transcript exercise. */
export function focusLabel(
  t: Messages,
  focus: { competency: string; transcript: boolean },
) {
  const label = competencyLabel(t, focus.competency);
  return focus.transcript ? `${t.mistakes.transcript} · ${label}` : label;
}
