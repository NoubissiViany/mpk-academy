"use client";

import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Clock3,
  FileQuestion,
  ShieldCheck,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useApp } from "@/components/providers/app-provider";
import { QuestionCard } from "@/features/assessment/question-card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { diagnosticSkillContent } from "@/config/diagnostic";
import { diagnosticQuestions } from "@/data/questions";
import { scoreDiagnostic } from "@/lib/domain/diagnostic";
import type {
  DiagnosticIntake,
  DiagnosticTarget,
  ExamType,
  FrenchExperience,
} from "@/types/domain";

const goalOptions: Array<{ value: ExamType; label: string }> = [
  { value: "TEF Canada", label: "Prepare for TEF Canada" },
  { value: "TCF Canada", label: "Prepare for TCF Canada" },
  { value: "Not sure yet", label: "I'm not sure yet" },
];

const targetOptions: DiagnosticTarget[] = [
  "NCLC 5",
  "NCLC 7",
  "NCLC 9+",
  "I'm not sure",
];
const experienceOptions: FrenchExperience[] = [
  "I'm just starting",
  "I know some French",
  "I can communicate in French",
  "I'm already comfortable in French",
  "I'm not sure",
];

function StepMarker({ step }: { step: 1 | 2 }) {
  return (
    <div
      className="mb-8 flex items-center gap-3"
      aria-label={`Step ${step} of 3`}
    >
      {[1, 2, 3].map((item) => (
        <span
          key={item}
          className={`h-1.5 flex-1 rounded-full ${item <= step ? "bg-primary" : "bg-muted"}`}
        />
      ))}
      <span className="shrink-0 text-xs font-bold uppercase tracking-[.14em] text-muted-foreground">
        Step {step} of 3
      </span>
    </div>
  );
}

