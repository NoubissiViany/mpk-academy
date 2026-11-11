import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppProvider } from "@/components/providers/app-provider";
import { productConfig } from "@/config/product";
import { diagnosticQuestions } from "@/data/questions";
import { scoreDiagnostic } from "@/lib/domain/diagnostic";
import { toPublicQuestion } from "@/lib/server/content";
import { guestAssessmentRepository } from "@/repositories/guest-assessment";
import { demoState } from "@/test/fixtures";
import { writingSampleFixture } from "@/test/diagnostic-writing";
import { diagnosticDraftStorageKey } from "@/repositories/diagnostic-draft";
import {
  createDiagnosticDraft,
  type DiagnosticDraft,
} from "@/lib/domain/diagnostic-draft";
import { DiagnosticFlow } from "./diagnostic-flow";

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  refresh: vi.fn(),
  getSnapshot: vi.fn(),
  submitDiagnostic: vi.fn(),
  updateProfile: vi.fn(),
  toastError: vi.fn(),
  scoreGuest: vi.fn(),
  getDraft: vi.fn(),
  saveDraft: vi.fn(),
  checkAnswers: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push, refresh: mocks.refresh }),
}));
vi.mock("@/app/actions/learner", () => ({
  getLearnerSnapshotAction: mocks.getSnapshot,
  submitDiagnosticAction: mocks.submitDiagnostic,
  updateProfileAction: mocks.updateProfile,
}));
vi.mock("@/app/actions/content", () => ({
  scoreGuestDiagnosticAction: mocks.scoreGuest,
  checkDiagnosticAnswersAction: mocks.checkAnswers,
}));
vi.mock("@/app/actions/diagnostic-draft", () => ({
  getDiagnosticDraftAction: mocks.getDraft,
  saveDiagnosticDraftAction: mocks.saveDraft,
  discardDiagnosticDraftAction: vi.fn(),
  replaceDiagnosticDraftAction: vi.fn(),
}));
beforeEach(() => {
  Object.defineProperty(window, "scrollTo", { value: vi.fn(), writable: true });
  mocks.checkAnswers.mockImplementation(
    async (answers: Record<string, string>) => ({
      ok: true,
      feedback: Object.fromEntries(
        Object.entries(answers).map(([id, answer]) => {
          const question = diagnosticQuestions.find((item) => item.id === id)!;
          return [
            id,
            {
              correct: question.correctAnswer === answer,
              correctAnswer: question.correctAnswer,
              explanation: question.explanation,
            },
          ];
        }),
      ),
    }),
  );
  mocks.getDraft.mockResolvedValue({ ok: true, draft: null });
  mocks.saveDraft.mockImplementation(async (draft) => ({
    ok: true,
    draft: { ...draft, revision: draft.revision + 1 },
  }));
});
vi.mock("sonner", () => ({
  toast: { error: mocks.toastError },
  Toaster: () => null,
}));

const publicQuestions = diagnosticQuestions.map(toPublicQuestion);
const shortQuestions = publicQuestions
  .filter((question) => question.type === "multiple_choice")
  .slice(0, 3);

function smallDraft(): DiagnosticDraft {
  return {
    ...createDiagnosticDraft(shortQuestions, {
      goal: "TEF Canada",
      target: "NCLC 7",
      frenchExperience: "I know some French",
    }),
    stage: "questions",
    index: 0,
    questionOrder: shortQuestions.map((question) => question.id),
    revision: 1,
  };
}

async function resumeAccount(draft: DiagnosticDraft) {
  mocks.getDraft.mockResolvedValue({ ok: true, draft });
  const view = render(
    <AppProvider
      initialState={{
        ...structuredClone(demoState),
        diagnosticAnswers: {},
        diagnosticResult: null,
      }}
    >
      <DiagnosticFlow questions={shortQuestions} />
    </AppProvider>,
  );
  fireEvent.click(
    await screen.findByRole("button", { name: "Continue assessment" }),
  );
  await screen.findByRole("heading", {
    name: shortQuestions[draft.index].prompt,
  });
  return view;
}

