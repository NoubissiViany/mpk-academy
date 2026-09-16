"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, BookOpen, Target } from "lucide-react";
import { useApp } from "@/components/providers/app-provider";
import { EmptyState, PageHeader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getMistakeDetail } from "@/lib/domain/personalization";

export function MistakeDetail({ mistakeId }: { mistakeId: string }) {
  const { state } = useApp();
  const detail = getMistakeDetail(state, mistakeId);
  if (!detail)
    return (
      <>
        <EmptyState
          title="Mistake pattern not found"
          description="This pattern may no longer be part of your current exam profile."
        />
        <Button asChild variant="secondary" className="mt-6">
          <Link href="/mistakes">Return to mistakes</Link>
        </Button>
      </>
    );

  const skill = detail.anchor.examSkill ?? "reading";
  const practiceHref = `/practice/session?skill=${skill}&focus=${detail.anchor.competencyId}&count=10`;
  return (
    <>
      <Link
        href="/mistakes"
        className="mb-5 inline-flex items-center gap-1 text-sm font-bold text-primary hover:underline"
      >
        <ArrowLeft className="size-4" /> Back to mistakes
      </Link>
      <PageHeader
        eyebrow={detail.anchor.examSkill ?? "Weakness review"}
        title={detail.title}
        description={`You've struggled with this pattern ${detail.count} ${detail.count === 1 ? "time" : "times"}.`}
      />

      <section aria-labelledby="recent-examples">
        <h2 id="recent-examples" className="text-xl font-bold">
          Most recent examples
        </h2>
        <div className="mt-4 space-y-4">
          {detail.examples.map((example) => (
            <Card key={example.id}>
              <CardContent className="grid gap-4 pt-6 md:grid-cols-2">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
                    Your answer
                  </p>
                  <p className="mt-2 font-semibold">{example.learnerAnswer}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
                    Correct answer
                  </p>
                  <p className="mt-2 font-semibold">{example.correctAnswer}</p>
                </div>
                <p className="text-sm leading-6 text-muted-foreground md:col-span-2">
                  {example.explanation}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <div className="mt-7 grid gap-5 md:grid-cols-2">
        <Card className="border-learn/20">
          <CardContent className="flex h-full flex-col pt-6">
            <BookOpen className="size-5 text-learn" aria-hidden="true" />
            <p className="mt-4 text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
              Recommended lesson
            </p>
            <h2 className="mt-2 text-xl font-bold">
              {detail.lesson?.title ?? "Review the related lesson"}
            </h2>
            {detail.lesson && (
              <Button asChild className="mt-6 w-fit">
                <Link
                  href={`/learn/${detail.lesson.moduleId}/${detail.lesson.id}`}
                >
                  Review lesson <ArrowRight className="size-4" />
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
        <Card className="border-practice/20">
          <CardContent className="flex h-full flex-col pt-6">
            <Target className="size-5 text-practice" aria-hidden="true" />
            <p className="mt-4 text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
              Recommended practice
            </p>
            <h2 className="mt-2 text-xl font-bold">10 targeted questions</h2>
            <Button asChild className="mt-6 w-fit">
              <Link href={practiceHref}>
                Practice weakness <ArrowRight className="size-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
