"use client";

import { useState } from "react";
import { toast } from "sonner";
import { setAiFeedbackConsentAction } from "@/app/actions/writing";
import { useApp } from "@/components/providers/app-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { hasPlanFeature } from "@/config/product";
import { useI18n } from "@/i18n/client";

/** Shows whether the learner agreed to AI feedback, and lets them withdraw. */
export function AiConsentSettings() {
  const { state, setState } = useApp();
  const { t, locale } = useI18n();
  const copy = t.writing.settings;
  const [saving, setSaving] = useState(false);
  if (!hasPlanFeature(state.planAccess, "aiWritingFeedback")) return null;
  const consent = state.user?.aiFeedbackConsent;
  const withdraw = async () => {
    setSaving(true);
    const result = await setAiFeedbackConsentAction(false);
    setSaving(false);
    if (!result.ok) return toast.error(result.message);
    setState((current) =>
      current.user
        ? { ...current, user: { ...current.user, aiFeedbackConsent: null } }
        : current,
    );
    toast.success(copy.withdrawn);
  };
  return (
    <Card className="mt-6 max-w-3xl">
      <CardContent className="pt-6">
        <h2 className="text-lg font-bold">{copy.title}</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {consent
            ? copy.on(
                new Intl.DateTimeFormat(locale === "fr" ? "fr-CA" : "en-CA", {
                  dateStyle: "long",
                }).format(new Date(consent.at)),
              )
            : copy.off}
        </p>
        {consent && (
          <Button
            variant="secondary"
            className="mt-4"
            disabled={saving}
            onClick={withdraw}
          >
            {saving ? t.common.saving : copy.withdraw}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
