"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getReminderPreferencesAction,
  updateReminderPreferencesAction,
} from "@/app/actions/reminders";
import { useApp } from "@/components/providers/app-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/i18n/client";
import { defaultTimeZone } from "@/lib/reminders/time";
import type { ReminderPreferences } from "@/lib/reminders/types";

export function ReminderPreferencesForm({
  initial,
  editExamDate = true,
}: {
  initial?: ReminderPreferences;
  editExamDate?: boolean;
}) {
  const { locale } = useI18n();
  const { state, updateUser } = useApp();
  const router = useRouter();
  const fr = locale === "fr";
  const [value, setValue] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<"saved" | "error" | null>(null);
  useEffect(() => {
    if (initial) return;
    let active = true;
    void getReminderPreferencesAction()
      .then((p) => {
        if (active) {
          if (p) setValue(p);
          else setStatus("error");
        }
      })
      .catch(() => {
        if (active) setStatus("error");
      });
    return () => {
      active = false;
    };
  }, [initial]);
  const copy = fr
    ? {
        title: "Rappels d’étude par courriel",
        enable: "Recevoir des rappels d’étude",
        description:
          "Vers 18 h dans votre fuseau horaire, au maximum trois fois par semaine et à au moins 48 heures d’intervalle. Après 30 jours d’inactivité, un seul rappel par semaine. Vous pouvez les désactiver à tout moment.",
        auto: "Détecter mon fuseau horaire lors de mes visites",
        zone: "Fuseau horaire",
        date: "Date d’examen (facultative)",
        help: "Effacez la date si elle n’est plus prévue. Les rappels restent suspendus après une date passée jusqu’à sa modification.",
        saved: "Préférences enregistrées.",
        error:
          "Impossible d’enregistrer ou de charger vos préférences. Réessayez.",
        save: "Enregistrer",
        loading: "Chargement…",
        saving: "Enregistrement…",
      }
    : {
        title: "Study reminder emails",
        enable: "Receive study reminders",
        description:
          "Around 6 p.m. in your time zone, at most three times a week and at least 48 hours apart. After 30 days of inactivity, reminders drop to once a week. You can turn them off at any time.",
        auto: "Detect my time zone when I visit",
        zone: "Time zone",
        date: "Exam date (optional)",
        help: "Clear the date if your exam is no longer scheduled. After a past exam date, reminders pause until you change it.",
        saved: "Preferences saved.",
        error: "Could not save or load your preferences. Please try again.",
        save: "Save preferences",
        loading: "Loading…",
        saving: "Saving…",
      };
  return (
    <section
      className="my-8 rounded-2xl border bg-card p-5 sm:p-7"
      aria-labelledby="reminder-heading"
    >
      <h2 id="reminder-heading" className="text-lg font-bold">
        {copy.title}
      </h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        {copy.description}
      </p>
      {!value ? (
        <p role="status" className="mt-4">
          {status === "error" ? copy.error : copy.loading}
        </p>
      ) : (
        <form
          className="mt-5 space-y-5"
          onSubmit={async (event) => {
            event.preventDefault();
            setBusy(true);
            setStatus(null);
            try {
              const result = await updateReminderPreferencesAction(
                value,
                editExamDate,
              );
              setStatus(result.ok ? "saved" : "error");
              if (result.ok) {
                if (state.user && editExamDate)
                  updateUser({
                    ...state.user,
                    goal: {
                      ...state.user.goal,
                      targetDate: value.targetDate ?? undefined,
                    },
                  });
                router.refresh();
              }
            } catch {
              setStatus("error");
            } finally {
              setBusy(false);
            }
          }}
        >
          <label className="flex min-h-11 items-center gap-3 text-sm font-semibold">
            <input
              type="checkbox"
              checked={value.enabled}
              onChange={(e) =>
                setValue({ ...value, enabled: e.target.checked })
              }
              className="size-5 accent-primary"
            />
            {copy.enable}
          </label>
          <label className="flex min-h-11 items-center gap-3 text-sm">
            <input
              type="checkbox"
              checked={value.timeZoneSource === "auto"}
              onChange={(e) =>
                setValue({
                  ...value,
                  timeZoneSource: e.target.checked ? "auto" : "manual",
                  timeZone: e.target.checked
                    ? Intl.DateTimeFormat().resolvedOptions().timeZone ||
                      defaultTimeZone
                    : value.timeZone,
                })
              }
              className="size-5 accent-primary"
            />
            {copy.auto}
          </label>
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block text-sm font-semibold">
              {copy.zone}
              <Input
                className="mt-2"
                list="reminder-timezones"
                required
                value={value.timeZone}
                disabled={value.timeZoneSource === "auto"}
                onChange={(e) =>
                  setValue({ ...value, timeZone: e.target.value })
                }
              />
              <datalist id="reminder-timezones">
                {[
                  "America/Toronto",
                  "America/Vancouver",
                  "America/Edmonton",
                  "America/Winnipeg",
                  "America/Halifax",
                  "America/St_Johns",
                  "Europe/Paris",
                  "Africa/Abidjan",
                  "Africa/Douala",
                  "Africa/Casablanca",
                  "UTC",
                ].map((zone) => (
                  <option key={zone} value={zone} />
                ))}
              </datalist>
            </label>
            {editExamDate && (
              <label className="block text-sm font-semibold">
                {copy.date}
                <Input
                  type="date"
                  className="mt-2"
                  value={value.targetDate ?? ""}
                  onChange={(e) =>
                    setValue({ ...value, targetDate: e.target.value || null })
                  }
                />
              </label>
            )}
          </div>
          {editExamDate && (
            <p className="text-sm leading-6 text-muted-foreground">
              {copy.help}
            </p>
          )}
          <Button type="submit" disabled={busy}>
            {busy ? copy.saving : copy.save}
          </Button>
          {status && (
            <p
              role={status === "error" ? "alert" : "status"}
              className="text-sm"
            >
              {status === "saved" ? copy.saved : copy.error}
            </p>
          )}
        </form>
      )}
    </section>
  );
}
