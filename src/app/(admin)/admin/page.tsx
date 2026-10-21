import { notFound } from "next/navigation";
import { z } from "zod";
import {
  createBetaInviteAction,
  revokeBetaInviteAction,
  updateBetaSettingsAction,
} from "@/app/actions/admin";
import { Wordmark } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getAdminEmail } from "@/lib/server/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAiWritingConfigured } from "@/lib/server/ai/groq";
import {
  AiUsageSection,
  aiUsageSchema,
  EngagementSummary,
  FunnelSection,
  metricsSchema,
  TestersSection,
} from "./metrics";

// No title: the route should not announce itself to visitors who get a 404.
export const metadata = { robots: { index: false, follow: false } };

const overviewSchema = z.object({
  seatLimit: z.number(),
  accessDays: z.number(),
  seatsUsed: z.number(),
  invites: z.array(
    z.object({
      code: z.string(),
      label: z.string().nullable(),
      maxUses: z.number(),
      useCount: z.number(),
      expiresAt: z.string().nullable(),
      revokedAt: z.string().nullable(),
      createdAt: z.string(),
    }),
  ),
  testers: z.array(
    z.object({
      email: z.string().nullable(),
      firstName: z.string(),
      code: z.string(),
      redeemedAt: z.string(),
      accessUntil: z.string().nullable(),
      active: z.boolean(),
    }),
  ),
});

const errorsSchema = z.array(
  z.object({
    reference: z.string(),
    event: z.string(),
    code: z.string().nullable(),
    status: z.number().nullable(),
    source: z.string().nullable(),
    context: z.record(z.string(), z.unknown()),
    createdAt: z.string(),
  }),
);

const dateTime = (value: string | null) =>
  value
    ? new Intl.DateTimeFormat("en-CA", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "America/Toronto",
      }).format(new Date(value))
    : "—";

