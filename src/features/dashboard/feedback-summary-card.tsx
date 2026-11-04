"use client";
import Link from "next/link";
import { Mic2, PenLine } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useI18n } from "@/i18n/client";
import { intlLocale } from "@/i18n/config";
import type { FeedbackSummary } from "@/lib/domain/learning-overview";

export function FeedbackSummaryCard({
  skill,
  summary,
  preview = false,
}: {
  skill: "writing" | "speaking";
  summary: FeedbackSummary;
  preview?: boolean;
}) {
  const { t, locale } = useI18n();
  const copy = t.ux.feedback;
  const Icon = skill === "writing" ? PenLine : Mic2;
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
            <Icon className="size-5" aria-hidden="true" />
          </span>
          {summary.status !== "self" && <Badge>{copy[summary.status]}</Badge>}
        </div>
        <h4 className="mt-4 text-lg font-bold">{t.practice.skills[skill]}</h4>
        <p className="mt-2 text-sm">
          {summary.available
            ? skill === "writing"
              ? copy.writingAi
              : copy.speakingAi
            : copy.self}
        </p>
        {!preview && (
          <p className="mt-3 text-sm text-muted-foreground">
            {summary.lastPracticeAt
              ? `${copy.lastPractice}: ${new Intl.DateTimeFormat(intlLocale(locale), { dateStyle: "medium" }).format(new Date(summary.lastPracticeAt))}`
              : copy.noPractice}
          </p>
        )}
        <p className="mt-3 text-xs leading-5 text-muted-foreground">
          {copy.separate}
        </p>
        <div className="mt-5 flex flex-wrap gap-x-5 gap-y-3 text-sm font-bold text-primary">
          <Link
            href={preview ? "/diagnostic" : `/practice/session?skill=${skill}`}
            className="hover:underline"
          >
            {preview ? t.landing.hero.primary : copy.start}
          </Link>
          {!preview && summary.status !== "self" && (
            <Link
              href={summary.href ?? `/${skill}`}
              className="hover:underline"
            >
              {summary.href ? copy.view : copy.history}
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
