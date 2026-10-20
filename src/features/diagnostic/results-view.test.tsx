import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppProvider } from "@/components/providers/app-provider";
import { defaultState } from "@/data/mock-state";
import { diagnosticQuestions } from "@/data/questions";
import { scoreDiagnostic } from "@/lib/domain/diagnostic";
import { saveState } from "@/lib/persistence";
import { demoState } from "@/test/fixtures";
import type { AppState } from "@/types/domain";
import { ResultsView } from "./results-view";

afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.unstubAllEnvs();
});

describe("ResultsView", () => {
  beforeEach(() => vi.stubEnv("NEXT_PUBLIC_BETA_MODE", "false"));

  it("renders dynamic results, intake context, and the visitor handoff", async () => {
    const answers = Object.fromEntries(
      diagnosticQuestions
        .filter(
          (question) =>
            question.diagnosticSkill !== "listening" && question.id !== "d15",
        )
        .map((question) => [question.id, question.correctAnswer]),
    );
    saveState({
      ...defaultState,
      user: null,
      diagnosticIntake: {
        goal: "TCF Canada",
        target: "NCLC 9+",
        frenchExperience: "I can communicate in French",
      },
      diagnosticResult: scoreDiagnostic(diagnosticQuestions, answers),
    });

    render(
      <AppProvider>
        <ResultsView />
      </AppProvider>,
    );

    expect(
      await screen.findByRole("heading", { name: "Your French Assessment" }),
    ).toBeVisible();
    expect(
      screen.getByRole("heading", {
        name: "Compared with your NCLC 9+ target",
      }),
    ).toBeVisible();
    expect(
      screen.getByText(/Estimated level C1 \(provisional\) · Advanced French/),
    ).toBeVisible();
    expect(screen.getByText("Limited evidence so far")).toBeVisible();
    expect(screen.getAllByText(/Target line at 85%/).length).toBeGreaterThan(0);
    expect(
      screen.getByText(/preparing for TCF Canada and aiming for NCLC 9\+/),
    ).toBeVisible();
    expect(screen.getByText("Your priority")).toBeVisible();
    expect(
      screen.getAllByText(/Listening — Not assessed yet/).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getByRole("link", { name: "Continue with Complete" }),
    ).toHaveAttribute("href", "/register?plan=complete");
    expect(screen.getByText(/For a NCLC 9\+ goal/)).toBeVisible();
  });

  it.each([
    ["NCLC 5", "Essential", "essential"],
    ["NCLC 7", "Complete", "complete"],
    ["I'm not sure", "Complete", "complete"],
    ["NCLC 9+", "Complete", "complete"],
  ] as const)(
    "continues target %s through registration with %s",
    async (target, planName, planId) => {
      saveState({
        ...defaultState,
        user: null,
        diagnosticIntake: {
          goal: "TEF Canada",
          target,
          frenchExperience: "I know some French",
        },
        diagnosticResult: scoreDiagnostic(diagnosticQuestions, {}),
      });

      render(
        <AppProvider>
          <ResultsView />
        </AppProvider>,
      );

      expect(
        await screen.findByRole("link", {
          name: `Continue with ${planName}`,
        }),
      ).toHaveAttribute("href", `/register?plan=${planId}`);
    },
  );

  it("hides plan recommendations from paid users", async () => {
    const initialState = {
      ...demoState,
      planAccess: { ...demoState.planAccess!, planId: "essential" },
    } satisfies AppState;

    render(
      <AppProvider initialState={initialState}>
        <ResultsView />
      </AppProvider>,
    );

    expect(
      await screen.findByRole("heading", { name: "Your French Assessment" }),
    ).toBeVisible();
    expect(
      screen.getByRole("link", { name: "Go to dashboard" }),
    ).toHaveAttribute("href", "/dashboard");
    expect(
      screen.queryByLabelText(/Recommended plan:/),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Recommended for you")).not.toBeInTheDocument();
    expect(screen.queryByText("Your plan")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Essential" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("~$119")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Compare all plans" }),
    ).not.toBeInTheDocument();
  });

  it("keeps the recommendation for an authenticated user without paid access", async () => {
    render(
      <AppProvider initialState={{ ...demoState, planAccess: null }}>
        <ResultsView />
      </AppProvider>,
    );

    expect(
      await screen.findByRole("link", { name: "Continue with Complete" }),
    ).toHaveAttribute("href", "/checkout?plan=complete");
    expect(screen.getByText("Recommended for you")).toBeVisible();
  });

  it("keeps an explicit plan selected while showing the assessment recommendation", async () => {
    render(
      <AppProvider
        initialState={{
          ...demoState,
          checkoutIntentPlanId: "essential",
          planAccess: null,
        }}
      >
        <ResultsView />
      </AppProvider>,
    );

    expect(
      await screen.findByRole("link", { name: "Continue with Essential" }),
    ).toHaveAttribute("href", "/checkout?plan=essential");
    expect(screen.getByText("Your selected plan")).toBeVisible();
    expect(screen.getByText(/we recommend Complete/i)).toBeVisible();
  });

  it("falls back to the recommendation for an invalid stored plan", async () => {
    const invalidState = {
      ...demoState,
      checkoutIntentPlanId: "unsupported",
      planAccess: null,
    } as unknown as AppState;
    render(
      <AppProvider initialState={invalidState}>
        <ResultsView />
      </AppProvider>,
    );

    expect(
      await screen.findByRole("link", { name: "Continue with Complete" }),
    ).toHaveAttribute("href", "/checkout?plan=complete");
  });

  it("offers a path back when no result exists", async () => {
    render(
      <AppProvider>
        <ResultsView />
      </AppProvider>,
    );
    expect(
      await screen.findByRole("heading", { name: "No assessment result yet" }),
    ).toBeVisible();
    expect(
      screen.getByRole("link", { name: "Start my assessment" }),
    ).toHaveAttribute("href", "/diagnostic");
  });
});

describe("ResultsView during the closed beta", () => {
  beforeEach(() => vi.stubEnv("NEXT_PUBLIC_BETA_MODE", "true"));

  it("invites a visitor to create a beta account instead of buying a plan", async () => {
    saveState({
      ...defaultState,
      user: null,
      diagnosticIntake: {
        goal: "TEF Canada",
        target: "NCLC 7",
        frenchExperience: "I know some French",
      },
      diagnosticResult: scoreDiagnostic(diagnosticQuestions, {}),
    });
    render(
      <AppProvider>
        <ResultsView />
      </AppProvider>,
    );

    expect(
      await screen.findByRole("link", { name: /Create my beta account/ }),
    ).toHaveAttribute("href", "/register");
    expect(screen.queryByText(/\$\d/)).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /Compare all plans/ }),
    ).toBeNull();
  });

  it("sends a signed-in learner without access to beta activation", async () => {
    render(
      <AppProvider initialState={{ ...demoState, planAccess: null }}>
        <ResultsView />
      </AppProvider>,
    );
    expect(
      await screen.findByRole("link", { name: /Activate beta access/ }),
    ).toHaveAttribute("href", "/beta");
  });
});