async function completeAssessment(user: ReturnType<typeof userEvent.setup>) {
  await user.click(
    await screen.findByRole("button", { name: /Start my assessment/ }),
  );
  for (let index = 0; index < diagnosticQuestions.length; index++) {
    const prompt = screen.getByRole("heading", { level: 2 }).textContent;
    const question = diagnosticQuestions.find((q) => q.prompt === prompt)!;
    if (question.type === "fill_blank") {
      await user.type(screen.getByLabelText("Your answer"), "lirais");
    } else {
      const correct = question.options.find(
        (option) => option.id === question.correctAnswer,
      )!;
      await user.click(screen.getByLabelText(correct.label));
    }
    await user.click(screen.getByRole("button", { name: "Next" }));
    await user.click(
      await screen.findByRole("button", {
        name:
          index === diagnosticQuestions.length - 1
            ? "Continue to writing"
            : "Continue",
      }),
    );
  }
  expect(
    screen.getByRole("button", { name: /Finish assessment/ }),
  ).toBeDisabled();
  fireEvent.change(screen.getByLabelText("Your message in French"), {
    target: { value: writingSampleFixture.text },
  });
  await user.click(screen.getByRole("button", { name: /Finish assessment/ }));
}

afterEach(() => {
  cleanup();
  localStorage.clear();
  Object.values(mocks).forEach((mock) => mock.mockReset());
});

