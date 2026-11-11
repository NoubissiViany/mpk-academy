import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
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
    const content = toPublicLesson(withExtra, "en", () => 0);
    expect(content).not.toHaveProperty("checkpoint");
    expect(content.checkpoints).toHaveLength(2);
    for (const checkpoint of content.checkpoints) {
      const original =
        checkpoint.index === 0
          ? authored.checkpoint
          : withExtra.extraCheckpoints[0];
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

  it("asks English-only checkpoints in French for French learners", () => {
    const tef = getLessonContent("tef-lesson-005")!;
    const { checkpoint } = tef;
    const content = toPublicLesson(tef, "fr", () => 0);
    expect(content.checkpoints.find((c) => c.index === 0)!.prompt).toBe(
      checkpoint.promptFr,
    );
    for (const option of content.checkpoints.find((c) => c.index === 0)!
      .options)
      expect(option.label).toBe(checkpoint.optionsFr![option.index]);
    expect(checkLessonCheckpoint(tef.id, 0, checkpoint.answer, "fr")).toEqual({
      correct: true,
      correctAnswer: checkpoint.optionsFr![checkpoint.answer],
      explanation: checkpoint.explanationFr,
    });
    expect(
      toPublicLesson(tef, "en").checkpoints.find((c) => c.index === 0)!.prompt,
    ).toBe(checkpoint.prompt);
  });

  it("completes only after every checkpoint is answered", async () => {
    const user = userEvent.setup();
    const shuffled = toPublicLesson(withExtra, "en", () => 0);
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
        <LessonView lesson={lesson} content={shuffled} next={null} />
      </AppProvider>,
    );
    const complete = await screen.findByRole("button", {
      name: "Complete lesson",
    });
    expect(screen.getByText("Question 1 of 2")).toBeVisible();
    expect(screen.getByText(/Answer every checkpoint question/)).toBeVisible();

    await user.click(
      screen
        .getByRole("group", { name: "Choose an answer" })
        .querySelector("input")!,
    );
    await user.click(screen.getByRole("button", { name: "Next" }));
    expect(
      await screen.findByText(
        `Explanation ${shuffled.checkpoints[0].index + 1}`,
      ),
    ).toBeVisible();
    expect(complete).toBeDisabled();
    expect(screen.getByText("Question 1 of 2")).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Continue" }));
    expect(
      screen.getByRole("heading", { name: shuffled.checkpoints[1].prompt }),
    ).toHaveFocus();

    await user.click(
      screen
        .getByRole("group", { name: "Choose an answer" })
        .querySelector("input")!,
    );
    await user.click(screen.getByRole("button", { name: "Next" }));
    expect(
      await screen.findByText(
        `Explanation ${shuffled.checkpoints[1].index + 1}`,
      ),
    ).toBeVisible();
    expect(mocks.check).toHaveBeenLastCalledWith(
      lesson.id,
      shuffled.checkpoints[1].index,
      expect.any(Number),
    );
    expect(complete).toBeEnabled();
    await user.click(screen.getByRole("button", { name: "Previous" }));
    expect(screen.getByText("2 checked · 2 correct")).toBeVisible();
    expect(mocks.check).toHaveBeenCalledTimes(2);
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
    expect(screen.getByText("Question 1 sur 2")).toBeVisible();
  });

  it("requires all three checkpoint verdicts before saving completion", async () => {
    const user = userEvent.setup();
    const content = toPublicLesson(
      {
        ...withExtra,
        extraCheckpoints: [
          ...withExtra.extraCheckpoints,
          { ...withExtra.extraCheckpoints[0], prompt: "Third checkpoint?" },
        ],
      },
      "en",
      () => 0,
    );
    mocks.check.mockResolvedValue({
      ok: true,
      feedback: {
        correct: false,
        correctAnswer: "Expected answer",
        explanation: "Review the example",
      },
    });
    render(
      <AppProvider
        initialState={{
          ...demoState,
          progress: { ...demoState.progress, completedLessonIds: [] },
        }}
      >
        <LessonView lesson={lesson} content={content} next={null} />
      </AppProvider>,
    );
    const complete = screen.getByRole("button", { name: "Complete lesson" });
    for (let index = 0; index < 3; index++) {
      expect(complete).toBeDisabled();
      await user.click(screen.getAllByRole("radio")[0]);
      await user.click(screen.getByRole("button", { name: "Next" }));
      expect(await screen.findByText("Expected answer")).toBeVisible();
      expect(screen.getByText(`Question ${index + 1} of 3`)).toBeVisible();
      if (index < 2)
        await user.click(screen.getByRole("button", { name: "Continue" }));
    }
    expect(complete).toBeEnabled();
    expect(screen.getByText("3 checked · 0 correct")).toBeVisible();
    expect(mocks.complete).not.toHaveBeenCalled();
  });

  it("freezes a submitted checkpoint and retains it after a failed check", async () => {
    let rejectCheck!: (reason: unknown) => void;
    mocks.check.mockImplementationOnce(
      () =>
        new Promise((_resolve, reject) => {
          rejectCheck = reject;
        }),
    );
    mocks.check.mockResolvedValueOnce({
      ok: true,
      feedback: {
        correct: false,
        correctAnswer: "Correct choice",
        explanation: "Recovered checkpoint",
      },
    });
    render(
      <AppProvider>
        <LessonView
          lesson={lesson}
          content={toPublicLesson(withExtra)}
          next={null}
        />
      </AppProvider>,
    );
    const [first, second] = screen.getAllByRole("radio");
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
    expect(await screen.findByText("Recovered checkpoint")).toBeVisible();
    expect(mocks.check.mock.calls[1]).toEqual(mocks.check.mock.calls[0]);
  });
});
