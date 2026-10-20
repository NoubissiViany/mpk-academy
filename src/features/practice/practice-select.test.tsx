import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { AppProvider } from "@/components/providers/app-provider";
import { demoState } from "@/test/fixtures";
import { createEmptyExamProfile } from "@/lib/domain/exam-progress";
import { PracticeSelect } from "./practice-select";

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe("personalized practice landing", () => {
  it("shows scores, focus areas, and the recommended weakness", async () => {
    render(
      <AppProvider initialState={demoState}>
        <PracticeSelect />
      </AppProvider>,
    );

    expect(await screen.findByText("54% · Needs attention")).toBeVisible();
    // Legacy "Numbers and dates" mistakes now count toward Specific details.
    expect(screen.getAllByText(/Specific details/).length).toBeGreaterThan(0);
    expect(screen.queryByText(/Numbers and dates/)).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Practice recommended weakness" }),
    ).toHaveAttribute("href", expect.stringContaining("skill=listening"));
  });

  it("does not invent productive-skill scores for a new learner", async () => {
    const profile = createEmptyExamProfile("TEF Canada");
    profile.skills.reading.current = 70;
    profile.skills.listening.current = 54;
    const initialState = {
      ...demoState,
      examProfiles: { "TEF Canada": profile },
      mistakes: [],
    };
    render(
      <AppProvider initialState={initialState}>
        <PracticeSelect />
      </AppProvider>,
    );

    expect(await screen.findAllByText("Timed self-practice")).toHaveLength(2);
    expect(screen.getAllByText(/Practise and review the rubric/)).toHaveLength(
      2,
    );
    expect(screen.getByRole("link", { name: /Writing/ })).toHaveAttribute(
      "href",
      "/practice/session?skill=writing",
    );
    expect(screen.queryByText("63% · Improving")).not.toBeInTheDocument();
    expect(screen.queryByText("48% · Priority")).not.toBeInTheDocument();
  });
});

describe("spaced review entry", () => {
  const due = (questionId: string, skill: "reading" | "listening") => ({
    questionId,
    exam: "TEF Canada" as const,
    skill,
    step: 0,
    dueAt: "2026-01-01T00:00:00Z",
  });

  it("offers each skill's due reviews and ignores future ones", async () => {
    render(
      <AppProvider
        initialState={{
          ...demoState,
          reviews: [
            due("q1", "listening"),
            due("q2", "listening"),
            { ...due("q3", "reading"), dueAt: "2999-01-01T00:00:00Z" },
            { ...due("q4", "reading"), exam: "TCF Canada" },
          ],
        }}
      >
        <PracticeSelect />
      </AppProvider>,
    );
    expect(
      await screen.findByText("2 missed questions are due for review"),
    ).toBeVisible();
    expect(
      screen.getByRole("link", { name: "Review listening (2)" }),
    ).toHaveAttribute("href", "/practice/session?skill=listening&review=1");
    expect(
      screen.queryByRole("link", { name: /Review reading/ }),
    ).not.toBeInTheDocument();
  });

  it("stays hidden without the mistake review feature", async () => {
    render(
      <AppProvider
        initialState={{
          ...demoState,
          planAccess: { ...demoState.planAccess!, planId: "essential" },
          reviews: [due("q1", "reading")],
        }}
      >
        <PracticeSelect />
      </AppProvider>,
    );
    expect(await screen.findByText("Choose a skill")).toBeVisible();
    expect(screen.queryByText(/due for review/)).not.toBeInTheDocument();
  });
});
