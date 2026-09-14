"use client";

import Link from "next/link";
import { BookOpen, Headphones, Mic2, PenLine } from "lucide-react";
import { useApp } from "@/components/providers/app-provider";
import { ModeBadge, PageHeader } from "@/components/shared";
import { Card, CardContent } from "@/components/ui/card";
import { examSkillContent, examSkillOrder } from "@/config/exams";
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
          return (
            <Link
              key={skill}
              href={`/practice/session?skill=${skill}`}
              className="group"
            >
              <Card className="h-full transition-colors group-hover:border-primary/40">
                <CardContent className="pt-6">
                  <span className="grid size-11 place-items-center rounded-xl bg-practice/10 text-practice">
                    <Icon className="size-5" />
                  </span>
                  <h2 className="mt-5 text-xl font-bold group-hover:text-primary">
                    {item.label}
                  </h2>
                  <p className="mt-1 text-muted-foreground">{item.labelFr}</p>
                  <p className="mt-5 text-sm font-semibold text-primary">
                    Practice →
                  </p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
      <p className="mt-7 text-xs leading-5 text-muted-foreground">
        Writing and speaking use learner self-review rubrics. They are practice
        indicators, not automated language evaluations or official exam scores.
      </p>
    </>
  );
}
