"use client";

import Link from "next/link";
import { useApp } from "@/components/providers/app-provider";
import { PageHeader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function ProfilePage() {
  const { state } = useApp();
  const user = state.user;
  const exam = user?.goal.exam;
  const profile =
    exam === "TEF Canada" || exam === "TCF Canada"
      ? state.examProfiles[exam]
      : null;
  const rows = [
    ["Name", `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim()],
    ["Email", user?.email ?? "—"],
    ["Plan", user?.tier === "paid_student" ? "Full program" : "Free plan"],
    ["Active exam", exam ?? "Not selected"],
    ["NCLC target", user?.goal.target ?? "I'm not sure"],
    [
      "Exam readiness",
      profile?.readiness == null ? "Not assessed yet" : `${profile.readiness}%`,
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
