import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { AppProvider } from "@/components/providers/app-provider";
import { demoState } from "@/test/fixtures";
import { diagnosticQuestions } from "@/data/questions";
import { scoreDiagnostic } from "@/lib/domain/diagnostic";
import { loadState, saveState } from "@/lib/persistence";
import { DashboardView } from "./dashboard-view";

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe("exam-centred dashboard", () => {
  it("shows the active exam, NCLC target, readiness, and four skills", async () => {
    saveState(demoState);
    render(
      <AppProvider>
        <DashboardView />
      </AppProvider>,
    );
    expect(await screen.findByText("MY EXAM")).toBeVisible();
    expect(screen.getByText("Target: NCLC 7")).toBeVisible();
    expect(screen.getByText("YOUR 4 EXAM SKILLS")).toBeVisible();
    expect(screen.getByRole("heading", { name: "Reading" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Listening" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Writing" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Speaking" })).toBeVisible();
  });

  it("requires an exam choice when the learner is unsure", async () => {
    saveState({
      ...demoState,
      user: demoState.user
        ? {
            ...demoState.user,
            goal: { ...demoState.user.goal, exam: "Not sure yet" },
          }
        : null,
    });
    render(
      <AppProvider>
        <DashboardView />
      </AppProvider>,
    );
    expect(
      await screen.findByRole("heading", {
        name: /Which Canadian French exam/,
      }),
    ).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Prepare for TEF" }),
    ).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Prepare for TCF" }),
    ).toBeVisible();
  });

  it("shows the assessment handoff once after checkout", async () => {
    const result = scoreDiagnostic(diagnosticQuestions, {});
    saveState({
      ...demoState,
      diagnosticResult: result,
      postCheckoutWelcomePending: true,
    });
    const first = render(
      <AppProvider>
        <DashboardView />
      </AppProvider>,
    );
    expect(
      await screen.findByRole("heading", {
        name: "Welcome to MPK Academy, Alex",
      }),
    ).toBeVisible();
    expect(screen.getAllByText(`${result.score}%`).length).toBeGreaterThan(0);
    expect(screen.getAllByText("RECOMMENDED NEXT")).toHaveLength(1);
    expect(
      screen.getByRole("heading", { name: "Start with grammar" }),
    ).toBeVisible();
    expect(
      screen.getByRole("link", { name: "Start recommended activity" }),
    ).toBeVisible();
    await waitFor(() =>
      expect(loadState().postCheckoutWelcomePending).toBe(false),
    );

    first.unmount();
    render(
      <AppProvider>
        <DashboardView />
      </AppProvider>,
    );
    expect(
      await screen.findByRole("heading", { name: "Welcome back, Alex" }),
    ).toBeVisible();
    expect(
      screen.queryByRole("heading", {
        name: "Welcome to MPK Academy, Alex",
      }),
    ).not.toBeInTheDocument();
  });
});
