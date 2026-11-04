"use client";
import { useI18n } from "@/i18n/client";

export function AssessmentSteps({ step }: { step: 1 | 2 | 3 | 4 }) {
  const { t } = useI18n();
  return (
    <ol className="mb-6 grid grid-cols-4 gap-2" aria-label={t.ux.stageLabel}>
      {t.ux.stages.map((label, index) => (
        <li
          key={label}
          aria-current={index + 1 === step ? "step" : undefined}
          className={`border-t-4 pt-2 text-xs font-semibold sm:text-sm ${index + 1 <= step ? "border-primary text-primary" : "border-muted text-muted-foreground"}`}
        >
          <span aria-hidden="true">{index + 1}. </span>
          {label}
        </li>
      ))}
    </ol>
  );
}
