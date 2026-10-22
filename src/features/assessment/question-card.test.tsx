import { cleanup, fireEvent, render, screen } from "@testing-library/react";
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
    expect(screen.getByText("Tu viens demain ?", { exact: false })).toBeVisible();
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
});
