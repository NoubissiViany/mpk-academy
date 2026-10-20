"use client";

import { useApp } from "@/components/providers/app-provider";
import { PageHeader } from "@/components/shared";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { examSkillOrder } from "@/config/exams";
import { hasPlanFeature } from "@/config/product";
import { useI18n } from "@/i18n/client";
import {
  createEmptyExamProfile,
  getWeakestExamSkill,
} from "@/lib/domain/exam-progress";

export function ProgressView() {
  const { state } = useApp();
  const { t } = useI18n();
  const copy = t.account.progress;
  const skills = t.practice.skills;
  const exam = state.user?.goal.exam;
  if (exam !== "TEF Canada" && exam !== "TCF Canada") {
    return <PageHeader title={copy.title} description={copy.chooseExam} />;
  }
  const profile = state.examProfiles[exam] ?? createEmptyExamProfile(exam);
  if (!hasPlanFeature(state.planAccess, "detailedReadiness")) {
    return (
      <>
        <PageHeader
          eyebrow={exam}
          title={copy.title}
          description={copy.basicDescription}
        />
        <div className="grid gap-5 sm:grid-cols-3">
          {[
            [copy.courseCompletion, `${state.progress.courseCompletion}%`],
            [copy.practiceQuestions, String(state.progress.practiceAnswered)],
            [copy.practiceAccuracy, `${state.progress.practiceAccuracy}%`],
          ].map(([label, value]) => (
            <Card key={label}>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="mt-2 text-3xl font-bold">{value}</p>
              </CardContent>
            </Card>
          ))}
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
  const signed = (value: number) =>
    `${value >= 0 ? "+" : ""}${Math.round(value)}`;

  return (
    <>
      <PageHeader
        eyebrow={exam}
        title={copy.title}
        description={copy.description}
      />
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm font-semibold">{copy.readiness}</p>
          <div className="mt-4 flex items-baseline gap-3">
            <span className="text-muted-foreground">
              {readinessBaseline === null ? "—" : `${readinessBaseline}%`}
            </span>
            <span aria-hidden="true">→</span>
            <strong className="text-3xl">
              {readiness === null ? copy.notAssessed : `${readiness}%`}
            </strong>
            {readinessChange !== null && readinessChange !== 0 && (
              <span className="font-bold text-primary">
                {signed(readinessChange)}%
              </span>
            )}
          </div>
          <Progress
            className="mt-4"
            value={readiness ?? 0}
            label={copy.readiness}
          />
          <p className="mt-3 text-xs text-muted-foreground">
            {copy.readinessNote}
          </p>
        </CardContent>
      </Card>
      <h2 className="mt-9 text-sm font-bold tracking-[0.14em]">
        {copy.skillProgress}
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
                  <strong>{skills[skill]}</strong>
                  {values.current === null ? (
                    <span className="font-semibold text-muted-foreground">
                      {copy.notAssessed}
                    </span>
                  ) : (
                    <span>
                      <span className="text-muted-foreground">
                        {values.baseline30Days ?? values.current}% →{" "}
                      </span>
                      <strong>{values.current}%</strong>
                      {change !== null && change !== 0 && (
                        <span className="ml-3 font-bold text-primary">
                          {signed(change)}
                        </span>
                      )}
                    </span>
                  )}
                </div>
                <Progress
                  value={values.current ?? 0}
                  label={copy.skillLabel(skills[skill])}
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
              {copy.biggest}
            </p>
            <p className="mt-3 text-2xl font-bold">
              {biggest && biggest.change! > 0
                ? `${skills[biggest.skill]} ${signed(biggest.change!)}`
                : copy.moreEvidence}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs font-bold tracking-[0.14em] text-muted-foreground">
              {copy.priority}
            </p>
            <p className="mt-3 text-2xl font-bold">
              {priority ? skills[priority] : copy.notAssessed}
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
