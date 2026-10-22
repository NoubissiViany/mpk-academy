import { timingSafeEqual } from "node:crypto";
import { isAiWritingConfigured } from "@/lib/server/ai/groq";
import { logServerError } from "@/lib/server/diagnostics";
import { processSpeakingQueue } from "@/lib/server/speaking/worker";
import { processWritingQueue } from "@/lib/server/writing/worker";

// Called every minute by pg_cron (only while essays or recordings wait). Protected by a
// shared secret stored in Vercel and in Supabase Vault.
export const maxDuration = 60;

function authorized(request: Request) {
  const secret = process.env.JOBS_SECRET?.trim();
  const header = request.headers.get("authorization") ?? "";
  if (!secret || secret.length < 32) return false;
  const expected = Buffer.from(`Bearer ${secret}`);
  const received = Buffer.from(header);
  return (
    expected.length === received.length && timingSafeEqual(expected, received)
  );
}

export async function POST(request: Request) {
  if (!authorized(request))
    return Response.json({ error: "unauthorized" }, { status: 401 });
  if (!isAiWritingConfigured())
    return Response.json({ error: "not_configured" }, { status: 404 });
  try {
    const writing = await processWritingQueue({
      maxJobs: 3,
      deadlineMs: 25_000,
    });
    const speaking = await processSpeakingQueue({
      maxJobs: 3,
      deadlineMs: 20_000,
    });
    return Response.json({
      processed: writing.processed + speaking.processed,
      writing: writing.processed,
      speaking: speaking.processed,
    });
  } catch (error) {
    const reference = logServerError("Writing job run failed", error, {
      operation: "run_writing_jobs",
    });
    return Response.json({ error: "failed", reference }, { status: 500 });
  }
}
