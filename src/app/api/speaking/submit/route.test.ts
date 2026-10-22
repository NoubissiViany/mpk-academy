// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  access: vi.fn(),
  requireUser: vi.fn(),
  userRpc: vi.fn(),
  adminRpc: vi.fn(),
  transcribe: vi.fn(),
  after: vi.fn(),
  consent: { value: "" },
  existing: { value: null as { id: string } | null },
}));

vi.mock("next/server", () => ({ after: mocks.after }));
vi.mock("@/i18n/server", async () => {
  const { messagesFor } = await import("@/i18n/messages");
  return {
    getLocale: async () => "fr",
    getMessages: async () => messagesFor("en"),
  };
});
vi.mock("@/lib/server/speaking/worker", () => ({
  processSpeakingQueue: vi.fn(async () => ({ processed: 1 })),
}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({ rpc: mocks.adminRpc }),
}));
vi.mock("@/lib/server/ai/groq", async (original) => ({
  ...(await original<typeof import("@/lib/server/ai/groq")>()),
  groqTranscribe: mocks.transcribe,
}));
vi.mock("@/lib/supabase/learner", () => ({
  getLearnerAccess: mocks.access,
  requireUserId: mocks.requireUser,
}));

import { aiFeedbackNoticeVersion } from "@/config/privacy";
import { GroqError } from "@/lib/server/ai/groq";
import { POST } from "./route";

const complete = {
  planAccess: { planId: "complete", purchasedAt: null, accessUntil: null },
  exam: "TEF Canada",
};
const spoken =
  "Bonjour je voudrais te proposer un défi de lecture avec moi ce mois-ci parce que";

function transcription(text = spoken) {
  const tokens = text.split(" ");
  return {
    text,
    duration: 94.6,
    segments: [
      { start: 0, end: 30, text, noSpeechProb: 0.01, avgLogprob: -0.2 },
    ],
    words: tokens.map((word, index) => ({
      word,
      start: 1 + index * 1.5,
      end: 1.4 + index * 1.5,
    })),
  };
}

function upload(
  audio: Blob = new Blob([new Uint8Array(4000)], {
    type: "audio/webm;codecs=opus",
  }),
) {
  const form = new FormData();
  form.append("audio", audio, "answer");
  form.append("taskId", "tef-speaking-section-b-001");
  form.append("clientKey", "6f1c5f3e-2d7a-4b1e-9c4a-1d2e3f4a5b6c");
  form.append("durationSeconds", "95");
  form.append("practiceSubmissionId", "7a1c5f3e-2d7a-4b1e-9c4a-1d2e3f4a5b6c");
  return POST(
    new Request("http://localhost/api/speaking/submit", {
      method: "POST",
      body: form,
    }),
  );
}

