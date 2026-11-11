import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createDiagnosticDraft } from "@/lib/domain/diagnostic-draft";
import { getPublicDiagnosticQuestions } from "@/lib/server/content";
import { messagesFor } from "@/i18n/messages";
import type { AnswerFeedback, Locale } from "@/types/domain";
import type { useDiagnosticDraft } from "./use-diagnostic-draft";
import { useDiagnosticFeedback } from "./use-diagnostic-feedback";

const mocks = vi.hoisted(() => ({
  check: vi.fn(),
  locale: "en" as Locale,
}));
vi.mock("@/app/actions/content", () => ({
  checkDiagnosticAnswersAction: mocks.check,
}));
vi.mock("@/i18n/client", () => ({
  useI18n: () => ({ locale: mocks.locale, t: messagesFor(mocks.locale) }),
}));

type Recovery = ReturnType<typeof useDiagnosticDraft>;
const questions = getPublicDiagnosticQuestions();
const id = questions[0].id;
const englishFeedback: AnswerFeedback = {
  correct: false,
  correctAnswer: "b",
  explanation: "The explanation in English",
};
const frenchFeedback: AnswerFeedback = {
  ...englishFeedback,
  explanation: "L’explication en français",
};

function recovery(checked = true): Recovery {
  const draft = createDiagnosticDraft(questions);
  draft.stage = "questions";
  draft.answers[id] = "a";
  if (checked) {
    draft.checkedAnswers = { [id]: "a" };
    draft.intake.feedbackMode = "guided";
  }
  return {
    draft,
    choices: [],
    status: "saved",
    loadFailed: false,
    change: vi.fn(),
    checkAnswer: vi.fn().mockResolvedValue(true),
    flush: vi.fn().mockResolvedValue(true),
    reload: vi.fn(),
    resume: vi.fn(),
    restart: vi.fn(),
    complete: vi.fn(),
    current: { current: draft },
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.locale = "en";
  mocks.check.mockResolvedValue({
    ok: true,
    feedback: { [id]: englishFeedback },
  });
});
afterEach(cleanup);

describe("diagnostic correction recovery", () => {
  it("waits for the durable first answer and ignores duplicate check clicks", async () => {
    const draft = recovery(false);
    let persist!: (value: boolean) => void;
    draft.checkAnswer = vi.fn().mockImplementation(() => {
      draft.current.current!.checkedAnswers = { [id]: "a" };
      return new Promise<boolean>((resolve) => {
        persist = resolve;
      });
    });
    const hook = renderHook(() => useDiagnosticFeedback(draft));
    let pending!: Promise<void>;
    act(() => {
      pending = hook.result.current.check(id);
    });
    await act(async () => {
      await hook.result.current.check(id);
    });
    expect(draft.checkAnswer).toHaveBeenCalledTimes(1);
    expect(mocks.check).not.toHaveBeenCalled();
    expect(hook.result.current.checking).toBe(true);
    await act(async () => {
      persist(true);
      await pending;
    });
    expect(mocks.check).toHaveBeenCalledWith({ [id]: "a" });
    expect(hook.result.current.feedback[id]).toEqual(englishFeedback);
    expect(hook.result.current.checking).toBe(false);
  });
  it("does not reveal corrections after a rejected save and retries the locked answer", async () => {
    const draft = recovery(false);
    draft.checkAnswer = vi.fn().mockImplementation(async () => {
      draft.current.current!.checkedAnswers = { [id]: "a" };
      draft.status = "error";
      return false;
    });
    const hook = renderHook(() => useDiagnosticFeedback(draft));
    await act(async () => {
      await hook.result.current.check(id);
    });
    expect(mocks.check).not.toHaveBeenCalled();
    expect(hook.result.current.feedback).toEqual({});
    expect(hook.result.current.error).toBe(
      messagesFor("en").assessment.feedbackError,
    );
    await act(async () => {
      await hook.result.current.retry();
    });
    expect(draft.flush).toHaveBeenCalledTimes(1);
    expect(mocks.check).toHaveBeenCalledWith({ [id]: "a" });
    expect(hook.result.current.feedback[id]).toEqual(englishFeedback);
    expect(hook.result.current.error).toBeNull();
  });
  it("reconstructs saved corrections in the new language after switching locale during a request", async () => {
    const draft = recovery();
    let resolveEnglish!: (value: unknown) => void;
    mocks.check.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveEnglish = resolve;
        }),
    );
    const hook = renderHook(() => useDiagnosticFeedback(draft));
    await waitFor(() => expect(mocks.check).toHaveBeenCalledTimes(1));
    mocks.locale = "fr";
    mocks.check.mockResolvedValue({
      ok: true,
      feedback: { [id]: frenchFeedback },
    });
    hook.rerender();
    expect(hook.result.current.feedback).toEqual({});
    await act(async () => {
      resolveEnglish({ ok: true, feedback: { [id]: englishFeedback } });
    });
    await waitFor(() => expect(mocks.check).toHaveBeenCalledTimes(2));
    await waitFor(() =>
      expect(hook.result.current.feedback[id]).toEqual(frenchFeedback),
    );
    expect(hook.result.current.error).toBeNull();
    expect(draft.checkAnswer).not.toHaveBeenCalled();
  });
  it("ignores an obsolete request after a fresh attempt is started", async () => {
    let current = recovery();
    let resolveOld!: (value: unknown) => void;
    mocks.check.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveOld = resolve;
        }),
    );
    const hook = renderHook(() => useDiagnosticFeedback(current));
    await waitFor(() => expect(mocks.check).toHaveBeenCalledTimes(1));
    current = recovery(false);
    hook.rerender();
    await act(async () => {
      resolveOld({ ok: true, feedback: { [id]: englishFeedback } });
    });
    expect(hook.result.current.feedback).toEqual({});
    expect(hook.result.current.checking).toBe(false);
    expect(mocks.check).toHaveBeenCalledTimes(1);
  });
});
