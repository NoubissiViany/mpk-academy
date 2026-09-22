import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { logServerError } from "@/lib/server/diagnostics";
import { createClient } from "@/lib/supabase/server";

function safePath(value: string | null) {
  return value?.startsWith("/") && !value.startsWith("//")
    ? value
    : "/auth/complete";
}

export async function GET(request: NextRequest) {
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const code = request.nextUrl.searchParams.get("code");
  const type = request.nextUrl.searchParams.get("type") as EmailOtpType | null;
  const next = safePath(request.nextUrl.searchParams.get("next"));
  let confirmationError: unknown = new Error(
    "Confirmation link is missing its verification parameters.",
  );

  if (tokenHash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type,
    });
    if (!error) return NextResponse.redirect(new URL(next, request.url));
    confirmationError = error;
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, request.url));
    confirmationError = error;
  }

  const reference = logServerError(
    "Email confirmation failed",
    confirmationError,
    { operation: "confirm_email" },
  );
  return NextResponse.redirect(
    new URL(
      `/login?error=confirmation&ref=${encodeURIComponent(reference)}`,
      request.url,
    ),
  );
}
