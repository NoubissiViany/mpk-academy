"use client";

import { useCallback } from "react";
import Link from "next/link";
import {
  flagWritingFixAction,
  getWritingStatusAction,
} from "@/app/actions/writing";
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
import type { WritingChecks } from "@/lib/domain/writing-checks";
import type { WritingSubmission } from "@/lib/supabase/writing";
import { RequestAiFeedback } from "./request-feedback";

export function WritingFeedbackView({
  submission,
  taskTitle,
  parentBody,
}: {
  submission: WritingSubmission;
  taskTitle: string;
  parentBody: string | null;
}) {
  const { t } = useI18n();
  const copy = t.writing;
  const { status, ahead, capReached, feedback } = useReviewStatus(
    submission.id,
    submission,
    getWritingStatusAction,
  );
  const flag = useCallback(
    (index: number) => flagWritingFixAction(submission.id, index),
    [submission.id],
  );

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        eyebrow={copy.feedback.eyebrow}
        title={copy.feedback.title(taskTitle)}
        description={copy.feedback.disclaimer}
      />
      {status === "done" && feedback ? (
        <AiFeedbackBody
          feedback={feedback}
          flagged={submission.flaggedFixes}
          onFlag={flag}
        >
          {submission.checks && <ChecksCard checks={submission.checks} />}
        </AiFeedbackBody>
      ) : (
        <ReviewStatusCard
          status={status}
          ahead={ahead}
          capReached={capReached}
          copy={copy.status}
        />
      )}
      {status === "failed" && (
        <div className="mt-4 space-y-4">
          <TextPanel title={copy.feedback.original} text={submission.body} />
          <RequestAiFeedback
            compact
            label={copy.status.retry}
            taskId={submission.taskId}
            text={submission.body}
            parentId={submission.parentId ?? undefined}
          />
        </div>
      )}
      {parentBody && (
        <section className="mt-8" aria-labelledby="compare-title">
          <h2 id="compare-title" className="text-xl font-bold">
            {copy.feedback.compareTitle}
          </h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <TextPanel title={copy.feedback.firstVersion} text={parentBody} />
            <TextPanel
              title={copy.feedback.thisVersion}
              text={submission.body}
            />
          </div>
        </section>
      )}
      <div className="mt-8 flex flex-wrap gap-3">
        {status === "done" && (
          <Button asChild>
            <Link href={`/writing/${submission.id}/rewrite`}>
              {copy.feedback.rewriteCta}
            </Link>
          </Button>
        )}
        <Button asChild variant="secondary">
          <Link href="/writing">{copy.feedback.history}</Link>
        </Button>
      </div>
    </div>
  );
}

function ChecksCard({ checks }: { checks: WritingChecks }) {
  const { t } = useI18n();
  const copy = t.writing.feedback;
  const items = [
    `${copy.words(checks.words)} · ${copy.paragraphs(checks.paragraphs)}`,
    checks.length === "under" && checks.range
      ? copy.length.under(checks.range.min)
      : checks.length === "over" && checks.range?.max
        ? copy.length.over(checks.range.max)
        : checks.length === "within"
          ? copy.length.within
          : null,
    copy.address[checks.address],
    checks.connectors.length
      ? copy.connectors(checks.connectors.join(", "))
      : copy.noConnectors,
    checks.variety === "low" ? copy.lowVariety : null,
  ].filter((item): item is string => Boolean(item));
  return (
    <Card>
      <CardContent className="pt-6">
        <h2 className="text-lg font-bold">{copy.checksTitle}</h2>
        <ul className="mt-3 list-inside list-disc space-y-1.5 text-sm leading-6">
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
