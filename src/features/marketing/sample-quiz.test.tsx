import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { PublicQuestion } from "@/types/domain";
import { SampleQuiz } from "./sample-quiz";

const mocks = vi.hoisted(() => ({ check: vi.fn(), track: vi.fn() }));
vi.mock("@/app/actions/content", () => ({
  checkSampleAnswerAction: mocks.check,
}));
vi.mock("@/lib/track-funnel", () => ({ trackFunnelStep: mocks.track }));
vi.mock("@/lib/domain/question-order", () => ({
  shuffleQuestions: (questions: PublicQuestion[]) => questions,
}));

const questions: PublicQuestion[] = [1, 2, 3, 4].map((number) => ({
  id: `sample-${number}`,
  source: "mpk_mock",
  examType: "general",
  type: "multiple_choice",
  prompt: `Question ${number} ?`,
  options: [
    { id: "second", label: "Le deuxième choix" },
    { id: "first", label: "Le premier choix" },
  ],
  competencies: ["vocabulary-context"],
  diagnosticSkill: "reading",
  difficulty: "A2",
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  mocks.check.mockReset();
});

describe("sample feedback", () => {
  it("reveals each correction before Continue and counts unique checked questions", async () => {
    const user = userEvent.setup();
    mocks.check.mockResolvedValue({
      ok: true,
      feedback: {
        correct: false,
        correctAnswer: "first",
        explanation: "Look at the context.",
      },
    });
    render(<SampleQuiz questions={questions} />);
    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "0",
    );
    for (let index = 0; index < 4; index++) {
      await user.click(
        screen.getByRole("radio", { name: "Le deuxième choix" }),
      );
      await user.click(screen.getByRole("button", { name: "Next" }));
      const panel = await screen.findByRole("status");
      expect(within(panel).getByText("Le premier choix")).toBeVisible();
      expect(screen.getByText(`Question ${index + 1} of 4`)).toBeVisible();
      expect(
        screen.getByText(`${index + 1} checked · 0 correct`),
      ).toBeVisible();
      await user.click(
        screen.getByRole("button", {
          name: index === 3 ? "See results" : "Continue",
        }),
      );
      if (index < 3)
        expect(
          screen.getByRole("heading", { name: questions[index + 1].prompt }),
        ).toHaveFocus();
    }
    expect(screen.getByText("0 of 4 correct")).toBeVisible();
    expect(mocks.check).toHaveBeenCalledTimes(4);
    expect(mocks.track).toHaveBeenCalledTimes(4);
    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(screen.getByText("0 checked · 0 correct")).toBeVisible();
  });

  it("locks selection during requests and retries a rejected check", async () => {
    let rejectCheck!: (error: unknown) => void;
    mocks.check.mockImplementationOnce(
      () =>
        new Promise((_resolve, reject) => {
          rejectCheck = reject;
        }),
    );
    mocks.check.mockResolvedValueOnce({
      ok: true,
      feedback: {
        correct: true,
        correctAnswer: "second",
        explanation: "Correct context.",
      },
    });
    render(<SampleQuiz questions={questions} />);
    const first = screen.getByRole("radio", { name: "Le deuxième choix" });
    const second = screen.getByRole("radio", { name: "Le premier choix" });
    fireEvent.click(first);
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(first).toBeDisabled();
    fireEvent.click(second);
    expect(first).toBeChecked();
    await act(async () => rejectCheck(new Error("offline")));
    expect(screen.getByRole("alert")).toBeVisible();
    expect(first).toBeChecked();
    expect(first).toBeDisabled();
    fireEvent.click(second);
    expect(first).toBeChecked();
    fireEvent.click(screen.getByRole("button", { name: "Retry checking" }));
    expect(await screen.findByText("Correct context.")).toBeVisible();
    expect(mocks.check).toHaveBeenNthCalledWith(1, "sample-1", "second");
    expect(mocks.check).toHaveBeenNthCalledWith(2, "sample-1", "second");
    expect(screen.getByText("1 checked · 1 correct")).toBeVisible();
  });

  it("keeps a fast correction visible when Next is double-clicked", async () => {
    const user = userEvent.setup();
    mocks.check.mockResolvedValue({
      ok: true,
      feedback: {
        correct: true,
        correctAnswer: "second",
        explanation: "Read this correction.",
      },
    });
    render(<SampleQuiz questions={questions} />);
    await user.click(screen.getAllByRole("radio")[0]);
    await user.dblClick(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByText("Question 1 of 4")).toBeVisible();
    expect(screen.getByText("Read this correction.")).toBeVisible();
    expect(mocks.check).toHaveBeenCalledTimes(1);
  });
});
