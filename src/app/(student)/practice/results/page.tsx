import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, RotateCcw } from "lucide-react";
import { PageHeader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { hasPlanFeature } from "@/config/product";
import { getLearnerSnapshot, getPracticeResult } from "@/lib/supabase/learner";

export default async function PracticeResultsPage({
  searchParams,
}: {
  searchParams: Promise<{ session?: string }>;
}) {
  const { session } = await searchParams;
  if (!session) notFound();
  const [result, snapshot] = await Promise.all([
    getPracticeResult(session),
    getLearnerSnapshot(),
  ]);
  if (!result) notFound();
  const canReviewMistakes = hasPlanFeature(
    snapshot.planAccess,
    "mistakeReview",
  );
  return (
    <>
      <PageHeader
        eyebrow={`${result.exam} practice complete`}
        title="Good work. Now use the evidence."
        description="This saved result updated your active exam profile and relevant mistake patterns."
      />
      <div className="grid gap-5 sm:grid-cols-2">
        <Card className="bg-practice text-white">
          <CardContent className="pt-6">
            <p className="text-sm text-white/70">Session result</p>
            <p className="mt-2 text-5xl font-black">{result.score}%</p>
            <p className="mt-2 text-xs text-white/70">
              {result.correct_count} of {result.question_count} correct
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">What changed</p>
            <p className="mt-2 text-xl font-bold">Your {result.skill} trend</p>
            <p className="mt-2 text-xs text-primary">
              Recency-weighted practice evidence
            </p>
          </CardContent>
        </Card>
      </div>
      <Card className="mt-5">
        <CardContent className="flex flex-col gap-5 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-bold">Recommended next action</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Review any new pattern, or return to your dashboard for the
              clearest next step.
            </p>
          </div>
          <div className="flex gap-3">
            {canReviewMistakes && (
              <Button asChild variant="secondary">
                <Link href="/mistakes">
                  <RotateCcw className="size-4" />
                  Review mistakes
                </Link>
              </Button>
            )}
            <Button asChild>
              <Link href="/dashboard">
                Dashboard <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
