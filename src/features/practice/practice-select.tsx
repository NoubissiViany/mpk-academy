"use client";

import Link from "next/link";
import { BookOpen, Headphones, Mic2, PenLine, Target } from "lucide-react";
import { useApp } from "@/components/providers/app-provider";
import { ModeBadge, PageHeader } from "@/components/shared";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { examSkillOrder } from "@/config/exams";
import { hasPlanFeature } from "@/config/product";
import { useI18n } from "@/i18n/client";
import { focusLabel } from "@/i18n/format";
import {
  createEmptyExamProfile,
  getSkillStatus,
} from "@/lib/domain/exam-progress";
import {
  getRecommendedPractice,
  getSkillFocusAreas,
} from "@/lib/domain/personalization";
import type { ExamSkill } from "@/types/domain";
import { ReviewDueCard } from "./review-due-card";

const icons = {
  reading: BookOpen,
  listening: Headphones,
  writing: PenLine,
  speaking: Mic2,
} satisfies Record<ExamSkill, typeof BookOpen>;

export function PracticeSelect() {
  const { state } = useApp();
  const { t } = useI18n();
  const copy = t.practice.select;
  const exam = state.user?.goal.exam;
  const examId = exam === "TCF Canada" ? "TCF Canada" : "TEF Canada";
  const profile = state.examProfiles[examId] ?? createEmptyExamProfile(examId);
  const recommended = getRecommendedPractice(state);
  const personalized = hasPlanFeature(
    state.planAccess,
    "personalizedRecommendations",
  );
  return (
    <>
      <PageHeader
        eyebrow={examId}
        title={copy.title}
        description={copy.description}
        action={<ModeBadge mode="practice" />}
      />
      <ReviewDueCard className="mb-6 border-primary/20 bg-primary/5" />
      <div className="grid gap-4 sm:grid-cols-2">
        {examSkillOrder.map((skill) => {
          const Icon = icons[skill];
          const score = profile.skills[skill].current;
          const focusAreas = getSkillFocusAreas(state, skill);
          const productive = skill === "writing" || skill === "speaking";
          const label = t.practice.skills[skill];
          const frenchLabel = t.practice.frenchSkills[skill];
          return (
            <Link
              key={skill}
              href={`/practice/session?skill=${skill}`}
              className="group"
            >
              <Card className="h-full transition-colors group-hover:border-primary/40">
                <CardContent className="pt-6">
                  <span className="grid size-11 place-items-center rounded-xl bg-practice/10 text-practice">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <h2 className="mt-5 text-xl font-bold group-hover:text-primary">
                    {label}
                  </h2>
                  {frenchLabel !== label && (
                    <p className="mt-1 text-muted-foreground" lang="fr">
                      {frenchLabel}
                    </p>
                  )}
                  <p className="mt-5 font-bold">
                    {productive
                      ? copy.selfPractice
                      : score === null
                        ? t.practice.status.notAssessed
                        : `${score}% · ${t.practice.status[getSkillStatus(score)]}`}
                  </p>
                  {!productive && focusAreas.length > 0 && (
                    <div className="mt-4 text-sm text-muted-foreground">
                      <p className="font-semibold text-foreground">
                        {copy.focusAreas}
                      </p>
                      <ul className="mt-2 space-y-1">
                        {focusAreas.map((area) => (
                          <li key={area.competency}>• {focusLabel(t, area)}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <p
                    className={`mt-5 text-sm font-semibold ${productive ? "text-muted-foreground" : "text-primary"}`}
                  >
                    {productive ? copy.reviewRubric : copy.practise}
                  </p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
      {personalized && recommended && (
        <Card className="mt-6 border-practice/20 bg-practice/5">
          <CardContent className="flex flex-col gap-4 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <Target
                className="mt-0.5 size-5 shrink-0 text-practice"
                aria-hidden="true"
              />
              <div>
                <h2 className="font-bold">{copy.recommendedTitle}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {copy.recommendedBody(t.practice.skills[recommended.skill])}
                </p>
              </div>
            </div>
            <Button asChild className="shrink-0">
              <Link href={recommended.href}>{copy.recommendedCta}</Link>
            </Button>
          </CardContent>
        </Card>
      )}
      {hasPlanFeature(state.planAccess, "aiWritingFeedback") && (
        <Link
          href="/writing"
          className="mt-6 inline-flex items-center gap-1 text-sm font-bold text-primary hover:underline"
        >
          <PenLine className="size-4" aria-hidden="true" />
          {t.writing.feedback.history}
        </Link>
      )}
      <p className="mt-7 text-xs leading-5 text-muted-foreground">
        {copy.productiveNote}
      </p>
    </>
  );
}
