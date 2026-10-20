"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { KeyRound } from "lucide-react";
import { signOutAction } from "@/app/actions/auth";
import { redeemBetaInviteAction } from "@/app/actions/beta";
import { useApp } from "@/components/providers/app-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { defaultState } from "@/data/mock-state";
import { useI18n } from "@/i18n/client";
import { resolveOnboardingDestination } from "@/lib/domain/onboarding";

export function BetaRedeemForm({
  pendingCode,
  contactEmail,
  loadError,
}: {
  pendingCode?: string;
  contactEmail: string | null;
  loadError?: { message: string; reference: string };
}) {
  const router = useRouter();
  const { replaceState } = useApp();
  const { t } = useI18n();
  const [code, setCode] = useState(pendingCode ?? "");
  const [submitting, setSubmitting] = useState(Boolean(pendingCode));
  const [message, setMessage] = useState(
    loadError
      ? t.common.errorReference(loadError.message, loadError.reference)
      : undefined,
  );
  const autoSubmitted = useRef(false);

  const redeem = async (value: string) => {
    setSubmitting(true);
    setMessage(undefined);
    const result = await redeemBetaInviteAction(value);
    if (result.ok) {
      replaceState(result.snapshot);
      router.replace(resolveOnboardingDestination(result.snapshot));
      router.refresh();
      return;
    }
    setSubmitting(false);
    setMessage(
      result.reference
        ? t.common.errorReference(result.message, result.reference)
        : result.message,
    );
  };

  useEffect(() => {
    if (!pendingCode || autoSubmitted.current) return;
    autoSubmitted.current = true;
    void redeem(pendingCode);
    // Redeem the sign-up code exactly once on arrival.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingCode]);

  return (
    <Card className="mx-auto max-w-xl">
      <CardContent className="p-7 sm:p-9">
        <span className="grid size-11 place-items-center rounded-full bg-primary/10 text-primary">
          <KeyRound className="size-5" aria-hidden="true" />
        </span>
        <p className="eyebrow mt-6">{t.beta.eyebrow}</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">
          {t.beta.title}
        </h1>
        <p className="mt-3 leading-7 text-muted-foreground">
          {t.beta.description}
        </p>
        <form
          className="mt-7 space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            void redeem(code);
          }}
        >
          <label className="block text-sm font-semibold">
            {t.beta.codeLabel}
            <Input
              className="mt-2 uppercase"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              placeholder={t.beta.codePlaceholder}
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              aria-invalid={Boolean(message)}
              aria-describedby={message ? "beta-code-message" : undefined}
            />
          </label>
          {message && (
            <p
              id="beta-code-message"
              role="alert"
              className="text-sm font-medium text-danger"
            >
              {message}
            </p>
          )}
          <Button className="w-full" disabled={submitting}>
            {submitting ? t.beta.submitting : t.beta.submit}
          </Button>
        </form>
        <p className="mt-6 text-sm leading-6 text-muted-foreground">
          {contactEmail
            ? t.beta.noCode(contactEmail)
            : t.beta.noCodeWithoutContact}
        </p>
        <button
          type="button"
          className="mt-4 text-sm font-semibold text-primary hover:underline"
          onClick={async () => {
            await signOutAction();
            replaceState(structuredClone(defaultState));
            router.push("/");
            router.refresh();
          }}
        >
          {t.beta.signOut}
        </button>
      </CardContent>
    </Card>
  );
}
