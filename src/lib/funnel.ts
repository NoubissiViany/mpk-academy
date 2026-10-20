// Anonymous funnel steps, stored only as daily totals (see the usage-metrics
// migration). Keep this list in sync with the `funnel_daily.step` check.
export const funnelSteps = [
  "landing_view",
  "sample_answered",
  "diagnostic_started",
  "diagnostic_completed",
  "register_view",
] as const;

export type FunnelStep = (typeof funnelSteps)[number];

const torontoDay = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Toronto",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** The counting day, aligned with the database's America/Toronto buckets. */
export const funnelDay = (now: Date) => torontoDay.format(now);

export const funnelStorageKey = (step: FunnelStep) => `mpk-funnel:${step}`;

/** Visitors who ask not to be tracked are not counted, even anonymously. */
export function prefersNoTracking(
  navigatorLike: Pick<Navigator, "doNotTrack"> & {
    globalPrivacyControl?: boolean;
  },
) {
  return (
    navigatorLike.globalPrivacyControl === true ||
    navigatorLike.doNotTrack === "1"
  );
}
