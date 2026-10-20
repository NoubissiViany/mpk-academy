"use client";

import { useState } from "react";
import Link from "next/link";
import { RotateCcw } from "lucide-react";
import { useApp } from "@/components/providers/app-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { hasPlanFeature } from "@/config/product";
import { useI18n } from "@/i18n/client";
import { objectiveSkills } from "@/lib/domain/readiness";

/** Spaced reviews due now for the active exam, with one entry per skill. */
export function ReviewDueCard({ className }: { className?: string }) {
  const { state } = useApp();
  const { t } = useI18n();
  const [now] = useState(() => Date.now());
  const copy = t.practice.select;
  if (!hasPlanFeature(state.planAccess, "mistakeReview")) return null;
  const exam = state.user?.goal.exam;
  const due = state.reviews.filter(
    (review) => review.exam === exam && Date.parse(review.dueAt) <= now,
  );
  if (!due.length) return null;
  return (
    <Card className={className}>
      <CardContent className="flex flex-col gap-4 pt-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <RotateCcw
            className="mt-0.5 size-5 shrink-0 text-primary"
            aria-hidden="true"
          />
          <div>
            <h2 className="font-bold">{copy.reviewTitle(due.length)}</h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              {copy.reviewBody}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          {objectiveSkills.map((skill) => {
            const count = due.filter((review) => review.skill === skill).length;
            return count ? (
              <Button key={skill} asChild>
                <Link href={`/practice/session?skill=${skill}&review=1`}>
                  {copy.reviewCta(t.practice.skills[skill], count)}
                </Link>
              </Button>
            ) : null;
          })}
        </div>
      </CardContent>
    </Card>
  );
}
