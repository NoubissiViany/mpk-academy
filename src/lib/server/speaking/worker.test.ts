import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { groqTranscribe, type ChatFunction } from "@/lib/server/ai/groq";
import { buildSpeakingMessages, processSpeakingQueue } from "./worker";

const transcript =
  "Bonjour Marc. Je voudrais te proposer de participer au défi de lecture avec moi. Je sais que tu manque de temps mais ça prend juste vingt minutes par jour.";

const job = (overrides = {}) => ({
  id: "job-1",
  user_id: "user-1",
  exam: "TEF Canada",
  task_id: "tef-speaking-section-b-001",
  locale: "en",
  transcript,
  metrics: { audioSeconds: 95, wordsPerMinute: 88, longPauses: 2 },
  target: "NCLC 7",
  attempts: 1,
  ...overrides,
});

const feedback = {
  criteria: ["task", "coherence", "vocabulary", "grammar"].map((id) => ({
    id,
    band: "B1",
    evidence: "je voudrais te proposer de participer", // lower case, no capital
    comment: "Comment.",
  })),
  fixes: [
    {
      quote: "tu manque de temps",
      correction: "tu manques de temps",
      explanation: "With tu, the present tense ends in -s.",
      category: "verb",
    },
    {
      quote: "Bonjour Marc.",
      correction: "Bonjour, Marc.",
      explanation: "Comma before a name.",
      category: "punctuation",
    },
  ],
  rewrite: {
    original:
      "Je sais que tu manque de temps mais ça prend juste vingt minutes par jour",
    improved:
      "Je sais que tu manques de temps, mais cela ne prend que vingt minutes par jour.",
  },
  summary: "Clear proposal; work on verb endings.",
};

type WorkerClient = NonNullable<
  NonNullable<Parameters<typeof processSpeakingQueue>[0]>["client"]
>;

function fakeClient(jobs: ReturnType<typeof job>[]) {
  const queue = [...jobs];
  const rpc = vi.fn(async (name: string, args?: Record<string, unknown>) => {
    void args;
    if (name === "mpk_claim_speaking_jobs")
      return { data: queue.length ? [queue.shift()] : [], error: null };
    return { data: null, error: null };
  });
  return { client: { rpc } as unknown as WorkerClient, rpc };
}

describe("speaking feedback worker", () => {
  it("describes the task, the role-play, and the timing to the reviewer", () => {
    const [system, user] = buildSpeakingMessages(job(), {
      id: "tef-speaking-section-b-001",
      taskType: "section-b",
      title: "Un défi de lecture",
      scenario: "Convaincre un ami.",
      instructions: "Répondez à ses objections.",
      candidateRole: "Personne qui propose",
      interlocutorRole: "Ami pressé",
    } as never);
    expect(system.content).toContain("never comment on spelling");
    expect(user.content).toContain("tries to convince the other person");
    expect(user.content).toContain("Pace: 88 words per minute");
    expect(user.content).toContain("Pauses of 2 seconds or more: 2");
    expect(user.content).toContain("Rewrite level: B2");
    expect(user.content).not.toContain("NCLC");
    expect(user.content).toContain(`<transcript>\n${transcript}`);
  });

  it("tells the reviewer which objections the other person raised", () => {
    const [, user] = buildSpeakingMessages(
      job({ metrics: { audioSeconds: 200, objections: [0, 2] } }),
      {
        id: "tef-speaking-section-b-001",
        taskType: "section-b",
        title: "Un défi de lecture",
        scenario: "Convaincre un ami.",
        instructions: "Répondez à ses objections.",
        candidateRole: "Personne qui propose",
        interlocutorRole: "Ami pressé",
        objections: {
          voice: "male",
          lines: [
            "Je n’ai pas le temps.",
            "Je préfère les séries.",
            "Et si j’abandonne ?",
          ],
        },
      } as never,
    );
    expect(user.content).toContain("not the learner's words");
    expect(user.content).toContain("- Je n’ai pas le temps.");
    expect(user.content).toContain("- Et si j’abandonne ?");
    expect(user.content).not.toContain("Je préfère les séries.");
  });

  it("matches quotes loosely and drops spelling and punctuation fixes", async () => {
    const { client, rpc } = fakeClient([job()]);
    const chat: ChatFunction = async () => ({
      content: JSON.stringify(feedback),
      totalTokens: 1800,
      remainingTokens: 7000,
    });
    await expect(processSpeakingQueue({ client, chat })).resolves.toEqual({
      processed: 1,
    });
    const [, args] = rpc.mock.calls.find(
      ([name]) => name === "mpk_complete_speaking_job",
    )!;
    expect(args).toMatchObject({
      p_id: "job-1",
      p_model: "qwen/qwen3.8-27b",
      p_tokens: 1800,
      p_feedback: {
        criteria: expect.arrayContaining([
          expect.objectContaining({
            evidence: "je voudrais te proposer de participer",
          }),
        ]),
        fixes: [expect.objectContaining({ quote: "tu manque de temps" })],
        rewrite: expect.objectContaining({ improved: expect.any(String) }),
        dropped: 1,
      },
    });
  });
});

describe("transcription", () => {
  beforeEach(() => vi.stubEnv("GROQ_API_KEY", "gsk_test"));
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("asks for French with word and segment timings and reads them", async () => {
    const fetch = vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            text: " Bonjour à tous.",
            duration: 3.2,
            segments: [
              {
                start: 0,
                end: 2,
                text: " Bonjour à tous.",
                no_speech_prob: 0.02,
                avg_logprob: -0.1,
                compression_ratio: 1.1,
              },
            ],
            words: [
              { word: "Bonjour", start: 0.1, end: 0.6 },
              { word: "à", start: 0.7, end: 0.8 },
              { word: "tous", start: 0.9, end: 1.3 },
            ],
          }),
        ),
    );
    vi.stubGlobal("fetch", fetch);
    const result = await groqTranscribe(new Blob(["audio"]), "answer.webm");
    expect(result).toMatchObject({
      duration: 3.2,
      words: [{ word: "Bonjour", start: 0.1, end: 0.6 }, {}, {}],
      segments: [
        { noSpeechProb: 0.02, avgLogprob: -0.1, compressionRatio: 1.1 },
      ],
    });
    const form = (fetch.mock.calls[0] as unknown as [string, RequestInit])[1]
      .body as FormData;
    expect(form.get("model")).toBe("whisper-large-v3-turbo");
    expect(form.get("language")).toBe("fr");
    expect(form.get("response_format")).toBe("verbose_json");
    expect(form.getAll("timestamp_granularities[]")).toEqual([
      "word",
      "segment",
    ]);
  });

  it("reports a busy service with its retry time", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response("{}", { status: 429, headers: { "retry-after": "12" } }),
      ),
    );
    await expect(
      groqTranscribe(new Blob(["audio"]), "answer.webm"),
    ).rejects.toMatchObject({ kind: "rate_limited", retryAfterSeconds: 12 });
  });
});
