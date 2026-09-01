import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { diagnosticQuestions } from "@/data/questions";
import { QuestionCard } from "./question-card";
describe("QuestionCard", () => {
  it("supports keyboard-accessible option selection", () => { const onChange = vi.fn(); render(<QuestionCard question={diagnosticQuestions[0]} onChange={onChange} />); fireEvent.click(screen.getByText("depuis")); expect(onChange).toHaveBeenCalledWith("a"); });
  it("suppresses instructional feedback in exam mode", () => { render(<QuestionCard question={diagnosticQuestions[0]} value="b" onChange={() => undefined} reveal exam />); expect(screen.queryByText(diagnosticQuestions[0].explanation)).not.toBeInTheDocument(); });
});
