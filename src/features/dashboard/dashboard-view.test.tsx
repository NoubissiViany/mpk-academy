import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { AppProvider } from "@/components/providers/app-provider";
import { defaultState } from "@/data/mock-state";
import { saveState } from "@/lib/persistence";
import { DashboardView } from "./dashboard-view";

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe("exam-centred dashboard", () => {
  it("shows the active exam, NCLC target, readiness, and four skills", async () => {
    saveState(defaultState);
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
      ...defaultState,
      user: defaultState.user
        ? {
            ...defaultState.user,
            goal: { ...defaultState.user.goal, exam: "Not sure yet" },
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
});
