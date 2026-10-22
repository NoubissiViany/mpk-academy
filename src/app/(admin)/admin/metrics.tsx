import { z } from "zod";
import { Card, CardContent } from "@/components/ui/card";

export const metricsSchema = z.object({
  funnel: z.array(
    z.object({
      step: z.string(),
      locale: z.enum(["en", "fr"]),
      last7: z.number(),
      last30: z.number(),
    }),
  ),
  summary: z.object({
    activated: z.number(),
    active7: z.number(),
    weekEligible: z.number(),
    weekReturned: z.number(),
  }),
  testers: z.array(
    z.object({
      email: z.string().nullable(),
      firstName: z.string(),
      locale: z.enum(["en", "fr"]),
      joinedAt: z.string(),
      lastActiveAt: z.string().nullable(),
      activeDays7: z.number(),
      weekEligible: z.boolean(),
      returnedAfterWeek: z.boolean(),
      diagnostics: z.number(),
      mockExams: z.number(),
      practiceSessions: z.number(),
      writingTasks: z.number(),
      speakingTasks: z.number(),
      lessons: z.number(),
    }),
  ),
});

export type Metrics = z.infer<typeof metricsSchema>;
export type TesterAccess = {
  email: string | null;
  firstName: string;
  code: string;
  redeemedAt: string;
  accessUntil: string | null;
  active: boolean;
};

const funnelRows = [
  ["landing_view", "Viewed the landing page"],
  ["sample_answered", "Answered a sample question"],
  ["diagnostic_started", "Started the diagnostic"],
  ["diagnostic_completed", "Finished the diagnostic"],
  ["register_view", "Opened registration"],
  ["account_created", "Created an account"],
  ["beta_activated", "Activated beta access"],
] as const;

const percent = (part: number, whole: number) =>
  whole ? `${Math.round((100 * part) / whole)}%` : "—";

