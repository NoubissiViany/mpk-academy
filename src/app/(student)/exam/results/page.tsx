import { mockItems } from "@/content/mock-catalog";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { examSkillContent, examSkillOrder } from "@/config/exams";
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
  const [result, snapshot] = await Promise.all([
    getAssessmentResult(assessment),
    getLearnerSnapshot(),
  ]);
  if (!result || result.kind !== "mock_exam") notFound();
  const answers = await getCompletedAssessmentAnswers(assessment);
  const exam = result.exam as ExamId;
  const profile = snapshot.examProfiles[exam] ?? createEmptyExamProfile(exam);
  const weakest = getWeakestExamSkill(profile) ?? "reading";
  return (
    <>
      <PageHeader
        eyebrow={`${exam} MPK practice simulation`}
        title="Your independent performance"
        description="Instructional support is available again. Use this saved practice evidence to choose what to strengthen next."
      />
      <div className="grid gap-5 lg:grid-cols-[.7fr_1.3fr]">
        <Card className="bg-exam text-white">
          <CardContent className="pt-6">
            <p className="text-sm text-white/70">MPK comprehension result</p>
            <p className="mt-3 text-6xl font-black">{result.score}%</p>
            <p className="mt-4 text-xs leading-5 text-white/60">
              Independent practice simulation. This is not an official {exam}{" "}
              score, immigration result, or prediction. This percentage uses
              Reading and Listening only. Writing and Speaking are rehearsal
              tasks and are not corrected or scored.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-5 pt-6">
            <h2 className="font-bold">Your four exam skills</h2>
            {examSkillOrder.map((skill) => {
              const productive = skill === "writing" || skill === "speaking";
              return (
                <div
                  key={skill}
                  className="flex items-center justify-between border-b pb-3 last:border-0"
                >
                  <span>{examSkillContent[skill].label}</span>
                  <strong>
                    {(() => {
                      const entries = answers.filter(
                        (a) =>
                          mockItems.find((i) => i.id === a.question_id)
                            ?.skill === skill,
                      );
                      if (!entries.length) return "Historical result";
                      if (productive)
                        return `${entries.filter((a) => a.answer.trim()).length}/${entries.length} completed · not scored`;
                      return `${Math.round((100 * entries.filter((a) => a.is_correct).length) / entries.length)}% practice accuracy`;
                    })()}
                  </strong>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
      <section className="mt-8 space-y-4">
        <h2 className="text-2xl font-bold">Corrections and self-review</h2>
        {answers.map((answer) => {
          const item = mockItems.find((i) => i.id === answer.question_id);
          if (!item) return null;
          return (
            <details key={item.id} className="rounded-xl border p-5">
              <summary>
                {item.kind === "mcq" ? item.prompt : item.title}
              </summary>
              <p className="mt-3">
                Your response:{" "}
                {item.kind === "mcq"
                  ? (item.options.find((o) => o.id === answer.answer)?.label ??
                    "Unanswered")
                  : answer.answer || "Not completed"}
              </p>
              {item.kind === "mcq" ? (
                <>
                  <p className="mt-3">
                    Correct answer:{" "}
                    {
                      item.options.find((o) => o.id === item.correction.answer)
                        ?.label
                    }
                  </p>
                  <p className="mt-3">{item.correction.explanation}</p>
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
            <p className="eyebrow">Recommended next</p>
            <h2 className="mt-2 text-xl font-bold">
              Practice {examSkillContent[weakest].label.toLowerCase()}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              This is currently your weakest assessed exam skill.
            </p>
          </div>
          <Button asChild>
            <Link href={`/practice/session?skill=${weakest}`}>
              Start targeted practice <ArrowRight className="size-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </>
  );
}
