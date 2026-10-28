"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  getDiagnosticWritingAction,
  requestDiagnosticWritingFeedbackAction,
} from "@/app/actions/diagnostic-writing";
import {
  flagWritingFixAction,
  getWritingStatusAction,
} from "@/app/actions/writing";
import { useApp } from "@/components/providers/app-provider";
import { Button } from "@/components/ui/button";
import { aiFeedbackNoticeVersion } from "@/config/privacy";
import {
  AiFeedbackBody,
  ReviewStatusCard,
  useReviewStatus,
} from "@/features/feedback/ai-feedback";
import { AiConsent } from "@/features/writing/request-feedback";
import { useI18n } from "@/i18n/client";
import type { WritingSubmission } from "@/lib/supabase/writing";
import type { DiagnosticWritingSample } from "@/lib/domain/diagnostic-writing";

type SavedWriting = {
  assessmentId: string;
  sample: DiagnosticWritingSample;
  configured: boolean;
  submission: WritingSubmission | null;
};

export function DiagnosticWritingResult() {
  const { state } = useApp();
  const { t } = useI18n();
  const copy = t.diagnostic.writing;
  const userId = state.user?.id;
  const [saved, setSaved] = useState<SavedWriting | null>();
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [revision, setRevision] = useState(0);
  const [reload, setReload] = useState(0);
  useEffect(() => {
    if (!userId) return;
    let active = true;
    void getDiagnosticWritingAction()
      .then((result) => {
        if (!active) return;
        setError("");
        if (result.ok) setSaved(result.data);
        else setError(result.message);
      })
      .catch(() => {
        if (active) setError(copy.unavailable);
      });
    return () => {
      active = false;
    };
  }, [userId, copy.unavailable, reload]);

  const request = async (retry = false) => {
    if (!saved) return;
    setSending(true);
    setError("");
    try {
      const result = await requestDiagnosticWritingFeedbackAction(
        saved.assessmentId,
        retry,
      );
      if (!result.ok) setError(result.message);
      else {
        setSaved({ ...saved, submission: result.submission });
        setRevision((value) => value + 1);
      }
    } catch {
      setError(copy.unavailable);
    } finally {
      setSending(false);
    }
  };
  const consented =
    state.user?.aiFeedbackConsent?.version === aiFeedbackNoticeVersion;

  return (
    <section
      className="mt-8 space-y-4 rounded-2xl border p-5 sm:p-7"
      aria-labelledby="diagnostic-writing-result"
    >
      <h2 id="diagnostic-writing-result" className="text-xl font-bold">
        {copy.resultTitle}
      </h2>
      <p className="text-sm leading-6 text-muted-foreground">
        {copy.resultBody}
      </p>
      {!userId ? (
        <>
          <p>{copy.guest}</p>
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/login?next=%2Fdiagnostic%2Fresults">
                {copy.signIn}
              </Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/register">{copy.register}</Link>
            </Button>
          </div>
        </>
      ) : (
        <>
          {error && (
            <div role="alert">
              <p>{error}</p>
              <Button
                variant="secondary"
                onClick={() => setReload((value) => value + 1)}
              >
                {copy.reload}
              </Button>
            </div>
          )}
          {saved === undefined && !error && <p role="status">{copy.load}</p>}
          {saved === null && <p>{copy.unavailable}</p>}
          {saved?.submission && (
            <Review
              key={`${saved.submission.id}:${revision}`}
              submission={saved.submission}
              canRetry={Boolean(saved.configured && consented)}
              needsConsent={Boolean(saved.configured && !consented)}
              sending={sending}
              retry={() => void request(true)}
            />
          )}
          {saved && !saved.configured && !saved.submission && (
            <p>{copy.unavailable}</p>
          )}
          {saved?.configured && !saved.submission && !consented && (
            <AiConsent />
          )}
          {saved?.configured && !saved.submission && consented && (
            <Button disabled={sending} onClick={() => void request()}>
              {sending ? t.common.saving : copy.request}
            </Button>
          )}
        </>
      )}
      <details>
        <summary className="cursor-pointer font-semibold">
          {copy.savedText}
        </summary>
        <p lang="fr" className="mt-3 whitespace-pre-wrap leading-7">
          {saved?.submission?.body ??
            saved?.sample?.text ??
            state.diagnosticIntake?.writingSample?.text}
        </p>
      </details>
    </section>
  );
}

function Review({
  submission,
  canRetry,
  needsConsent,
  sending,
  retry,
}: {
  submission: WritingSubmission;
  canRetry: boolean;
  needsConsent: boolean;
  sending: boolean;
  retry: () => void;
}) {
  const { t } = useI18n();
  const { status, feedback, ahead, capReached } = useReviewStatus(
    submission.id,
    submission,
    getWritingStatusAction,
  );
  const flag = useCallback(
    (index: number) => flagWritingFixAction(submission.id, index),
    [submission.id],
  );
  return (
    <>
      {status === "done" && feedback ? (
        <AiFeedbackBody
          feedback={feedback}
          flagged={submission.flaggedFixes}
          onFlag={flag}
        />
      ) : (
        <ReviewStatusCard
          status={status}
          ahead={ahead}
          capReached={capReached}
          copy={t.writing.status}
        />
      )}
      {status === "failed" && canRetry && (
        <Button disabled={sending} onClick={retry}>
          {t.diagnostic.writing.retry}
        </Button>
      )}
      {status === "failed" && needsConsent && <AiConsent />}
    </>
  );
}
