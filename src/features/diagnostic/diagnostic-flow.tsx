"use client";

import { WritingLength } from "@/features/writing/writing-length";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Clock3 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useApp } from "@/components/providers/app-provider";
import { scoreGuestDiagnosticAction } from "@/app/actions/content";
import { submitDiagnosticAction } from "@/app/actions/learner";
import { QuestionCard } from "@/features/assessment/question-card";
import { CheckedProgress } from "@/features/assessment/checked-progress";
import { Button } from "@/components/ui/button";
import { isBetaMode, recommendedPaidPlanId } from "@/config/product";
import { defaultState } from "@/data/mock-state";
import { useI18n } from "@/i18n/client";
import {
  diagnosticTotalMinutes,
  diagnosticRemainingMinutes,
} from "@/lib/domain/diagnostic";
import {
  createDiagnosticDraft,
  isCompatibleDraft,
  restoreDraftQuestions,
} from "@/lib/domain/diagnostic-draft";
import {
  diagnosticWritingPrompt,
  diagnosticWritingVersion,
  diagnosticWritingRange,
  isDiagnosticWritingSample,
} from "@/lib/domain/diagnostic-writing";
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
import { AssessmentSteps } from "./assessment-steps";
import { useDiagnosticDraft } from "./use-diagnostic-draft";
import { useDiagnosticFeedback } from "./use-diagnostic-feedback";

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
  const { hydrated, state, sessionUnavailable } = useApp();
  const { t } = useI18n();
  if (sessionUnavailable)
    return (
      <div role="alert" className="mx-auto max-w-xl rounded-xl border p-6">
        <p>{t.ux.draft.loadError}</p>
        <Button className="mt-4" onClick={() => window.location.reload()}>
          {t.ux.draft.retryLoad}
        </Button>
      </div>
    );
  if (!hydrated)
    return (
      <div
        className="mx-auto h-96 max-w-4xl animate-pulse rounded-2xl bg-muted"
        aria-label={t.diagnostic.intro.loading}
      />
    );
  return (
    <DiagnosticExperience
      key={state.user?.id ?? "guest"}
      questions={questions}
    />
  );
}

