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
    expect(screen.getByText(/Specific details/)).toBeVisible();
    expect(screen.getByText(/Numbers and dates/)).toBeVisible();
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

    expect(await screen.findAllByText("Coming soon")).toHaveLength(2);
    expect(screen.getAllByText(/Correction is not available yet/)).toHaveLength(
      2,
    );
    expect(screen.queryByRole("link", { name: /Writing/ })).toBeNull();
    expect(screen.queryByText("63% · Improving")).not.toBeInTheDocument();
    expect(screen.queryByText("48% · Priority")).not.toBeInTheDocument();
  });
});
