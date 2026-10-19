"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { findPractice } from "@/content/catalog";
import { wordCount } from "@/content/validate";
import { useApp } from "@/components/providers/app-provider";
import { Button } from "@/components/ui/button";
import { submitPracticeAction } from "@/app/actions/learner";
import type { ExamId } from "@/types/domain";
export function ProductiveSession({
  exam,
  skill,
}: {
  exam: ExamId;
  skill: "writing" | "speaking";
}) {
  const tasks = findPractice(
    exam === "TEF Canada" ? "TEF" : "TCF",
    skill,
  ).filter((i) => i.kind !== "mcq");
  const [submissionId] = useState(() => crypto.randomUUID());
  const [index, setIndex] = useState(0);
  const [response, setResponse] = useState("");
  const [started, setStarted] = useState<number | null>(null);
  const [now, setNow] = useState(0);
  const [review, setReview] = useState(false);
  const [saving, setSaving] = useState(false);
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
  const preparing =
    started !== null &&
    task.preparationSeconds > 0 &&
    now - started < task.preparationSeconds * 1000;
  const finish = async () => {
    setSaving(true);
    const result = await submitPracticeAction({
      exam,
      skill,
      submissionId,
      durationSeconds:
        started === null
          ? 0
          : Math.min(task.durationSeconds, Math.floor((now - started) / 1000)),
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
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-3xl font-bold">
        {exam} · {skill} self-practice
      </h1>
      <p>
        MPK practice feedback only. No recording, AI evaluation, or official
        grading. Speaking requires you to imagine or arrange an interlocutor.
      </p>
      <label className="block">
        Choose a task
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
          {tasks.map((t, i) => (
            <option key={t.id} value={i}>
              {t.title}
            </option>
          ))}
        </select>
      </label>
      <div className="rounded-xl border bg-card p-6" lang="fr">
        <h2 className="text-xl font-bold">{task.title}</h2>
        <p className="mt-4">{task.scenario}</p>
        <p className="mt-4">{task.instructions}</p>
        {task.wordCount && (
          <p className="mt-4">
            {task.wordCount.min}
            {task.wordCount.max ? `–${task.wordCount.max}` : " minimum"} mots
          </p>
        )}
      </div>
      <p role="timer">
        {preparing ? "Preparation" : "Response"} · {Math.floor(remaining / 60)}:
        {String(remaining % 60).padStart(2, "0")}
      </p>
      {started === null ? (
        <Button
          onClick={() => {
            const t = Date.now();
            setStarted(t);
            setNow(t);
          }}
        >
          Start timed practice
        </Button>
      ) : null}
      {skill === "writing" && (
        <>
          <textarea
            aria-label="Votre réponse"
            lang="fr"
            className="min-h-64 w-full rounded border bg-background p-4"
            value={response}
            disabled={started === null || expired || review}
            onChange={(e) => setResponse(e.target.value)}
          />
          <p>{wordCount(response)} words</p>
        </>
      )}
      <details>
        <summary>Planning guidance</summary>
        <p className="mt-3">{task.correction.guidance}</p>
      </details>
      <Button disabled={started === null} onClick={() => setReview(true)}>
        Finish and review
      </Button>
      {(review || expired) && (
        <section className="space-y-4 rounded-xl border p-6">
          <h2 className="text-xl font-bold">
            Self-review · MPK practice feedback
          </h2>
          <ul className="list-inside list-disc">
            {task.correction.rubric.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
          {task.correction.modelResponse && (
            <details>
              <summary>Original MPK model response</summary>
              <p lang="fr" className="mt-4 whitespace-pre-line">
                {task.correction.modelResponse}
              </p>
            </details>
          )}
          <Button
            disabled={saving || (skill === "writing" && !response.trim())}
            onClick={finish}
          >
            {saving ? "Saving…" : "Save practice completion"}
          </Button>
        </section>
      )}
    </div>
  );
}
