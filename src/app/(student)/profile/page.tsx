"use client";

import Link from "next/link";
import { useApp } from "@/components/providers/app-provider";
import { PageHeader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getPaidPlan } from "@/config/product";

export default function ProfilePage() {
  const { state } = useApp();
  const user = state.user;
  const exam = user?.goal.exam;
  const paidPlan = state.planAccess
    ? getPaidPlan(state.planAccess.planId)
    : null;
  const accessUntil = state.planAccess?.accessUntil
    ? new Intl.DateTimeFormat(user?.locale === "fr" ? "fr-CA" : "en-CA", {
        month: "long",
        day: "numeric",
        year: "numeric",
        timeZone: "UTC",
      }).format(new Date(state.planAccess.accessUntil))
    : null;
  const rows = [
    ["Name", `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim()],
    ["Email", user?.email ?? "—"],
    [
      "Plan",
      state.planAccess && paidPlan ? `${paidPlan.name} Plan` : "Free plan",
    ],
    ...(accessUntil ? [["Access until", accessUntil]] : []),
    ["Active exam", exam ?? "Not selected"],
    ["NCLC target", user?.goal.target ?? "I'm not sure"],
    [
      "Diagnostic readiness",
      state.diagnosticResult == null
        ? "Not assessed yet"
        : `${state.diagnosticResult.score}%`,
    ],
  ];
  return (
    <>
      <PageHeader
        eyebrow="Your account"
        title="Profile"
        description="A read-only summary of your MPK preparation profile."
        action={
          <Button asChild>
            <Link href="/settings">Edit in Settings</Link>
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
