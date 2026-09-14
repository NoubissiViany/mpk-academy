import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppProvider } from "@/components/providers/app-provider";
import { productConfig } from "@/config/product";
import { defaultState } from "@/data/mock-state";
import { diagnosticQuestions } from "@/data/questions";
import { scoreDiagnostic } from "@/lib/domain/diagnostic";
import { saveState } from "@/lib/persistence";
import { guestAssessmentRepository } from "@/repositories/guest-assessment";
import { mockAuthRepository } from "@/repositories/mock";
import { AuthForm } from "./auth-form";

const { push } = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

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
  await user.clear(await screen.findByLabelText("Email"));
  await user.type(screen.getByLabelText("Email"), "learner@example.com");
  await user.type(screen.getByLabelText("Password"), "password123");
  await user.click(
    screen.getByRole("button", { name: "Create my learning plan" }),
  );
}

describe("guest assessment registration handoff", () => {
  beforeEach(() => {
    localStorage.clear();
    push.mockClear();
    saveState({
      ...structuredClone(defaultState),
      user: null,
      diagnosticIntake: intake,
      diagnosticAnswers: answers,
      diagnosticResult: result,
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("attaches the full assessment, clears the guest record, and continues checkout", async () => {
    await createGuestAssessment();
    render(
      <AppProvider>
        <AuthForm mode="register" />
      </AppProvider>,
    );

    await submitRegistration();

    await waitFor(() =>
      expect(push).toHaveBeenCalledWith("/checkout?plan=complete"),
    );
    const persisted = JSON.parse(
      localStorage.getItem(productConfig.storageKey) ?? "null",
    );
    expect(persisted.user.email).toBe("learner@example.com");
    expect(persisted.diagnosticIntake).toEqual(intake);
    expect(persisted.diagnosticAnswers).toEqual(answers);
    expect(persisted.diagnosticResult).toEqual(result);
    expect(persisted.progress.diagnosticScore).toBe(result.score);
    expect(persisted.progress.competencyScores).toMatchObject(
      result.competencyScores,
    );
    expect(persisted.activities[0].label).toBe("Assessment completed");
    expect(
      localStorage.getItem(productConfig.guestAssessmentStorageKey),
    ).toBeNull();
  });

  it("retains the guest assessment when registration fails", async () => {
    const session = await createGuestAssessment();
    vi.spyOn(mockAuthRepository, "register").mockRejectedValueOnce(
      new Error("Registration failed"),
    );
    render(
      <AppProvider>
        <AuthForm mode="register" planId="complete" />
      </AppProvider>,
    );

    await submitRegistration();

    await waitFor(() =>
      expect(
        screen.getByText(
          "We could not create your account. Your assessment is still saved.",
        ),
      ).toBeVisible(),
    );
    expect(push).not.toHaveBeenCalled();
    expect(await guestAssessmentRepository.getActive()).toEqual(session);
  });
});
