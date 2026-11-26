import { Resend } from "resend";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
const emailEvent = z.object({
  type: z.string(),
  data: z.object({
    email_id: z.string(),
    to: z.array(z.email()),
    tags: z.record(z.string(), z.string()).optional(),
  }),
});
export async function POST(request: Request) {
  const secret = process.env.RESEND_REMINDER_WEBHOOK_SECRET;
  if (!secret)
    return Response.json({ error: "not_configured" }, { status: 503 });
  if (Number(request.headers.get("content-length")) > 256_000)
    return new Response(null, { status: 413 });
  let event;
  const eventId = request.headers.get("svix-id") ?? "";
  try {
    const payload = await request.text();
    if (payload.length > 256_000) return new Response(null, { status: 413 });
    // Verification is local; the SDK does not need the sending credential.
    event = new Resend("webhook-verification-only").webhooks.verify({
      payload,
      headers: {
        id: eventId,
        timestamp: request.headers.get("svix-timestamp") ?? "",
        signature: request.headers.get("svix-signature") ?? "",
      },
      webhookSecret: secret,
    });
  } catch {
    return Response.json({ error: "invalid_signature" }, { status: 400 });
  }
  const parsed = emailEvent.safeParse(event);
  if (!parsed.success) return Response.json({ received: true });
  const { type, data } = parsed.data;
  const deliveryId = z.uuid().safeParse(data.tags?.delivery_id);
  const db = createAdminClient();
  // One recipient per reminder. Bounce/complaint suppression also respects
  // verified events for auth mail from the same account, without changing SMTP.
  const { error } = await db.rpc("mpk_reminder_webhook", {
    p_event_id: eventId,
    p_type: type,
    p_provider_id: data.email_id,
    p_email: data.to[0] ?? "",
    ...(deliveryId.success ? { p_delivery_id: deliveryId.data } : {}),
  });
  return Response.json(
    error ? { error: "storage_failed" } : { received: true },
    { status: error ? 503 : 200 },
  );
}
