import "server-only";
import { randomUUID } from "node:crypto";
import { Resend } from "resend";
import { isBetaMode } from "@/config/product";
import { getAppUrl } from "@/lib/app-url";
import { createAdminClient } from "@/lib/supabase/admin";
import { chooseReminder } from "@/lib/reminders/eligibility";
import { renderReminder } from "@/lib/reminders/email";
import type { ReminderClaim, ReminderContext } from "@/lib/reminders/types";
import type { Json } from "@/types/database";
import { signUnsubscribe } from "./token";

export function providerFailure(
  name: string,
  status: number | null,
  now: Date,
  retryAfter?: string,
) {
  let pauseUntil: Date | undefined;
  if (name === "daily_quota_exceeded")
    pauseUntil = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1),
    );
  else if (name === "monthly_quota_exceeded")
    pauseUntil = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1),
    );
  else if (status === 429) {
    const seconds = Number(retryAfter);
    const retryTime =
      retryAfter && !Number.isFinite(seconds)
        ? Date.parse(retryAfter)
        : now.getTime() + Math.max(60, seconds || 60) * 1000;
    pauseUntil = new Date(Math.max(now.getTime() + 60_000, retryTime || 0));
  } else if (status === 401 || status === 403)
    pauseUntil = new Date(now.getTime() + 24 * 3_600_000);
  const retry =
    !status ||
    status >= 500 ||
    status === 429 ||
    name === "concurrent_idempotent_requests";
  return {
    status: retry ? "retry" : "failed",
    pauseUntil: pauseUntil?.toISOString(),
  };
}

export async function processStudyReminders(
  options: {
    dryRun?: boolean;
    previewOutsideWindow?: boolean;
    controlledRecipient?: string;
  } = {},
) {
  const dryRun = options.dryRun !== false;
  if (!dryRun && process.env.STUDY_REMINDERS_ENABLED !== "true")
    return { disabled: true, sent: 0 };
  const db = createAdminClient();
  const maintenance = await db.rpc("mpk_reminder_maintenance");
  if (maintenance.error) throw maintenance.error;
  const response = await db.rpc("mpk_reminder_candidates");
  if (response.error) throw response.error;
  const contexts = response.data as unknown as ReminderContext[];
  const allowed = new Set(
    (process.env.STUDY_REMINDER_ALLOWED_EMAILS ?? "")
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean),
  );
  const controlledRecipient = options.controlledRecipient?.trim().toLowerCase();
  if (
    options.controlledRecipient !== undefined &&
    (!controlledRecipient || !allowed.has(controlledRecipient))
  )
    throw new Error(
      "Controlled tests require an explicitly allowlisted recipient",
    );
  const outsideWindow =
    Boolean(controlledRecipient) ||
    Boolean(dryRun && options.previewOutsideWindow);
  const appUrl = getAppUrl();
  if (!dryRun && !appUrl.startsWith("https://"))
    throw new Error("Reminder delivery requires an HTTPS application URL");
  const from =
    process.env.STUDY_REMINDER_FROM?.trim() ||
    "MPK Academy <no-reply@mpkacademy.com>";
  const apiKey = process.env.RESEND_REMINDER_API_KEY?.trim();
  if (!dryRun && !apiKey)
    throw new Error("Dedicated Resend reminder key is not configured");
  const resend = !dryRun ? new Resend(apiKey) : null;
  const previews: {
    userId: string;
    email: string;
    kind: string;
    subject: string;
    text: string;
    html: string;
  }[] = [];
  let sent = 0;
  let attempted = 0;
  const deadline = Date.now() + 45_000;
  for (const context of contexts) {
    if (Date.now() > deadline) break;
    if (allowed.size && !allowed.has(context.email)) continue;
    if (controlledRecipient && context.email !== controlledRecipient) continue;
    const decision = chooseReminder(context, new Date(), outsideWindow);
    if (!decision) continue;
    const id = context.pending?.id ?? randomUUID();
    const token = dryRun
      ? null
      : signUnsubscribe({
          userId: context.userId,
          version: context.unsubscribeVersion,
          locale: context.locale,
        });
    const message = renderReminder(context, decision, {
      appUrl,
      from,
      beta: isBetaMode(),
      deliveryId: id,
      unsubscribeUrl: token
        ? `${appUrl}/email-preferences/unsubscribe?token=${token}`
        : `${appUrl}/email-preferences`,
    });
    if (dryRun) {
      previews.push({
        userId: context.userId,
        email: context.email,
        kind: decision.kind,
        subject: message.subject,
        text: message.text,
        html: message.html,
      });
      continue;
    }
    const claim = await db.rpc("mpk_claim_reminder", {
      p_context: context as unknown as Json,
      p_kind: decision.kind,
      p_payload: message as unknown as Json,
      p_id: id,
      ...(controlledRecipient
        ? { p_controlled_recipient: controlledRecipient }
        : {}),
    });
    if (claim.error) throw claim.error;
    if (!claim.data) continue;
    const delivery = claim.data as unknown as ReminderClaim;
    const outcome = { p_id: delivery.id, p_lease: delivery.lease };
    // Check opt-out, completion, email/goal changes and access again after claim.
    const check = await db.rpc("mpk_reminder_send_context", outcome);
    if (check.error) throw check.error;
    const current = check.data as unknown as ReminderContext | null;
    if (
      !current ||
      chooseReminder(current, new Date(), outsideWindow)?.kind !==
        decision.kind ||
      current.hasAccess !== context.hasAccess ||
      current.hasDiagnostic !== context.hasDiagnostic ||
      current.locale !== context.locale
    ) {
      const cancelled = await db.rpc("mpk_finish_reminder", {
        ...outcome,
        p_status: "failed",
        p_error: "eligibility_changed",
      });
      if (cancelled.error) throw cancelled.error;
      continue;
    }
    attempted++;
    let result;
    try {
      result = await resend!.emails.send(delivery.payload, {
        idempotencyKey: `study-reminder/${delivery.id}`,
        signal: AbortSignal.timeout(10_000),
      });
    } catch {
      // A timeout is ambiguous. Keep the reservation and frozen payload so a
      // retry uses exactly the same key, within the provider's 24-hour window.
      const saved = await db.rpc("mpk_finish_reminder", {
        ...outcome,
        p_status: "retry",
        p_error: "transport_unknown",
      });
      if (saved.error) throw saved.error;
      continue;
    }
    if (result.error) {
      const failure = providerFailure(
        result.error.name,
        result.error.statusCode,
        new Date(),
        result.headers?.["retry-after"],
      );
      const saved = await db.rpc("mpk_finish_reminder", {
        ...outcome,
        p_status: failure.status,
        p_error: result.error.name,
        ...(failure.pauseUntil ? { p_pause_until: failure.pauseUntil } : {}),
      });
      if (saved.error) throw saved.error;
      if (failure.pauseUntil) break;
    } else {
      const saved = await db.rpc("mpk_finish_reminder", {
        ...outcome,
        p_status: "sent",
        p_provider_id: result.data.id,
      });
      if (saved.error) throw saved.error;
      sent++;
    }
    // Leave room for auth traffic in the account-wide request-rate limit.
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  return { dryRun, attempted, sent, ...(dryRun ? { previews } : {}) };
}
