"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { submitPracticeAction } from "@/app/actions/learner";
import { useApp } from "@/components/providers/app-provider";
import { Button } from "@/components/ui/button";
import type { PublicProductiveTask } from "@/content/shared/types";
import { Objections } from "@/features/speaking/objections";
import { SpeakingRecorder } from "@/features/speaking/speaking-recorder";
import { RequestAiFeedback } from "@/features/writing/request-feedback";
import { useI18n } from "@/i18n/client";
import type { ExamId } from "@/types/domain";
import { ModelAnswer } from "./model-answer";

const wordCount = (value: string) =>
  value.trim() ? value.trim().split(/\s+/).length : 0;

type SessionProps = {
  exam: ExamId;
  skill: "writing" | "speaking";
  tasks: PublicProductiveTask[];
  /** AI writing feedback is included and configured on the server. */
  aiFeedback?: boolean;
  /** Recorded speaking feedback is included and configured on the server. */
  aiSpeaking?: boolean;
};

export function ProductiveSession(props: SessionProps) {
  const { t } = useI18n();
  if (!props.tasks.length) return <p>{t.common.errors.notFound}</p>;
  return <TaskSession {...props} />;
}

function TaskSession({
  exam,
  skill,
  tasks,
  aiFeedback,
  aiSpeaking,
}: SessionProps) {
  const { t, locale } = useI18n();
  const copy = t.practice.productive;
  const [submissionId] = useState(() => crypto.randomUUID());
  const [index, setIndex] = useState(0);
  const [response, setResponse] = useState("");
  const [started, setStarted] = useState<number | null>(null);
  const [now, setNow] = useState(0);
  const [review, setReview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [withoutRecording, setWithoutRecording] = useState(false);
  const task = tasks[index];
  const router = useRouter();
  const { replaceState } = useApp();
  useEffect(() => {
    if (started === null) return;
    const interval = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(interval);
  }, [started]);
  const remaining =
    started === null
      ? task.durationSeconds
      : Math.max(0, task.durationSeconds - Math.floor((now - started) / 1000));
  const expired = started !== null && remaining === 0;
  const reviewing = review || expired;
  const preparing =
    started !== null &&
    task.preparationSeconds > 0 &&
    now - started < task.preparationSeconds * 1000;

  const elapsedSeconds =
    started === null
      ? 0
      : Math.min(task.durationSeconds, Math.floor((now - started) / 1000));

  const finish = async () => {
    setSaving(true);
    const result = await submitPracticeAction({
      exam,
      skill,
      submissionId,
      durationSeconds: elapsedSeconds,
      answers: [
        {
          questionId: task.id,
          sequence: 0,
          answer: skill === "writing" ? response : "self_practice_completed",
        },
      ],
    });
    setSaving(false);
    if (!result.ok) return toast.error(result.message);
    replaceState(result.snapshot);
    router.push(`/practice/results?session=${result.data.id}`);
  };
  const taskPicker = (
    <label className="block">
      {copy.chooseTask}
      <select
        className="ml-3 rounded border bg-background p-2"
        value={index}
        disabled={started !== null}
        onChange={(e) => {
          setIndex(Number(e.target.value));
          setResponse("");
          setReview(false);
        }}
      >
        {tasks.map((item, i) => (
          <option key={item.id} value={i} lang="fr">
            {item.title}
          </option>
        ))}
      </select>
    </label>
  );
  const taskCard = (
    <div className="rounded-xl border bg-card p-6" lang="fr">
      <h2 className="text-xl font-bold">{task.title}</h2>
      <p className="mt-4">{task.scenario}</p>
      <p className="mt-4">{task.instructions}</p>
      {task.wordCount && (
        <p className="mt-4">
          {copy.wordRange(task.wordCount.min, task.wordCount.max)}
        </p>
      )}
    </div>
  );
  const guidanceText =
    (locale === "fr" && task.correction.guidanceFr) || task.correction.guidance;
  const guidance = (
    <details>
      <summary>{copy.guidance}</summary>
      <p className="mt-3">{guidanceText}</p>
      <ul className="mt-3 list-inside list-disc" lang="fr">
        {task.correction.rubric.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </details>
  );

  // Recorded answers replace the timer flow; self-practice stays one click away.
  if (skill === "speaking" && aiSpeaking && !withoutRecording)
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <h1 className="text-3xl font-bold">
          {copy.title(exam, t.practice.skills[skill])}
        </h1>
        <p>{copy.noteAiSpeaking}</p>
        {taskPicker}
        {taskCard}
        <SpeakingRecorder
          key={task.id}
          task={task}
          practiceSubmissionId={submissionId}
          onPractiseWithout={() => setWithoutRecording(true)}
        />
        {guidance}
      </div>
    );

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-3xl font-bold">
        {copy.title(exam, t.practice.skills[skill])}
      </h1>
      <p>{skill === "writing" && aiFeedback ? copy.noteAi : copy.note}</p>
      {taskPicker}
      {taskCard}
      <p role="timer">
        {preparing ? copy.preparation : copy.response} ·{" "}
        {Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, "0")}
      </p>
      {task.objections && !reviewing && (
        <Objections
          objections={task.objections}
          elapsed={elapsedSeconds}
          active={started !== null}
        />
      )}
      {started === null ? (
        <Button
          onClick={() => {
            const startedAt = Date.now();
            setStarted(startedAt);
            setNow(startedAt);
          }}
        >
          {copy.start}
        </Button>
      ) : null}
      {skill === "writing" && (
        <>
          <textarea
            aria-label={copy.responseLabel}
            lang="fr"
            className="min-h-64 w-full rounded border bg-background p-4"
            value={response}
            disabled={started === null || reviewing}
            onChange={(e) => setResponse(e.target.value)}
          />
          <p>{copy.words(wordCount(response))}</p>
        </>
      )}
      <details>
        <summary>{copy.guidance}</summary>
        <p className="mt-3">{guidanceText}</p>
      </details>
      <Button
        disabled={started === null || reviewing}
        onClick={() => setReview(true)}
      >
        {copy.finish}
      </Button>
      {reviewing && (
        <section className="space-y-4 rounded-xl border p-6">
          <h2 className="text-xl font-bold">{copy.reviewTitle}</h2>
          <ul className="list-inside list-disc" lang="fr">
            {task.correction.rubric.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          {task.correction.hasModelResponse && (
            <ModelAnswer key={task.id} taskId={task.id} />
          )}
          {skill === "writing" && aiFeedback && (
            <div className="rounded-xl border bg-card p-5">
              <RequestAiFeedback
                taskId={task.id}
                text={response}
                practice={{ submissionId, durationSeconds: elapsedSeconds }}
                disabled={saving}
              />
            </div>
          )}
          <Button
            variant={
              skill === "writing" && aiFeedback ? "secondary" : "primary"
            }
            disabled={saving || (skill === "writing" && !response.trim())}
            onClick={finish}
          >
            {saving ? t.common.saving : copy.save}
          </Button>
        </section>
      )}
    </div>
  );
}
