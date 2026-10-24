"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Mic, Square } from "lucide-react";
import { toast } from "sonner";
import { getSpeakingAllowanceAction } from "@/app/actions/speaking";
import { Button } from "@/components/ui/button";
import type { PublicProductiveTask } from "@/content/shared/types";
import { AiConsent } from "@/features/writing/request-feedback";
import { useI18n } from "@/i18n/client";
import { Objections, type RaisedObjection } from "./objections";
import { useRecorder } from "./use-recorder";

type Allowance =
  | "checking"
  | "allowed"
  | "consent_required"
  | "not_included"
  | "unavailable"
  | "daily_limit"
  | "busy_today"
  | "invalid"
  | "not_found";

const clock = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

/** Records a spoken answer and sends it for transcription and feedback. */
export function SpeakingRecorder({
  task,
  practiceSubmissionId,
  onPractiseWithout,
}: {
  task: PublicProductiveTask;
  practiceSubmissionId: string;
  onPractiseWithout: () => void;
}) {
  const { t } = useI18n();
  const copy = t.speaking.record;
  const errors = t.speaking.errors;
  const router = useRouter();
  const [allowance, setAllowance] = useState<Allowance>("checking");
  const [clientKey, setClientKey] = useState(() => crypto.randomUUID());
  const [sending, setSending] = useState(false);
  // Objections raised during this recording, sent so their audio can be
  // removed from the transcript.
  const raised = useRef<RaisedObjection[]>([]);
  const recorder = useRecorder({
    maxSeconds: task.durationSeconds,
    preparationSeconds: task.preparationSeconds,
  });

  // Bumped to check again, for example after the learner agrees to AI feedback.
  const [checks, setChecks] = useState(0);
  useEffect(() => {
    let active = true;
    getSpeakingAllowanceAction().then((result) => {
      if (active) setAllowance(result.ok ? result.allowance : "unavailable");
    });
    return () => {
      active = false;
    };
  }, [checks]);

  const practiseWithout = (
    <Button variant="secondary" onClick={onPractiseWithout}>
      {copy.practiseWithout}
    </Button>
  );

  if (allowance === "checking")
    return <p className="text-sm text-muted-foreground">{copy.checking}</p>;
  if (allowance === "consent_required")
    return (
      <AiConsent
        onAccepted={() => {
          setAllowance("checking");
          setChecks((count) => count + 1);
        }}
      />
    );
  if (allowance !== "allowed")
    return (
      <div className="space-y-4 rounded-xl border p-5">
        <p className="text-sm leading-6">{errors[allowance]}</p>
        {practiseWithout}
      </div>
    );

  const send = async () => {
    if (!recorder.recording) return;
    setSending(true);
    const form = new FormData();
    form.append("audio", recorder.recording.blob, "answer");
    form.append("taskId", task.id);
    form.append("clientKey", clientKey);
    form.append("durationSeconds", String(recorder.recording.seconds));
    form.append("practiceSubmissionId", practiceSubmissionId);
    if (raised.current.length)
      form.append("objections", JSON.stringify(raised.current));
    const response = await fetch("/api/speaking/submit", {
      method: "POST",
      body: form,
    }).catch(() => null);
    const body = (await response?.json().catch(() => null)) as {
      ok?: boolean;
      id?: string;
      reason?: string;
      message?: string;
      reference?: string;
    } | null;
    if (!body?.ok || !body.id) {
      setSending(false);
      const message = body?.message ?? errors.unavailable;
      toast.error(
        body?.reference
          ? t.common.errorReference(message, body.reference)
          : message,
      );
      if (body?.reason === "daily_limit" || body?.reason === "busy_today")
        setAllowance(body.reason);
      return;
    }
    router.push(`/speaking/${body.id}`);
  };

  const recordAgain = () => {
    recorder.reset();
    raised.current = [];
    setClientKey(crypto.randomUUID());
  };

  return (
    <div className="space-y-4 rounded-xl border bg-card p-5">
      <div>
        <h3 className="font-bold">{copy.title}</h3>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          {copy.body}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">{copy.limit}</p>
      </div>

      {task.objections &&
        (recorder.state === "idle" || recorder.state === "recording") && (
          <Objections
            objections={task.objections}
            elapsed={recorder.elapsed}
            active={recorder.state === "recording"}
            onRaised={(objection) => raised.current.push(objection)}
          />
        )}

      {recorder.state === "idle" && (
        <Button onClick={() => void recorder.start()}>
          <Mic className="size-4" aria-hidden="true" />
          {copy.start}
        </Button>
      )}

      {(recorder.state === "unsupported" || recorder.state === "denied") && (
        <div className="space-y-4">
          <p role="alert" className="text-sm leading-6">
            {recorder.state === "denied" ? copy.micDenied : copy.unsupported}
          </p>
          {practiseWithout}
        </div>
      )}

      {recorder.state === "preparing" && (
        <p role="timer" className="font-semibold">
          {copy.preparing(recorder.countdown)}
        </p>
      )}

      {recorder.state === "recording" && (
        <div className="flex flex-wrap items-center gap-4">
          <p
            role="timer"
            className="inline-flex items-center gap-2 font-semibold"
          >
            <span
              className="size-3 animate-pulse rounded-full bg-danger"
              aria-hidden="true"
            />
            {copy.recording} · {clock(recorder.elapsed)} /{" "}
            {clock(task.durationSeconds)}
          </p>
          <Button variant="secondary" onClick={recorder.stop}>
            <Square className="size-4" aria-hidden="true" />
            {copy.stop}
          </Button>
        </div>
      )}

      {recorder.state === "recorded" && recorder.recording && (
        <div className="space-y-4">
          {recorder.stoppedAtLimit && (
            <p className="text-sm text-muted-foreground">{copy.sizeLimit}</p>
          )}
          <label className="block text-sm font-semibold">
            {copy.listen}
            <audio
              className="mt-2 w-full"
              controls
              src={recorder.recording.url}
            />
          </label>
          <div className="flex flex-wrap gap-3">
            <Button disabled={sending} onClick={send}>
              {sending ? copy.sending : copy.send}
            </Button>
            <Button
              variant="secondary"
              disabled={sending}
              onClick={recordAgain}
            >
              {copy.again}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
