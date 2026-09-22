import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { AppProvider } from "@/components/providers/app-provider";
import { demoState } from "@/test/fixtures";
import type { AppState } from "@/types/domain";
import { DashboardView } from "./dashboard-view";

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe("exam-centred dashboard", () => {
  it("shows only assessment access for a free account", async () => {
    const initialState = {
      ...demoState,
      user: { ...demoState.user!, tier: "free_student" },
      planAccess: null,
    } satisfies AppState;
    render(
      <AppProvider initialState={initialState}>
        <DashboardView />
      </AppProvider>,
    );
    expect(
      await screen.findByRole("heading", { name: /estimated level/ }),
    ).toBeVisible();
    expect(screen.getByText(/main weakness/)).toBeVisible();
    expect(screen.queryByText("YOUR 4 EXAM SKILLS")).not.toBeInTheDocument();
  });

  it("shows basic progress without personalization for Essential", async () => {
    const initialState = {
      ...demoState,
      planAccess: { ...demoState.planAccess!, planId: "essential" },
    } satisfies AppState;
    render(
      <AppProvider initialState={initialState}>
        <DashboardView />
      </AppProvider>,
    );
    expect(
      await screen.findByRole("heading", {
        name: "Continue your guided lessons",
      }),
    ).toBeVisible();
    expect(screen.getByText("Practice accuracy")).toBeVisible();
    expect(screen.queryByText("Diagnostic readiness")).not.toBeInTheDocument();
    expect(screen.queryByText("Start with grammar")).not.toBeInTheDocument();
  });

  it("shows the active exam, NCLC target, readiness, and four skills", async () => {
    render(
      <AppProvider initialState={demoState}>
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
    const initialState = {
      ...demoState,
      user: demoState.user
        ? {
            ...demoState.user,
            goal: { ...demoState.user.goal, exam: "Not sure yet" },
          }
        : null,
    } satisfies AppState;
    render(
      <AppProvider initialState={initialState}>
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
});
