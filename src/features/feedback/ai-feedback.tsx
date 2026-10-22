"use client";

import { useEffect, useState, type ReactNode } from "react";
import { AlertTriangle, Clock, Flag, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useApp } from "@/components/providers/app-provider";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useI18n } from "@/i18n/client";
import {
  compareBand,
  targetBandFor,
  type WritingFeedback,
} from "@/lib/domain/writing-feedback";
import { cn } from "@/lib/utils";

// Shared by writing and speaking feedback pages: queue polling, the status
// card, and the feedback itself (levels, corrections, rewritten passage).

export type ReviewStatus = "queued" | "processing" | "done" | "failed";

type PollResult =
  | {
      ok: true;
      status: ReviewStatus;
      ahead: number;
      capReached: boolean;
      feedback: WritingFeedback | null;
    }
  | { ok: false };

const POLL_MS = 5_000;
const POLL_LIMIT = 180; // 15 minutes

/** Polls while the review is pending; restarts when `status` is set back. */
export function useReviewStatus(
  id: string,
  initial: { status: ReviewStatus; feedback: WritingFeedback | null },
  poll: (id: string) => Promise<PollResult>,
) {
  const [status, setStatus] = useState(initial.status);
  const [ahead, setAhead] = useState(0);
  const [capReached, setCapReached] = useState(false);
  const [feedback, setFeedback] = useState(initial.feedback);
  const pending = status === "queued" || status === "processing";

  useEffect(() => {
    if (!pending) return;
    let polls = 0;
    let cancelled = false;
    const check = async () => {
      polls += 1;
      const result = await poll(id);
      if (cancelled || !result.ok) return;
      setStatus(result.status);
      setAhead(result.ahead);
      setCapReached(result.capReached);
      if (result.feedback) setFeedback(result.feedback);
    };
    void check();
    const interval = setInterval(() => {
      if (polls >= POLL_LIMIT) return clearInterval(interval);
      void check();
    }, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [pending, id, poll]);

  return { status, setStatus, ahead, capReached, feedback };
}

export interface StatusCopy {
  queuedTitle: string;
  ahead: (count: number) => string;
  eta: (minutes: number) => string;
  processingTitle: string;
  processingBody: string;
  failedTitle: string;
  failedBody: string;
  deferredTitle?: string;
  deferredBody?: string;
}

export function ReviewStatusCard({
  status,
  ahead,
  capReached,
  copy,
}: {
  status: ReviewStatus;
  ahead: number;
  capReached: boolean;
  copy: StatusCopy;
}) {
  const [Icon, title, body] =
    status === "failed"
      ? [AlertTriangle, copy.failedTitle, copy.failedBody]
      : capReached && copy.deferredTitle && copy.deferredBody
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

type FlagAction = (
  fixIndex: number,
) => Promise<{ ok: true } | { ok: false; message: string }>;

export function AiFeedbackBody({
  feedback,
  flagged,
  onFlag,
  quoteLabel,
  children,
}: {
  feedback: WritingFeedback;
  flagged: number[];
  onFlag: FlagAction;
  /** "You wrote" by default; speaking says "You said". */
  quoteLabel?: string;
  /** Extra cards shown after the rewritten passage. */
  children?: ReactNode;
}) {
  const { t } = useI18n();
  const { state } = useApp();
  const copy = t.writing.feedback;
  const target = state.user?.goal.target ?? "I'm not sure";
  const targetBand = targetBandFor[target];
  const top = feedback.fixes.slice(0, 3);
  const more = feedback.fixes.slice(3);
  const item = (fix: WritingFeedback["fixes"][number], index: number) => (
    <FixItem
      key={`${index}-${fix.quote}`}
      index={index}
      fix={fix}
      alreadyFlagged={flagged.includes(index)}
      onFlag={onFlag}
      quoteLabel={quoteLabel ?? copy.youWrote}
    />
  );
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
            {top.map((fix, index) => item(fix, index))}
          </ol>
        )}
        {more.length > 0 && (
          <details className="mt-4">
            <summary className="cursor-pointer text-sm font-bold text-primary">
              {copy.moreFixes(more.length)}
            </summary>
            <ol className="mt-3 space-y-3">
              {more.map((fix, offset) => item(fix, offset + 3))}
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

      {children}

      {feedback.dropped > 0 && (
        <p className="text-xs text-muted-foreground">
          {copy.dropped(feedback.dropped)}
        </p>
      )}
    </div>
  );
}

function FixItem({
  index,
  fix,
  alreadyFlagged,
  onFlag,
  quoteLabel,
}: {
  index: number;
  fix: WritingFeedback["fixes"][number];
  alreadyFlagged: boolean;
  onFlag: FlagAction;
  quoteLabel: string;
}) {
  const { t } = useI18n();
  const copy = t.writing.feedback;
  const [flagged, setFlagged] = useState(alreadyFlagged);
  const [sending, setSending] = useState(false);
  const flag = async () => {
    setSending(true);
    const result = await onFlag(index);
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
        <dt className="font-semibold text-muted-foreground">{quoteLabel}</dt>
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

export function TextPanel({
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
