"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import {
  requestWritingFeedbackAction,
  setAiFeedbackConsentAction,
} from "@/app/actions/writing";
import { useApp } from "@/components/providers/app-provider";
import { Button } from "@/components/ui/button";
import { aiFeedbackNoticeVersion } from "@/config/privacy";
import { useI18n } from "@/i18n/client";

/** Asks once for agreement before any writing goes to the AI provider. */
export function AiConsent({ onAccepted }: { onAccepted?: () => void }) {
  const { t } = useI18n();
  const { setState } = useApp();
  const copy = t.writing.consent;
  const [agreed, setAgreed] = useState(false);
  const [saving, setSaving] = useState(false);
  const accept = async () => {
    setSaving(true);
    const result = await setAiFeedbackConsentAction(true);
    setSaving(false);
    if (!result.ok) return toast.error(result.message);
    setState((current) =>
      current.user
        ? {
            ...current,
            user: {
              ...current.user,
              aiFeedbackConsent: {
                version: aiFeedbackNoticeVersion,
                at: new Date().toISOString(),
              },
            },
          }
        : current,
    );
    onAccepted?.();
  };
  return (
    <div className="rounded-xl border border-primary/30 bg-primary/5 p-5">
      <h3 className="font-bold">{copy.title}</h3>
      <ul className="mt-3 list-inside list-disc space-y-2 text-sm leading-6">
        {copy.points.map((point) => (
          <li key={point}>{point}</li>
        ))}
      </ul>
      <label className="mt-4 flex items-start gap-3 text-sm font-semibold">
        <input
          type="checkbox"
          className="mt-1 size-4 accent-primary"
          checked={agreed}
          onChange={(event) => setAgreed(event.target.checked)}
        />
        {copy.agree}
      </label>
      <div className="mt-4 flex flex-wrap items-center gap-4">
        <Button disabled={!agreed || saving} onClick={accept}>
          {saving ? t.common.saving : copy.confirm}
        </Button>
        <Link
          href="/privacy"
          className="text-sm font-semibold text-primary hover:underline"
        >
          {copy.privacy}
        </Link>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">{copy.withdraw}</p>
    </div>
  );
}

/** Sends a text for AI feedback and opens its feedback page. */
export function RequestAiFeedback({
  taskId,
  text,
  parentId,
  practice,
  disabled,
}: {
  taskId: string;
  text: string;
  parentId?: string;
  practice?: { submissionId: string; durationSeconds: number };
  disabled?: boolean;
}) {
  const { t } = useI18n();
  const { state } = useApp();
  const router = useRouter();
  const copy = t.writing.cta;
  const [clientKey] = useState(() => crypto.randomUUID());
  const [sending, setSending] = useState(false);
  const consented =
    state.user?.aiFeedbackConsent?.version === aiFeedbackNoticeVersion;

  const send = async () => {
    setSending(true);
    const result = await requestWritingFeedbackAction({
      taskId,
      text,
      clientKey,
      parentId: parentId ?? null,
      practice,
    });
    if (!result.ok) {
      setSending(false);
      return toast.error(
        result.reference
          ? t.common.errorReference(result.message, result.reference)
          : result.message,
      );
    }
    router.push(`/writing/${result.id}`);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <Sparkles
          className="mt-0.5 size-5 shrink-0 text-primary"
          aria-hidden="true"
        />
        <div>
          <h3 className="font-bold">{copy.title}</h3>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            {copy.body}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{copy.limit}</p>
        </div>
      </div>
      {consented ? (
        <Button disabled={disabled || sending || !text.trim()} onClick={send}>
          {sending ? copy.sending : copy.button}
        </Button>
      ) : (
        <AiConsent />
      )}
    </div>
  );
}
