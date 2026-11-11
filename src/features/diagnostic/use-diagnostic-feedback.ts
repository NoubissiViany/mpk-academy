"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { checkDiagnosticAnswersAction } from "@/app/actions/content";
import { useI18n } from "@/i18n/client";
import type { AnswerFeedback } from "@/types/domain";
import type { useDiagnosticDraft } from "./use-diagnostic-draft";

/** Feedback is transient; only first submitted answers belong in the draft. */
export function useDiagnosticFeedback(
  recovery: ReturnType<typeof useDiagnosticDraft>,
) {
  const { locale, t } = useI18n();
  const key = `${recovery.draft?.id ?? ""}:${locale}`;
  const latestKey = useRef(key);
  useEffect(() => {
    latestKey.current = key;
  }, [key]);
  const busy = useRef(false);
  const [state, setState] = useState<{
    key: string;
    feedback: Record<string, AnswerFeedback>;
    checking: boolean;
    error: string | null;
  }>({ key, feedback: {}, checking: false, error: null });
  const feedback = useMemo(
    () => (state.key === key ? state.feedback : {}),
    [state.key, state.feedback, key],
  );
  const error = state.key === key ? state.error : null;
  const checking = state.checking;

  const run = useCallback(
    async (questionId?: string) => {
      if (busy.current) return;
      busy.current = true;
      const requestKey = key;
      setState((previous) => ({
        key: requestKey,
        feedback: previous.key === requestKey ? previous.feedback : {},
        checking: true,
        error: null,
      }));
      try {
        // A correction must never be revealed until its first answer is durable.
        if (questionId && !(await recovery.checkAnswer(questionId)))
          throw new Error(t.ux.draft.error);
        if (!questionId && !(await recovery.flush()))
          throw new Error(t.ux.draft.error);
        const checked = recovery.current.current?.checkedAnswers ?? {};
        const result = await checkDiagnosticAnswersAction(checked);
        if (!result.ok) throw new Error(result.message);
        if (latestKey.current === requestKey)
          setState({
            key: requestKey,
            feedback: result.feedback,
            checking: false,
            error: null,
          });
      } catch {
        if (latestKey.current === requestKey)
          setState((previous) => ({
            ...previous,
            checking: false,
            error: t.assessment.feedbackError,
          }));
      } finally {
        busy.current = false;
        // A language change can happen while the previous request is pending.
        // Publish the new key so recovery checks run again in that language.
        if (latestKey.current !== requestKey)
          setState({
            key: latestKey.current,
            feedback: {},
            checking: false,
            error: null,
          });
      }
    },
    [key, recovery, t],
  );

  useEffect(() => {
    if (
      recovery.draft?.stage === "questions" &&
      recovery.status === "saved" &&
      !error &&
      !busy.current &&
      Object.keys(recovery.draft.checkedAnswers ?? {}).some(
        (id) => !feedback[id],
      )
    )
      void run();
  }, [recovery.draft, recovery.status, feedback, error, run]);

  return {
    feedback,
    checking,
    error,
    check: (questionId: string) => run(questionId),
    retry: () => run(),
  };
}
