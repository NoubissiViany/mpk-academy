"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  claimGuestAssessmentAction,
  getLearnerSnapshotAction,
} from "@/app/actions/learner";
import { useApp } from "@/components/providers/app-provider";
import { clearAnonymousState } from "@/lib/persistence";
import { withErrorReference } from "@/lib/public-error";
import { guestAssessmentRepository } from "@/repositories/guest-assessment";

export function AuthComplete() {
  const router = useRouter();
  const { replaceState } = useApp();
  const [error, setError] = useState<string>();

  useEffect(() => {
    let active = true;
    void (async () => {
      const guest = await guestAssessmentRepository.getActive();
      const result = guest ? await claimGuestAssessmentAction(guest) : null;
      if (!active) return;
      if (result && !result.ok) {
        setError(result.message);
        return;
      }
      let snapshot = result?.ok ? result.snapshot : null;
      if (!snapshot) {
        const snapshotResult = await getLearnerSnapshotAction();
        if (!snapshotResult.ok) {
          setError(
            withErrorReference(
              snapshotResult.message,
              snapshotResult.reference,
            ),
          );
          return;
        }
        snapshot = snapshotResult.snapshot;
      }
      replaceState(snapshot);
      if (guest) {
        await guestAssessmentRepository.clear(guest.id);
        clearAnonymousState();
      }
      router.replace(
        guest ? `/checkout?plan=${guest.recommendedPlanId}` : "/diagnostic",
      );
      router.refresh();
    })();
    return () => {
      active = false;
    };
  }, [replaceState, router]);

  return (
    <div className="container-page py-20 text-center">
      <p className="eyebrow">Account confirmed</p>
      <h1 className="mt-3 text-3xl font-bold">
        {error
          ? "We could not finish loading your account."
          : "Preparing your learning profile…"}
      </h1>
      {error && <p className="mt-4 text-sm text-danger">{error}</p>}
    </div>
  );
}
