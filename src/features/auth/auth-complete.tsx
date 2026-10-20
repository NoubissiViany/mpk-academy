"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  claimGuestAssessmentAction,
  getLearnerSnapshotAction,
} from "@/app/actions/learner";
import { useApp } from "@/components/providers/app-provider";
import { isBetaMode } from "@/config/product";
import { useI18n } from "@/i18n/client";
import { clearAnonymousState } from "@/lib/persistence";
import { guestAssessmentRepository } from "@/repositories/guest-assessment";
import { resolveOnboardingDestination } from "@/lib/domain/onboarding";

export function AuthComplete() {
  const router = useRouter();
  const { replaceState } = useApp();
  const { t } = useI18n();
  const copy = t.auth.complete;
  const formatError = t.common.errorReference;
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
            formatError(snapshotResult.message, snapshotResult.reference),
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
        guest && !isBetaMode()
          ? `/checkout?plan=${snapshot.checkoutIntentPlanId ?? guest.recommendedPlanId}`
          : resolveOnboardingDestination(snapshot),
      );
      router.refresh();
    })();
    return () => {
      active = false;
    };
  }, [formatError, replaceState, router]);

  return (
    <div className="container-page py-20 text-center">
      <p className="eyebrow">{copy.eyebrow}</p>
      <h1 className="mt-3 text-3xl font-bold">
        {error ? copy.failed : copy.preparing}
      </h1>
      {error && <p className="mt-4 text-sm text-danger">{error}</p>}
    </div>
  );
}
