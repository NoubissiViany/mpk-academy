"use client";

import Link from "next/link";
import { ArrowRight, LockKeyhole } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { isBetaMode } from "@/config/product";
import { useI18n } from "@/i18n/client";

const modeStyles = {
  learn: "bg-learn/10 text-learn border-learn/20",
  practice: "bg-practice/10 text-practice border-practice/20",
  exam: "bg-exam/10 text-exam border-exam/20",
} as const;

export function ModeBadge({ mode }: { mode: "learn" | "practice" | "exam" }) {
  const { t } = useI18n();
  return <Badge className={modeStyles[mode]}>{t.practice.modes[mode]}</Badge>;
}

/** Shown where a feature is outside the learner's access. */
export function LockedContent({
  title,
  description,
}: {
  title?: string;
  description?: string;
}) {
  const { t } = useI18n();
  const copy = t.account.locked;
  const beta = isBetaMode();
  return (
    <Card className="bg-muted/50">
      <CardContent className="flex flex-col items-start gap-4 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-card">
            <LockKeyhole className="size-5 text-primary" aria-hidden="true" />
          </span>
          <div>
            <h3 className="font-bold">{title ?? copy.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {description ?? (beta ? copy.betaDescription : copy.description)}
            </p>
          </div>
        </div>
        <Button asChild>
          <Link href={beta ? "/beta" : "/choose-plan"}>
            {beta ? copy.betaCta : copy.cta} <ArrowRight className="size-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
