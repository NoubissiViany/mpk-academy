"use client";
import Link from "next/link";
import { useApp } from "@/components/providers/app-provider";
import { LockedContent, ModeBadge, PageHeader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { mockSummaries } from "@/content/mock-summaries";
import { canAccessExam } from "@/lib/domain/access";
export function MockOverview() {
  const { state } = useApp();
  if (!canAccessExam(state.planAccess))
    return (
      <>
        <PageHeader
          eyebrow="Mock Exams"
          title="Measure independent performance."
          description="Four-skill MPK practice simulations."
        />
        <LockedContent title="Unlock Mock Exams" />
      </>
    );
  const exam = state.user?.goal.exam === "TCF Canada" ? "TCF" : "TEF";
  const mock = mockSummaries.find((m) => m.exam === exam)!;
  return (
    <>
      <PageHeader
        eyebrow={`${exam} Canada`}
        title="Mock Exams"
        description="A full-length MPK practice simulation, independently authored. This is not an official examination and does not produce an official score."
        action={<ModeBadge mode="exam" />}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        {mock.sections.map((section) => (
          <Card key={section.skill}>
            <CardContent className="pt-6">
              <h2 className="text-xl font-bold capitalize">{section.skill}</h2>
              <p className="mt-3">
                {section.count}{" "}
                {["reading", "listening"].includes(section.skill)
                  ? "questions"
                  : "tasks"}{" "}
                · {section.durationSeconds / 60} minutes
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="mt-6">
        <CardContent className="space-y-4 pt-6">
          <h2 className="text-xl font-bold">{exam} Canada · MPK Mock 01</h2>
          <p>
            {mock.sections.reduce((n, s) => n + s.durationSeconds, 0) / 60}{" "}
            minutes total
          </p>
          <p>
            Writing and speaking are rehearsal-only. Speaking is timed
            self-practice without a live interlocutor, recording, or AI
            evaluation.
          </p>
          {!mock.ready && (
            <p role="status">
              Audio pending — the complete mock is unavailable until all
              original recordings are ready. Transcript exercises are available
              in Practice.
            </p>
          )}
          <Button asChild>
            <Link href="/exam/setup">Review simulation format</Link>
          </Button>
        </CardContent>
      </Card>
    </>
  );
}
export function MockSetup() {
  const { state } = useApp();
  const exam = state.user?.goal.exam === "TCF Canada" ? "TCF" : "TEF";
  const mock = mockSummaries.find((m) => m.exam === exam)!;
  if (!canAccessExam(state.planAccess))
    return <LockedContent title="Unlock Mock Exams" />;
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        eyebrow={`${exam} Canada`}
        title="Simulation MPK"
        description="Simulation d’entraînement indépendante, et non examen officiel."
      />
      <p>
        Les corrections, les explications et les modèles ne sont accessibles
        qu’après la fin. Les sections terminées sont verrouillées. Les
        enregistrements ne sont diffusés qu’une fois.
      </p>
      <p>
        {exam === "TEF"
          ? "Écrit A : 25 min, 80 mots minimum. Écrit B : 35 min, 200 mots minimum. Oral A : 5 min. Oral B : 10 min."
          : "Écrit : 60 min partagées, 60–120 / 120–150 / 120–180 mots. Oral : 2 min / 5 min 30 (dont 2 min de préparation) / 4 min 30."}
      </p>
      <p>
        Vous pouvez revenir sur les questions de lecture dans la section en
        cours. L’écoute progresse sans retour ni répétition.
      </p>
      {mock.ready ? (
        <Button asChild>
          <Link href="/exam/session">Commencer la simulation</Link>
        </Button>
      ) : (
        <>
          <Button disabled>Audio pending — simulation unavailable</Button>
          <p>
            Les transcriptions restent disponibles pour un entraînement
            clairement identifié dans Practice.
          </p>
        </>
      )}
    </div>
  );
}
