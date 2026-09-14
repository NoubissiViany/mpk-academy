"use client";

import Link from "next/link";
import { BookOpen, Clock3, Headphones, Mic2, PenLine } from "lucide-react";
import { useApp } from "@/components/providers/app-provider";
import { LockedContent, ModeBadge, PageHeader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { examConfigurations } from "@/config/exams";
import { canAccessExam } from "@/lib/domain/access";

export function MockOverview() {
  const { state } = useApp();
  if (!canAccessExam(state.user?.tier ?? "visitor"))
    return (
      <>
        <PageHeader
          eyebrow="Mock Exams"
          title="Measure independent performance."
          description="Four-skill, French-first simulations are included in the full program."
        />
        <LockedContent title="Unlock Mock Exams" />
      </>
    );
  const exam =
    state.user?.goal.exam === "TCF Canada" ? "TCF Canada" : "TEF Canada";
  const config = examConfigurations[exam];
  const rows = [
    [BookOpen, "Reading", config.officialFormat.reading],
    [Headphones, "Listening", config.officialFormat.listening],
    [PenLine, "Writing", config.officialFormat.writing],
    [Mic2, "Speaking", config.officialFormat.speaking],
  ] as const;
  return (
    <>
      <PageHeader
        eyebrow={exam}
        title="Mock Exams"
        description={`Know the official ${config.shortName} format, then practise with a shortened independent MPK simulation.`}
        action={<ModeBadge mode="exam" />}
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-bold tracking-[0.14em]">
          OFFICIAL FORMAT INFORMATION
        </h2>
        <a
          href={config.officialUrl}
          target="_blank"
          rel="noreferrer"
          className="text-sm font-bold text-primary hover:underline"
        >
          View official {config.shortName} format ↗
        </a>
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {rows.map(([Icon, label, copy]) => (
          <Card key={label}>
            <CardContent className="pt-6">
              <Icon className="size-5 text-exam" />
              <h3 className="mt-4 font-bold">{label}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {copy}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="mt-6 border-exam/20 bg-exam/5">
        <CardContent className="flex flex-col gap-5 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold tracking-[0.14em] text-exam">
              SHORTENED MPK MOCK
            </p>
            <h2 className="mt-2 text-xl font-bold">
              Four skills · approximately {config.scaledMock.durationMinutes}{" "}
              minutes
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              5 Reading · 5 Listening · {config.scaledMock.writingTasks} Writing
              · {config.scaledMock.speakingTasks} Speaking
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              This independent simulation is shorter than the official exam and
              does not produce an official score. Productive tasks receive
              completion credit and are not automatically language-scored.
            </p>
          </div>
          <Button asChild>
            <Link href="/exam/setup">Prepare mock</Link>
          </Button>
        </CardContent>
      </Card>
    </>
  );
}

export function MockSetup() {
  const { state } = useApp();
  const exam =
    state.user?.goal.exam === "TCF Canada" ? "TCF Canada" : "TEF Canada";
  const config = examConfigurations[exam];
  return (
    <>
      <PageHeader
        eyebrow="Before you begin"
        title={`${exam} shortened mock`}
        description="Choose a quiet place. Instructional help and corrections return only after submission."
        action={<ModeBadge mode="exam" />}
      />
      <Card className="mx-auto max-w-3xl">
        <CardContent className="pt-6">
          <div className="grid gap-5 border-b pb-6 sm:grid-cols-3">
            <div>
              <Clock3 className="size-5 text-exam" />
              <p className="mt-3 text-sm text-muted-foreground">
                Estimated duration
              </p>
              <strong>{config.scaledMock.durationMinutes} minutes</strong>
            </div>
            <div>
              <BookOpen className="size-5 text-exam" />
              <p className="mt-3 text-sm text-muted-foreground">
                Comprehension
              </p>
              <strong>5 Reading + 5 Listening</strong>
            </div>
            <div>
              <Mic2 className="size-5 text-exam" />
              <p className="mt-3 text-sm text-muted-foreground">
                Productive tasks
              </p>
              <strong>
                {config.scaledMock.writingTasks} Writing +{" "}
                {config.scaledMock.speakingTasks} Speaking
              </strong>
            </div>
          </div>
          <div className="mt-6 rounded-xl bg-exam/5 p-5">
            <h2 className="font-bold">
              {config.shortName}-specific rules apply.
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {exam === "TEF Canada"
                ? "Listening is one-way: once you advance, you cannot return to a listening question."
                : "Follow the three productive tasks in order and manage the progressive difficulty."}
            </p>
          </div>
          <Button
            asChild
            size="lg"
            className="mt-7 w-full bg-exam hover:bg-exam/90"
          >
            <Link href="/exam/session">Start shortened mock</Link>
          </Button>
          <p className="mt-4 text-center text-xs text-muted-foreground">
            Need a different exam? Switch your active profile in{" "}
            <Link className="font-bold text-primary" href="/settings">
              Settings
            </Link>
            .
          </p>
        </CardContent>
      </Card>
    </>
  );
}
