"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { useApp } from "@/components/providers/app-provider";
import { EmptyState, PageHeader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { examSkillContent, examSkillOrder } from "@/config/exams";
import type { ExamSkill } from "@/types/domain";
import { cn } from "@/lib/utils";
import { aggregateMistakePatterns } from "@/lib/domain/exam-progress";

type Filter = "all" | ExamSkill;
const filters: Filter[] = ["all", ...examSkillOrder];

export default function MistakesPage() {
  const { state } = useApp();
  const [filter, setFilter] = useState<Filter>("all");
  const exam = state.user?.goal.exam;
  const mistakes = aggregateMistakePatterns(
    state.mistakes.filter(
      (mistake) =>
        (!mistake.exam || mistake.exam === exam) &&
        (filter === "all" || mistake.examSkill === filter),
    ),
  );
  const grouped = examSkillOrder
    .map((skill) => ({
      skill,
      items: mistakes.filter((item) => item.examSkill === skill),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <>
      <PageHeader
        eyebrow={typeof exam === "string" ? exam : undefined}
        title="My Mistakes"
        description="Patterns from your assessed Reading and Listening practice."
      />
      <div
        className="flex gap-2 overflow-x-auto pb-2"
        role="tablist"
        aria-label="Filter mistakes"
      >
        {filters.map((item) => (
          <button
            key={item}
            role="tab"
            aria-selected={filter === item}
            onClick={() => setFilter(item)}
            className={cn(
              "rounded-full border px-4 py-2 text-sm font-semibold capitalize",
              filter === item
                ? "border-primary bg-primary text-primary-foreground"
                : "bg-card",
            )}
          >
            {item === "all" ? "All" : examSkillContent[item].label}
          </button>
        ))}
      </div>
      {grouped.length === 0 ? (
        <div className="mt-5">
          <EmptyState
            title="No mistake patterns here"
            description="Complete exam-specific practice and any recurring patterns will appear here."
          />
        </div>
      ) : (
        <div className="mt-6 space-y-6">
          {grouped.map(({ skill, items }) => (
            <Card key={skill}>
              <CardContent className="pt-6">
                <h2 className="text-lg font-bold">
                  {examSkillContent[skill].label}
                </h2>
                <div className="mt-4 divide-y">
                  {items.map((mistake) => (
                    <Link
                      key={mistake.id}
                      href={`/mistakes/${mistake.id}`}
                      className="flex min-h-14 items-center justify-between gap-4 py-3 hover:text-primary"
                    >
                      <span className="font-medium">
                        {mistake.pattern ?? mistake.mistakeCategory}
                      </span>
                      <span className="inline-flex shrink-0 items-center gap-2 text-sm text-muted-foreground">
                        {mistake.count ?? 1}{" "}
                        {(mistake.count ?? 1) === 1 ? "mistake" : "mistakes"}
                        <ArrowRight className="size-4" />
                      </span>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <Button asChild variant="secondary" className="mt-7">
        <Link href="/practice">Choose another skill</Link>
      </Button>
    </>
  );
}
