import "server-only";

import { unstable_rethrow } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const adminEmails = () =>
  new Set(
    (process.env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );

/** Returns the signed-in administrator's email, or null for everyone else. */
export async function getAdminEmail() {
  const allowed = adminEmails();
  if (!allowed.size) return null;
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getClaims();
    const email = data?.claims?.email;
    return typeof email === "string" && allowed.has(email.toLowerCase())
      ? email
      : null;
  } catch (error) {
    unstable_rethrow(error);
    return null;
  }
}
