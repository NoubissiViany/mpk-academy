import { mockItems } from "@/content/mock-catalog";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { examSkillOrder } from "@/config/exams";
import { getLocale, getMessages } from "@/i18n/server";
import {
  createEmptyExamProfile,
  getWeakestExamSkill,
} from "@/lib/domain/exam-progress";
import {
  getAssessmentResult,
  getCompletedAssessmentAnswers,
  getLearnerSnapshot,
} from "@/lib/supabase/learner";
import type { ExamId } from "@/types/domain";

export default async function ExamResultsPage({
  searchParams,
}: {
  searchParams: Promise<{ assessment?: string }>;
}) {
  const { assessment } = await searchParams;
  if (!assessment) notFound();
  const [result, snapshot, t, locale] = await Promise.all([
    getAssessmentResult(assessment),
    getLearnerSnapshot(),
    getMessages(),
    getLocale(),
  ]);
  const copy = t.exam.results;
  if (!result || result.kind !== "mock_exam") notFound();
  const answers = await getCompletedAssessmentAnswers(assessment);
  const exam = result.exam as ExamId;
  const profile = snapshot.examProfiles[exam] ?? createEmptyExamProfile(exam);
  const weakest = getWeakestExamSkill(profile) ?? "reading";
  return (
    <>
      <PageHeader
        eyebrow={copy.eyebrow(exam)}
        title={copy.title}
        description={copy.description}
      />
      <div className="grid gap-5 lg:grid-cols-[.7fr_1.3fr]">
        <Card className="bg-exam text-white">
          <CardContent className="pt-6">
            <p className="text-sm text-white/70">{copy.scoreLabel}</p>
            <p className="mt-3 text-6xl font-black">{result.score}%</p>
            <p className="mt-4 text-xs leading-5 text-white/60">
              {copy.scoreNote(exam)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-5 pt-6">
            <h2 className="font-bold">{copy.skillsTitle}</h2>
            {examSkillOrder.map((skill) => {
              const productive = skill === "writing" || skill === "speaking";
              return (
                <div
                  key={skill}
                  className="flex items-center justify-between border-b pb-3 last:border-0"
                >
                  <span>{t.practice.skills[skill]}</span>
                  <strong>
                    {(() => {
                      const entries = answers.filter(
                        (a) =>
                          mockItems.find((i) => i.id === a.question_id)
                            ?.skill === skill,
                      );
                      if (!entries.length) return copy.historical;
                      if (productive)
                        return copy.productive(
                          entries.filter((a) => a.answer.trim()).length,
                          entries.length,
                        );
                      return copy.accuracy(
                        Math.round(
                          (100 * entries.filter((a) => a.is_correct).length) /
                            entries.length,
                        ),
                      );
                    })()}
                  </strong>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
      <section className="mt-8 space-y-4">
        <h2 className="text-2xl font-bold">{copy.correctionsTitle}</h2>
        {answers.map((answer) => {
          const item = mockItems.find((i) => i.id === answer.question_id);
          if (!item) return null;
          return (
            <details key={item.id} className="rounded-xl border p-5">
              <summary>
                {item.kind === "mcq" ? item.prompt : item.title}
              </summary>
              <p className="mt-3">
                {copy.yourResponse}{" "}
                <span lang="fr">
                  {item.kind === "mcq"
                    ? (item.options.find((o) => o.id === answer.answer)
                        ?.label ?? copy.unanswered)
                    : answer.answer || copy.notCompleted}
                </span>
              </p>
              {item.kind === "mcq" ? (
                <>
                  <p className="mt-3">
                    {copy.correctAnswer}{" "}
                    <span lang="fr">
                      {
                        item.options.find(
                          (o) => o.id === item.correction.answer,
                        )?.label
                      }
                    </span>
                  </p>
                  <p className="mt-3">
                    {(locale === "fr" && item.correction.explanationFr) ||
                      item.correction.explanation}
                  </p>
                  {item.audio && (
                    <p className="mt-3 whitespace-pre-line" lang="fr">
                      {item.audio.transcript}
                    </p>
                  )}
                </>
              ) : (
                <>
                  <p className="mt-3">{item.correction.guidance}</p>
                  <ul className="my-3 list-inside list-disc">
                    {item.correction.rubric.map((r) => (
                      <li key={r}>{r}</li>
                    ))}
                  </ul>
                  {item.correction.modelResponse && (
                    <p lang="fr" className="whitespace-pre-line">
                      {item.correction.modelResponse}
                    </p>
                  )}
                </>
              )}
            </details>
          );
        })}
      </section>
      <Card className="mt-5">
        <CardContent className="flex flex-col gap-5 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="eyebrow">{copy.nextEyebrow}</p>
            <h2 className="mt-2 text-xl font-bold">
              {copy.nextTitle(t.practice.skills[weakest])}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {copy.nextBody}
            </p>
          </div>
          <Button asChild>
            <Link href={`/practice/session?skill=${weakest}`}>
              {copy.nextCta} <ArrowRight className="size-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </>
  );
}
