import { cleanup, render, screen, waitFor } from "@testing-library/react";
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
  getModelResponse: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));
vi.mock("@/app/actions/content", () => ({
  checkPracticeAnswerAction: mocks.checkAnswer,
  getModelResponseAction: mocks.getModelResponse,
}));

afterEach(() => {
  cleanup();
  localStorage.clear();
  Object.values(mocks).forEach((mock) => mock.mockReset());
});

describe("comprehension practice", () => {
  const pool = getPracticePool("TEF Canada", "reading", null, 5);

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
    await user.click(screen.getByRole("button", { name: "Finish and review" }));
    expect(mocks.getModelResponse).not.toHaveBeenCalled();
    await user.click(screen.getByText("Original MPK model response"));
    await waitFor(() =>
      expect(mocks.getModelResponse).toHaveBeenCalledWith(tasks[0].id),
    );
    expect(await screen.findByText("Réponse modèle")).toBeInTheDocument();
  });
});
