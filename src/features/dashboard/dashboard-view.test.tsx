import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppProvider } from "@/components/providers/app-provider";
import { demoState } from "@/test/fixtures";
import type { AppState } from "@/types/domain";
import { DashboardView } from "./dashboard-view";

beforeEach(() => {
  // Wednesday 21 October 2026; the demo exam date is 15 November.
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(2026, 9, 21, 10, 0));
});

afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.useRealTimers();
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
      reviews: [
        {
          questionId: "q1",
          exam: "TEF Canada",
          skill: "reading",
          step: 0,
          dueAt: "2026-10-20T09:00:00Z",
        },
      ],
    } satisfies AppState;
    render(
      <AppProvider initialState={initialState}>
        <DashboardView />
      </AppProvider>,
    );
    expect(
      await screen.findByText("Questions you have not seen come first."),
    ).toBeVisible();
    expect(screen.getByText("Practice accuracy")).toBeVisible();
    expect(screen.queryByText("MPK readiness")).not.toBeInTheDocument();
    expect(screen.queryByText("Focus skill")).not.toBeInTheDocument();
    expect(screen.queryByText(/missed question/)).not.toBeInTheDocument();
  });

  it("plans today around due reviews, the weakest skill, and a lesson", async () => {
    const initialState = {
      ...demoState,
      reviews: [
        {
          questionId: "q1",
          exam: "TEF Canada",
          skill: "listening",
          step: 0,
          dueAt: "2026-10-20T09:00:00Z",
        },
      ],
    } satisfies AppState;
    render(
      <AppProvider initialState={initialState}>
        <DashboardView />
      </AppProvider>,
    );
    expect(
      await screen.findByRole("heading", { name: /Today’s plan · about/ }),
    ).toBeVisible();
    expect(
      screen.getByRole("link", {
        name: /Review 1 missed question · Listening/,
      }),
    ).toHaveAttribute("href", "/practice/session?skill=listening&review=1");
    expect(
      screen.getByRole("link", { name: /Practise listening · 10 questions/ }),
    ).toBeVisible();
    expect(screen.getByRole("link", { name: /Lesson ·/ })).toBeVisible();
    expect(
      screen.getByRole("link", { name: /Start today’s plan/ }),
    ).toHaveAttribute("href", "/practice/session?skill=listening&review=1");
  });

  it("measures readiness against the target and keeps a weekly rhythm", async () => {
    render(
      <AppProvider initialState={demoState}>
        <DashboardView />
      </AppProvider>,
    );
    expect(await screen.findByText("MPK readiness")).toBeVisible();
    expect(screen.getByText("63%")).toBeVisible();
    expect(screen.getAllByText("Near your target")[0]).toBeVisible();
    expect(
      screen.getByText("Goal for NCLC 7: 70% on MPK practice"),
    ).toBeVisible();
    expect(screen.getByText("Focus skill")).toBeVisible();
    expect(screen.getByText("25 days to your exam")).toBeVisible();
    expect(screen.getByText("Plan: 4 practice sessions a week")).toBeVisible();
    expect(screen.getByText(/not an official TEF result/)).toBeVisible();
  });

  it("asks for an exam date before planning the weeks", async () => {
    const initialState = {
      ...demoState,
      user: {
        ...demoState.user!,
        goal: { exam: "TEF Canada", target: "NCLC 7" },
      },
    } satisfies AppState;
    render(
      <AppProvider initialState={initialState}>
        <DashboardView />
      </AppProvider>,
    );
    expect(await screen.findByText("Add your exam date")).toBeVisible();
    expect(screen.getByRole("link", { name: "Set exam date" })).toHaveAttribute(
      "href",
      "/settings",
    );
  });

  it("shows the four exam skills", async () => {
    render(
      <AppProvider initialState={demoState}>
        <DashboardView />
      </AppProvider>,
    );
    expect(await screen.findByText("YOUR 4 EXAM SKILLS")).toBeVisible();
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
