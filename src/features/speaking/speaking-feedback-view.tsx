"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { Gauge, Info } from "lucide-react";
import { toast } from "sonner";
import {
  flagSpeakingFixAction,
  getSpeakingStatusAction,
  requeueSpeakingAction,
} from "@/app/actions/speaking";
import { PageHeader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  AiFeedbackBody,
  ReviewStatusCard,
  TextPanel,
  useReviewStatus,
} from "@/features/feedback/ai-feedback";
import { useI18n } from "@/i18n/client";
import { paceFor, type SpeakingMetrics } from "@/lib/domain/speaking-metrics";
import type { SpeakingSubmission } from "@/lib/supabase/speaking";

export function SpeakingFeedbackView({
  submission,
  taskTitle,
}: {
  submission: SpeakingSubmission;
  taskTitle: string;
}) {
  const { t } = useI18n();
  const copy = t.speaking;
  const { status, setStatus, ahead, capReached, feedback } = useReviewStatus(
    submission.id,
    submission,
    getSpeakingStatusAction,
  );
  const [retrying, setRetrying] = useState(false);
  const flag = useCallback(
    (index: number) => flagSpeakingFixAction(submission.id, index),
    [submission.id],
  );
  const retry = async () => {
    setRetrying(true);
    const result = await requeueSpeakingAction(submission.id);
    setRetrying(false);
    if (!result.ok) return toast.error(result.message);
    setStatus("queued");
  };

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        eyebrow={copy.feedback.eyebrow}
        title={copy.feedback.title(taskTitle)}
        description={copy.feedback.disclaimer}
      />
      <div className="mb-8 grid gap-4 md:grid-cols-[1.4fr_1fr]">
        <div>
          <TextPanel
            title={copy.feedback.transcriptTitle}
            text={submission.transcript}
          />
          <p className="mt-2 text-xs text-muted-foreground">
            {copy.feedback.transcriptNote}
          </p>
        </div>
        {submission.metrics && <MetricsCard metrics={submission.metrics} />}
      </div>
      {status === "done" && feedback ? (
        <AiFeedbackBody
          feedback={feedback}
          flagged={submission.flaggedFixes}
          onFlag={flag}
          quoteLabel={copy.feedback.youSaid}
          evidenceLabel={copy.feedback.evidence}
        />
      ) : (
        <ReviewStatusCard
          status={status}
          ahead={ahead}
          capReached={capReached}
          copy={{
            ...t.writing.status,
            queuedTitle: copy.status.queuedTitle,
            processingTitle: copy.status.processingTitle,
            processingBody: copy.status.processingBody,
            failedTitle: copy.status.failedTitle,
            failedBody: copy.status.failedBody,
          }}
        />
      )}
      <div className="mt-8 flex flex-wrap gap-3">
        {status === "failed" && (
          <Button disabled={retrying} onClick={retry}>
            {copy.status.retry}
          </Button>
        )}
        <Button asChild variant="secondary">
          <Link href="/speaking">{copy.feedback.history}</Link>
        </Button>
      </div>
    </div>
  );
}

function MetricsCard({ metrics }: { metrics: SpeakingMetrics }) {
  const { t } = useI18n();
  const copy = t.speaking.feedback;
  const pace =
    metrics.wordsPerMinute === null ? null : paceFor(metrics.wordsPerMinute);
  return (
    <Card>
      <CardContent className="space-y-3 pt-6 text-sm leading-6">
        <h2 className="inline-flex items-center gap-2 text-lg font-bold">
          <Gauge className="size-5 text-primary" aria-hidden="true" />
          {copy.metricsTitle}
        </h2>
        <p>
          {copy.length(
            Math.floor(metrics.audioSeconds / 60),
            metrics.audioSeconds % 60,
          )}
        </p>
        {pace && metrics.wordsPerMinute !== null ? (
          <>
            <p className="font-semibold">
              {copy.pace[pace](metrics.wordsPerMinute)}
            </p>
            <p className="text-muted-foreground">{copy.paceTip[pace]}</p>
          </>
        ) : (
          <p>{copy.noPace}</p>
        )}
        <p>{copy.pauses(metrics.longPauses, metrics.longestPause)}</p>
        {metrics.longPauses >= 3 && (
          <p className="text-muted-foreground">{copy.pausesTip}</p>
        )}
        {metrics.startDelay >= 3 && (
          <p>{copy.startDelay(metrics.startDelay)}</p>
        )}
        <p className="inline-flex items-start gap-2 text-muted-foreground">
          <Info className="mt-1 size-4 shrink-0" aria-hidden="true" />
          {copy.pronunciation}
        </p>
      </CardContent>
    </Card>
  );
}
