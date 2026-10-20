import "server-only";

import { after } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

type ErrorDetails = {
  code?: string;
  status?: number;
  source: string;
};

type ErrorContext = Record<string, string | number | undefined>;

export function createErrorReference() {
  return crypto.randomUUID();
}

export function getErrorDetails(error: unknown): ErrorDetails {
  if (!error || typeof error !== "object") return { source: typeof error };

  const candidate = error as {
    code?: unknown;
    status?: unknown;
    name?: unknown;
  };

  return {
    code: typeof candidate.code === "string" ? candidate.code : undefined,
    status: typeof candidate.status === "number" ? candidate.status : undefined,
    source:
      typeof candidate.name === "string"
        ? candidate.name
        : "structured_server_error",
  };
}

/**
 * Stores the error after the response is sent. Vercel Hobby keeps runtime logs
 * for one hour, so the reference shown to a learner must be traceable later.
 * Logging never throws and never delays the learner's request.
 */
function persistError(
  reference: string,
  event: string,
  details: ErrorDetails,
  context: ErrorContext,
) {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) return;
  const write = async () => {
    try {
      await createAdminClient().rpc("mpk_log_app_error", {
        p_reference: reference,
        p_event: event,
        p_code: details.code ?? null,
        p_status: details.status ?? null,
        p_source: details.source,
        p_context: Object.fromEntries(
          Object.entries(context).filter(([, value]) => value !== undefined),
        ),
      });
    } catch {
      // The console entry below remains the fallback record.
    }
  };
  try {
    after(write);
  } catch {
    // Outside a request scope (scripts, tests): write without deferring.
    void write();
  }
}

export function logServerError(
  event: string,
  error: unknown,
  context: ErrorContext = {},
) {
  const reference = createErrorReference();
  const details = getErrorDetails(error);
  console.error(event, {
    reference,
    ...context,
    code: details.code ?? "unknown",
    status: details.status ?? "unknown",
    source: details.source,
  });
  persistError(reference, event, details, context);
  return reference;
}
