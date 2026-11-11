"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  discardDiagnosticDraftAction,
  getDiagnosticDraftAction,
  replaceDiagnosticDraftAction,
  saveDiagnosticDraftAction,
} from "@/app/actions/diagnostic-draft";
import {
  createDiagnosticDraft,
  type DiagnosticDraft,
} from "@/lib/domain/diagnostic-draft";
import {
  DraftConflict,
  guestDiagnosticDraft,
  withGuestDraftLock,
} from "@/repositories/diagnostic-draft";
import type { DiagnosticIntake, PublicQuestion } from "@/types/domain";

type Status = "loading" | "idle" | "saving" | "saved" | "error" | "conflict";
export type DraftChoice = {
  source: "account" | "browser";
  draft: DiagnosticDraft;
};

/** Serialize writes; an older response must never replace newer edits. */
export function useDiagnosticDraft(
  questions: PublicQuestion[],
  userId?: string,
) {
  const [draft, setDraft] = useState<DiagnosticDraft | null>(null);
  const [choices, setChoices] = useState<DraftChoice[]>([]);
  const [status, setStatus] = useState<Status>("loading");
  const [loadFailed, setLoadFailed] = useState(false);
  const current = useRef<DiagnosticDraft | null>(null);
  const saved = useRef<DiagnosticDraft | null>(null);
  const sequence = useRef(0);
  const savedSequence = useRef(0);
  const blocked = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlight = useRef<Promise<boolean> | null>(null);
  const selecting = useRef(false);
  const mounted = useRef(true);
  const publish = useCallback((next: DiagnosticDraft | null) => {
    current.current = next;
    if (mounted.current) setDraft(next);
  }, []);

  const flush = useCallback(async (): Promise<boolean> => {
    if (timer.current) clearTimeout(timer.current);
    if (inFlight.current) return inFlight.current;
    if (blocked.current) return false;
    const run = async () => {
      // Let the in-flight promise be installed before synchronous browser writes.
      await Promise.resolve();
      while (current.current && savedSequence.current < sequence.current) {
        const seq = sequence.current;
        const input = {
          ...current.current,
          revision: saved.current?.revision ?? current.current.revision,
        };
        if (mounted.current) setStatus("saving");
        try {
          const result = userId
            ? await saveDiagnosticDraftAction(input, userId)
            : {
                ok: true as const,
                draft: await withGuestDraftLock(() =>
                  guestDiagnosticDraft.save(input),
                ),
              };
          if (!result.ok || !result.draft) {
            blocked.current = !result.ok && result.reason === "conflict";
            if (mounted.current)
              setStatus(blocked.current ? "conflict" : "error");
            return false;
          }
          saved.current = result.draft;
          savedSequence.current = seq;
          if (current.current?.id === input.id)
            publish({
              ...current.current,
              revision: result.draft.revision,
              updatedAt: result.draft.updatedAt,
              expiresAt: result.draft.expiresAt,
            });
        } catch (error) {
          blocked.current = error instanceof DraftConflict;
          if (mounted.current)
            setStatus(blocked.current ? "conflict" : "error");
          return false;
        }
      }
      if (mounted.current) setStatus("saved");
      return true;
    };
    inFlight.current = run();
    const result = await inFlight.current;
    inFlight.current = null;
    return result;
  }, [publish, userId]);

  const reload = useCallback(async () => {
    if (timer.current) clearTimeout(timer.current);
    await inFlight.current;
    setStatus("loading");
    setLoadFailed(false);
    try {
      let browser: DiagnosticDraft | null = null;
      try {
        browser = await withGuestDraftLock(() =>
          guestDiagnosticDraft.load(questions),
        );
      } catch (error) {
        if (!userId) throw error;
      }
      const account = userId ? await getDiagnosticDraftAction() : null;
      if (account && !account.ok) throw new Error("Cannot load account draft");
      if (!mounted.current) return;
      setChoices([
        ...(account?.ok && account.draft
          ? [{ source: "account" as const, draft: account.draft }]
          : []),
        ...(browser ? [{ source: "browser" as const, draft: browser }] : []),
      ]);
      publish(null);
      saved.current = null;
      sequence.current = savedSequence.current = 0;
      blocked.current = false;
      setStatus("idle");
    } catch {
      if (mounted.current) {
        setStatus("error");
        setLoadFailed(true);
      }
    }
  }, [questions, userId, publish]);

  useEffect(() => {
    mounted.current = true;
    let active = true;
    queueMicrotask(() => {
      if (active) void reload();
    });
    const leave = (event: BeforeUnloadEvent) => {
      if (sequence.current > savedSequence.current) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    const hide = () => {
      void flush();
    };
    window.addEventListener("beforeunload", leave);
    window.addEventListener("pagehide", hide);
    return () => {
      active = false;
      mounted.current = false;
      window.removeEventListener("beforeunload", leave);
      window.removeEventListener("pagehide", hide);
      void flush();
    };
  }, [reload, flush]);

  const change = (next: DiagnosticDraft, debounce = false) => {
    const existing = current.current;
    if (existing?.id === next.id) {
      const checkedAnswers = {
        ...next.checkedAnswers,
        ...existing.checkedAnswers,
      };
      if (Object.keys(checkedAnswers).length) {
        next = {
          ...next,
          checkedAnswers,
          answers: { ...next.answers, ...checkedAnswers },
          intake: { ...next.intake, feedbackMode: "guided" },
          contentVersion: existing.contentVersion,
          questionOrder: existing.questionOrder,
          optionOrder: existing.optionOrder,
        };
      }
    }
    publish(next);
    sequence.current++;
    if (blocked.current) return;
    setStatus("saving");
    if (timer.current) clearTimeout(timer.current);
    if (debounce)
      timer.current = setTimeout(() => {
        void flush();
      }, 400);
    else void flush();
  };

  const checkAnswer = async (questionId: string): Promise<boolean> => {
    const existing = current.current;
    if (!existing || blocked.current) return false;
    const answer = existing.answers[questionId];
    if (!existing.questionOrder.includes(questionId) || !answer?.trim())
      return false;
    if (existing.checkedAnswers?.[questionId] === undefined)
      change({
        ...existing,
        checkedAnswers: {
          ...existing.checkedAnswers,
          [questionId]: answer,
        },
        intake: { ...existing.intake, feedbackMode: "guided" },
      });
    // Keep the first answer locked even when saving fails. Retrying waits for
    // the same payload to become durable before the caller reveals feedback.
    return flush();
  };

  const resume = async (choice: DraftChoice) => {
    if (selecting.current) return false;
    selecting.current = true;
    try {
      if (timer.current) clearTimeout(timer.current);
      await inFlight.current;
      const account = choices.find((item) => item.source === "account");
      let next = choice.draft;
      if (choice.source === "browser" && userId) {
        // Choosing the browser explicitly replaces the account draft atomically.
        next = {
          ...next,
          revision: account?.draft.revision ?? 0,
        };
        setStatus("saving");
        try {
          const result = await replaceDiagnosticDraftAction(next, userId);
          if (!result.ok || !result.draft) {
            blocked.current = !result.ok && result.reason === "conflict";
            setStatus(blocked.current ? "conflict" : "error");
            return false;
          }
          next = result.draft;
        } catch {
          setStatus("error");
          return false;
        }
        try {
          await withGuestDraftLock(() =>
            guestDiagnosticDraft.discard(
              choice.draft.id,
              choice.draft.revision,
            ),
          );
        } catch {
          /* Keep a newer browser draft. */
        }
      }
      saved.current = next;
      publish(next);
      sequence.current = savedSequence.current = 0;
      blocked.current = false;
      setStatus("saved");
      setChoices([]);
      return true;
    } finally {
      selecting.current = false;
    }
  };

  const restart = async (intake: Partial<DiagnosticIntake>) => {
    if (selecting.current) return;
    selecting.current = true;
    try {
      if (timer.current) clearTimeout(timer.current);
      await inFlight.current;
      const targets = current.current
        ? [
            {
              source: userId ? ("account" as const) : ("browser" as const),
              draft: saved.current ?? current.current,
            },
          ]
        : choices;
      try {
        for (const choice of targets) {
          if (choice.source === "account") {
            const result = await discardDiagnosticDraftAction(
              choice.draft.id,
              choice.draft.revision,
              userId!,
            );
            if (!result.ok) {
              blocked.current = result.reason === "conflict";
              setStatus(blocked.current ? "conflict" : "error");
              return;
            }
          } else
            await withGuestDraftLock(() =>
              guestDiagnosticDraft.discard(
                choice.draft.id,
                choice.draft.revision,
              ),
            );
        }
        saved.current = null;
        sequence.current = savedSequence.current = 0;
        blocked.current = false;
        setChoices([]);
        publish(null);
        change(
          createDiagnosticDraft(questions, {
            ...intake,
            writingSample: undefined,
            feedbackMode: undefined,
          }),
        );
      } catch (error) {
        setStatus(error instanceof DraftConflict ? "conflict" : "error");
      }
    } finally {
      selecting.current = false;
    }
  };

  const complete = async () => {
    // The authenticated scoring transaction removes its matching draft.
    if (!userId && saved.current) {
      try {
        const completed = saved.current;
        await withGuestDraftLock(() =>
          guestDiagnosticDraft.discard(completed.id, completed.revision),
        );
      } catch {
        /* Completed results remain available. */
      }
    }
    if (timer.current) clearTimeout(timer.current);
    sequence.current = savedSequence.current;
    current.current = null;
    saved.current = null;
  };

  return {
    draft,
    choices,
    status,
    loadFailed,
    change,
    checkAnswer,
    flush,
    reload,
    resume,
    restart,
    complete,
    current,
  };
}
