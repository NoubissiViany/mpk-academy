import "server-only";

type ErrorDetails = {
  code?: string;
  status?: number;
  source: string;
};

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

export function logServerError(
  event: string,
  error: unknown,
  context: Record<string, string | number | undefined> = {},
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
  return reference;
}
