import {
  act,
  fireEvent,
  cleanup,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AppProvider } from "@/components/providers/app-provider";
import {
  getPracticePool,
  getPublicProductiveTasks,
} from "@/lib/server/content";
import { ExamPracticeSession } from "./exam-practice-session";
import { ProductiveSession } from "./productive-session";

const mocks = vi.hoisted(() => ({
  checkAnswer: vi.fn(),
  saveIncomplete: vi.fn(),
  submit: vi.fn(),
  getModelResponse: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));
vi.mock("@/app/actions/content", () => ({
  checkPracticeAnswerAction: mocks.checkAnswer,
  getModelResponseAction: mocks.getModelResponse,
}));

vi.mock("@/app/actions/learner", () => ({
  saveIncompleteWritingPracticeAction: mocks.saveIncomplete,
  submitPracticeAction: mocks.submit,
}));

afterEach(() => {
  vi.useRealTimers();
  cleanup();
  localStorage.clear();
  Object.values(mocks).forEach((mock) => mock.mockReset());
});

describe("comprehension practice", () => {
  const { questions: pool } = getPracticePool("TEF Canada", "reading", {
    count: 5,
  });

  it("receives questions without answer keys", () => {
    expect(pool).toHaveLength(5);
    for (const question of pool) {
      expect(question).not.toHaveProperty("correctAnswer");
      expect(question).not.toHaveProperty("explanation");
    }
  });

  it("asks the server whether an answer is correct", async () => {
    const user = userEvent.setup();
    mocks.checkAnswer.mockResolvedValue({
      ok: true,
      feedback: {
        correct: true,
        correctAnswer: pool[0].options![0].id,
        explanation: "Server explanation",
      },
    });
    render(
      <AppProvider>
        <ExamPracticeSession
          exam="TEF Canada"
          skill="reading"
          focus={null}
          pool={pool}
        />
      </AppProvider>,
    );
    await user.click(screen.getByLabelText(pool[0].options![0].label));
    await user.click(screen.getByRole("button", { name: "Check answer" }));

    expect(mocks.checkAnswer).toHaveBeenCalledWith(
      pool[0].id,
      pool[0].options![0].id,
    );
    expect(await screen.findByText("Server explanation")).toBeVisible();
  });
});

describe("spaced review", () => {
  const { questions: pool, reviewIds } = getPracticePool(
    "TEF Canada",
    "reading",
    { count: 5, dueIds: ["missing-id"], random: () => 0.5 },
  );

  it("draws due reviews from the learner's queue", () => {
    const due = getPracticePool("TEF Canada", "reading", {
      count: 5,
      dueIds: [pool[2].id],
    });
    expect(due.reviewIds).toEqual([pool[2].id]);
    expect(due.questions.map((question) => question.id)).toContain(pool[2].id);
    expect(reviewIds).toEqual([]);
  });

  it("labels a question the learner missed before", async () => {
    render(
      <AppProvider>
        <ExamPracticeSession
          exam="TEF Canada"
          skill="reading"
          focus={null}
          pool={pool}
          reviewIds={[pool[0].id]}
        />
      </AppProvider>,
    );
    expect(await screen.findByText("Review")).toBeVisible();
    expect(screen.getByText(/You missed this before/)).toBeVisible();
  });

  it("explains when no review is due", async () => {
    render(
      <AppProvider>
        <ExamPracticeSession
          exam="TEF Canada"
          skill="reading"
          focus={null}
          pool={[]}
          mode="review"
        />
      </AppProvider>,
    );
    expect(
      await screen.findByText(/No reviews are due right now/),
    ).toBeVisible();
    expect(
      screen.getByRole("link", { name: "Back to Practice" }),
    ).toHaveAttribute("href", "/practice");
  });
});

describe("productive practice availability", () => {
  const tasks = getPublicProductiveTasks("TEF Canada", "writing");

  it("does not ship model responses with the task", () => {
    expect(tasks.length).toBeGreaterThan(0);
    for (const task of tasks)
      expect(task.correction).not.toHaveProperty("modelResponse");
  });

  it("does not create a Writing score through a direct session URL", async () => {
    render(
      <AppProvider>
        <ProductiveSession exam="TEF Canada" skill="writing" tasks={tasks} />
      </AppProvider>,
    );

    expect(
      await screen.findByRole("heading", {
        name: /Writing self-practice/,
      }),
    ).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Start timed practice" }),
    ).toBeVisible();
    expect(
      screen.getByText(/No recording, AI evaluation, or official grading/),
    ).toBeVisible();
    expect(screen.queryByText(/Save self-review/)).not.toBeInTheDocument();
  });

  it("loads the model response only when the learner opens it after review", async () => {
    const user = userEvent.setup();
    mocks.getModelResponse.mockResolvedValue({
      ok: true,
      modelResponse: "Réponse modèle",
    });
    render(
      <AppProvider>
        <ProductiveSession exam="TEF Canada" skill="writing" tasks={tasks} />
      </AppProvider>,
    );
    expect(mocks.getModelResponse).not.toHaveBeenCalled();
    await user.click(
      screen.getByRole("button", { name: "Start timed practice" }),
    );
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "mot ".repeat(tasks[0].wordCount!.min) },
    });
    await user.click(screen.getByRole("button", { name: "Finish and review" }));
    expect(mocks.getModelResponse).not.toHaveBeenCalled();
    await user.click(screen.getByText("Original MPK model response"));
    await waitFor(() =>
      expect(mocks.getModelResponse).toHaveBeenCalledWith(tasks[0].id),
    );
    expect(await screen.findByText("Réponse modèle")).toBeInTheDocument();
  });
});

