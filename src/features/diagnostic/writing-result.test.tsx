import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppProvider } from "@/components/providers/app-provider";
import { aiFeedbackNoticeVersion } from "@/config/privacy";
import { demoState } from "@/test/fixtures";
import { writingSampleFixture } from "@/test/diagnostic-writing";
import { DiagnosticWritingResult } from "./writing-result";

const mocks = vi.hoisted(() => ({
  load: vi.fn(),
  request: vi.fn(),
  poll: vi.fn(),
  consent: vi.fn(),
}));
vi.mock("@/app/actions/diagnostic-writing", () => ({
  getDiagnosticWritingAction: mocks.load,
  requestDiagnosticWritingFeedbackAction: mocks.request,
}));
vi.mock("@/app/actions/writing", () => ({
  getWritingStatusAction: mocks.poll,
  setAiFeedbackConsentAction: mocks.consent,
  flagWritingFixAction: vi.fn(),
}));
const saved = {
  assessmentId: "assessment-id",
  sample: writingSampleFixture,
  configured: true,
  submission: null,
};
const submission = {
  id: "submission-id",
  taskId: "mpk-diagnostic-writing-v1",
  status: "failed",
  feedback: null,
  flaggedFixes: [],
  body: writingSampleFixture.text,
};
const state = {
  ...demoState,
  diagnosticIntake: {
    ...demoState.diagnosticIntake!,
    writingSample: writingSampleFixture,
  },
};

describe("separate diagnostic writing result", () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mock) => mock.mockReset());
    mocks.load.mockResolvedValue({ ok: true, data: saved });
    mocks.poll.mockResolvedValue({
      ok: true,
      status: "queued",
      feedback: null,
      ahead: 2,
      capReached: true,
    });
    mocks.consent.mockResolvedValue({ ok: true });
  });
  afterEach(cleanup);
  it("asks guests to sign in and never queues their writing", () => {
    render(
      <AppProvider initialState={{ ...state, user: null }}>
        <DiagnosticWritingResult />
      </AppProvider>,
    );
    expect(
      screen.getByRole("link", { name: "Sign in for writing feedback" }),
    ).toHaveAttribute("href", "/login?next=%2Fdiagnostic%2Fresults");
    expect(mocks.load).not.toHaveBeenCalled();
    expect(mocks.request).not.toHaveBeenCalled();
  });
  it("requires distinct AI consent before offering the review", async () => {
    render(
      <AppProvider
        initialState={{
          ...state,
          user: { ...state.user!, aiFeedbackConsent: undefined },
        }}
      >
        <DiagnosticWritingResult />
      </AppProvider>,
    );
    expect(await screen.findByRole("checkbox")).not.toBeChecked();
    expect(
      screen.queryByRole("button", { name: "Get my writing feedback" }),
    ).not.toBeInTheDocument();
    expect(mocks.request).not.toHaveBeenCalled();
  });
  it("shows the budget queue and retries a failed sample without resubmitting its text", async () => {
    const user = userEvent.setup();
    mocks.load.mockResolvedValue({ ok: true, data: { ...saved, submission } });
    mocks.request.mockResolvedValue({
      ok: true,
      submission: { ...submission, status: "queued" },
    });
    render(
      <AppProvider
        initialState={{
          ...state,
          user: {
            ...state.user!,
            aiFeedbackConsent: {
              version: aiFeedbackNoticeVersion,
              at: new Date().toISOString(),
            },
          },
        }}
      >
        <DiagnosticWritingResult />
      </AppProvider>,
    );
    await user.click(
      await screen.findByRole("button", { name: "Retry writing feedback" }),
    );
    expect(mocks.request).toHaveBeenCalledWith("assessment-id", true);
    expect(await screen.findByText(/tomorrow morning/i)).toBeVisible();
    expect(screen.getByText(/does not change your quiz score/)).toBeVisible();
  });
});
