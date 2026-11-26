import { timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { processStudyReminders } from "@/lib/server/reminders/worker";
import { logServerError } from "@/lib/server/diagnostics";
export const maxDuration = 60;
const jobInput = z
  .object({
    dryRun: z.boolean().optional(),
    previewOutsideWindow: z.boolean().optional(),
    controlledRecipient: z.email().optional(),
  })
  .strict();
export async function POST(request: Request) {
  const secret = process.env.JOBS_SECRET?.trim();
  const received = Buffer.from(request.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);
  if (
    !secret ||
    secret.length < 32 ||
    received.length !== expected.length ||
    !timingSafeEqual(received, expected)
  )
    return Response.json({ error: "unauthorized" }, { status: 401 });
  let body: z.infer<typeof jobInput>;
  try {
    body = jobInput.parse(await request.json());
  } catch {
    return Response.json({ error: "invalid_body" }, { status: 400 });
  }
  try {
    return Response.json(
      await processStudyReminders({
        dryRun:
          body.dryRun === true ||
          process.env.STUDY_REMINDERS_ENABLED !== "true",
        previewOutsideWindow: body.previewOutsideWindow === true,
        controlledRecipient: body.controlledRecipient,
      }),
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    const reference = logServerError("Study reminder worker failed", error, {
      operation: "study_reminders",
    });
    return Response.json({ error: "failed", reference }, { status: 500 });
  }
}
