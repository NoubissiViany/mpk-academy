import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppProvider } from "@/components/providers/app-provider";
import { defaultState } from "@/data/mock-state";
import { diagnosticQuestions } from "@/data/questions";
import { scoreDiagnostic } from "@/lib/domain/diagnostic";
import { saveState } from "@/lib/persistence";
import { guestAssessmentRepository } from "@/repositories/guest-assessment";
import { demoState } from "@/test/fixtures";
import { AuthForm } from "./auth-form";

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  refresh: vi.fn(),
  signUp: vi.fn(),
  signIn: vi.fn(),
  claimGuest: vi.fn(),
  getSnapshot: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push, refresh: mocks.refresh }),
}));
vi.mock("@/app/actions/auth", () => ({
  signUpAction: mocks.signUp,
  signInAction: mocks.signIn,
}));
vi.mock("@/app/actions/learner", () => ({
  claimGuestAssessmentAction: mocks.claimGuest,
  getLearnerSnapshotAction: mocks.getSnapshot,
  updateProfileAction: vi.fn(),
}));

const answers = Object.fromEntries(
  diagnosticQuestions.map((question) => [question.id, question.correctAnswer]),
);
const result = scoreDiagnostic(diagnosticQuestions, answers);
const intake = {
  goal: "TEF Canada",
  target: "NCLC 7",
  frenchExperience: "I know some French",
} as const;

async function createGuestAssessment() {
  return guestAssessmentRepository.create({
    intake,
    answers,
    result,
    activity: {
      id: "guest-assessment-activity",
      label: "Assessment completed",
      detail: `${result.level} estimated level`,
      timestamp: "2026-09-14T12:00:00.000Z",
    },
    recommendedPlanId: "complete",
  });
}

async function submitRegistration() {
  const user = userEvent.setup();
  await user.type(await screen.findByLabelText("First name"), "Amina");
  await user.type(screen.getByLabelText("Last name"), "Diallo");
  await user.type(screen.getByLabelText("Email"), "learner@example.com");
  await user.type(screen.getByLabelText("Password"), "password123");
  await user.click(screen.getByRole("button", { name: "Create my account" }));
}

describe("Supabase authentication handoff", () => {
  beforeEach(() => {
    localStorage.clear();
    Object.values(mocks).forEach((mock) => mock.mockReset());
    mocks.signUp.mockResolvedValue({ ok: true, confirmationRequired: true });
    mocks.signIn.mockResolvedValue({ ok: true });
    mocks.getSnapshot.mockResolvedValue(demoState);
    mocks.claimGuest.mockResolvedValue({
      ok: true,
      data: { id: "assessment-id" },
      snapshot: demoState,
    });
    saveState({
      ...structuredClone(defaultState),
      diagnosticIntake: intake,
      diagnosticAnswers: answers,
      diagnosticResult: result,
    });
  });

  afterEach(cleanup);

  it("sends a new learner to email confirmation", async () => {
    render(
      <AppProvider>
        <AuthForm mode="register" />
      </AppProvider>,
    );
    await submitRegistration();
    await waitFor(() =>
      expect(mocks.push).toHaveBeenCalledWith(
        "/auth/check-email?email=learner%40example.com",
      ),
    );
    expect(mocks.signUp).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "learner@example.com",
        exam: "TEF Canada",
        target: "NCLC 7",
      }),
    );
  });

  it("keeps a guest assessment until the email is confirmed", async () => {
    const guest = await createGuestAssessment();
    render(
      <AppProvider>
        <AuthForm mode="register" />
      </AppProvider>,
    );
    await submitRegistration();
    await waitFor(() => expect(mocks.push).toHaveBeenCalled());
    expect(mocks.claimGuest).not.toHaveBeenCalled();
    expect(await guestAssessmentRepository.getActive()).toEqual(guest);
  });

  it("loads the server snapshot after sign-in", async () => {
    render(
      <AppProvider>
        <AuthForm mode="login" nextPath="/learn" />
      </AppProvider>,
    );
    const user = userEvent.setup();
    await user.type(
      await screen.findByLabelText("Email"),
      "learner@example.com",
    );
    await user.type(screen.getByLabelText("Password"), "password123");
    await user.click(screen.getByRole("button", { name: "Sign in" }));
    await waitFor(() => expect(mocks.push).toHaveBeenCalledWith("/learn"));
    expect(mocks.signIn).toHaveBeenCalledWith({
      email: "learner@example.com",
      password: "password123",
    });
  });

  it("retains the guest assessment when registration fails", async () => {
    const guest = await createGuestAssessment();
    mocks.signUp.mockResolvedValue({
      ok: false,
      message: "Registration failed",
    });
    render(
      <AppProvider>
        <AuthForm mode="register" />
      </AppProvider>,
    );
    await submitRegistration();
    expect(await screen.findByText("Registration failed")).toBeVisible();
    expect(await guestAssessmentRepository.getActive()).toEqual(guest);
  });
});
