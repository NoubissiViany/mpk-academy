"use client";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { completeLessonAction } from "@/app/actions/learner";
import { useApp } from "@/components/providers/app-provider";
import { LockedContent, ModeBadge } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { allLessons, getCourseModules } from "@/data/course";
import { allLessons as archivedLessons } from "@/content/legacy/course";
import { canAccessLesson } from "@/lib/domain/access";
export function LessonView({
  moduleId,
  lessonId,
}: {
  moduleId: string;
  lessonId: string;
}) {
  const { state, replaceState } = useApp();
  const [answer, setAnswer] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [saving, setSaving] = useState(false);
  const lesson = allLessons.find(
    (l) => l.id === lessonId && l.moduleId === moduleId,
  );
  const archived = archivedLessons.find(
    (l) => l.id === lessonId && l.moduleId === moduleId,
  );
  if (!lesson)
    return (
      <div>
        <h1>
          {archived
            ? `${archived.title} — Archived lesson`
            : "Lesson not found"}
        </h1>
        {archived && (
          <p>
            Your historical completion is preserved. Study the updated lessons
            in Learn.
          </p>
        )}
        <Link href="/learn">Return to course</Link>
      </div>
    );
  if (!canAccessLesson(state.planAccess, lesson))
    return <LockedContent title="Unlock this lesson" />;
  const content = lesson.content!;
  const exam = state.user?.goal.exam === "TCF Canada" ? "TCF" : "TEF";
  if (content.exam !== "shared" && content.exam !== exam)
    return (
      <div>
        <p>
          This lesson belongs to {content.exam}. Switch your active exam in
          Settings to study it.
        </p>
        <Link href="/learn">Return to Learn</Link>
      </div>
    );
  const available = getCourseModules(exam).flatMap((m) => m.lessons);
  const next = available[available.findIndex((l) => l.id === lesson.id) + 1];
  const completed = state.progress.completedLessonIds.includes(lesson.id);
  const save = async () => {
    setSaving(true);
    const result = await completeLessonAction(lesson.id);
    setSaving(false);
    if (!result.ok) return toast.error(result.message);
    replaceState(result.snapshot);
    toast.success("Lesson progress saved");
  };
  return (
    <article className="mx-auto max-w-3xl space-y-7">
      <ModeBadge mode="learn" />
      <header>
        <p>
          {lesson.duration} min ·{" "}
          {content.exam === "shared"
            ? "Shared French foundations"
            : content.exam}
        </p>
        <h1 className="mt-3 text-3xl font-bold">{lesson.title}</h1>
        <p className="mt-3">{lesson.description}</p>
      </header>
      <section>
        <h2 className="text-xl font-bold">Understand</h2>
        <p className="mt-3 leading-8">{content.explanation}</p>
      </section>
      <section className="rounded-xl border bg-learn/5 p-6">
        <h2 className="font-bold">French examples</h2>
        {content.examples.map((example) => (
          <p key={example} lang="fr" className="mt-3 text-lg">
            {example}
          </p>
        ))}
      </section>
      <section>
        <h2 className="text-xl font-bold">Try it</h2>
        <p className="mt-3">{content.guidedApplication}</p>
      </section>
      <section>
        <h2 className="text-xl font-bold">Common errors</h2>
        {content.commonErrors.map((error) => (
          <p key={error} className="mt-3">
            {error}
          </p>
        ))}
      </section>
      <section className="rounded-xl border p-6">
        <h2 className="text-xl font-bold">Checkpoint</h2>
        <p className="mt-3">{content.checkpoint.prompt}</p>
        <fieldset className="my-5 space-y-3">
          <legend className="sr-only">Choose an answer</legend>
          {content.checkpoint.options.map((option, index) => (
            <label key={option} className="block">
              <input
                type="radio"
                name={lesson.id}
                checked={answer === index}
                onChange={() => {
                  setAnswer(index);
                  setChecked(false);
                }}
              />{" "}
              {option}
            </label>
          ))}
        </fieldset>
        <Button disabled={answer === null} onClick={() => setChecked(true)}>
          Check understanding
        </Button>
        {checked && (
          <p role="status" className="mt-4">
            {answer === content.checkpoint.answer
              ? "Correct. "
              : "Review this point. "}
            {content.checkpoint.explanation}
          </p>
        )}
        <Button
          className="mt-6 ml-3"
          disabled={!checked || completed || saving}
          onClick={save}
        >
          {completed
            ? "Lesson completed"
            : saving
              ? "Saving…"
              : "Complete lesson"}
        </Button>
      </section>
      {next && (
        <Button asChild>
          <Link href={`/learn/${next.moduleId}/${next.id}`}>Next lesson</Link>
        </Button>
      )}
    </article>
  );
}
