import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { AppProvider } from "@/components/providers/app-provider";
import { demoState } from "@/test/fixtures";
import { MistakeDetail } from "./mistake-detail";

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe("mistake detail", () => {
  it("connects a repeated pattern to a lesson and targeted practice", async () => {
    render(
      <AppProvider initialState={demoState}>
        <MistakeDetail mistakeId="m1" />
      </AppProvider>,
    );

    expect(
      await screen.findByRole("heading", { name: "Specific details" }),
    ).toBeVisible();
    // Legacy listening-detail rows merge into the canonical competency.
    expect(
      screen.getByText(/struggled with this pattern 13 times/),
    ).toBeVisible();
    expect(
      screen.getByRole("heading", {
        name: "Listen for intention and correction",
      }),
    ).toBeVisible();
    expect(
      screen.getByRole("link", { name: /Practice weakness/ }),
    ).toHaveAttribute(
      "href",
      "/practice/session?skill=listening&focus=specific_detail&count=10",
    );
  });

  it("shows option text instead of stored option ids", async () => {
    const mistake = demoState.mistakes.find((item) => item.id === "m1")!;
    render(
      <AppProvider initialState={demoState}>
        <MistakeDetail
          mistakeId="m1"
          optionLabels={{
            [mistake.questionId]: {
              [mistake.learnerAnswer]: "Learner option text",
              [mistake.correctAnswer]: "Correct option text",
            },
          }}
        />
      </AppProvider>,
    );
    expect(await screen.findByText("Learner option text")).toBeVisible();
    expect(screen.getByText("Correct option text")).toBeVisible();
  });
});
