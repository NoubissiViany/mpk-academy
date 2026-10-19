import { beforeEach, describe, it, expect, vi } from "vitest";
const mocks = vi.hoisted(() => ({ rpc: vi.fn() }));
vi.mock("@/lib/supabase/learner", () => ({
  requireUserId: async () => ({ supabase: { rpc: mocks.rpc } }),
}));
vi.mock("@/content/mock-catalog", () => ({
  manifests: [
    {
      id: "fixture",
      exam: "TCF",
      version: "test",
      disclaimer: "Practice only",
      sections: [
        {
          skill: "listening",
          durationSeconds: 60,
          itemIds: ["fixture-listening"],
          navigation: "forward",
          taskTimers: false,
        },
      ],
    },
  ],
  mockItems: [
    {
      id: "fixture-listening",
      exam: "TCF",
      kind: "mcq",
      skill: "listening",
      prompt: "Question after listening",
      options: [{ id: "a", label: "One" }],
      audio: {
        id: "test-audio",
        status: "ready",
        path: "/test-only/fixture.wav",
        intendedDuration: 2,
        transcript: "SECRET TRANSCRIPT",
        speakers: [{ id: "a", role: "speaker" }],
      },
      correction: { answer: "a", explanation: "SECRET EXPLANATION" },
    },
  ],
}));
import { mockSessionEvent } from "./mock-session";
const id = "10000000-0000-4000-8000-000000000001";
const state = {
  status: "in_progress",
  sectionIndex: 0,
  itemIndex: 0,
  deadline: 9999999999999,
  taskDeadline: 9999999999999,
  taskStartedAt: 0,
  audioUntil: null,
  answers: {},
  consumedAudio: [],
};
beforeEach(() => {
  mocks.rpc.mockReset();
});
describe("mock candidate boundary", () => {
  it("hides TCF question, transcript and corrections before playback", async () => {
    mocks.rpc.mockResolvedValue({
      data: { id, manifestId: "fixture", state, audioGranted: false },
      error: null,
    });
    const result = await mockSessionEvent(id, "fixture", { type: "resume" });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.item?.options).toBeUndefined();
    expect(result.data.item?.audio?.path).toBeUndefined();
    expect(JSON.stringify(result)).not.toContain("SECRET");
  });
  it("releases a path only for a server-authorized first play", async () => {
    mocks.rpc.mockResolvedValue({
      data: {
        id,
        manifestId: "fixture",
        state: {
          ...state,
          consumedAudio: ["fixture-listening"],
          audioUntil: Date.now() + 2000,
        },
        audioGranted: true,
      },
      error: null,
    });
    const first = await mockSessionEvent(id, "fixture", {
      type: "play",
      itemId: "fixture-listening",
    });
    if (!first.ok) throw Error("fixture failed");
    expect(first.data.item?.audio?.path).toBe("/test-only/fixture.wav");
    expect(first.data.item?.options).toBeUndefined();
    mocks.rpc.mockResolvedValue({
      data: {
        id,
        manifestId: "fixture",
        state: {
          ...state,
          consumedAudio: ["fixture-listening"],
          audioUntil: 0,
        },
        audioGranted: false,
      },
      error: null,
    });
    const resumed = await mockSessionEvent(id, "fixture", { type: "resume" });
    if (!resumed.ok) throw Error("fixture failed");
    expect(resumed.data.item?.audio?.path).toBeUndefined();
    expect(resumed.data.item?.prompt).toBe("Question after listening");
    expect(JSON.stringify(resumed)).not.toContain("SECRET");
  });
  it("does not grant audio for a stale play that instead advanced an expired task", async () => {
    mocks.rpc.mockResolvedValue({
      data: { id, manifestId: "fixture", state, audioGranted: false },
      error: null,
    });
    const result = await mockSessionEvent(id, "fixture", {
      type: "play",
      itemId: "old-item",
    });
    if (!result.ok) throw Error("fixture failed");
    expect(result.data.item?.audio?.path).toBeUndefined();
  });
  it("reports pending audio without returning a candidate", async () => {
    mocks.rpc.mockResolvedValue({ data: null, error: { code: "55000" } });
    expect(await mockSessionEvent(null, "fixture", { type: "start" })).toEqual({
      ok: false,
      message: "Audio pending: full mock unavailable.",
    });
  });
});
