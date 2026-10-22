"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Clock, Flag, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  flagWritingFixAction,
  getWritingStatusAction,
} from "@/app/actions/writing";
import { useApp } from "@/components/providers/app-provider";
import { PageHeader } from "@/components/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useI18n } from "@/i18n/client";
import type { WritingChecks } from "@/lib/domain/writing-checks";
import {
  compareBand,
  targetBandFor,
  type WritingFeedback,
} from "@/lib/domain/writing-feedback";
import type { WritingSubmission } from "@/lib/supabase/writing";
import { cn } from "@/lib/utils";

const POLL_MS = 5_000;
const POLL_LIMIT = 180; // 15 minutes

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
  const [status, setStatus] = useState(submission.status);
  const [ahead, setAhead] = useState(0);
  const [capReached, setCapReached] = useState(false);
  const [feedback, setFeedback] = useState(submission.feedback);
  const pending = status === "queued" || status === "processing";

  useEffect(() => {
    if (!pending) return;
    let polls = 0;
    let cancelled = false;
    const poll = async () => {
      polls += 1;
      const result = await getWritingStatusAction(submission.id);
      if (cancelled || !result.ok) return;
      setStatus(result.status);
      setAhead(result.ahead);
      setCapReached(result.capReached);
      if (result.feedback) setFeedback(result.feedback);
    };
    void poll();
    const interval = setInterval(() => {
      if (polls >= POLL_LIMIT) return clearInterval(interval);
      void poll();
    }, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [pending, submission.id]);

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        eyebrow={copy.feedback.eyebrow}
        title={copy.feedback.title(taskTitle)}
        description={copy.feedback.disclaimer}
      />
      {status === "done" && feedback ? (
        <FeedbackBody
          submissionId={submission.id}
          feedback={feedback}
          checks={submission.checks}
          flagged={submission.flaggedFixes}
        />
      ) : (
        <StatusCard status={status} ahead={ahead} capReached={capReached} />
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

function StatusCard({
  status,
  ahead,
  capReached,
}: {
  status: WritingSubmission["status"];
  ahead: number;
  capReached: boolean;
}) {
  const { t } = useI18n();
  const copy = t.writing.status;
  const [Icon, title, body] =
    status === "failed"
      ? [AlertTriangle, copy.failedTitle, copy.failedBody]
      : capReached
        ? [Clock, copy.deferredTitle, copy.deferredBody]
        : status === "processing"
          ? [Loader2, copy.processingTitle, copy.processingBody]
          : [
              Clock,
              copy.queuedTitle,
              `${copy.ahead(ahead)} ${copy.eta(Math.ceil((ahead + 1) * 0.5))}`,
            ];
  return (
    <Card role="status" aria-live="polite">
      <CardContent className="flex items-start gap-4 pt-6">
        <Icon
          className={cn(
            "mt-1 size-6 shrink-0 text-primary",
            status === "processing" && !capReached && "animate-spin",
          )}
          aria-hidden="true"
        />
        <div>
          <h2 className="text-xl font-bold">{title}</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function FeedbackBody({
  submissionId,
  feedback,
  checks,
  flagged,
}: {
  submissionId: string;
  feedback: WritingFeedback;
  checks: WritingChecks | null;
  flagged: number[];
}) {
  const { t } = useI18n();
  const { state } = useApp();
  const copy = t.writing.feedback;
  const target = state.user?.goal.target ?? "I'm not sure";
  const targetBand = targetBandFor[target];
  const top = feedback.fixes.slice(0, 3);
  const more = feedback.fixes.slice(3);
  return (
    <div className="space-y-8">
      <Card className="border-primary/20">
        <CardContent className="pt-6">
          <p className="eyebrow">{copy.summary}</p>
          <p className="mt-3 leading-7">{feedback.summary}</p>
          <p className="mt-3 text-sm text-muted-foreground">
            {copy.targetBar(targetBand, t.diagnostic.intake.targets[target])}
          </p>
        </CardContent>
      </Card>

      <section className="grid gap-4 sm:grid-cols-2">
        {feedback.criteria.map((criterion) => {
          const relation = compareBand(criterion.band, targetBand);
          return (
            <Card key={criterion.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="font-bold">{copy.criteria[criterion.id]}</h2>
                  <Badge
                    className={cn(
                      relation >= 0
                        ? "border-primary/30 bg-primary/10 text-primary"
                        : "border-accent/30 bg-accent/10 text-accent",
                    )}
                  >
                    {criterion.band}
                  </Badge>
                </div>
                <p className="mt-1 text-sm font-semibold text-muted-foreground">
                  {
                    copy.relation[
                      relation > 0 ? "above" : relation === 0 ? "at" : "below"
                    ]
                  }
                </p>
                <p className="mt-3 text-sm leading-6">{criterion.comment}</p>
                {criterion.evidence && (
                  <blockquote
                    lang="fr"
                    className="mt-3 border-l-2 border-primary/40 pl-3 text-sm italic text-muted-foreground"
                  >
                    <span className="sr-only">{copy.evidence}: </span>«&nbsp;
                    {criterion.evidence}&nbsp;»
                  </blockquote>
                )}
              </CardContent>
            </Card>
          );
        })}
      </section>

      <section aria-labelledby="fixes-title">
        <h2 id="fixes-title" className="text-xl font-bold">
          {copy.topFixes}
        </h2>
        {feedback.fixes.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">{copy.noFixes}</p>
        ) : (
          <ol className="mt-4 space-y-3">
            {top.map((fix, index) => (
              <FixItem
                key={`${index}-${fix.quote}`}
                submissionId={submissionId}
                index={index}
                fix={fix}
                alreadyFlagged={flagged.includes(index)}
              />
            ))}
          </ol>
        )}
        {more.length > 0 && (
          <details className="mt-4">
            <summary className="cursor-pointer text-sm font-bold text-primary">
              {copy.moreFixes(more.length)}
            </summary>
            <ol className="mt-3 space-y-3">
              {more.map((fix, offset) => (
                <FixItem
                  key={`${offset + 3}-${fix.quote}`}
                  submissionId={submissionId}
                  index={offset + 3}
                  fix={fix}
                  alreadyFlagged={flagged.includes(offset + 3)}
                />
              ))}
            </ol>
          </details>
        )}
      </section>

      {feedback.rewrite && (
        <section aria-labelledby="rewrite-title">
          <h2 id="rewrite-title" className="text-xl font-bold">
            {copy.rewriteTitle}
          </h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <TextPanel title={copy.original} text={feedback.rewrite.original} />
            <TextPanel
              title={copy.improved}
              text={feedback.rewrite.improved}
              highlight
            />
          </div>
        </section>
      )}

      {checks && <ChecksCard checks={checks} />}

      {feedback.dropped > 0 && (
        <p className="text-xs text-muted-foreground">
          {copy.dropped(feedback.dropped)}
        </p>
      )}
    </div>
  );
}

function FixItem({
  submissionId,
  index,
  fix,
  alreadyFlagged,
}: {
  submissionId: string;
  index: number;
  fix: WritingFeedback["fixes"][number];
  alreadyFlagged: boolean;
}) {
  const { t } = useI18n();
  const copy = t.writing.feedback;
  const [flagged, setFlagged] = useState(alreadyFlagged);
  const [sending, setSending] = useState(false);
  const flag = async () => {
    setSending(true);
    const result = await flagWritingFixAction(submissionId, index);
    setSending(false);
    if (!result.ok) return toast.error(result.message);
    setFlagged(true);
  };
  return (
    <li className="rounded-xl border p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Badge>{copy.categories[fix.category]}</Badge>
        <button
          type="button"
          className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground disabled:opacity-70"
          disabled={flagged || sending}
          onClick={flag}
        >
          <Flag className="size-3.5" aria-hidden="true" />
          {flagged ? copy.flagged : copy.flag}
        </button>
      </div>
      <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-[auto_1fr] sm:gap-x-4">
        <dt className="font-semibold text-muted-foreground">{copy.youWrote}</dt>
        <dd lang="fr" className="text-danger line-through decoration-1">
          {fix.quote}
        </dd>
        <dt className="font-semibold text-muted-foreground">{copy.better}</dt>
        <dd lang="fr" className="font-semibold">
          {fix.correction}
        </dd>
      </dl>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        {fix.explanation}
      </p>
    </li>
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

function TextPanel({
  title,
  text,
  highlight,
}: {
  title: string;
  text: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border p-4",
        highlight && "border-primary/30 bg-primary/5",
      )}
    >
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
        {title}
      </p>
      <p lang="fr" className="mt-2 whitespace-pre-line text-sm leading-7">
        {text}
      </p>
    </div>
  );
}
