"use server";

import { after } from "next/server";
import { z } from "zod";
import { getLocale } from "@/i18n/server";
import { funnelSteps } from "@/lib/funnel";
import { createAdminClient } from "@/lib/supabase/admin";

const stepSchema = z.enum(funnelSteps);

/**
 * Adds one to today's total for a funnel step. Nothing about the visitor is
 * stored. Best effort: counting never delays or breaks the page.
 */
export async function recordFunnelStepAction(step: string): Promise<void> {
  const parsed = stepSchema.safeParse(step);
  if (!parsed.success || !process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) return;
  const locale = await getLocale();
  const write = async () => {
    try {
      await createAdminClient().rpc("mpk_record_funnel_step", {
        p_step: parsed.data,
        p_locale: locale,
      });
    } catch {
      // A missed count is acceptable; the learner's request is not affected.
    }
  };
  try {
    after(write);
  } catch {
    void write();
  }
}
