"use client";

import { useEffect } from "react";
import type { FunnelStep } from "@/lib/funnel";
import { trackFunnelStep } from "@/lib/track-funnel";

/** Counts a page-level funnel step once the page has loaded in a browser. */
export function TrackFunnelStep({ step }: { step: FunnelStep }) {
  useEffect(() => trackFunnelStep(step), [step]);
  return null;
}
