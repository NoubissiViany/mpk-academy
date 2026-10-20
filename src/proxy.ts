import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

// Refresh the Supabase session only where Server Components read it. Marketing
// pages, the guest diagnostic, and the Stripe webhook skip the Supabase auth
// round trip, which matters on the free plans' invocation and egress budgets.
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/learn/:path*",
    "/practice/:path*",
    "/exam/:path*",
    "/progress/:path*",
    "/mistakes/:path*",
    "/weaknesses/:path*",
    "/profile/:path*",
    "/settings/:path*",
    "/beta/:path*",
    "/admin/:path*",
    "/auth/:path*",
    "/checkout/:path*",
  ],
};