describe("speaking upload", () => {
  beforeEach(() => {
    vi.stubEnv("GROQ_API_KEY", "gsk_test");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service");
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    mocks.access.mockResolvedValue(complete);
    mocks.consent.value = aiFeedbackNoticeVersion;
    mocks.existing.value = null;
    mocks.requireUser.mockResolvedValue({
      userId: "user-1",
      supabase: {
        rpc: mocks.userRpc,
        from: (table: string) => ({
          select: () => ({
            eq: () => ({
              single: async () => ({
                data: { ai_feedback_consent_version: mocks.consent.value },
                error: null,
              }),
              maybeSingle: async () => ({
                data:
                  table === "speaking_submissions"
                    ? mocks.existing.value
                    : null,
                error: null,
              }),
            }),
          }),
        }),
      },
    });
    mocks.userRpc.mockResolvedValue({
      data: { id: "practice-1" },
      error: null,
    });
    mocks.adminRpc.mockImplementation(async (name: string) => {
      if (name === "mpk_speaking_allowance")
        return { data: "allowed", error: null };
      if (name === "mpk_submit_speaking")
        return { data: { id: "rec-1", status: "queued" }, error: null };
      return { data: null, error: null };
    });
    mocks.transcribe.mockResolvedValue(transcription());
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    Object.values(mocks).forEach(
      (mock) => typeof mock === "function" && mock.mockReset(),
    );
  });

  it("transcribes, keeps only the transcript and timings, and queues feedback", async () => {
    const response = await upload();
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true, id: "rec-1" });
    expect(mocks.transcribe).toHaveBeenCalledWith(
      expect.any(Blob),
      "answer.webm",
    );
    expect(mocks.adminRpc).toHaveBeenCalledWith("mpk_record_transcription", {
      p_model: "whisper-large-v3-turbo",
      p_audio_seconds: 95,
      p_failed: false,
    });
    expect(mocks.adminRpc).toHaveBeenCalledWith(
      "mpk_submit_speaking",
      expect.objectContaining({
        p_user_id: "user-1",
        p_exam: "TEF Canada",
        p_task_id: "tef-speaking-section-b-001",
        p_transcript: spoken,
        p_locale: "fr",
        p_audio_seconds: 95,
        p_metrics: expect.objectContaining({ words: 15, longPauses: 0 }),
      }),
    );
    expect(mocks.userRpc).toHaveBeenCalledWith(
      "mpk_submit_practice",
      expect.objectContaining({ p_skill: "speaking" }),
    );
    expect(mocks.after).toHaveBeenCalledTimes(1);
  });

  it("refuses before transcribing when today's answer is used", async () => {
    mocks.adminRpc.mockResolvedValue({ data: "daily_limit", error: null });
    const response = await upload();
    expect(response.status).toBe(429);
    expect(await response.json()).toMatchObject({
      ok: false,
      reason: "daily_limit",
    });
    expect(mocks.transcribe).not.toHaveBeenCalled();
  });

  it("requires agreement to the current AI notice", async () => {
    mocks.consent.value = "2026-10-21";
    const response = await upload();
    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({ reason: "consent_required" });
    expect(mocks.transcribe).not.toHaveBeenCalled();
  });

  it("is limited to plans that include it", async () => {
    mocks.access.mockResolvedValue({
      ...complete,
      planAccess: { ...complete.planAccess, planId: "essential" },
    });
    expect((await upload()).status).toBe(403);
    expect(mocks.transcribe).not.toHaveBeenCalled();
  });

  it("returns the first submission when the same upload is retried", async () => {
    mocks.existing.value = { id: "rec-0" };
    expect(await (await upload()).json()).toEqual({ ok: true, id: "rec-0" });
    expect(mocks.transcribe).not.toHaveBeenCalled();
  });

  it("asks to send again later when transcription is busy", async () => {
    mocks.transcribe.mockRejectedValue(new GroqError("rate_limited", 20, 429));
    const response = await upload();
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({
      reason: "busy",
      retryAfterSeconds: 20,
    });
    expect(mocks.adminRpc).not.toHaveBeenCalledWith(
      "mpk_submit_speaking",
      expect.anything(),
    );
  });

  it("explains when too little speech was heard", async () => {
    mocks.transcribe.mockResolvedValue(transcription("Euh bonjour"));
    const response = await upload();
    expect(response.status).toBe(422);
    expect(await response.json()).toMatchObject({ reason: "too_short" });
  });

  it("rejects recordings over the size limit and non-audio files", async () => {
    expect(
      (
        await upload(
          new Blob([new Uint8Array(4 * 1024 * 1024 + 1)], {
            type: "audio/webm",
          }),
        )
      ).status,
    ).toBe(413);
    expect(
      (await upload(new Blob([new Uint8Array(4000)], { type: "text/plain" })))
        .status,
    ).toBe(415);
  });

  it("asks unauthenticated callers to sign in", async () => {
    mocks.requireUser.mockRejectedValue(new Error("Unauthorized"));
    expect((await upload()).status).toBe(401);
  });
});