function ChoiceGroup<T extends string>({
  legend,
  name,
  options,
  value,
  onChange,
}: {
  legend: string;
  name: string;
  options: Array<{ value: T; label: string }>;
  value?: T;
  onChange: (value: T) => void;
}) {
  return (
    <fieldset>
      <legend className="text-base font-bold">{legend}</legend>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {options.map((option) => (
          <label
            key={option.value}
            className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium transition-colors focus-within:ring-2 focus-within:ring-primary ${
              value === option.value
                ? "border-primary bg-primary/5"
                : "bg-background hover:bg-muted/50"
            }`}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              className="size-4 accent-primary"
            />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function DiagnosticFlow() {
  const { hydrated } = useApp();
  if (!hydrated) {
    return (
      <div
        className="mx-auto h-96 max-w-4xl animate-pulse rounded-2xl bg-muted"
        aria-label="Loading assessment"
      />
    );
  }
  return <DiagnosticExperience />;
}

function DiagnosticExperience() {
  const router = useRouter();
  const { state, setState } = useApp();
  const [stage, setStage] = useState<"intro" | "questions">("intro");
  const [index, setIndex] = useState(0);
  const [intake, setIntake] = useState<Partial<DiagnosticIntake>>(
    state.diagnosticIntake ?? {},
  );
  const question = diagnosticQuestions[index];
  const answers = state.diagnosticAnswers;

  const intakeComplete = Boolean(
    intake.goal && intake.target && intake.frenchExperience,
  );
  const start = () => {
    if (!intakeComplete) return;
    setState((current) => ({
      ...current,
      diagnosticIntake: intake as DiagnosticIntake,
      diagnosticAnswers: {},
      diagnosticResult: null,
    }));
    setIndex(0);
    setStage("questions");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const answer = (value: string) =>
    setState((current) => ({
      ...current,
      diagnosticAnswers: { ...current.diagnosticAnswers, [question.id]: value },
    }));
  const finish = () => {
    const result = scoreDiagnostic(diagnosticQuestions, answers);
    setState((current) => ({
      ...current,
      diagnosticResult: result,
      progress: { ...current.progress, diagnosticScore: result.score },
      activities: [
        {
          id: crypto.randomUUID(),
          label: "Assessment completed",
          detail: `${result.level} estimated level`,
          timestamp: new Date().toISOString(),
        },
        ...current.activities,
      ],
    }));
    router.push("/diagnostic/results");
  };

  if (stage === "intro") {
    return (
      <div className="mx-auto max-w-4xl">
        <StepMarker step={1} />
        <div className="grid gap-8 lg:grid-cols-[.9fr_1.1fr] lg:gap-12">
          <section>
            <p className="eyebrow">Free French assessment</p>
            <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
              Check your French level
            </h1>
            <p className="mt-5 text-lg leading-8 text-muted-foreground">
              Find out where you are today and what you should focus on next.
            </p>
            <p className="mt-4 leading-7 text-muted-foreground">
              This quick assessment helps MPK Academy understand your strengths
              and weaknesses.
            </p>
            <ul className="mt-7 grid gap-3 text-sm font-semibold sm:grid-cols-2 lg:grid-cols-1">
              {[
                "About 10 minutes",
                "15 questions",
                "Free",
                "No payment required",
              ].map((item) => (
                <li key={item} className="flex items-center gap-3">
                  <span className="grid size-6 place-items-center rounded-full bg-primary/10 text-primary">
                    <Check className="size-4" />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
            <div className="mt-8 rounded-2xl bg-ink p-6 text-white">
              <p className="text-sm font-bold uppercase tracking-[.14em] text-white/55">
                {"You'll receive"}
              </p>
              <ul className="mt-4 space-y-3 text-sm text-white/80">
                {[
                  "Your estimated French level",
                  "Your strongest skills",
                  "Skills that need improvement",
                  "A recommended starting point",
                ].map((item) => (
                  <li key={item} className="flex gap-3">
                    <span className="text-[#74dab8]">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className="rounded-2xl border bg-card p-5 sm:p-7">
            <div className="mb-7 flex items-start gap-4 border-b pb-6">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                <ShieldCheck className="size-5" />
              </span>
              <div>
                <h2 className="text-xl font-bold">
                  First, tell us about your goal
                </h2>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Your answers personalize your next steps, not your assessment
                  score.
                </p>
              </div>
            </div>
            <div className="space-y-7">
              <ChoiceGroup
                legend="What's your goal?"
                name="goal"
                options={goalOptions}
                value={intake.goal}
                onChange={(goal) =>
                  setIntake((current) => ({ ...current, goal }))
                }
              />
              <ChoiceGroup
                legend="What result are you aiming for?"
                name="target"
                options={targetOptions.map((item) => ({
                  value: item,
                  label: item,
                }))}
                value={intake.target}
                onChange={(target) =>
                  setIntake((current) => ({ ...current, target }))
                }
              />
              <ChoiceGroup
                legend="How would you describe your French today?"
                name="experience"
                options={experienceOptions.map((item) => ({
                  value: item,
                  label: item,
                }))}
                value={intake.frenchExperience}
                onChange={(frenchExperience) =>
                  setIntake((current) => ({ ...current, frenchExperience }))
                }
              />
            </div>
            <Button
              size="lg"
              className="mt-8 w-full"
              disabled={!intakeComplete}
              onClick={start}
            >
              Start my assessment <ArrowRight className="size-4" />
            </Button>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <StepMarker step={2} />
      <div className="mb-7">
        <div className="mb-3 flex items-center justify-between text-sm">
          <span className="font-semibold">
            Question {index + 1} of {diagnosticQuestions.length}
          </span>
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <Clock3 className="size-4" /> About{" "}
            {Math.max(
              1,
              Math.ceil(
                (diagnosticQuestions.length - index) *
                  (10 / diagnosticQuestions.length),
              ),
            )}{" "}
            min left
          </span>
        </div>
        <Progress
          value={((index + 1) / diagnosticQuestions.length) * 100}
          label={`Assessment progress: ${index + 1} of ${diagnosticQuestions.length}`}
        />
      </div>
      <div className="mb-4 flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm leading-6">
        <FileQuestion className="mt-0.5 size-5 shrink-0 text-primary" />
        <p>
          {"Don't worry if you're unsure. Choose the answer that seems best."}
        </p>
      </div>
      <div className="rounded-2xl border bg-card p-5 sm:p-8">
        <p className="mb-4 text-xs font-bold uppercase tracking-[.14em] text-primary">
          Competency · {diagnosticSkillContent[question.diagnosticSkill].label}
        </p>
        <QuestionCard
          question={question}
          value={answers[question.id]}
          onChange={answer}
        />
      </div>
      <div className="mt-6 flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() =>
            index === 0 ? setStage("intro") : setIndex(index - 1)
          }
        >
          <ArrowLeft className="size-4" /> Previous
        </Button>
        {index < diagnosticQuestions.length - 1 ? (
          <Button
            disabled={!answers[question.id]}
            onClick={() => setIndex(index + 1)}
          >
            Next <ArrowRight className="size-4" />
          </Button>
        ) : (
          <Button disabled={!answers[question.id]} onClick={finish}>
            Finish assessment
          </Button>
        )}
      </div>
      <p className="mt-8 text-center text-xs text-muted-foreground">
        Independent mock practice content · not official TEF/TCF questions
      </p>
    </div>
  );
}
