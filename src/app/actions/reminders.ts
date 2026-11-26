"use server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { validTimeZone } from "@/lib/reminders/time";
import type { ReminderPreferences } from "@/lib/reminders/types";

const preferencesSchema = z.object({
  enabled: z.boolean(),
  timeZone: z.string().refine(validTimeZone),
  timeZoneSource: z.enum(["auto", "manual"]),
  targetDate: z.iso.date().nullable(),
});
export async function getReminderPreferencesAction(): Promise<ReminderPreferences | null> {
  const db = await createClient();
  const { data, error } = await db.rpc("mpk_get_reminder_preferences");
  if (error || !data) return null;
  return preferencesSchema.parse(data);
}
export async function updateReminderPreferencesAction(
  input: ReminderPreferences,
  updateExamDate = true,
) {
  const parsed = preferencesSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const };
  const db = await createClient();
  const p = parsed.data;
  const { error } = await db.rpc("mpk_update_reminder_preferences", {
    p_enabled: p.enabled,
    p_time_zone: p.timeZone,
    p_manual: p.timeZoneSource === "manual",
    p_target_date: p.targetDate,
    p_update_target_date: updateExamDate === true,
  });
  return { ok: !error };
}
export async function recordStudyVisitAction(timeZone: string) {
  if (!validTimeZone(timeZone)) return;
  const db = await createClient();
  await db.rpc("mpk_record_study_visit", { p_time_zone: timeZone });
}
