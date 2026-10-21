import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured, getSupabaseEnv } from "@/lib/supabase/env";
import type { Database } from "@/types/database";

export async function updateSession(request: NextRequest) {
  if (!isSupabaseConfigured()) return NextResponse.next({ request });

  let response = NextResponse.next({ request });
  const { url, publishableKey } = getSupabaseEnv();
  const supabase = createServerClient<Database>(url, publishableKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  const { data, error } = await supabase.auth.getClaims();
  // Signed-out visitors go straight to sign-in, before any page renders. On an
  // auth error the page decides, so an outage never looks like a sign-out.
  if (!error && !data?.claims && requiresSignIn(request.nextUrl.pathname)) {
    const login = new URL("/login", request.url);
    login.searchParams.set(
      "next",
      request.nextUrl.pathname + request.nextUrl.search,
    );
    const redirect = NextResponse.redirect(login);
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
    redirect.headers.set("Cache-Control", "private, no-store");
    return redirect;
  }
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

// Learner areas only: /auth, /checkout, /beta, and /admin answer signed-out
// visitors themselves (callbacks, the account prompt, and a plain 404).
const learnerAreas = [
  "/dashboard",
  "/learn",
  "/practice",
  "/exam",
  "/progress",
  "/mistakes",
  "/weaknesses",
  "/profile",
  "/settings",
  "/writing",
];

export const requiresSignIn = (pathname: string) =>
  learnerAreas.some(
    (area) => pathname === area || pathname.startsWith(`${area}/`),
  );
