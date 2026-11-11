import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { I18nContextProvider } from "@/i18n/client";
import { messagesFor } from "@/i18n/messages";
import { afterEach, describe, expect, it, vi } from "vitest";
import { diagnosticQuestions } from "@/data/questions";
import { toPublicQuestion } from "@/lib/server/content";
import { QuestionCard } from "./question-card";

const question = toPublicQuestion(diagnosticQuestions[0]);
const feedback = {
  correct: false,
  correctAnswer: diagnosticQuestions[0].correctAnswer,
  explanation: diagnosticQuestions[0].explanation,
};

afterEach(cleanup);

describe("QuestionCard", () => {
  it("supports keyboard-accessible option selection", () => {
    const onChange = vi.fn();
    render(<QuestionCard question={question} onChange={onChange} />);
    fireEvent.click(
      screen.getByRole("radio", { name: question.options![0].label }),
    );
    expect(onChange).toHaveBeenCalledWith(question.options![0].id);
  });

  it("receives no answer key from the public projection", () => {
    expect(question).not.toHaveProperty("correctAnswer");
    expect(question).not.toHaveProperty("explanation");
    expect(question).not.toHaveProperty("explanationFr");
  });

  it("shows server feedback in practice", () => {
    render(
      <QuestionCard
        question={question}
        value="z"
        onChange={() => undefined}
        feedback={feedback}
      />,
    );
    expect(screen.getByText("Not quite")).toBeInTheDocument();
    expect(screen.getByText(feedback.explanation)).toBeInTheDocument();
  });

  it("offers the transcript of a real recording once answered", () => {
    render(
      <QuestionCard
        question={question}
        value="z"
        onChange={() => undefined}
        feedback={{
          ...feedback,
          transcript: "A : Tu viens demain ? B : Oui, vers midi.",
        }}
      />,
    );
    fireEvent.click(screen.getByText("Read what was said"));
    expect(
      screen.getByText("Tu viens demain ?", { exact: false }),
    ).toBeVisible();
    expect(screen.getByText("B : Oui, vers midi.")).toBeVisible();
  });

  it("suppresses instructional feedback in exam mode", () => {
    render(
      <QuestionCard
        question={question}
        value="b"
        onChange={() => undefined}
        feedback={feedback}
        exam
      />,
    );
    expect(screen.queryByText(feedback.explanation)).not.toBeInTheDocument();
  });

  it.each(["en", "fr"] as const)(
    "names both full answers in %s, independently of shuffled positions",
    (locale) => {
      if (question.type !== "multiple_choice")
        throw new Error("MCQ fixture required");
      const options = [...question.options].reverse();
      const correctOption = options[0];
      const chosenOption = options[1];
      render(
        <I18nContextProvider
          value={{ locale, t: messagesFor(locale), setLocale: async () => {} }}
        >
          <QuestionCard
            question={{ ...question, options }}
            value={chosenOption.id}
            onChange={vi.fn()}
            feedback={{
              correct: false,
              correctAnswer: correctOption.id,
              explanation: "Explanation",
            }}
          />
        </I18nContextProvider>,
      );
      const panel = screen.getByRole("status");
      expect(within(panel).getByText(chosenOption.label)).toBeVisible();
      expect(within(panel).getByText(correctOption.label)).toBeVisible();
      expect(
        within(panel).getByText(
          locale === "fr" ? "Votre réponse" : "Your answer",
        ),
      ).toBeVisible();
      expect(
        within(panel).getByText(
          locale === "fr" ? "Bonne réponse" : "Correct answer",
        ),
      ).toBeVisible();
      expect(panel).toHaveFocus();
    },
  );

  it("disables answer controls while checking", () => {
    render(<QuestionCard question={question} onChange={vi.fn()} disabled />);
    for (const option of screen.getAllByRole("radio"))
      expect(option).toBeDisabled();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("shows the correct fill-in answer explicitly", () => {
    const fillQuestion = {
      ...question,
      type: "fill_blank" as const,
      options: undefined,
    };
    render(
      <QuestionCard
        question={fillQuestion}
        value="avais"
        onChange={vi.fn()}
        feedback={{
          correct: false,
          correctAnswer: "avait",
          explanation: "Third person singular",
        }}
      />,
    );
    expect(within(screen.getByRole("status")).getByText("avait")).toBeVisible();
    expect(screen.getByRole("textbox")).toBeDisabled();
  });
});
