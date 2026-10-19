import { readFileSync } from "node:fs";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import { AppProvider } from "@/components/providers/app-provider";
import { demoState } from "@/test/fixtures";
import type { MockSessionPayload } from "./mock-types";
const mocks = vi.hoisted(() => ({ event: vi.fn(), router: { push: vi.fn() } }));
vi.mock("next/navigation", () => ({ useRouter: () => mocks.router }));
vi.mock("@/content/mock-summaries", () => ({
  mockSummaries: [{ id: "test-mock", exam: "TEF", ready: true }],
}));
vi.mock("@/app/actions/mock-session", () => ({
  mockSessionEvent: mocks.event,
}));
import { ScaledMockSession } from "./scaled-mock-session";
// A one-second synthetic tone, used only by this test; never a production listening asset.
const audioFixture = readFileSync(
  `${process.cwd()}/src/test/audio/one-shot.wav`,
);
const testAudioPath = `data:audio/wav;base64,${audioFixture.toString("base64")}`;
let payload: MockSessionPayload;
beforeEach(() => {
  localStorage.clear();
  mocks.router.push.mockReset();
  mocks.event.mockReset();
  payload = {
    id: "10000000-0000-4000-8000-000000000001",
    manifestId: "test-mock",
    assessmentId: null,
    serverNow: Date.now(),
    manifest: {
      id: "test-mock",
      version: "test",
      exam: "TEF",
      disclaimer: "Independent MPK practice",
      sections: [
        {
          skill: "writing",
          durationSeconds: 3600,
          itemIds: ["test-writing"],
          navigation: "free",
          taskTimers: false,
        },
      ],
    },
    state: {
      status: "in_progress",
      sectionIndex: 0,
      itemIndex: 0,
      deadline: Date.now() + 3600000,
      taskDeadline: null,
      taskStartedAt: Date.now(),
      audioUntil: null,
      answers: {},
      consumedAudio: [],
    },
    item: {
      id: "test-writing",
      kind: "writing",
      skill: "writing",
      prompt: "Rédigez un message.",
      wordCount: { min: 80 },
    },
  };
  mocks.event.mockImplementation(
    async (
      _id: string,
      _manifest: string,
      event: { type: string; answer?: string },
    ) => {
      if (event.type === "answer")
        payload.state.answers["test-writing"] = event.answer ?? "";
      if (event.type === "tick") {
        payload.state.status = "completed";
        payload.assessmentId = "result-id";
        delete payload.item;
      }
      if (event.type === "play") {
        payload.state.consumedAudio = ["test-listening"];
        payload.state.audioUntil = Date.now() + 1000;
        if (payload.item?.audio) payload.item.audio.path = testAudioPath;
      }
      return {
        ok: true,
        data: structuredClone({ ...payload, serverNow: Date.now() }),
      };
    },
  );
});
afterEach(() => {
  cleanup();
  localStorage.clear();
});
const mount = () =>
  render(
    <AppProvider initialState={demoState}>
      <ScaledMockSession />
    </AppProvider>,
  );
describe("timed mock browser state", () => {
  it("autosaves writing and restores the server session on refresh", async () => {
    const first = mount();
    const input = await screen.findByRole("textbox", { name: "Votre réponse" });
    fireEvent.change(input, {
      target: { value: "Un texte conservé après actualisation." },
    });
    await waitFor(
      () =>
        expect(mocks.event).toHaveBeenCalledWith(
          payload.id,
          "test-mock",
          expect.objectContaining({
            type: "answer",
            answer: "Un texte conservé après actualisation.",
          }),
        ),
      { timeout: 3000 },
    );
    first.unmount();
    mount();
    expect(
      await screen.findByRole("textbox", { name: "Votre réponse" }),
    ).toHaveValue("Un texte conservé après actualisation.");
    expect(mocks.event).toHaveBeenCalledWith(
      payload.id,
      "test-mock",
      expect.objectContaining({ type: "resume" }),
    );
  });
  it("requests authoritative expiry and redirects to completed results", async () => {
    payload.state.deadline = Date.now() - 100;
    mount();
    await waitFor(
      () =>
        expect(mocks.router.push).toHaveBeenCalledWith(
          "/exam/results?assessment=result-id",
        ),
      { timeout: 3000 },
    );
  });
  it("offers one playback and no transcript or model help", async () => {
    expect(audioFixture.toString("ascii", 0, 4)).toBe("RIFF");
    expect(audioFixture.readUInt32LE(24)).toBe(8000);
    payload.manifest.sections[0] = {
      skill: "listening",
      durationSeconds: 60,
      itemIds: ["test-listening"],
      navigation: "forward",
      taskTimers: false,
    };
    payload.item = {
      id: "test-listening",
      kind: "mcq",
      skill: "listening",
      prompt: "Que propose la personne ?",
      options: [{ id: "a", label: "Une visite" }],
      audio: { id: "fixture", status: "ready", intendedDuration: 1 },
    };
    mount();
    fireEvent.click(
      await screen.findByRole("button", { name: "Écouter une fois" }),
    );
    await waitFor(() =>
      expect(
        screen.queryByRole("button", { name: "Écouter une fois" }),
      ).toBeNull(),
    );
    expect(document.querySelector("audio")).toHaveAttribute(
      "src",
      testAudioPath,
    );
    expect(
      screen.queryByText(/transcript-based|model response|planning guidance/i),
    ).toBeNull();
    expect(screen.getByRole("button", { name: "Précédent" })).toBeDisabled();
  });
});
