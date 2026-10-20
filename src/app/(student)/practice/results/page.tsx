import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, RotateCcw } from "lucide-react";
import { PageHeader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { hasPlanFeature } from "@/config/product";
import { getMessages } from "@/i18n/server";
import { getLearnerAccess, getPracticeResult } from "@/lib/supabase/learner";
import type { ExamSkill } from "@/types/domain";

export default async function PracticeResultsPage({
  searchParams,
}: {
  searchParams: Promise<{ session?: string }>;
}) {
  const { session } = await searchParams;
  if (!session) notFound();
  const [result, access, t] = await Promise.all([
    getPracticeResult(session),
    getLearnerAccess(),
    getMessages(),
  ]);
  if (!result) notFound();
  const copy = t.practice.results;
  const canReviewMistakes = hasPlanFeature(access.planAccess, "mistakeReview");
  const scored = result.score !== null;
  const skill = t.practice.skills[result.skill as ExamSkill] ?? result.skill;
  return (
    <>
      <PageHeader
        eyebrow={copy.eyebrow(result.exam)}
        title={copy.title}
        description={scored ? copy.scored : copy.unscored}
      />
      <div className="grid gap-5 sm:grid-cols-2">
        <Card className="bg-practice text-white">
          <CardContent className="pt-6">
            <p className="text-sm text-white/70">{copy.sessionResult}</p>
            <p className="mt-2 text-5xl font-black">
              {scored ? `${result.score}%` : copy.completed}
            </p>
            <p className="mt-2 text-xs text-white/70">
              {scored
                ? copy.correctCount(result.correct_count, result.question_count)
                : result.evidence_mode === "transcript"
                  ? copy.transcript
                  : copy.selfPractice}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">{copy.whatChanged}</p>
            <p className="mt-2 text-xl font-bold">
              {scored ? copy.trend(skill) : copy.completionSaved}
            </p>
            <p className="mt-2 text-xs text-primary">
              {scored ? copy.recency : copy.noPercentage}
            </p>
          </CardContent>
        </Card>
      </div>
      <Card className="mt-5">
        <CardContent className="flex flex-col gap-5 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-bold">{copy.nextTitle}</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {copy.nextBody}
            </p>
          </div>
          <div className="flex gap-3">
            {canReviewMistakes && (
              <Button asChild variant="secondary">
                <Link href="/mistakes">
                  <RotateCcw className="size-4" aria-hidden="true" />
                  {copy.reviewMistakes}
                </Link>
              </Button>
            )}
            <Button asChild>
              <Link href="/dashboard">
                {copy.dashboard} <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