function DiagnosticExperience({
  questions: sourceQuestions,
}: {
  questions: PublicQuestion[];
}) {
  const router = useRouter();
  const { state, setState } = useApp();
  const { t } = useI18n();
  const copy = t.diagnostic;
  const recovery = useDiagnosticDraft(sourceQuestions, state.user?.id);
  const checking = useDiagnosticFeedback(recovery);
  const { draft } = recovery;
  const questionCard = useRef<HTMLDivElement>(null);
  const [finishing, setFinishing] = useState(false);
  const finishingGuard = useRef(false);
  const releaseFinish = () => {
    finishingGuard.current = false;
    setFinishing(false);
  };
  const initialIntake: Partial<DiagnosticIntake> = {
    goal: state.user?.goal.exam,
    target: state.user?.goal.target,
    frenchExperience: state.user
      ? state.diagnosticIntake?.frenchExperience
      : undefined,
  };
  const intake = draft?.intake ?? initialIntake;
  const stage = draft?.stage ?? "intro";
  const index = draft?.index ?? 0;
  const questions = draft
    ? restoreDraftQuestions(draft, sourceQuestions)
    : sourceQuestions;
  const question = questions[index];
  const answers = draft?.answers ?? {};
  const feedback = question ? checking.feedback[question.id] : undefined;
  const checkedCount = Object.keys(checking.feedback).length;
  const correctCount = Object.values(checking.feedback).filter(
    (item) => item.correct,
  ).length;
  useEffect(() => {
    if (stage === "questions")
      questionCard.current?.querySelector("h2")?.focus();
  }, [stage, index]);
  const writingSample = {
    version: diagnosticWritingVersion,
    text: intake.writingSample?.text ?? "",
  };
  const writingValid = isDiagnosticWritingSample(writingSample);
  const intakeComplete = Boolean(
    intake.goal && intake.target && intake.frenchExperience,
  );
  const formatError = (message: string, reference?: string) =>
    reference ? t.common.errorReference(message, reference) : message;
  const changeIntake = (next: Partial<DiagnosticIntake>, debounce = false) => {
    recovery.change(
      {
        ...(draft ?? createDiagnosticDraft(sourceQuestions, initialIntake)),
        intake: next,
      },
      debounce,
    );
  };
  const move = (
    nextStage: "intro" | "questions" | "writing",
    nextIndex = index,
  ) => {
    if (checking.checking) return;
    if (draft)
      recovery.change({ ...draft, stage: nextStage, index: nextIndex });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const start = () => {
    if (!intakeComplete) return;
    recovery.change({
      ...(draft ?? createDiagnosticDraft(sourceQuestions, intake)),
      stage: "questions",
    });
    trackFunnelStep("diagnostic_started");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const answer = (value: string) => {
    if (draft && !checking.checking && !draft.checkedAnswers?.[question.id])
      recovery.change({
        ...draft,
        answers: { ...answers, [question.id]: value },
      });
  };
  const restart = () => {
    if (!checking.checking && window.confirm(t.ux.draft.restartConfirm))
      void recovery.restart(intake);
  };
  const statusBar = (
    <div className="my-4 text-sm" aria-live="polite">
      {recovery.status === "saving" && <p>{t.ux.draft.saving}</p>}
      {recovery.status === "saved" && (
        <p className="text-primary">{t.ux.draft.saved}</p>
      )}
      {recovery.status === "error" && !recovery.loadFailed && (
        <div role="alert">
          <p>{t.ux.draft.error}</p>
          <Button
            variant="secondary"
            className="mt-2"
            onClick={() => void recovery.flush()}
          >
            {t.ux.draft.retry}
          </Button>
        </div>
      )}
      {recovery.status === "conflict" && (
        <div role="alert">
          <p>{t.ux.draft.conflict}</p>
          <Button
            variant="secondary"
            className="mt-2"
            onClick={() => {
              if (window.confirm(t.ux.draft.reloadConfirm))
                void recovery.reload();
            }}
          >
            {t.ux.draft.reload}
          </Button>
        </div>
      )}
    </div>
  );

  const activityFor = (result: DiagnosticResult) => ({
    id: crypto.randomUUID(),
    label: copy.activityLabel,
    detail: copy.activityDetail(result.level),
    timestamp: new Date().toISOString(),
  });

  /** Scores on the server and keeps the result on this device until sign-in. */
  const saveAsGuest = async (completedIntake: DiagnosticIntake) => {
    const scored = await scoreGuestDiagnosticAction(
      answers,
      completedIntake.writingSample,
    );
    if (!scored.ok)
      throw new Error(formatError(scored.message, scored.reference));
    const activity = activityFor(scored.result);
    await guestAssessmentRepository.create({
      id: draft!.id,
      intake: completedIntake,
      answers,
      result: scored.result,
      activity,
      recommendedPlanId: recommendedPaidPlanId(completedIntake.target),
    });
    return { result: scored.result, activity };
  };

  const finish = async () => {
    if (!writingValid || !draft || finishingGuard.current) return;
    finishingGuard.current = true;
    setFinishing(true);
    if (!(await recovery.flush())) {
      releaseFinish();
      return;
    }
    const completedIntake = {
      ...(intake as DiagnosticIntake),
      writingSample,
    };
    if (state.user) {
      const saved = await submitDiagnosticAction({
        submissionId: draft.id,
        draftRevision: recovery.current.current?.revision,
        intake: completedIntake,
        answers,
      }).catch(() => ({
        ok: false as const,
        reason: "unavailable" as const,
        message: copy.toasts.saveFailed,
        reference: "",
      }));
      if (saved.ok) {
        await recovery.complete();
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
        releaseFinish();
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
        releaseFinish();
        toast.error(copy.toasts.sessionExpiredUnsaved);
        return;
      }
      releaseFinish();
      toast.error(
        formatError(copy.toasts.sessionExpiredSaved, saved.reference),
      );
      trackFunnelStep("diagnostic_completed");
      router.push("/login?next=%2Fdiagnostic%2Fresults");
      return;
    }
    try {
      const { result, activity } = await saveAsGuest(completedIntake);
      await recovery.complete();
      setState((current) =>
        applyDiagnosticResult(current, completedIntake, result, activity),
      );
    } catch {
      releaseFinish();
      toast.error(copy.toasts.saveFailed);
      return;
    }
    trackFunnelStep("diagnostic_completed");
    router.push("/diagnostic/results");
  };

  if (recovery.status === "loading")
    return (
      <p role="status" className="py-8 text-center">
        {t.ux.draft.loading}
      </p>
    );
  if (recovery.loadFailed)
    return (
      <div
        className="mx-auto max-w-xl rounded-2xl border bg-card p-6"
        role="alert"
      >
        <p>{t.ux.draft.loadError}</p>
        <Button className="mt-4" onClick={() => void recovery.reload()}>
          {t.ux.draft.retryLoad}
        </Button>
      </div>
    );
  if (!draft && recovery.choices.length)
    return (
      <section className="mx-auto max-w-3xl">
        <AssessmentSteps step={1} />
        <h1 className="text-3xl font-bold">{t.ux.draft.title}</h1>
        {recovery.choices.length > 1 && (
          <p className="mt-3">{t.ux.draft.both}</p>
        )}
        <div className="mt-5 grid gap-4">
          {recovery.choices.map((choice) => {
            const compatible = isCompatibleDraft(choice.draft, sourceQuestions);
            return (
              <article
                key={choice.source}
                className="rounded-2xl border bg-card p-5"
              >
                <h2 className="text-lg font-bold">
                  {t.ux.draft[choice.source]}
                </h2>
                <p className="mt-2 text-sm">
                  {choice.draft.stage === "questions"
                    ? t.ux.draft.question(
                        choice.draft.index + 1,
                        sourceQuestions.length,
                      )
                    : t.ux.stages[choice.draft.stage === "writing" ? 2 : 0]}
                </p>
                {!compatible && (
                  <>
                    <p className="mt-3" role="alert">
                      {t.ux.draft.incompatible}
                    </p>
                    {choice.draft.intake.writingSample?.text && (
                      <>
                        <label
                          className="mt-3 block"
                          htmlFor={`saved-${choice.source}`}
                        >
                          {t.ux.draft.savedWriting}
                        </label>
                        <textarea
                          id={`saved-${choice.source}`}
                          readOnly
                          className="mt-2 w-full rounded border p-3"
                          value={choice.draft.intake.writingSample.text}
                        />
                      </>
                    )}
                  </>
                )}
                <Button
                  className="mt-4"
                  disabled={!compatible}
                  onClick={() => {
                    if (
                      choice.source === "browser" &&
                      recovery.choices.some((c) => c.source === "account") &&
                      !window.confirm(t.ux.draft.replaceConfirm)
                    )
                      return;
                    void recovery.resume(choice);
                  }}
                >
                  {t.ux.draft.resume}
                </Button>
              </article>
            );
          })}
        </div>
        {statusBar}
        <Button variant="ghost" className="mt-4" onClick={restart}>
          {t.ux.draft.restart}
        </Button>
      </section>
    );

  if (stage === "intro")
    return (
      <div className="mx-auto max-w-3xl">
        <AssessmentSteps step={1} />
        <header>
          <p className="eyebrow">{copy.intro.eyebrow}</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
            {copy.intro.title}
          </h1>
          <p className="mt-3 text-muted-foreground">{copy.intro.lead}</p>
          <p className="mt-3 text-sm font-semibold">
            {copy.intro
              .facts(
                sourceQuestions.length,
                diagnosticTotalMinutes(sourceQuestions.length),
              )
              .slice(0, 2)
              .join(" · ")}
          </p>
          {isBetaMode() && (
            <p className="mt-2 text-sm text-muted-foreground">
              {t.ux.betaAccess}
            </p>
          )}
        </header>
        <section
          className="mt-6 rounded-2xl border bg-card p-5 sm:p-7"
          aria-label={copy.intro.goalTitle}
        >
          <div className="space-y-6">
            <div>
              <ChoiceGroup
                legend={copy.intro.goalLegend}
                name="goal"
                options={goalOptions.map((value) => ({
                  value,
                  label: copy.intake.goals[value],
                }))}
                value={intake.goal}
                onChange={(goal) => changeIntake({ ...intake, goal })}
              />
              <details className="mt-2 text-sm text-muted-foreground">
                <summary className="cursor-pointer py-1">TEF / TCF</summary>
                <p className="mt-1 leading-6">{t.ux.examHelp}</p>
              </details>
            </div>
            <div>
              <ChoiceGroup
                legend={copy.intro.targetLegend}
                name="target"
                options={targetOptions.map((value) => ({
                  value,
                  label: copy.intake.targets[value],
                }))}
                value={intake.target}
                onChange={(target) => changeIntake({ ...intake, target })}
              />
              <details className="mt-2 text-sm text-muted-foreground">
                <summary className="cursor-pointer py-1">NCLC</summary>
                <p className="mt-1 leading-6">{t.ux.targetHelp}</p>
              </details>
            </div>
            <ChoiceGroup
              legend={copy.intro.experienceLegend}
              name="experience"
              options={experienceOptions.map((value) => ({
                value,
                label: copy.intake.experience[value],
              }))}
              value={intake.frenchExperience}
              onChange={(frenchExperience) =>
                changeIntake({ ...intake, frenchExperience })
              }
            />
          </div>
          {statusBar}
          <Button
            size="lg"
            className="mt-3 w-full"
            disabled={!intakeComplete || recovery.status === "conflict"}
            onClick={start}
          >
            {copy.intro.start}
            <ArrowRight className="size-4" />
          </Button>
          <p className="mt-3 text-xs leading-5 text-muted-foreground">
            {state.user
              ? t.ux.draft.retentionAccount
              : t.ux.draft.retentionGuest}
          </p>
        </section>
        <details className="mt-5 rounded-xl border p-4">
          <summary className="cursor-pointer font-semibold">
            {copy.intro.receiveTitle}
          </summary>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm">
            {copy.intro.receive.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </details>
      </div>
    );

  if (stage === "writing")
    return (
      <div className="mx-auto max-w-3xl">
        <AssessmentSteps step={3} />
        <h1 className="text-3xl font-bold">{copy.writing.title}</h1>
        <p className="mt-3 leading-7">{copy.writing.instructions}</p>
        <p lang="fr" className="my-6 rounded-xl border bg-card p-5 leading-7">
          {diagnosticWritingPrompt}
        </p>
        <label htmlFor="diagnostic-writing" className="font-semibold">
          {copy.writing.label}
        </label>
        <textarea
          id="diagnostic-writing"
          lang="fr"
          required
          rows={10}
          maxLength={4000}
          value={writingSample.text}
          aria-describedby="diagnostic-writing-help diagnostic-writing-count"
          onBlur={() => void recovery.flush()}
          onChange={(event) =>
            changeIntake(
              {
                ...intake,
                writingSample: {
                  version: diagnosticWritingVersion,
                  text: event.target.value,
                },
              },
              true,
            )
          }
          className="mt-2 w-full rounded-xl border bg-background p-4 focus-visible:outline-primary"
        />
        <WritingLength
          id="diagnostic-writing-count"
          text={writingSample.text}
          range={diagnosticWritingRange}
          enforceMaximum
        />
        {statusBar}
        <p
          id="diagnostic-writing-help"
          className="mt-3 text-sm text-muted-foreground"
        >
          {state.user ? t.ux.draft.retentionAccount : t.ux.draft.retentionGuest}{" "}
          {copy.writing.privacy}
        </p>
        <Button
          variant="ghost"
          className="mt-4"
          disabled={finishing}
          onClick={restart}
        >
          {t.ux.draft.restart}
        </Button>
        <div className="mt-6 flex justify-between gap-4">
          <Button
            variant="ghost"
            disabled={finishing}
            onClick={() => move("questions")}
          >
            <ArrowLeft className="size-4" />
            {t.common.previous}
          </Button>
          <Button
            disabled={
              !writingValid || finishing || recovery.status === "conflict"
            }
            onClick={finish}
          >
            {finishing ? copy.question.finishing : copy.question.finish}
          </Button>
        </div>
      </div>
    );

  const total = questions.length;
  return (
    <div className="mx-auto max-w-3xl">
      <AssessmentSteps step={2} />
      <div className="mb-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-sm">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <Clock3 className="size-4" aria-hidden="true" />
            {copy.question.minutesLeft(
              diagnosticRemainingMinutes(total, checkedCount),
            )}
          </span>
        </div>
        <CheckedProgress
          position={index + 1}
          total={total}
          checked={checkedCount}
          correct={correctCount}
        />
      </div>
      <p className="mb-4 text-sm leading-6 text-muted-foreground">
        {t.assessment.instruction} {copy.question.reassurance}
      </p>
      <div ref={questionCard} className="rounded-2xl border bg-card p-5 sm:p-8">
        <p className="mb-4 text-xs font-bold uppercase tracking-[.14em] text-primary">
          {copy.question.competency(
            copy.skills[question.diagnosticSkill].label,
          )}
        </p>
        <QuestionCard
          key={question.id}
          question={question}
          value={answers[question.id]}
          onChange={answer}
          feedback={feedback}
          disabled={
            checking.checking || Boolean(draft?.checkedAnswers?.[question.id])
          }
        />
      </div>
      {statusBar}
      {checking.error && (
        <div
          role="alert"
          className="mt-4 rounded-xl border border-danger/30 p-4 text-sm"
        >
          <p>{checking.error}</p>
          <Button
            className="mt-3"
            variant="secondary"
            disabled={checking.checking || recovery.status === "conflict"}
            onClick={() => void checking.retry()}
          >
            {t.assessment.retry}
          </Button>
        </div>
      )}
      <div className="mt-5 flex items-center justify-between gap-3">
        <Button
          variant="ghost"
          disabled={checking.checking}
          onClick={(event) => {
            if (event.detail > 1) return;
            if (index === 0) move("intro");
            else move("questions", index - 1);
          }}
        >
          <ArrowLeft className="size-4" />
          {t.common.previous}
        </Button>
        <Button
          disabled={
            !answers[question.id]?.trim() ||
            checking.checking ||
            Boolean(checking.error) ||
            recovery.status === "conflict"
          }
          onClick={(event) => {
            if (event.detail > 1) return;
            if (!feedback) void checking.check(question.id);
            else if (index < total - 1) move("questions", index + 1);
            else move("writing");
          }}
        >
          {checking.checking
            ? t.assessment.checking
            : feedback
              ? index < total - 1
                ? t.assessment.continue
                : copy.writing.continue
              : t.assessment.next}
          <ArrowRight className="size-4" />
        </Button>
      </div>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
        <p>{copy.question.disclaimer}</p>
        <Button variant="ghost" disabled={checking.checking} onClick={restart}>
          {t.ux.draft.restart}
        </Button>
      </div>
    </div>
  );
}
