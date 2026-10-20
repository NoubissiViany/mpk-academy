"use client";

import Link from "next/link";
import { useApp } from "@/components/providers/app-provider";
import { PageHeader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { isBetaMode, planDisplayName } from "@/config/product";
import { useI18n } from "@/i18n/client";
import { intlLocale } from "@/i18n/config";

export default function ProfilePage() {
  const { state } = useApp();
  const { t, locale } = useI18n();
  const copy = t.account.profile;
  const user = state.user;
  const exam = user?.goal.exam;
  const accessUntil = state.planAccess?.accessUntil
    ? new Intl.DateTimeFormat(intlLocale(locale), {
        month: "long",
        day: "numeric",
        year: "numeric",
        timeZone: "UTC",
      }).format(new Date(state.planAccess.accessUntil))
    : null;
  const plan = state.planAccess
    ? isBetaMode()
      ? t.beta.planLabel
      : copy.planName(planDisplayName(state.planAccess.planId))
    : copy.free;
  const rows = [
    [copy.name, `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim()],
    [copy.email, user?.email ?? "—"],
    [copy.plan, plan],
    ...(accessUntil ? [[copy.accessUntil, accessUntil]] : []),
    [copy.exam, exam && exam !== "Not sure yet" ? exam : copy.notSelected],
    [
      copy.target,
      t.diagnostic.intake.targets[user?.goal.target ?? "I'm not sure"],
    ],
    [
      copy.readiness,
      state.diagnosticResult == null
        ? copy.notAssessed
        : `${state.diagnosticResult.score}%`,
    ],
  ];
  return (
    <>
      <PageHeader
        eyebrow={copy.eyebrow}
        title={copy.title}
        description={copy.description}
        action={
          <Button asChild>
            <Link href="/settings">{copy.edit}</Link>
          </Button>
        }
      />
      <Card>
        <CardContent className="divide-y pt-6">
          {rows.map(([label, value]) => (
            <div
              key={label}
              className="grid gap-1 py-4 first:pt-0 sm:grid-cols-[12rem_1fr]"
            >
              <span className="text-sm text-muted-foreground">{label}</span>
              <strong>{value}</strong>
            </div>
          ))}
        </CardContent>
      </Card>
    </>
  );
}