function inviteState(
  invite: z.infer<typeof overviewSchema>["invites"][number],
) {
  if (invite.revokedAt) return "Revoked";
  if (invite.expiresAt && Date.parse(invite.expiresAt) <= Date.now())
    return "Expired";
  if (invite.useCount >= invite.maxUses) return "Used up";
  return "Active";
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const adminEmail = await getAdminEmail();
  if (!adminEmail) notFound();
  const { error } = await searchParams;

  const admin = createAdminClient();
  const [overviewResponse, errorsResponse, metricsResponse, aiResponse] =
    await Promise.all([
      admin.rpc("mpk_admin_beta_overview"),
      admin.rpc("mpk_admin_recent_errors", { p_limit: 50 }),
      admin.rpc("mpk_admin_beta_metrics"),
      admin.rpc("mpk_admin_ai_usage"),
    ]);
  if (overviewResponse.error) throw overviewResponse.error;
  if (errorsResponse.error) throw errorsResponse.error;
  if (metricsResponse.error) throw metricsResponse.error;
  if (aiResponse.error) throw aiResponse.error;
  const aiUsage = aiUsageSchema.parse(aiResponse.data);
  const overview = overviewSchema.parse(overviewResponse.data);
  const errors = errorsSchema.parse(errorsResponse.data);
  const metrics = metricsSchema.parse(metricsResponse.data);
  const seatsLeft = Math.max(overview.seatLimit - overview.seatsUsed, 0);

  return (
    <div className="container-page space-y-8 py-10">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Wordmark />
          <h1 className="mt-4 text-3xl font-bold">Beta administration</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Signed in as {adminEmail}
          </p>
        </div>
      </header>

      {error && (
        <p
          role="alert"
          className="rounded-xl border border-danger/25 bg-danger/5 px-4 py-3 text-sm text-danger"
        >
          {error}
        </p>
      )}

      <section className="grid gap-4 sm:grid-cols-3">
        {[
          ["Seats used", `${overview.seatsUsed} / ${overview.seatLimit}`],
          ["Seats left", String(seatsLeft)],
          ["Access per tester", `${overview.accessDays} days`],
        ].map(([label, value]) => (
          <Card key={label}>
            <CardContent className="pt-5">
              <p className="text-sm text-muted-foreground">{label}</p>
              <p className="mt-1 text-2xl font-bold">{value}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardContent className="space-y-4 pt-6">
            <h2 className="text-lg font-bold">Create an invite</h2>
            <form action={createBetaInviteAction} className="space-y-3">
              <label className="block text-sm font-semibold">
                Code (leave empty to generate)
                <Input
                  name="code"
                  className="mt-1 uppercase"
                  placeholder="MPK-XXXX-XXXX"
                />
              </label>
              <label className="block text-sm font-semibold">
                Label
                <Input
                  name="label"
                  className="mt-1"
                  placeholder="Cohort 1 — Reddit"
                />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-sm font-semibold">
                  Max uses
                  <Input
                    name="maxUses"
                    type="number"
                    min={1}
                    max={1000}
                    defaultValue={1}
                    className="mt-1"
                  />
                </label>
                <label className="block text-sm font-semibold">
                  Expires in days (optional)
                  <Input
                    name="expiresInDays"
                    type="number"
                    min={1}
                    max={365}
                    className="mt-1"
                  />
                </label>
              </div>
              <Button>Create invite</Button>
            </form>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-4 pt-6">
            <h2 className="text-lg font-bold">Beta settings</h2>
            <form action={updateBetaSettingsAction} className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-sm font-semibold">
                  Seat limit
                  <Input
                    name="seatLimit"
                    type="number"
                    min={0}
                    max={10000}
                    defaultValue={overview.seatLimit}
                    className="mt-1"
                  />
                </label>
                <label className="block text-sm font-semibold">
                  Access days for new testers
                  <Input
                    name="accessDays"
                    type="number"
                    min={1}
                    max={365}
                    defaultValue={overview.accessDays}
                    className="mt-1"
                  />
                </label>
              </div>
              <p className="text-xs leading-5 text-muted-foreground">
                The free plans are sized for 40 active testers. Raise the limit
                only after checking Vercel, Supabase, and Groq usage.
              </p>
              <Button variant="secondary">Save settings</Button>
            </form>
          </CardContent>
        </Card>
      </section>

      <section>
        <h2 className="text-lg font-bold">Invites</h2>
        <div className="mt-3 overflow-x-auto rounded-xl border">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/60 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-3 py-2">Code</th>
                <th className="px-3 py-2">Label</th>
                <th className="px-3 py-2">Uses</th>
                <th className="px-3 py-2">Expires</th>
                <th className="px-3 py-2">State</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {overview.invites.map((invite) => (
                <tr key={invite.code} className="border-t">
                  <td className="px-3 py-2 font-mono">{invite.code}</td>
                  <td className="px-3 py-2">{invite.label ?? "—"}</td>
                  <td className="px-3 py-2">
                    {invite.useCount} / {invite.maxUses}
                  </td>
                  <td className="px-3 py-2">{dateTime(invite.expiresAt)}</td>
                  <td className="px-3 py-2">{inviteState(invite)}</td>
                  <td className="px-3 py-2 text-right">
                    {!invite.revokedAt && (
                      <form action={revokeBetaInviteAction}>
                        <input type="hidden" name="code" value={invite.code} />
                        <button className="text-sm font-semibold text-danger hover:underline">
                          Revoke
                        </button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
              {!overview.invites.length && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-3 py-6 text-center text-muted-foreground"
                  >
                    No invites yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <AiUsageSection usage={aiUsage} configured={isAiWritingConfigured()} />
      <FunnelSection funnel={metrics.funnel} />
      <EngagementSummary summary={metrics.summary} />
      <TestersSection
        access={overview.testers}
        engagement={metrics.testers}
        formatDate={dateTime}
      />

      <section>
        <h2 className="text-lg font-bold">Recent server errors</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Learners see the reference; search for it here. Kept for 30 days.
        </p>
        <div className="mt-3 overflow-x-auto rounded-xl border">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/60 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-3 py-2">When</th>
                <th className="px-3 py-2">Event</th>
                <th className="px-3 py-2">Details</th>
                <th className="px-3 py-2">Reference</th>
              </tr>
            </thead>
            <tbody>
              {errors.map((entry) => (
                <tr key={entry.reference} className="border-t align-top">
                  <td className="whitespace-nowrap px-3 py-2">
                    {dateTime(entry.createdAt)}
                  </td>
                  <td className="px-3 py-2">{entry.event}</td>
                  <td className="px-3 py-2 font-mono text-xs">
                    {[
                      entry.source,
                      entry.code,
                      entry.status,
                      JSON.stringify(entry.context),
                    ]
                      .filter((value) => value !== null && value !== "{}")
                      .join(" · ")}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs">
                    {entry.reference}
                  </td>
                </tr>
              ))}
              {!errors.length && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-3 py-6 text-center text-muted-foreground"
                  >
                    No errors in the last 30 days.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-xl border border-dashed p-5 text-sm leading-6 text-muted-foreground">
        AI usage (Groq tokens per model, queue length) appears here once writing
        feedback ships in Phase 2. Until then, check Vercel and Supabase usage
        in their dashboards weekly.
      </section>
    </div>
  );
}
