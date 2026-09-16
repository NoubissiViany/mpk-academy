"use client";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useApp } from "@/components/providers/app-provider";
import { PageHeader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { examSkillContent, examSkillOrder } from "@/config/exams";
import {
  createEmptyExamProfile,
  getWeakestExamSkill,
} from "@/lib/domain/exam-progress";
export default function ExamResultsPage() {
  const { state } = useApp();
  const exam =
    state.user?.goal.exam === "TCF Canada" ? "TCF Canada" : "TEF Canada";
  const profile = state.examProfiles[exam] ?? createEmptyExamProfile(exam);
  const score = state.lastExamScore ?? profile.mockAverage ?? 0;
  const weakest = getWeakestExamSkill(profile) ?? "reading";
  return (
    <>
      <PageHeader
        eyebrow={`${exam} shortened mock`}
        title="Your independent performance"
        description="Instructional support is available again. Use this practice evidence to choose what to strengthen next."
      />
      <div className="grid gap-5 lg:grid-cols-[.7fr_1.3fr]">
        <Card className="bg-exam text-white">
          <CardContent className="pt-6">
            <p className="text-sm text-white/70">MPK comprehension result</p>
            <p className="mt-3 text-6xl font-black">{score}%</p>
            <p className="mt-4 text-xs leading-5 text-white/60">
              Shortened independent simulation—not an official {exam} score,
              immigration result, or prediction. This percentage uses Reading
              and Listening only. Writing and Speaking are rehearsal tasks and
              are not corrected or scored.
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
                    {productive || profile.skills[skill].current === null
                      ? "Not assessed yet"
                      : `${profile.skills[skill].current}%`}
                  </strong>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
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
