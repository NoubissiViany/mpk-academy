"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseEnv } from "@/lib/supabase/env";
import type { Database } from "@/types/database";
import type { SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient<Database> | undefined;

export function createClient() {
  if (!client) {
    const { url, publishableKey } = getSupabaseEnv();
    client = createBrowserClient<Database>(url, publishableKey);
  }
  return client;
}
