import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AppProvider } from "@/components/providers/app-provider";
import { productConfig } from "@/config/product";
import { diagnosticQuestions } from "@/data/questions";
import { scoreDiagnostic } from "@/lib/domain/diagnostic";
import { guestAssessmentRepository } from "@/repositories/guest-assessment";
import { demoState } from "@/test/fixtures";
import { DiagnosticFlow } from "./diagnostic-flow";

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  refresh: vi.fn(),
  getSnapshot: vi.fn(),
  submitDiagnostic: vi.fn(),
  updateProfile: vi.fn(),
  toastError: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push, refresh: mocks.refresh }),
}));
vi.mock("@/app/actions/learner", () => ({
  getLearnerSnapshotAction: mocks.getSnapshot,
  submitDiagnosticAction: mocks.submitDiagnostic,
  updateProfileAction: mocks.updateProfile,
}));
vi.mock("sonner", () => ({
  toast: { error: mocks.toastError },
  Toaster: () => null,
}));

async function completeAssessment(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: /Start my assessment/ }));
  for (const [index, question] of diagnosticQuestions.entries()) {
    if (question.type === "fill_blank") {
      await user.type(screen.getByLabelText("Your answer"), "lirais");
    } else {
      const correct = question.options.find(
        (option) => option.id === question.correctAnswer,
      )!;
      await user.click(screen.getByLabelText(correct.label));
    }
    await user.click(
      screen.getByRole("button", {
        name:
          index === diagnosticQuestions.length - 1
            ? /Finish assessment/
            : /Next/,
      }),
    );
  }
}

afterEach(() => {
  cleanup();
  localStorage.clear();
  Object.values(mocks).forEach((mock) => mock.mockReset());
});

describe("DiagnosticFlow", () => {
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
        <DiagnosticFlow />
      </AppProvider>,
    );

    expect(screen.getByLabelText("Prepare for TEF Canada")).toBeChecked();
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
        <DiagnosticFlow />
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

    expect(screen.getByText("Question 1 of 15")).toBeVisible();
    expect(screen.getByText("Competency · Grammar")).toBeVisible();
    expect(
      screen.getByText(
        "Don't worry if you're unsure. Choose the answer that seems best.",
      ),
    ).toBeVisible();
    const stored = JSON.parse(
      localStorage.getItem(productConfig.anonymousStateStorageKey) ?? "null",
    );
    expect(stored.diagnosticIntake).toEqual({
      goal: "TEF Canada",
      target: "NCLC 7",
      frenchExperience: "I know some French",
    });
    expect(stored.diagnosticAnswers).toEqual({});
  });

  it("preserves an answer while navigating and returns to the intro from question one", async () => {
    const user = userEvent.setup();
    Object.defineProperty(window, "scrollTo", {
      value: vi.fn(),
      writable: true,
    });
    render(
      <AppProvider>
        <DiagnosticFlow />
      </AppProvider>,
    );
    await user.click(await screen.findByLabelText("I'm not sure yet"));
    await user.click(screen.getByLabelText("NCLC 5"));
    await user.click(screen.getByLabelText("I'm just starting"));
    await user.click(
      screen.getByRole("button", { name: /Start my assessment/ }),
    );
    fireEvent.click(screen.getByText("depuis"));
    await user.click(screen.getByRole("button", { name: /Next/ }));
    await user.click(screen.getByRole("button", { name: /Previous/ }));
    expect(screen.getByLabelText("depuis")).toBeChecked();
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
    render(
      <AppProvider
        initialState={{
          ...structuredClone(demoState),
          diagnosticAnswers: {},
          diagnosticResult: null,
        }}
      >
        <DiagnosticFlow />
      </AppProvider>,
    );

    await completeAssessment(user);

    await waitFor(() =>
      expect(mocks.push).toHaveBeenCalledWith(
        "/login?next=%2Fdiagnostic%2Fresults",
      ),
    );
    const guest = await guestAssessmentRepository.getActive();
    expect(guest?.answers).toHaveProperty("d15", "c");
    const anonymous = JSON.parse(
      localStorage.getItem(productConfig.anonymousStateStorageKey) ?? "null",
    );
    expect(anonymous.user).toBeNull();
    expect(anonymous.planAccess).toBeNull();
    expect(mocks.submitDiagnostic).toHaveBeenCalledOnce();
  }, 10_000);

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
        <DiagnosticFlow />
      </AppProvider>,
    );

    await completeAssessment(user);

    await waitFor(() =>
      expect(mocks.push).toHaveBeenCalledWith(
        "/diagnostic/results?assessment=40000000-0000-4000-8000-000000000004",
      ),
    );
    expect(mocks.submitDiagnostic).toHaveBeenCalledWith(
      expect.objectContaining({ submissionId: expect.any(String) }),
    );
  }, 10_000);

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
        <DiagnosticFlow />
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
  }, 10_000);
});
