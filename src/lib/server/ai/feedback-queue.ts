import "server-only";

import {
  feedbackJsonSchema,
  rawFeedbackSchema,
  verifyFeedback,
  type VerifyOptions,
  type WritingFeedback,
} from "@/lib/domain/writing-feedback";
import {
  GroqError,
  type ChatFunction,
  type ChatMessage,
} from "@/lib/server/ai/groq";
import { logServerError } from "@/lib/server/diagnostics";

// The loop shared by writing and speaking feedback: claim one job, ask the
// model, keep only what the learner's text supports, and either store the
// feedback or put the job back with a delay. Each skill supplies its prompt,
// its database calls, and its verification options.

export interface FeedbackQueue<Job extends { id: string }> {
  /** Label for logs. */
  operation: string;
  model: () => string;
  chat: ChatFunction;
  claim: () => Promise<Job | null>;
  /** The learner's text and the request, or null when the task is unknown. */
  prepare: (
    job: Job,
  ) => { text: string; messages: ChatMessage[]; verify?: VerifyOptions } | null;
  complete: (
    job: Job,
    feedback: WritingFeedback,
    tokens: number,
  ) => Promise<void>;
  retry: (
    job: Job,
    error: string,
    delaySeconds: number,
    final: boolean,
    tokens: number,
  ) => Promise<void>;
}

async function processJob<Job extends { id: string }>(
  queue: FeedbackQueue<Job>,
  job: Job,
): Promise<{ stop: boolean }> {
  const request = queue.prepare(job);
  if (!request) {
    await queue.retry(job, "unknown_task", 0, true, 0);
    return { stop: false };
  }
  try {
    const result = await queue.chat({
      model: queue.model(),
      messages: request.messages,
      schemaName: "learner_feedback",
      schema: feedbackJsonSchema,
      maxCompletionTokens: 2500,
    });
    let parsed: unknown;
    try {
      parsed = JSON.parse(result.content);
    } catch {
      parsed = null;
    }
    const raw = rawFeedbackSchema.safeParse(parsed);
    const feedback = raw.success
      ? verifyFeedback(request.text, raw.data, request.verify)
      : null;
    if (!feedback) {
      await queue.retry(job, "invalid_output", 30, false, result.totalTokens);
      return { stop: false };
    }
    await queue.complete(job, feedback, result.totalTokens);
    // Leave the rest of this minute's token allowance unused rather than hit 429.
    return {
      stop: result.remainingTokens !== null && result.remainingTokens < 3000,
    };
  } catch (error) {
    if (error instanceof GroqError) {
      if (error.kind === "rate_limited") {
        await queue.retry(
          job,
          "rate_limited",
          error.retryAfterSeconds ?? 60,
          false,
          0,
        );
        return { stop: true };
      }
      if (error.kind === "auth") {
        logServerError("AI provider rejected the API key", error, {
          operation: queue.operation,
        });
        await queue.retry(job, "provider_auth", 600, false, 0);
        return { stop: true };
      }
      if (error.kind === "rejected") {
        await queue.retry(job, "provider_rejected", 0, true, 0);
        return { stop: false };
      }
      await queue.retry(
        job,
        error.kind,
        error.kind === "invalid_output" ? 30 : 120,
        false,
        0,
      );
      return { stop: error.kind === "unavailable" };
    }
    logServerError("Feedback job failed", error, {
      operation: queue.operation,
    });
    await queue.retry(job, "server_error", 120, false, 0);
    return { stop: true };
  }
}

/**
 * Works through queued jobs one at a time until `maxJobs`, the deadline, an
 * empty queue, or the provider's per-minute limit stops it.
 */
export async function runFeedbackQueue<Job extends { id: string }>(
  queue: FeedbackQueue<Job>,
  { maxJobs, deadlineMs }: { maxJobs: number; deadlineMs: number },
) {
  const deadline = Date.now() + deadlineMs;
  let processed = 0;
  while (processed < maxJobs && Date.now() < deadline) {
    let job: Job | null;
    try {
      job = await queue.claim();
    } catch (error) {
      logServerError("Feedback queue claim failed", error, {
        operation: queue.operation,
      });
      break;
    }
    if (!job) break;
    processed += 1;
    if ((await processJob(queue, job)).stop) break;
  }
  return { processed };
}