describe("productive writing minimums", () => {
  it.each([60, 80, 120, 200])(
    "blocks final submission below %i and allows the exact minimum",
    async (min) => {
      const task = {
        ...getPublicProductiveTasks("TEF Canada", "writing")[0],
        wordCount: { min, max: min + 60 },
      };
      const view = render(
        <AppProvider>
          <ProductiveSession exam="TEF Canada" skill="writing" tasks={[task]} />
        </AppProvider>,
      );
      fireEvent.click(
        await screen.findByRole("button", { name: "Start timed practice" }),
      );
      const finish = screen.getByRole("button", { name: "Finish and review" });
      fireEvent.change(screen.getByRole("textbox"), {
        target: { value: "mot ".repeat(min - 1) },
      });
      expect(finish).toBeDisabled();
      expect(screen.getByRole("status")).toHaveTextContent(
        `Write 1 more words to reach the ${min}-word minimum`,
      );
      fireEvent.change(screen.getByRole("textbox"), {
        target: { value: "mot ".repeat(min) },
      });
      expect(finish).toBeEnabled();
      view.rerender(
        <AppProvider>
          <ProductiveSession
            exam="TEF Canada"
            skill="writing"
            tasks={[{ ...task, id: "new-server-order" }]}
          />
        </AppProvider>,
      );
      expect(screen.getByRole("textbox")).toHaveValue("mot ".repeat(min));
      fireEvent.change(screen.getByRole("textbox"), {
        target: { value: "mot ".repeat(min + 61) },
      });
      expect(finish).toBeEnabled();
    },
  );
  it("retains a short timed-out answer without completion or an AI request", async () => {
    vi.useFakeTimers();
    const task = {
      ...getPublicProductiveTasks("TEF Canada", "writing")[0],
      durationSeconds: 1,
    };
    mocks.saveIncomplete.mockResolvedValue({ ok: true, id: "saved-draft" });
    render(
      <AppProvider>
        <ProductiveSession
          exam="TEF Canada"
          skill="writing"
          tasks={[task]}
          aiFeedback
        />
      </AppProvider>,
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Start timed practice" }),
    );
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "Un court brouillon." },
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });
    expect(screen.getByRole("textbox")).toBeDisabled();
    expect(mocks.saveIncomplete).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        text: "Un court brouillon.",
        taskId: task.id,
        durationSeconds: 1,
      }),
    );
    expect(mocks.submit).not.toHaveBeenCalled();
    expect(
      screen.queryByRole("button", { name: "Get AI feedback" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Start a new attempt" }),
    ).toBeVisible();
    expect(
      screen.getByText(/Your draft is saved without completion credit/),
    ).toBeVisible();
  });
});
