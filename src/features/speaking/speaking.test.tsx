import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppProvider } from "@/components/providers/app-provider";
import type { PublicProductiveTask } from "@/content/shared/types";
import type { WritingFeedback } from "@/lib/domain/writing-feedback";
import type { SpeakingSubmission } from "@/lib/supabase/speaking";
import { demoState } from "@/test/fixtures";
import { SpeakingFeedbackView } from "./speaking-feedback-view";
import { SpeakingRecorder } from "./speaking-recorder";

const mocks = vi.hoisted(() => ({
  allowance: vi.fn(),
  status: vi.fn(),
  requeue: vi.fn(),
  flag: vi.fn(),
  push: vi.fn(),
  consent: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push, refresh: vi.fn() }),
}));
vi.mock("@/app/actions/speaking", () => ({
  getSpeakingAllowanceAction: mocks.allowance,
  getSpeakingStatusAction: mocks.status,
  requeueSpeakingAction: mocks.requeue,
  flagSpeakingFixAction: mocks.flag,
}));
vi.mock("@/app/actions/writing", () => ({
  setAiFeedbackConsentAction: mocks.consent,
  requestWritingFeedbackAction: vi.fn(),
}));

/** Minimal MediaRecorder: emits one chunk of `bytes` when stopped. */
class FakeRecorder {
  static bytes = 30_000;
  static latest: FakeRecorder | null = null;
  static isTypeSupported = (type: string) => type === "audio/webm;codecs=opus";
  state: "inactive" | "recording" = "inactive";
  mimeType: string;
  ondataavailable: ((event: { data: Blob }) => void) | null = null;
  onstop: (() => void) | null = null;
  constructor(_stream: unknown, options: { mimeType?: string }) {
    this.mimeType = options.mimeType ?? "";
    FakeRecorder.latest = this;
  }
  /** A timeslice chunk arriving while recording. */
  emit(bytes: number) {
    this.ondataavailable?.({
      data: new Blob([new Uint8Array(bytes)], { type: this.mimeType }),
    });
  }
  start() {
    this.state = "recording";
  }
  stop() {
    this.state = "inactive";
    this.ondataavailable?.({
      data: new Blob([new Uint8Array(FakeRecorder.bytes)], {
        type: this.mimeType,
      }),
    });
    this.onstop?.();
  }
}

const task = {
  id: "tef-speaking-section-b-001",
  title: "Un défi de lecture",
  durationSeconds: 600,
  preparationSeconds: 0,
} as PublicProductiveTask;

const getUserMedia = vi.fn();

beforeEach(() => {
  vi.stubGlobal("MediaRecorder", FakeRecorder);
  Object.defineProperty(navigator, "mediaDevices", {
    configurable: true,
    value: { getUserMedia },
  });
  getUserMedia.mockResolvedValue({ getTracks: () => [{ stop: vi.fn() }] });
  URL.createObjectURL = vi.fn(() => "blob:recording");
  URL.revokeObjectURL = vi.fn();
});

afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.unstubAllGlobals();
  Object.values(mocks).forEach((mock) => mock.mockReset());
  getUserMedia.mockReset();
});

function renderRecorder(onPractiseWithout = vi.fn()) {
  render(
    <AppProvider initialState={demoState}>
      <SpeakingRecorder
        task={task}
        practiceSubmissionId="7a1c5f3e-2d7a-4b1e-9c4a-1d2e3f4a5b6c"
        onPractiseWithout={onPractiseWithout}
      />
    </AppProvider>,
  );
  return onPractiseWithout;
}

