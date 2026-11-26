import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getReminderPreferencesAction } from "@/app/actions/reminders";
import { ReminderPreferencesForm } from "@/features/reminders/preferences";
import { ActivityTracker } from "@/features/reminders/activity-tracker";
import { getLocale } from "@/i18n/server";
export const metadata = {
  title: "Email preferences",
  robots: { index: false, follow: false },
};
export default async function EmailPreferencesPage() {
  const db = await createClient();
  const { data, error } = await db.auth.getUser();
  if (error || !data.user) redirect("/login?next=%2Femail-preferences");
  const preferences = await getReminderPreferencesAction();
  const fr = (await getLocale()) === "fr";
  return (
    <div className="container-page max-w-3xl py-12">
      <h1 className="text-3xl font-bold">
        {fr ? "Préférences de courriel" : "Email preferences"}
      </h1>
      <ActivityTracker userId={data.user.id} />
      <ReminderPreferencesForm initial={preferences ?? undefined} />
    </div>
  );
}