describe("DiagnosticFlow", () => {
  it("ships questions to the browser without answer keys", () => {
    for (const question of publicQuestions)
      expect(question).not.toHaveProperty("correctAnswer");
  });

  it("scores a guest on the server and keeps the result on this device", async () => {
    const user = userEvent.setup();
    Object.defineProperty(window, "scrollTo", {
      value: vi.fn(),
      writable: true,
    });
    const serverResult = scoreDiagnostic(diagnosticQuestions, {});
    mocks.scoreGuest.mockResolvedValue({ ok: true, result: serverResult });
    render(
      <AppProvider>
        <DiagnosticFlow questions={publicQuestions} />
      </AppProvider>,
    );
    await user.click(await screen.findByLabelText("Prepare for TEF Canada"));
    await user.click(screen.getByLabelText("NCLC 7"));
    await user.click(screen.getByLabelText("I know some French"));
    await completeAssessment(user);

    await waitFor(() =>
      expect(mocks.push).toHaveBeenCalledWith("/diagnostic/results"),
    );
    expect(mocks.scoreGuest).toHaveBeenCalledOnce();
    expect((await guestAssessmentRepository.getActive())?.result).toEqual(
      serverResult,
    );
    expect(
      (await guestAssessmentRepository.getActive())?.intake.writingSample,
    ).toEqual(writingSampleFixture);
    expect(mocks.scoreGuest).toHaveBeenCalledWith(
      expect.any(Object),
      writingSampleFixture,
    );
  }, 20_000);

  it("prefills the exam and target saved during registration", async () => {
    render(
      <AppProvider
        initialState={{
          ...demoState,
          planAccess: null,
          diagnosticIntake: null,
          diagnosticAnswers: {},
          diagnosticResult: null,
        }}
      >
        <DiagnosticFlow questions={publicQuestions} />
      </AppProvider>,
    );

    expect(
      await screen.findByLabelText("Prepare for TEF Canada"),
    ).toBeChecked();
    expect(screen.getByLabelText("NCLC 7")).toBeChecked();
    expect(
      screen.getByRole("button", { name: /Start my assessment/ }),
    ).toBeDisabled();
  });

  it("requires the intake before starting and persists it", async () => {
    const user = userEvent.setup();
    Object.defineProperty(window, "scrollTo", {
      value: vi.fn(),
      writable: true,
    });
    render(
      <AppProvider>
        <DiagnosticFlow questions={publicQuestions} />
      </AppProvider>,
    );

    const start = await screen.findByRole("button", {
      name: /Start my assessment/,
    });
    expect(start).toBeDisabled();
    await user.click(screen.getByLabelText("Prepare for TEF Canada"));
    await user.click(screen.getByLabelText("NCLC 7"));
    await user.click(screen.getByLabelText("I know some French"));
    expect(start).toBeEnabled();
    await user.click(start);

    expect(
      screen.getByText(`Question 1 of ${publicQuestions.length}`),
    ).toBeVisible();
    expect(screen.getByText(/^Competency ·/)).toBeVisible();
    expect(screen.getByText(/Don't worry if you're unsure/)).toBeVisible();
    const stored = JSON.parse(
      localStorage.getItem(diagnosticDraftStorageKey) ?? "null",
    );
    expect(stored.intake).toEqual({
      goal: "TEF Canada",
      target: "NCLC 7",
      frenchExperience: "I know some French",
    });
    expect(stored.answers).toEqual({});
  });

  it("preserves an answer while navigating and returns to the intro from question one", async () => {
    const user = userEvent.setup();
    Object.defineProperty(window, "scrollTo", {
      value: vi.fn(),
      writable: true,
    });
    render(
      <AppProvider>
        <DiagnosticFlow questions={publicQuestions} />
      </AppProvider>,
    );
    await user.click(await screen.findByLabelText("I'm not sure yet"));
    await user.click(screen.getByLabelText("NCLC 5"));
    await user.click(screen.getByLabelText("I'm just starting"));
    await user.click(
      screen.getByRole("button", { name: /Start my assessment/ }),
    );
    const firstQuestion = diagnosticQuestions.find((q) =>
      screen.queryByText(q.prompt),
    )!;
    fireEvent.click(screen.getByText(firstQuestion.options![0].label));
    await user.click(screen.getByRole("button", { name: /Next/ }));
    await user.click(await screen.findByRole("button", { name: "Continue" }));
    await user.click(screen.getByRole("button", { name: /Previous/ }));
    expect(
      screen.getByLabelText(firstQuestion.options![0].label),
    ).toBeChecked();
    await user.click(screen.getByRole("button", { name: /Previous/ }));
    expect(
      screen.getByRole("heading", { name: "Check your French level" }),
    ).toBeVisible();
    await waitFor(() =>
      expect(screen.getByLabelText("I'm not sure yet")).toBeChecked(),
    );
  });

  it("preserves a completed assessment when the authenticated session expires", async () => {
    const user = userEvent.setup();
    mocks.submitDiagnostic.mockResolvedValue({
      ok: false,
      reason: "unauthenticated",
      message: "Your session has expired. Sign in again to save your progress.",
    });
    mocks.scoreGuest.mockResolvedValue({
      ok: true,
      result: scoreDiagnostic(diagnosticQuestions, {}),
    });
    render(
      <AppProvider
        initialState={{
          ...structuredClone(demoState),
          diagnosticAnswers: {},
          diagnosticResult: null,
        }}
      >
        <DiagnosticFlow questions={publicQuestions} />
      </AppProvider>,
    );

    await completeAssessment(user);

    await waitFor(() =>
      expect(mocks.push).toHaveBeenCalledWith(
        "/login?next=%2Fdiagnostic%2Fresults",
      ),
    );
    const guest = await guestAssessmentRepository.getActive();
    expect(guest?.answers).toHaveProperty(
      diagnosticQuestions[19].id,
      diagnosticQuestions[19].correctAnswer,
    );
    const anonymous = JSON.parse(
      localStorage.getItem(productConfig.anonymousStateStorageKey) ?? "null",
    );
    expect(anonymous.user).toBeNull();
    expect(anonymous.planAccess).toBeNull();
    expect(mocks.submitDiagnostic).toHaveBeenCalledOnce();
  }, 20_000);

  it("uses the authoritative RPC result and routes to results", async () => {
    const user = userEvent.setup();
    const authoritative = scoreDiagnostic(
      diagnosticQuestions,
      Object.fromEntries(
        diagnosticQuestions.map((question) => [
          question.id,
          question.correctAnswer,
        ]),
      ),
    );
    mocks.submitDiagnostic.mockResolvedValue({
      ok: true,
      data: {
        id: "40000000-0000-4000-8000-000000000004",
        result: authoritative,
      },
    });
    render(
      <AppProvider
        initialState={{
          ...structuredClone(demoState),
          diagnosticAnswers: {},
          diagnosticResult: null,
        }}
      >
        <DiagnosticFlow questions={publicQuestions} />
      </AppProvider>,
    );

    await completeAssessment(user);

    await waitFor(() =>
      expect(mocks.push).toHaveBeenCalledWith(
        "/diagnostic/results?assessment=40000000-0000-4000-8000-000000000004",
      ),
    );
    expect(mocks.submitDiagnostic).toHaveBeenCalledWith(
      expect.objectContaining({
        submissionId: expect.any(String),
        intake: expect.objectContaining({ feedbackMode: "guided" }),
      }),
    );
  }, 20_000);

  it("shows the diagnostic reference and keeps its submission id for retries", async () => {
    const user = userEvent.setup();
    mocks.submitDiagnostic.mockResolvedValue({
      ok: false,
      reason: "unavailable",
      message: "We could not save this update. Please try again.",
      reference: "assessment-reference",
    });
    render(
      <AppProvider
        initialState={{
          ...structuredClone(demoState),
          diagnosticAnswers: {},
          diagnosticResult: null,
        }}
      >
        <DiagnosticFlow questions={publicQuestions} />
      </AppProvider>,
    );

    await completeAssessment(user);
    await waitFor(() =>
      expect(mocks.toastError).toHaveBeenCalledWith(
        expect.stringContaining("Reference: assessment-reference"),
      ),
    );
    const firstSubmissionId = mocks.submitDiagnostic.mock.calls[0][0]
      .submissionId as string;
    await user.click(screen.getByRole("button", { name: /Finish assessment/ }));
    await waitFor(() =>
      expect(mocks.submitDiagnostic).toHaveBeenCalledTimes(2),
    );
    expect(mocks.submitDiagnostic.mock.calls[1][0].submissionId).toBe(
      firstSubmissionId,
    );
  }, 20_000);

  it("saves the first submitted answer before revealing feedback and keeps Next on the current question", async () => {
    const user = userEvent.setup();
    await resumeAccount(smallDraft());
    const [first, second] = screen.getAllByRole("radio");
    await user.click(first);
    await waitFor(() => expect(mocks.saveDraft).toHaveBeenCalledTimes(1));
    await screen.findByText("Progress saved");
    let resolveSave!: (result: unknown) => void;
    mocks.saveDraft.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveSave = resolve;
        }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    await waitFor(() => expect(mocks.saveDraft).toHaveBeenCalledTimes(2));
    const submitted = mocks.saveDraft.mock.calls[1][0] as DiagnosticDraft;
    expect(submitted.checkedAnswers?.[shortQuestions[0].id]).toBe(
      (first as HTMLInputElement).value,
    );
    expect(mocks.checkAnswers).not.toHaveBeenCalled();
    expect(first).toBeDisabled();
    expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();
    fireEvent.click(second);
    expect(first).toBeChecked();
    await act(async () =>
      resolveSave({
        ok: true,
        draft: { ...submitted, revision: submitted.revision + 1 },
      }),
    );
    expect(await screen.findByRole("status")).toBeVisible();
    expect(screen.getByText("Question 1 of 3")).toBeVisible();
    expect(mocks.checkAnswers).toHaveBeenCalledWith(submitted.checkedAnswers);
    expect(localStorage.getItem(diagnosticDraftStorageKey)).toBeNull();
    await user.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.getByText("Question 2 of 3")).toBeVisible();
    expect(
      screen.getByRole("heading", { name: shortQuestions[1].prompt }),
    ).toHaveFocus();
  });

  it("does not reveal a correction when saving fails and retries the same locked first answer", async () => {
    const user = userEvent.setup();
    let failing = true;
    mocks.saveDraft.mockImplementation(async (draft: DiagnosticDraft) =>
      Object.keys(draft.checkedAnswers ?? {}).length && failing
        ? { ok: false, reason: "unavailable", message: "Unavailable" }
        : { ok: true, draft: { ...draft, revision: draft.revision + 1 } },
    );
    await resumeAccount(smallDraft());
    const [first, second] = screen.getAllByRole("radio");
    await user.click(first);
    await user.click(screen.getByRole("button", { name: "Next" }));
    const retry = await screen.findByRole("button", { name: "Retry checking" });
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(mocks.checkAnswers).not.toHaveBeenCalled();
    expect(first).toBeDisabled();
    fireEvent.click(second);
    expect(first).toBeChecked();
    failing = false;
    await user.click(retry);
    expect(await screen.findByRole("status")).toBeVisible();
    expect(mocks.checkAnswers).toHaveBeenCalledWith({
      [shortQuestions[0].id]: (first as HTMLInputElement).value,
    });
    expect(screen.getByText("Question 1 of 3")).toBeVisible();
  });

  it("restores checked answers without inflating the tally or skipping them on a double-click", async () => {
    const user = userEvent.setup();
    const answers = Object.fromEntries(
      shortQuestions
        .slice(0, 2)
        .map((question) => [
          question.id,
          diagnosticQuestions.find((source) => source.id === question.id)!
            .correctAnswer,
        ]),
    );
    const draft = {
      ...smallDraft(),
      answers,
      checkedAnswers: answers,
      intake: { ...smallDraft().intake, feedbackMode: "guided" as const },
    };
    await resumeAccount(draft);
    expect(await screen.findByText("2 checked · 2 correct")).toBeVisible();
    expect(mocks.checkAnswers).toHaveBeenCalledTimes(1);
    expect(mocks.checkAnswers).toHaveBeenCalledWith(answers);
    for (const option of screen.getAllByRole("radio"))
      expect(option).toBeDisabled();
    await user.dblClick(screen.getByRole("button", { name: "Continue" }));
    expect(screen.getByText("Question 2 of 3")).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Previous" }));
    expect(screen.getByText("Question 1 of 3")).toBeVisible();
    expect(screen.getByText("2 checked · 2 correct")).toBeVisible();
    expect(mocks.checkAnswers).toHaveBeenCalledTimes(1);
  });
});