describe("recording a spoken answer", () => {
  it("records, plays back, and sends the recording for feedback", async () => {
    const user = userEvent.setup();
    mocks.allowance.mockResolvedValue({ ok: true, allowance: "allowed" });
    const fetch = vi.fn(async () => Response.json({ ok: true, id: "rec-1" }));
    vi.stubGlobal("fetch", fetch);
    renderRecorder();

    await user.click(await screen.findByRole("button", { name: "Start" }));
    expect(await screen.findByRole("timer")).toHaveTextContent(
      "Recording · 0:00 / 10:00",
    );
    await user.click(screen.getByRole("button", { name: "Stop recording" }));
    expect(
      await screen.findByText("Your recording (stays on this device)"),
    ).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Get AI feedback" }));

    await waitFor(() =>
      expect(mocks.push).toHaveBeenCalledWith("/speaking/rec-1"),
    );
    const [url, init] = fetch.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("/api/speaking/submit");
    const form = init.body as FormData;
    expect((form.get("audio") as Blob).type).toBe("audio/webm;codecs=opus");
    expect(form.get("taskId")).toBe(task.id);
    expect(form.get("durationSeconds")).toBe("1");
  });

  it("stops by itself near the upload size limit", async () => {
    const user = userEvent.setup();
    mocks.allowance.mockResolvedValue({ ok: true, allowance: "allowed" });
    renderRecorder();
    await user.click(await screen.findByRole("button", { name: "Start" }));
    await screen.findByRole("button", { name: "Stop recording" });
    act(() => FakeRecorder.latest!.emit(4 * 1024 * 1024));
    expect(
      await screen.findByText(/Recording stopped at the size limit/),
    ).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Get AI feedback" }),
    ).toBeVisible();
  });

  it("offers self-practice when today's recorded answer is used", async () => {
    const user = userEvent.setup();
    mocks.allowance.mockResolvedValue({ ok: true, allowance: "daily_limit" });
    const fallback = renderRecorder();
    expect(
      await screen.findByText(/You have used today’s recorded answer/),
    ).toBeVisible();
    await user.click(
      screen.getByRole("button", { name: "Practise without recording" }),
    );
    expect(fallback).toHaveBeenCalled();
  });

  it("explains a refused microphone", async () => {
    const user = userEvent.setup();
    mocks.allowance.mockResolvedValue({ ok: true, allowance: "allowed" });
    getUserMedia.mockRejectedValue(new Error("NotAllowedError"));
    renderRecorder();
    await user.click(await screen.findByRole("button", { name: "Start" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      /Microphone access was refused/,
    );
  });

  it("asks for agreement before the first recording", async () => {
    mocks.allowance.mockResolvedValue({
      ok: true,
      allowance: "consent_required",
    });
    renderRecorder();
    expect(
      await screen.findByText(
        /Recordings are transcribed by Groq and then deleted/,
      ),
    ).toBeVisible();
  });
});

const feedback: WritingFeedback = {
  version: 1,
  criteria: (["task", "coherence", "vocabulary", "grammar"] as const).map(
    (id) => ({
      id,
      band: "B1",
      evidence: "je voudrais te proposer",
      comment: "Commentaire.",
    }),
  ),
  fixes: [
    {
      quote: "tu manque de temps",
      correction: "tu manques de temps",
      explanation: "With tu, add -s.",
      category: "verb",
    },
  ],
  rewrite: null,
  summary: "Clear proposal.",
  dropped: 0,
};

const submission = (
  overrides: Partial<SpeakingSubmission> = {},
): SpeakingSubmission => ({
  id: "6f1c5f3e-2d7a-4b1e-9c4a-1d2e3f4a5b6c",
  exam: "TEF Canada",
  taskId: task.id,
  transcript: "Bonjour Marc, je voudrais te proposer un défi.",
  metrics: {
    audioSeconds: 95,
    words: 140,
    speechSeconds: 92,
    wordsPerMinute: 88,
    longPauses: 4,
    longestPause: 3.1,
    startDelay: 1,
  },
  status: "done",
  feedback,
  createdAt: "2026-10-22T12:00:00Z",
  flaggedFixes: [],
  ...overrides,
});

describe("speaking feedback", () => {
  it("shows what was heard, pace and pauses, and the feedback", async () => {
    render(
      <AppProvider initialState={demoState}>
        <SpeakingFeedbackView submission={submission()} taskTitle="Défi" />
      </AppProvider>,
    );
    expect(await screen.findByText("This is what we heard")).toBeVisible();
    expect(
      screen.getByText("Bonjour Marc, je voudrais te proposer un défi."),
    ).toBeVisible();
    expect(screen.getByText("Recording: 1 min 35 s")).toBeVisible();
    expect(screen.getByText("88 words a minute · steady")).toBeVisible();
    expect(
      screen.getByText("4 pauses of 2 seconds or more (longest: 3.1 s)."),
    ).toBeVisible();
    expect(screen.getByText(/fill short silences/)).toBeVisible();
    expect(screen.getByText("Pronunciation is not assessed.")).toBeVisible();
    expect(screen.getByText("You said")).toBeVisible();
    expect(screen.queryByText(/From your text/)).not.toBeInTheDocument();
    expect(screen.getByText("tu manques de temps")).toBeVisible();
    expect(mocks.status).not.toHaveBeenCalled();
  });

  it("asks again for feedback on a failed review without recording", async () => {
    const user = userEvent.setup();
    mocks.requeue.mockResolvedValue({ ok: true });
    mocks.status.mockResolvedValue({
      ok: true,
      status: "queued",
      ahead: 0,
      capReached: false,
      feedback: null,
    });
    render(
      <AppProvider initialState={demoState}>
        <SpeakingFeedbackView
          submission={submission({ status: "failed", feedback: null })}
          taskTitle="Défi"
        />
      </AppProvider>,
    );
    expect(
      await screen.findByText("We could not review this answer"),
    ).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(mocks.requeue).toHaveBeenCalledWith(
      "6f1c5f3e-2d7a-4b1e-9c4a-1d2e3f4a5b6c",
    );
    expect(
      await screen.findByText("Your answer is in the queue"),
    ).toBeVisible();
  });
});
