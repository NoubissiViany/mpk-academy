import "server-only";

// Minimal Groq chat client (OpenAI-compatible API). Errors are classified so
// the queue knows whether to wait, retry, or give up.

export const aiWritingModel = () =>
  process.env.GROQ_WRITING_MODEL?.trim() || "openai/gpt-oss-120b";

/** AI writing feedback needs the provider key and the server database key. */
export const isAiWritingConfigured = () =>
  Boolean(
    process.env.GROQ_API_KEY?.trim() &&
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim(),
  );

export type GroqErrorKind =
  "rate_limited" | "unavailable" | "auth" | "invalid_output" | "rejected";

export class GroqError extends Error {
  constructor(
    readonly kind: GroqErrorKind,
    readonly retryAfterSeconds: number | null = null,
    readonly status: number | null = null,
  ) {
    super(`Groq request failed: ${kind}`);
    this.name = "GroqError";
  }
}

export interface ChatMessage {
  role: "system" | "user";
  content: string;
}

export interface ChatResult {
  content: string;
  totalTokens: number;
  /** Tokens left in the current minute, when Groq reports it. */
  remainingTokens: number | null;
}

export type ChatFunction = (request: {
  model: string;
  messages: ChatMessage[];
  schemaName: string;
  schema: object;
  maxCompletionTokens: number;
}) => Promise<ChatResult>;

const numberHeader = (headers: Headers, name: string) => {
  const value = Number(headers.get(name));
  return Number.isFinite(value) && headers.has(name) ? value : null;
};

export const groqChat: ChatFunction = async ({
  model,
  messages,
  schemaName,
  schema,
  maxCompletionTokens,
}) => {
  const apiKey = process.env.GROQ_API_KEY?.trim();
  if (!apiKey) throw new GroqError("auth");
  let response: Response;
  try {
    response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.2,
        reasoning_effort: "low",
        // gpt-oss hides reasoning with include_reasoning; Qwen with reasoning_format.
        ...(model.startsWith("openai/gpt-oss")
          ? { include_reasoning: false }
          : { reasoning_format: "hidden" }),
        max_completion_tokens: maxCompletionTokens,
        response_format: {
          type: "json_schema",
          json_schema: { name: schemaName, strict: true, schema },
        },
      }),
      signal: AbortSignal.timeout(45_000),
    });
  } catch {
    throw new GroqError("unavailable");
  }

  if (response.status === 429)
    throw new GroqError(
      "rate_limited",
      numberHeader(response.headers, "retry-after") ?? 60,
      429,
    );
  if (response.status === 401 || response.status === 403)
    throw new GroqError("auth", null, response.status);
  if (response.status === 400 || response.status === 422) {
    const body = (await response.json().catch(() => null)) as {
      error?: { code?: string; failed_generation?: string };
    } | null;
    // Groq checks structured output after generating it and rejects answers
    // that miss the schema, but returns what the model wrote. The caller
    // validates leniently, so use it instead of paying for another attempt.
    const generated = body?.error?.failed_generation;
    if (body?.error?.code === "json_validate_failed" && generated)
      return {
        content: generated,
        // Usage is not reported on errors: estimate prompt plus output.
        totalTokens: 900 + Math.ceil(generated.length / 3),
        remainingTokens: numberHeader(
          response.headers,
          "x-ratelimit-remaining-tokens",
        ),
      };
    throw new GroqError(
      body?.error?.code === "json_validate_failed"
        ? "invalid_output"
        : "rejected",
      null,
      response.status,
    );
  }
  if (!response.ok) throw new GroqError("unavailable", null, response.status);

  const body = (await response.json().catch(() => null)) as {
    choices?: Array<{ message?: { content?: string | null } }>;
    usage?: { total_tokens?: number };
  } | null;
  const content = body?.choices?.[0]?.message?.content;
  if (!content) throw new GroqError("invalid_output", null, response.status);
  return {
    content,
    totalTokens: body?.usage?.total_tokens ?? 0,
    remainingTokens: numberHeader(
      response.headers,
      "x-ratelimit-remaining-tokens",
    ),
  };
};

// Chosen by testing on learner-like transcripts: it caught the real errors
// without "correcting" normal spoken French. It is a Groq preview model, so
// GROQ_SPEAKING_MODEL can switch to openai/gpt-oss-120b without a deploy.
export const aiSpeakingModel = () =>
  process.env.GROQ_SPEAKING_MODEL?.trim() || "qwen/qwen3.8-27b";

export const speechToTextModel = () =>
  process.env.GROQ_SPEECH_MODEL?.trim() || "whisper-large-v3-turbo";

/** Speaking feedback needs the same keys as writing feedback. */
export const isAiSpeakingConfigured = isAiWritingConfigured;

export interface Transcription {
  text: string;
  /** Seconds of audio, as measured by the provider when it says. */
  duration: number | null;
  segments: Array<{
    start: number;
    end: number;
    text: string;
    noSpeechProb?: number;
    avgLogprob?: number;
    compressionRatio?: number;
  }>;
  words: Array<{ word: string; start: number; end: number }>;
}

export type TranscribeFunction = (
  audio: Blob,
  filename: string,
) => Promise<Transcription>;

/** French transcription with word and segment timestamps. */
export const groqTranscribe: TranscribeFunction = async (audio, filename) => {
  const apiKey = process.env.GROQ_API_KEY?.trim();
  if (!apiKey) throw new GroqError("auth");
  const form = new FormData();
  form.append("file", audio, filename);
  form.append("model", speechToTextModel());
  form.append("language", "fr");
  form.append("temperature", "0");
  form.append("response_format", "verbose_json");
  form.append("timestamp_granularities[]", "word");
  form.append("timestamp_granularities[]", "segment");
  let response: Response;
  try {
    response = await fetch(
      "https://api.groq.com/openai/v1/audio/transcriptions",
      {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}` },
        body: form,
        signal: AbortSignal.timeout(45_000),
      },
    );
  } catch {
    throw new GroqError("unavailable");
  }
  if (response.status === 429)
    throw new GroqError(
      "rate_limited",
      numberHeader(response.headers, "retry-after") ?? 60,
      429,
    );
  if (response.status === 401 || response.status === 403)
    throw new GroqError("auth", null, response.status);
  if (
    response.status === 400 ||
    response.status === 413 ||
    response.status === 422
  )
    throw new GroqError("rejected", null, response.status);
  if (!response.ok) throw new GroqError("unavailable", null, response.status);

  const body = (await response.json().catch(() => null)) as {
    text?: string;
    duration?: number;
    segments?: Array<{
      start: number;
      end: number;
      text: string;
      no_speech_prob?: number;
      avg_logprob?: number;
      compression_ratio?: number;
    }>;
    words?: Array<{ word: string; start: number; end: number }>;
  } | null;
  if (!body || typeof body.text !== "string")
    throw new GroqError("invalid_output", null, response.status);
  return {
    text: body.text,
    duration: typeof body.duration === "number" ? body.duration : null,
    segments: (body.segments ?? []).map((segment) => ({
      start: segment.start,
      end: segment.end,
      text: segment.text,
      noSpeechProb: segment.no_speech_prob,
      avgLogprob: segment.avg_logprob,
      compressionRatio: segment.compression_ratio,
    })),
    words: (body.words ?? []).filter(
      (word) =>
        typeof word.word === "string" &&
        Number.isFinite(word.start) &&
        Number.isFinite(word.end),
    ),
  };
};
