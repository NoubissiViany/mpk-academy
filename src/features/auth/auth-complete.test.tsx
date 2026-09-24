import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppProvider } from "@/components/providers/app-provider";
import { diagnosticQuestions } from "@/data/questions";
import { scoreDiagnostic } from "@/lib/domain/diagnostic";
import { guestAssessmentRepository } from "@/repositories/guest-assessment";
import { demoState } from "@/test/fixtures";
import { AuthComplete } from "./auth-complete";

const mocks = vi.hoisted(() => ({
  replace: vi.fn(),
  refresh: vi.fn(),
  claimGuest: vi.fn(),
  getSnapshot: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mocks.replace, refresh: mocks.refresh }),
}));
vi.mock("@/app/actions/learner", () => ({
  claimGuestAssessmentAction: mocks.claimGuest,
  getLearnerSnapshotAction: mocks.getSnapshot,
  updateProfileAction: vi.fn(),
}));

describe("confirmed registration handoff", () => {
  beforeEach(() => {
    localStorage.clear();
    Object.values(mocks).forEach((mock) => mock.mockReset());
    mocks.getSnapshot.mockResolvedValue({
      ok: true,
      snapshot: {
        ...demoState,
        diagnosticResult: null,
        planAccess: null,
      },
    });
  });
  afterEach(cleanup);

  it("starts the assessment after a direct registration", async () => {
    render(
      <AppProvider
        initialState={{
          ...demoState,
          diagnosticResult: null,
          planAccess: null,
        }}
      >
        <AuthComplete />
      </AppProvider>,
    );
    await waitFor(() =>
      expect(mocks.replace).toHaveBeenCalledWith("/diagnostic"),
    );
  });

  it("keeps a server-backed plan intent but still starts the assessment", async () => {
    mocks.getSnapshot.mockResolvedValue({
      ok: true,
      snapshot: {
        ...demoState,
        checkoutIntentPlanId: "intensive",
        diagnosticResult: null,
        planAccess: null,
      },
    });
    render(
      <AppProvider>
        <AuthComplete />
      </AppProvider>,
    );

    await waitFor(() =>
      expect(mocks.replace).toHaveBeenCalledWith("/diagnostic"),
    );
  });

  it("keeps the existing guest assessment handoff to checkout", async () => {
    const answers = Object.fromEntries(
      diagnosticQuestions.map((question) => [
        question.id,
        question.correctAnswer,
      ]),
    );
    const result = scoreDiagnostic(diagnosticQuestions, answers);
    await guestAssessmentRepository.create({
      intake: {
        goal: "TEF Canada",
        target: "NCLC 7",
        frenchExperience: "I know some French",
      },
      answers,
      result,
      activity: {
        id: "guest-activity",
        label: "Assessment completed",
        detail: `${result.level} estimated level`,
        timestamp: "2026-09-22T12:00:00.000Z",
      },
      recommendedPlanId: "complete",
    });
    mocks.claimGuest.mockResolvedValue({
      ok: true,
      data: { id: "assessment-id" },
      snapshot: { ...demoState, planAccess: null },
    });

    render(
      <AppProvider initialState={{ ...demoState, planAccess: null }}>
        <AuthComplete />
      </AppProvider>,
    );
    await waitFor(() =>
      expect(mocks.replace).toHaveBeenCalledWith("/checkout?plan=complete"),
    );
  });

  it("uses an explicit selected plan instead of the guest recommendation", async () => {
    const answers = Object.fromEntries(
      diagnosticQuestions.map((question) => [
        question.id,
        question.correctAnswer,
      ]),
    );
    const result = scoreDiagnostic(diagnosticQuestions, answers);
    await guestAssessmentRepository.create({
      intake: {
        goal: "TEF Canada",
        target: "NCLC 7",
        frenchExperience: "I know some French",
      },
      answers,
      result,
      activity: {
        id: "guest-selected-plan",
        label: "Assessment completed",
        detail: `${result.level} estimated level`,
        timestamp: "2026-09-22T12:00:00.000Z",
      },
      recommendedPlanId: "complete",
    });
    mocks.claimGuest.mockResolvedValue({
      ok: true,
      data: { id: "assessment-id" },
      snapshot: {
        ...demoState,
        checkoutIntentPlanId: "essential",
        planAccess: null,
      },
    });

    render(
      <AppProvider>
        <AuthComplete />
      </AppProvider>,
    );

    await waitFor(() =>
      expect(mocks.replace).toHaveBeenCalledWith("/checkout?plan=essential"),
    );
  });

  it("shows a support reference instead of navigating when profile loading fails", async () => {
    mocks.getSnapshot.mockResolvedValue({
      ok: false,
      reason: "profile_unavailable",
      message:
        "Your account is signed in, but its learning profile could not be loaded.",
      reference: "confirmation-profile-reference",
    });

    render(
      <AppProvider initialState={{ ...demoState, planAccess: null }}>
        <AuthComplete />
      </AppProvider>,
    );

    expect(
      await screen.findByText(/Reference: confirmation-profile-reference/),
    ).toBeVisible();
    expect(mocks.replace).not.toHaveBeenCalled();
  });
});
