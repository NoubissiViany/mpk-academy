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
        include_reasoning: false,
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
      error?: { code?: string };
    } | null;
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
