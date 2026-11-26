import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
const schema = z.object({
  enabled: z.boolean(),
  pauseUntil: z.string().nullable(),
  pauseReason: z.string().nullable(),
  today: z.number(),
  month: z.number(),
  counts: z.record(z.string(), z.number()),
  failures: z.array(
    z.object({
      id: z.string(),
      status: z.string(),
      error_code: z.string().nullable(),
      attempted_at: z.string(),
    }),
  ),
});
export async function ReminderMetrics() {
  const { data, error } = await createAdminClient().rpc("mpk_reminder_metrics");
  if (error)
    return (
      <section className="rounded-2xl border bg-card p-5">
        <h2 className="text-lg font-bold">Study reminders</h2>
        <p>Reminder metrics are unavailable.</p>
      </section>
    );
  const metrics = schema.parse(data);
  return (
    <section className="space-y-4 rounded-2xl border bg-card p-5 sm:p-7">
      <h2 className="text-lg font-bold">Study reminders · Resend Free</h2>
      <p className="text-sm text-muted-foreground">
        Sending{" "}
        {metrics.enabled && process.env.STUDY_REMINDERS_ENABLED === "true"
          ? "enabled"
          : "disabled"}
        . Reserved deliveries include uncertain sends. Logs are retained for 30
        days.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <p>
          Today (UTC): <strong>{metrics.today} / 50</strong>
        </p>
        <p>
          This month (UTC): <strong>{metrics.month} / 1,500</strong>
        </p>
      </div>
      {metrics.pauseUntil && (
        <p>
          Provider pause until {metrics.pauseUntil}: {metrics.pauseReason}
        </p>
      )}
      <div className="flex flex-wrap gap-4 text-sm">
        {Object.entries(metrics.counts).map(([status, count]) => (
          <p key={status}>
            {status}: <strong>{count}</strong>
          </p>
        ))}
      </div>
      <h3 className="font-semibold">Recent failures</h3>
      {!metrics.failures.length ? (
        <p className="text-sm text-muted-foreground">No recent failures.</p>
      ) : (
        <ul className="space-y-2 text-sm">
          {metrics.failures.map((item) => (
            <li key={item.id} className="break-words">
              {item.attempted_at} · {item.status} · {item.error_code}
              <span className="block font-mono text-xs">{item.id}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
