"use client";

import { useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Clock3,
  FileQuestion,
  ShieldCheck,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useApp } from "@/components/providers/app-provider";
import { scoreGuestDiagnosticAction } from "@/app/actions/content";
import { submitDiagnosticAction } from "@/app/actions/learner";
import { QuestionCard } from "@/features/assessment/question-card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { recommendedPaidPlanId } from "@/config/product";
import { defaultState } from "@/data/mock-state";
import { useI18n } from "@/i18n/client";
import { diagnosticMinutes } from "@/lib/domain/diagnostic";
import { applyDiagnosticResult } from "@/lib/domain/onboarding";
import { trackFunnelStep } from "@/lib/track-funnel";
import { guestAssessmentRepository } from "@/repositories/guest-assessment";
import type {
  DiagnosticIntake,
  DiagnosticResult,
  DiagnosticTarget,
  ExamType,
  FrenchExperience,
  PublicQuestion,
} from "@/types/domain";

const goalOptions: ExamType[] = ["TEF Canada", "TCF Canada", "Not sure yet"];
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
  const { t } = useI18n();
  return (
    <div
      className="mb-8 flex items-center gap-3"
      aria-label={t.diagnostic.step(step)}
    >
      {[1, 2, 3].map((item) => (
        <span
          key={item}
          className={`h-1.5 flex-1 rounded-full ${item <= step ? "bg-primary" : "bg-muted"}`}
        />
      ))}
      <span className="shrink-0 text-xs font-bold uppercase tracking-[.14em] text-muted-foreground">
        {t.diagnostic.step(step)}
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

export function DiagnosticFlow({ questions }: { questions: PublicQuestion[] }) {
  const { hydrated } = useApp();
  const { t } = useI18n();
  if (!hydrated) {
    return (
      <div
        className="mx-auto h-96 max-w-4xl animate-pulse rounded-2xl bg-muted"
        aria-label={t.diagnostic.intro.loading}
      />
    );
  }
  return <DiagnosticExperience questions={questions} />;
}

function DiagnosticExperience({ questions }: { questions: PublicQuestion[] }) {
  const router = useRouter();
  const { state, setState } = useApp();
  const { t } = useI18n();
  const copy = t.diagnostic;
  const formatError = (message: string, reference?: string) =>
    reference ? t.common.errorReference(message, reference) : message;
  const submissionId = useRef<string | null>(null);
  const [stage, setStage] = useState<"intro" | "questions">("intro");
  const [index, setIndex] = useState(0);
  const [finishing, setFinishing] = useState(false);
  const [intake, setIntake] = useState<Partial<DiagnosticIntake>>(() => ({
    goal: state.diagnosticIntake?.goal ?? state.user?.goal.exam,
    target: state.diagnosticIntake?.target ?? state.user?.goal.target,
    frenchExperience: state.diagnosticIntake?.frenchExperience,
  }));
  const question = questions[index];
  const answers = state.diagnosticAnswers;

  const intakeComplete = Boolean(
    intake.goal && intake.target && intake.frenchExperience,
  );
  const start = () => {
    if (!intakeComplete) return;
    if (
      localStorage.getItem("mpk-assessment-restart") ||
      Object.keys(state.diagnosticAnswers).some(
        (id) => !questions.some((q) => q.id === id),
      )
    ) {
      toast.info(copy.toasts.updated);
      localStorage.removeItem("mpk-assessment-restart");
    }
    submissionId.current = crypto.randomUUID();
    setState((current) => ({
      ...current,
      diagnosticIntake: intake as DiagnosticIntake,
      diagnosticAnswers: {},
      diagnosticResult: null,
    }));
    setIndex(0);
    setStage("questions");
    trackFunnelStep("diagnostic_started");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const answer = (value: string) =>
    setState((current) => ({
      ...current,
      diagnosticAnswers: { ...current.diagnosticAnswers, [question.id]: value },
    }));
  const activityFor = (result: DiagnosticResult) => ({
    id: crypto.randomUUID(),
    label: copy.activityLabel,
    detail: copy.activityDetail(result.level),
    timestamp: new Date().toISOString(),
  });

  /** Scores on the server and keeps the result on this device until sign-in. */
  const saveAsGuest = async (completedIntake: DiagnosticIntake) => {
    const scored = await scoreGuestDiagnosticAction(answers);
    if (!scored.ok)
      throw new Error(formatError(scored.message, scored.reference));
    const activity = activityFor(scored.result);
    await guestAssessmentRepository.create({
      intake: completedIntake,
      answers,
      result: scored.result,
      activity,
      recommendedPlanId: recommendedPaidPlanId(completedIntake.target),
    });
    return { result: scored.result, activity };
  };

  const finish = async () => {
    setFinishing(true);
    const completedIntake =
      state.diagnosticIntake ?? (intake as DiagnosticIntake);
    if (state.user) {
      const saved = await submitDiagnosticAction({
        submissionId: (submissionId.current ??= crypto.randomUUID()),
        intake: completedIntake,
        answers,
      });
      if (saved.ok) {
        const result = saved.data.result;
        setState((current) =>
          applyDiagnosticResult(
            current,
            completedIntake,
            result,
            activityFor(result),
          ),
        );
        trackFunnelStep("diagnostic_completed");
        router.push(`/diagnostic/results?assessment=${saved.data.id}`);
        router.refresh();
        return;
      }
      if (saved.reason !== "unauthenticated") {
        setFinishing(false);
        toast.error(formatError(saved.message, saved.reference));
        return;
      }
      try {
        const { result, activity } = await saveAsGuest(completedIntake);
        setState(
          applyDiagnosticResult(
            structuredClone(defaultState),
            completedIntake,
            result,
            activity,
          ),
        );
      } catch {
        setFinishing(false);
        toast.error(copy.toasts.sessionExpiredUnsaved);
        return;
      }
      setFinishing(false);
      toast.error(
        formatError(copy.toasts.sessionExpiredSaved, saved.reference),
      );
      trackFunnelStep("diagnostic_completed");
      router.push("/login?next=%2Fdiagnostic%2Fresults");
      return;
    }
    try {
      const { result, activity } = await saveAsGuest(completedIntake);
      setState((current) =>
        applyDiagnosticResult(current, completedIntake, result, activity),
      );
    } catch {
      setFinishing(false);
      toast.error(copy.toasts.saveFailed);
      return;
    }
    trackFunnelStep("diagnostic_completed");
    router.push("/diagnostic/results");
  };

  if (stage === "intro") {
    return (
      <div className="mx-auto max-w-4xl">
        <StepMarker step={1} />
        <div className="grid gap-8 lg:grid-cols-[.9fr_1.1fr] lg:gap-12">
          <section>
            <p className="eyebrow">{copy.intro.eyebrow}</p>
            <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
              {copy.intro.title}
            </h1>
            <p className="mt-5 text-lg leading-8 text-muted-foreground">
              {copy.intro.lead}
            </p>
            <p className="mt-4 leading-7 text-muted-foreground">
              {copy.intro.body}
            </p>
            <ul className="mt-7 grid gap-3 text-sm font-semibold sm:grid-cols-2 lg:grid-cols-1">
              {copy.intro
                .facts(questions.length, diagnosticMinutes(questions.length))
                .map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <span className="grid size-6 place-items-center rounded-full bg-primary/10 text-primary">
                      <Check className="size-4" aria-hidden="true" />
                    </span>
                    {item}
                  </li>
                ))}
            </ul>
            <div className="mt-8 rounded-2xl bg-ink p-6 text-white">
              <p className="text-sm font-bold uppercase tracking-[.14em] text-white/55">
                {copy.intro.receiveTitle}
              </p>
              <ul className="mt-4 space-y-3 text-sm text-white/80">
                {copy.intro.receive.map((item) => (
                  <li key={item} className="flex gap-3">
                    <span className="text-[#74dab8]" aria-hidden="true">
                      •
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className="rounded-2xl border bg-card p-5 sm:p-7">
            <div className="mb-7 flex items-start gap-4 border-b pb-6">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                <ShieldCheck className="size-5" aria-hidden="true" />
              </span>
              <div>
                <h2 className="text-xl font-bold">{copy.intro.goalTitle}</h2>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  {copy.intro.goalBody}
                </p>
              </div>
            </div>
            <div className="space-y-7">
              <ChoiceGroup
                legend={copy.intro.goalLegend}
                name="goal"
                options={goalOptions.map((value) => ({
                  value,
                  label: copy.intake.goals[value],
                }))}
                value={intake.goal}
                onChange={(goal) =>
                  setIntake((current) => ({ ...current, goal }))
                }
              />
              <ChoiceGroup
                legend={copy.intro.targetLegend}
                name="target"
                options={targetOptions.map((value) => ({
                  value,
                  label: copy.intake.targets[value],
                }))}
                value={intake.target}
                onChange={(target) =>
                  setIntake((current) => ({ ...current, target }))
                }
              />
              <ChoiceGroup
                legend={copy.intro.experienceLegend}
                name="experience"
                options={experienceOptions.map((value) => ({
                  value,
                  label: copy.intake.experience[value],
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
              {copy.intro.start} <ArrowRight className="size-4" />
            </Button>
          </section>
        </div>
      </div>
    );
  }

  const total = questions.length;
  return (
    <div className="mx-auto max-w-3xl">
      <StepMarker step={2} />
      <div className="mb-7">
        <div className="mb-3 flex items-center justify-between text-sm">
          <span className="font-semibold">
            {copy.question.progress(index + 1, total)}
          </span>
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <Clock3 className="size-4" aria-hidden="true" />
            {copy.question.minutesLeft(
              Math.max(1, Math.ceil((total - index) * (10 / total))),
            )}
          </span>
        </div>
        <Progress
          value={((index + 1) / total) * 100}
          label={copy.question.progressLabel(index + 1, total)}
        />
      </div>
      <div className="mb-4 flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm leading-6">
        <FileQuestion
          className="mt-0.5 size-5 shrink-0 text-primary"
          aria-hidden="true"
        />
        <p>{copy.question.reassurance}</p>
      </div>
      <div className="rounded-2xl border bg-card p-5 sm:p-8">
        <p className="mb-4 text-xs font-bold uppercase tracking-[.14em] text-primary">
          {copy.question.competency(
            copy.skills[question.diagnosticSkill].label,
          )}
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
          <ArrowLeft className="size-4" /> {t.common.previous}
        </Button>
        {index < total - 1 ? (
          <Button
            disabled={!answers[question.id]}
            onClick={() => setIndex(index + 1)}
          >
            {t.common.next} <ArrowRight className="size-4" />
          </Button>
        ) : (
          <Button
            disabled={!answers[question.id] || finishing}
            onClick={finish}
          >
            {finishing ? copy.question.finishing : copy.question.finish}
          </Button>
        )}
      </div>
      <p className="mt-8 text-center text-xs text-muted-foreground">
        {copy.question.disclaimer}
      </p>
    </div>
  );
}