export function FunnelSection({ funnel }: { funnel: Metrics["funnel"] }) {
  const total = (step: string, window: "last7" | "last30", locale?: string) =>
    funnel
      .filter((row) => row.step === step && (!locale || row.locale === locale))
      .reduce((sum, row) => sum + row[window], 0);
  const landing30 = total("landing_view", "last30");
  return (
    <section>
      <h2 className="text-lg font-bold">Funnel</h2>
      <p className="mt-1 text-sm leading-6 text-muted-foreground">
        The first five steps are anonymous daily totals: each browser counts
        once per step per day, and browsers sending Do Not Track or Global
        Privacy Control are not counted. Accounts and activations come from the
        database. Steps can happen in a different order, so read the last column
        as reach, not strict conversion.
      </p>
      <div className="mt-3 overflow-x-auto rounded-xl border">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/60 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-2">Step</th>
              <th className="px-3 py-2 text-right">7 days · EN</th>
              <th className="px-3 py-2 text-right">7 days · FR</th>
              <th className="px-3 py-2 text-right">7 days</th>
              <th className="px-3 py-2 text-right">30 days</th>
              <th className="px-3 py-2 text-right">% of landing (30 days)</th>
            </tr>
          </thead>
          <tbody>
            {funnelRows.map(([step, label]) => (
              <tr key={step} className="border-t">
                <td className="px-3 py-2">{label}</td>
                <td className="px-3 py-2 text-right">
                  {total(step, "last7", "en")}
                </td>
                <td className="px-3 py-2 text-right">
                  {total(step, "last7", "fr")}
                </td>
                <td className="px-3 py-2 text-right font-semibold">
                  {total(step, "last7")}
                </td>
                <td className="px-3 py-2 text-right font-semibold">
                  {total(step, "last30")}
                </td>
                <td className="px-3 py-2 text-right">
                  {step === "landing_view"
                    ? "100%"
                    : percent(total(step, "last30"), landing30)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function EngagementSummary({
  summary,
}: {
  summary: Metrics["summary"];
}) {
  const returned = summary.weekEligible
    ? `${summary.weekReturned} of ${summary.weekEligible} (${percent(summary.weekReturned, summary.weekEligible)})`
    : "No tester has passed day 7 yet";
  return (
    <section>
      <h2 className="text-lg font-bold">Engagement</h2>
      <p className="mt-1 text-sm leading-6 text-muted-foreground">
        Activity means a completed diagnostic, mock exam, practice session, or
        lesson; signing in alone does not count.
      </p>
      <div className="mt-3 grid gap-4 sm:grid-cols-3">
        {[
          ["Testers activated", String(summary.activated)],
          ["Active in the last 7 days", String(summary.active7)],
          ["Active again on day 7 or later", returned],
        ].map(([label, value]) => (
          <Card key={label}>
            <CardContent className="pt-5">
              <p className="text-sm text-muted-foreground">{label}</p>
              <p className="mt-1 text-xl font-bold">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

export function TestersSection({
  access,
  engagement,
  formatDate,
}: {
  access: TesterAccess[];
  engagement: Metrics["testers"];
  formatDate: (value: string | null) => string;
}) {
  const activity = new Map(
    engagement.map((tester) => [`${tester.email}|${tester.joinedAt}`, tester]),
  );
  const columns = [
    "Tester",
    "Code",
    "Joined",
    "Last active",
    "Active days (7)",
    "Diagnostic",
    "Practice",
    "Writing",
    "Speaking",
    "Lessons",
    "Mock exams",
    "Week 1+",
    "Access until",
    "Status",
  ];
  return (
    <section>
      <h2 className="text-lg font-bold">Testers</h2>
      <div className="mt-3 overflow-x-auto rounded-xl border">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/60 text-xs uppercase text-muted-foreground">
            <tr>
              {columns.map((column) => (
                <th key={column} className="whitespace-nowrap px-3 py-2">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {access.map((tester) => {
              const usage = activity.get(
                `${tester.email}|${tester.redeemedAt}`,
              );
              return (
                <tr
                  key={`${tester.email}-${tester.redeemedAt}`}
                  className="border-t"
                >
                  <td className="px-3 py-2">
                    {tester.firstName}
                    {usage && (
                      <span className="ml-1 text-xs uppercase text-muted-foreground">
                        {usage.locale}
                      </span>
                    )}
                    <span className="block text-xs text-muted-foreground">
                      {tester.email}
                    </span>
                  </td>
                  <td className="px-3 py-2 font-mono">{tester.code}</td>
                  <td className="whitespace-nowrap px-3 py-2">
                    {formatDate(tester.redeemedAt)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2">
                    {formatDate(usage?.lastActiveAt ?? null)}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {usage?.activeDays7 ?? 0}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {usage?.diagnostics ?? 0}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {usage?.practiceSessions ?? 0}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {usage?.writingTasks ?? 0}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {usage?.speakingTasks ?? 0}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {usage?.lessons ?? 0}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {usage?.mockExams ?? 0}
                  </td>
                  <td className="px-3 py-2">
                    {!usage?.weekEligible
                      ? "Too early"
                      : usage.returnedAfterWeek
                        ? "Yes"
                        : "No"}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2">
                    {formatDate(tester.accessUntil)}
                  </td>
                  <td className="px-3 py-2">
                    {tester.active ? "Active" : "Ended"}
                  </td>
                </tr>
              );
            })}
            {!access.length && (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-3 py-6 text-center text-muted-foreground"
                >
                  No testers yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// Speaking fields default so the page still renders before their migration.
export const aiUsageSchema = z.object({
  today: z.array(
    z.object({
      feature: z.string(),
      model: z.string(),
      requests: z.number(),
      failures: z.number(),
      tokens: z.number(),
      audioSeconds: z.number().default(0),
    }),
  ),
  last7Tokens: z.number(),
  queue: z.object({
    queued: z.number(),
    processing: z.number(),
    failedToday: z.number(),
    startedToday: z.number(),
  }),
  speaking: z
    .object({
      queued: z.number(),
      processing: z.number(),
      failedToday: z.number(),
      createdToday: z.number(),
      transcribedSecondsToday: z.number(),
    })
    .default({
      queued: 0,
      processing: 0,
      failedToday: 0,
      createdToday: 0,
      transcribedSecondsToday: 0,
    }),
  limits: z.object({
    daily: z.number(),
    perLearner: z.number(),
    speakingDaily: z.number().default(0),
    speakingPerLearner: z.number().default(0),
    transcriptionSeconds: z.number().default(0),
  }),
  flags30: z.number(),
});

/** Groq's daily token allowance per model; check the account Limits page. */
const DAILY_TOKEN_ALLOWANCE = 200_000;

export function AiUsageSection({
  usage,
  configured,
}: {
  usage: z.infer<typeof aiUsageSchema>;
  configured: boolean;
}) {
  const busiest = Math.max(
    0,
    ...usage.today
      .filter((row) => row.feature !== "transcription")
      .map((row) => row.tokens),
  );
  const minutes = (seconds: number) => Math.round(seconds / 60);
  const cards = [
    [
      "Essays started today",
      `${usage.queue.startedToday} of ${usage.limits.daily}`,
    ],
    [
      "Recordings today",
      `${usage.speaking.createdToday} of ${usage.limits.speakingDaily}`,
    ],
    [
      "Audio transcribed today",
      `${minutes(usage.speaking.transcribedSecondsToday)} of ${minutes(usage.limits.transcriptionSeconds)} min`,
    ],
    [
      "Waiting (essays · recordings)",
      `${usage.queue.queued + usage.queue.processing} · ${usage.speaking.queued + usage.speaking.processing}`,
    ],
    [
      "Tokens today, busiest model",
      `${busiest.toLocaleString("en-CA")} of ${DAILY_TOKEN_ALLOWANCE.toLocaleString("en-CA")}`,
    ],
    [
      "Failed today · flagged (30 days)",
      `${usage.queue.failedToday + usage.speaking.failedToday} · ${usage.flags30}`,
    ],
  ];
  return (
    <section>
      <h2 className="text-lg font-bold">AI feedback</h2>
      <p className="mt-1 text-sm leading-6 text-muted-foreground">
        {configured
          ? `Each learner can send ${usage.limits.perLearner} essays and ${usage.limits.speakingPerLearner} recording a day. Tokens over the last 7 days: ${usage.last7Tokens.toLocaleString("en-CA")}.`
          : "Not configured on this deployment: GROQ_API_KEY is missing, so learners do not see AI feedback."}
      </p>
      <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map(([label, value]) => (
          <Card key={label}>
            <CardContent className="pt-5">
              <p className="text-sm text-muted-foreground">{label}</p>
              <p className="mt-1 text-xl font-bold">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      {usage.today.length > 0 && (
        <div className="mt-3 overflow-x-auto rounded-xl border">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/60 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-3 py-2">Use</th>
                <th className="px-3 py-2">Model</th>
                <th className="px-3 py-2 text-right">Requests</th>
                <th className="px-3 py-2 text-right">Failures</th>
                <th className="px-3 py-2 text-right">Tokens</th>
                <th className="px-3 py-2 text-right">Audio (min)</th>
              </tr>
            </thead>
            <tbody>
              {usage.today.map((row) => (
                <tr key={`${row.feature}-${row.model}`} className="border-t">
                  <td className="px-3 py-2">{row.feature}</td>
                  <td className="px-3 py-2 font-mono">{row.model}</td>
                  <td className="px-3 py-2 text-right">{row.requests}</td>
                  <td className="px-3 py-2 text-right">{row.failures}</td>
                  <td className="px-3 py-2 text-right">
                    {row.tokens.toLocaleString("en-CA")}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {minutes(row.audioSeconds)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
