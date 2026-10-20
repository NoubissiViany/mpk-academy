import { recordFunnelStepAction } from "@/app/actions/analytics";
import {
  funnelDay,
  funnelStorageKey,
  prefersNoTracking,
  type FunnelStep,
} from "@/lib/funnel";

/**
 * Counts a funnel step at most once per browser per day. The marker stays in
 * this browser; only the step name reaches the server.
 */
export function trackFunnelStep(step: FunnelStep, now = new Date()) {
  if (typeof window === "undefined" || prefersNoTracking(navigator)) return;
  const day = funnelDay(now);
  try {
    if (localStorage.getItem(funnelStorageKey(step)) === day) return;
    localStorage.setItem(funnelStorageKey(step), day);
  } catch {
    // Storage blocked (private mode): count anyway rather than never.
  }
  void recordFunnelStepAction(step).catch(() => undefined);
}
