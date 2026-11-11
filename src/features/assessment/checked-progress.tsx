"use client";

import { Progress } from "@/components/ui/progress";
import { useI18n } from "@/i18n/client";

export function CheckedProgress({
  position,
  total,
  checked,
  correct,
}: {
  position: number;
  total: number;
  checked: number;
  correct: number;
}) {
  const { t } = useI18n();
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap justify-between gap-2 text-sm">
        <p className="font-semibold">
          {t.assessment.questionProgress(position, total)}
        </p>
        <p className="text-muted-foreground">
          {t.assessment.tally(correct, checked)}
        </p>
      </div>
      <Progress
        label={t.assessment.progress}
        value={total > 0 ? (checked / total) * 100 : 0}
      />
    </div>
  );
}
