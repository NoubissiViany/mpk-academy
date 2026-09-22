"use client";

import Link from "next/link";
import { BookOpen, Headphones, Mic2, PenLine, Target } from "lucide-react";
import { useApp } from "@/components/providers/app-provider";
import { ModeBadge, PageHeader } from "@/components/shared";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { examSkillContent, examSkillOrder } from "@/config/exams";
import { hasPlanFeature } from "@/config/product";
import {
  createEmptyExamProfile,
  getSkillStatus,
} from "@/lib/domain/exam-progress";
import {
  getRecommendedPractice,
  getSkillFocusAreas,
} from "@/lib/domain/personalization";
import type { ExamSkill } from "@/types/domain";

const icons = {
  reading: BookOpen,
  listening: Headphones,
  writing: PenLine,
  speaking: Mic2,
} satisfies Record<ExamSkill, typeof BookOpen>;

export function PracticeSelect() {
  const { state } = useApp();
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
        eyebrow={exam === "TCF Canada" ? "TCF Canada" : "TEF Canada"}
        title="Choose a skill"
        description="Practice uses the prompts, question style, and navigation rules of your active exam."
        action={<ModeBadge mode="practice" />}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        {examSkillOrder.map((skill) => {
          const Icon = icons[skill];
          const item = examSkillContent[skill];
          const score = profile.skills[skill].current;
          const focusAreas = getSkillFocusAreas(state, skill);
          const productive = skill === "writing" || skill === "speaking";
          const card = (
            <Card className="h-full transition-colors group-hover:border-primary/40">
              <CardContent className="pt-6">
                <span className="grid size-11 place-items-center rounded-xl bg-practice/10 text-practice">
                  <Icon className="size-5" />
                </span>
                <h2 className="mt-5 text-xl font-bold group-hover:text-primary">
                  {item.label}
                </h2>
                <p className="mt-1 text-muted-foreground">{item.labelFr}</p>
                <p className="mt-5 font-bold">
                  {productive
                    ? "Coming soon"
                    : score === null
                      ? "Not assessed yet"
                      : `${score}% · ${getSkillStatus(score)}`}
                </p>
                {!productive && focusAreas.length > 0 && (
                  <div className="mt-4 text-sm text-muted-foreground">
                    <p className="font-semibold text-foreground">
                      Focus areas:
                    </p>
                    <ul className="mt-2 space-y-1">
                      {focusAreas.map((area) => (
                        <li key={area.label}>• {area.label}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <p
                  className={`mt-5 text-sm font-semibold ${productive ? "text-muted-foreground" : "text-primary"}`}
                >
                  {productive
                    ? "Correction is not available yet"
                    : "Practice →"}
                </p>
              </CardContent>
            </Card>
          );
          return productive ? (
            <div key={skill} aria-disabled="true">
              {card}
            </div>
          ) : (
            <Link
              key={skill}
              href={`/practice/session?skill=${skill}`}
              className="group"
            >
              {card}
            </Link>
          );
        })}
      </div>
      {personalized && recommended && (
        <Card className="mt-6 border-practice/20 bg-practice/5">
          <CardContent className="flex flex-col gap-4 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <Target className="mt-0.5 size-5 shrink-0 text-practice" />
              <div>
                <h2 className="font-bold">Recommended weakness</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Focus next on {recommended.label.toLowerCase()} using your
                  current evidence.
                </p>
              </div>
            </div>
            <Button asChild className="shrink-0">
              <Link href={recommended.href}>Practice recommended weakness</Link>
            </Button>
          </CardContent>
        </Card>
      )}
      <p className="mt-7 text-xs leading-5 text-muted-foreground">
        Writing and speaking lessons remain available, but corrected practice
        for those skills is coming soon.
      </p>
    </>
  );
}
