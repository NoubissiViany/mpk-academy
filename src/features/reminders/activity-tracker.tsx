"use client";
import { useEffect } from "react";
import { recordStudyVisitAction } from "@/app/actions/reminders";

export function ActivityTracker({ userId }: { userId?: string }) {
  useEffect(() => {
    if (!userId) return;
    let last = 0;
    const record = () => {
      if (
        document.visibilityState !== "visible" ||
        Date.now() - last < 10 * 60_000
      )
        return;
      last = Date.now();
      void recordStudyVisitAction(
        Intl.DateTimeFormat().resolvedOptions().timeZone,
      ).catch(() => {
        /* Browsing remains usable offline. */
      });
    };
    record();
    const timer = window.setInterval(record, 10 * 60_000);
    document.addEventListener("visibilitychange", record);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", record);
    };
  }, [userId]);
  return null;
}
