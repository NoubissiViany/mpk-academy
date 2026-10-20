import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AppProvider } from "@/components/providers/app-provider";
import { allLessons } from "@/data/course";
import {
  checkLessonCheckpoint,
  getLessonContent,
  toPublicLesson,
} from "@/lib/server/content";
import { demoState } from "@/test/fixtures";
import { LessonView } from "./lesson-view";

const mocks = vi.hoisted(() => ({ check: vi.fn(), complete: vi.fn() }));
vi.mock("@/app/actions/content", () => ({
  checkLessonCheckpointAction: mocks.check,
}));
vi.mock("@/app/actions/learner", async (original) => ({
  ...(await original<typeof import("@/app/actions/learner")>()),
  completeLessonAction: mocks.complete,
}));

afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.clearAllMocks();
});

const lesson = allLessons.find((item) => !item.isFree) ?? allLessons[0];
const authored = getLessonContent(lesson.id)!;
const withExtra = {
  ...authored,
  explanationFr: "Explication en français.",
  extraCheckpoints: [
    {
      prompt: "Deuxième question ?",
      options: ["oui", "non", "peut-être"],
      answer: 1,
      explanation: "Second explanation.",
      explanationFr: "Deuxième explication.",
    },
  ],
};

describe("lesson checkpoints", () => {
  it("shuffles options on the server but keeps each original index", () => {
    const content = toPublicLesson(withExtra, () => 0);
    expect(content).not.toHaveProperty("checkpoint");
    expect(content.checkpoints).toHaveLength(2);
    for (const [position, checkpoint] of content.checkpoints.entries()) {
      const original =
        position === 0 ? authored.checkpoint : withExtra.extraCheckpoints[0];
      expect(checkpoint).not.toHaveProperty("answer");
      for (const option of checkpoint.options)
        expect(option.label).toBe(original.options[option.index]);
    }
    expect(
      content.checkpoints[1].options.map((option) => option.label),
    ).not.toEqual(["oui", "non", "peut-être"]);
  });

  it("checks the right checkpoint and explains in the learner's language", () => {
    const { checkpoint } = authored;
    expect(
      checkLessonCheckpoint(lesson.id, 0, checkpoint.answer, "en"),
    ).toEqual({
      correct: true,
      correctAnswer: checkpoint.options[checkpoint.answer],
      explanation: checkpoint.explanation,
    });
    expect(checkLessonCheckpoint(lesson.id, 5, 0, "en")).toBeNull();
    expect(
      checkLessonCheckpoint(lesson.id, 0, checkpoint.options.length, "en"),
    ).toBeNull();
  });

  it("completes only after every checkpoint is answered", async () => {
    const user = userEvent.setup();
    mocks.check.mockImplementation(async (_id, position: number) => ({
      ok: true,
      feedback: {
        correct: true,
        correctAnswer: "",
        explanation: `Explanation ${position + 1}`,
      },
    }));
    render(
      <AppProvider
        initialState={{
          ...demoState,
          progress: { ...demoState.progress, completedLessonIds: [] },
        }}
      >
        <LessonView
          lesson={lesson}
          content={toPublicLesson(withExtra)}
          next={null}
        />
      </AppProvider>,
    );
    const complete = await screen.findByRole("button", {
      name: "Complete lesson",
    });
    expect(screen.getByText("Question 1 of 2")).toBeVisible();
    expect(screen.getByText(/Answer every checkpoint question/)).toBeVisible();

    const groups = screen.getAllByRole("group", { name: "Choose an answer" });
    const checks = screen.getAllByRole("button", {
      name: "Check understanding",
    });
    await user.click(groups[0].querySelector("input")!);
    await user.click(checks[0]);
    expect(await screen.findByText("Explanation 1")).toBeVisible();
    expect(complete).toBeDisabled();

    await user.click(groups[1].querySelector("input")!);
    await user.click(
      screen.getByRole("button", { name: "Check understanding" }),
    );
    expect(await screen.findByText("Explanation 2")).toBeVisible();
    expect(mocks.check).toHaveBeenLastCalledWith(
      lesson.id,
      1,
      expect.any(Number),
    );
    expect(complete).toBeEnabled();
  });

  it("shows the French body to a French-speaking learner when it exists", async () => {
    render(
      <AppProvider
        initialState={{
          ...demoState,
          user: { ...demoState.user!, locale: "fr" },
        }}
      >
        <LessonView
          lesson={lesson}
          content={toPublicLesson(withExtra)}
          next={null}
        />
      </AppProvider>,
    );
    expect(await screen.findByText("Explication en français.")).toBeVisible();
    expect(screen.getByText("Question 2 sur 2")).toBeVisible();
  });
});
