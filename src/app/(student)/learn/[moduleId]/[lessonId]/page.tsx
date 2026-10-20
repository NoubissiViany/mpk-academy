import Link from "next/link";
import { LockedContent } from "@/components/shared";
import { allLessons as archivedLessons } from "@/content/legacy/course";
import { allLessons, getCourseModules } from "@/data/course";
import { LessonView } from "@/features/learn/lesson-view";
import { getMessages } from "@/i18n/server";
import { canAccessLesson } from "@/lib/domain/access";
import { getLessonContent, toPublicLesson } from "@/lib/server/content";
import { getLearnerAccess } from "@/lib/supabase/learner";

export default async function LessonPage({
  params,
}: {
  params: Promise<{ moduleId: string; lessonId: string }>;
}) {
  const { moduleId, lessonId } = await params;
  const [{ planAccess, exam }, t] = await Promise.all([
    getLearnerAccess(),
    getMessages(),
  ]);
  const copy = t.learn.lesson;
  const lesson = allLessons.find(
    (item) => item.id === lessonId && item.moduleId === moduleId,
  );

  if (!lesson) {
    const archived = archivedLessons.find(
      (item) => item.id === lessonId && item.moduleId === moduleId,
    );
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">
          {archived ? copy.archivedTitle(archived.title) : copy.notFound}
        </h1>
        {archived && <p>{copy.archivedBody}</p>}
        <Link
          href="/learn"
          className="font-semibold text-primary hover:underline"
        >
          {copy.back}
        </Link>
      </div>
    );
  }

  // Lesson bodies are sent only to learners who may open them.
  if (!canAccessLesson(planAccess, lesson))
    return <LockedContent title={copy.lockedTitle} />;

  const examCode = exam === "TCF Canada" ? "TCF" : "TEF";
  if (lesson.exam !== "shared" && lesson.exam !== examCode)
    return (
      <div className="space-y-4">
        <p>{copy.wrongExam(lesson.exam ?? examCode)}</p>
        <Link
          href="/learn"
          className="font-semibold text-primary hover:underline"
        >
          {copy.back}
        </Link>
      </div>
    );

  const content = getLessonContent(lesson.id)!;
  const available = getCourseModules(examCode).flatMap((m) => m.lessons);
  const next = available[available.findIndex((l) => l.id === lesson.id) + 1];
  return (
    <LessonView
      lesson={lesson}
      content={toPublicLesson(content)}
      next={next ? { id: next.id, moduleId: next.moduleId } : null}
    />
  );
}
