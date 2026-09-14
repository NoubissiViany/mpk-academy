import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { AppProvider } from "@/components/providers/app-provider";
import { defaultState } from "@/data/mock-state";
import { diagnosticQuestions } from "@/data/questions";
import { scoreDiagnostic } from "@/lib/domain/diagnostic";
import { saveState } from "@/lib/persistence";
import { ResultsView } from "./results-view";

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe("ResultsView", () => {
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
    expect(screen.getByText("B2")).toBeVisible();
    expect(screen.getByText("Upper-intermediate French")).toBeVisible();
    expect(
      screen.getByText(/preparing for TCF Canada and aiming for NCLC 9\+/),
    ).toBeVisible();
    expect(screen.getByText("Your priority")).toBeVisible();
    expect(screen.getAllByText("Listening").length).toBeGreaterThan(0);
    expect(
      screen.getByRole("link", { name: "Continue with Intensive" }),
    ).toHaveAttribute("href", "/register?plan=intensive");
  });

  it.each([
    ["NCLC 5", "Essential", "essential"],
    ["NCLC 7", "Complete", "complete"],
    ["I'm not sure", "Complete", "complete"],
    ["NCLC 9+", "Intensive", "intensive"],
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
