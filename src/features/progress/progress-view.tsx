"use client";

import { useApp } from "@/components/providers/app-provider";
import { PageHeader } from "@/components/shared";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { examSkillContent, examSkillOrder } from "@/config/exams";
import { hasPlanFeature } from "@/config/product";
import {
  createEmptyExamProfile,
  getWeakestExamSkill,
} from "@/lib/domain/exam-progress";

export function ProgressView() {
  const { state } = useApp();
  const exam = state.user?.goal.exam;
  if (exam !== "TEF Canada" && exam !== "TCF Canada") {
    return (
      <PageHeader
        title="Progress"
        description="Choose your exam on the dashboard to begin tracking exam-specific progress."
      />
    );
  }
  const profile = state.examProfiles[exam] ?? createEmptyExamProfile(exam);
  if (!hasPlanFeature(state.planAccess, "detailedReadiness")) {
    return (
      <>
        <PageHeader
          eyebrow={exam}
          title="Progress"
          description="Your course and practice activity with the Essential plan."
        />
        <div className="grid gap-5 sm:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Course completion</p>
              <p className="mt-2 text-3xl font-bold">
                {state.progress.courseCompletion}%
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">
                Practice questions
              </p>
              <p className="mt-2 text-3xl font-bold">
                {state.progress.practiceAnswered}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Practice accuracy</p>
              <p className="mt-2 text-3xl font-bold">
                {state.progress.practiceAccuracy}%
              </p>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }
  const readinessBaseline = profile.readinessBaseline30Days;
  const readiness = profile.readiness;
  const changes = examSkillOrder.map((skill) => ({
    skill,
    change:
      profile.skills[skill].current !== null &&
      profile.skills[skill].baseline30Days !== null
        ? profile.skills[skill].current! - profile.skills[skill].baseline30Days!
        : null,
  }));
  const biggest = changes
    .filter((item) => item.change !== null)
    .sort((a, b) => b.change! - a.change!)[0];
  const priority = getWeakestExamSkill(profile);
  const readinessChange =
    readiness !== null && readinessBaseline !== null
      ? readiness - readinessBaseline
      : null;

  return (
    <>
      <PageHeader
        eyebrow={exam}
        title="Progress"
        description="Your diagnostic readiness and assessed-skill movement over the last 30 days."
      />
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm font-semibold">Diagnostic readiness</p>
          <div className="mt-4 flex items-baseline gap-3">
            <span className="text-muted-foreground">
              {readinessBaseline === null ? "—" : `${readinessBaseline}%`}
            </span>
            <span>→</span>
            <strong className="text-3xl">
              {readiness === null ? "Not assessed yet" : `${readiness}%`}
            </strong>
            {readinessChange !== null && (
              <span className="font-bold text-primary">
                ↑ {readinessChange >= 0 ? "+" : ""}
                {Math.round(readinessChange)}%
              </span>
            )}
          </div>
          <Progress
            className="mt-4"
            value={readiness ?? 0}
            label="Diagnostic readiness"
          />
          <p className="mt-3 text-xs text-muted-foreground">
            This readiness comes from your latest diagnostic and is not changed
            by practice or shortened mock results.
          </p>
        </CardContent>
      </Card>
      <h2 className="mt-9 text-sm font-bold tracking-[0.14em]">
        SKILL PROGRESS
      </h2>
      <Card className="mt-4">
        <CardContent className="space-y-7 pt-6">
          {examSkillOrder.map((skill) => {
            const values = profile.skills[skill];
            const change =
              values.current !== null && values.baseline30Days !== null
                ? values.current - values.baseline30Days
                : null;
            return (
              <div key={skill}>
                <div className="mb-2 flex flex-wrap items-center justify-between gap-3 text-sm">
                  <strong>{examSkillContent[skill].label}</strong>
                  {values.current === null ? (
                    <span className="font-semibold text-muted-foreground">
                      Not assessed yet
                    </span>
                  ) : (
                    <span>
                      <span className="text-muted-foreground">
                        {values.baseline30Days ?? values.current}% →{" "}
                      </span>
                      <strong>{values.current}%</strong>
                      {change !== null && (
                        <span className="ml-3 font-bold text-primary">
                          ↑{change}
                        </span>
                      )}
                    </span>
                  )}
                </div>
                <Progress
                  value={values.current ?? 0}
                  label={`${examSkillContent[skill].label} progress`}
                />
              </div>
            );
          })}
        </CardContent>
      </Card>
      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs font-bold tracking-[0.14em] text-muted-foreground">
              YOUR BIGGEST IMPROVEMENT
            </p>
            <p className="mt-3 text-2xl font-bold">
              {biggest
                ? `${examSkillContent[biggest.skill].label} ↑${biggest.change}`
                : "More evidence needed"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs font-bold tracking-[0.14em] text-muted-foreground">
              CURRENT PRIORITY
            </p>
            <p className="mt-3 text-2xl font-bold">
              {priority ? examSkillContent[priority].label : "Not assessed yet"}
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
