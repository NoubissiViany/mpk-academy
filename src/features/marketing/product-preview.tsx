"use client";
import { FixItem } from "@/features/feedback/ai-feedback";
import { isBetaMode } from "@/config/product";
import { allLessons } from "@/data/course";
import { TodayCard } from "@/features/dashboard/dashboard-view";
import { FeedbackSummaryCard } from "@/features/dashboard/feedback-summary-card";
import { useI18n } from "@/i18n/client";
import type { TodayStep } from "@/lib/domain/today";

export function ProductPreview() {
  const { t } = useI18n();
  const copy = t.ux.preview;
  const lesson =
    allLessons.find((item) => item.exam === "shared") ?? allLessons[0];
  const steps: TodayStep[] = [
    {
      kind: "review",
      skill: "listening",
      count: 3,
      minutes: 3,
      href: "/diagnostic",
      done: false,
    },
    {
      kind: "practice",
      skill: "listening",
      minutes: 12,
      href: "/diagnostic",
      done: false,
    },
    ...(lesson
      ? [
          {
            kind: "lesson" as const,
            lesson,
            minutes: lesson.duration,
            href: "/diagnostic",
            done: false,
          },
        ]
      : []),
  ];
  return (
    <section className="border-y bg-card/50 py-12 sm:py-16">
      <div className="container-page">
        <div className="max-w-2xl">
          <p className="eyebrow">{copy.eyebrow}</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            {copy.title}
          </h2>
          <p className="mt-3 text-muted-foreground">{copy.planBody}</p>
          <p className="mt-3 text-xs font-bold uppercase tracking-wide text-primary">
            {copy.example}
          </p>
        </div>
        <div className="mt-7 grid items-start gap-5 lg:grid-cols-[1.2fr_.8fr]">
          <TodayCard
            today={{
              steps,
              minutes: steps.reduce((sum, step) => sum + step.minutes, 0),
              next: steps[0],
            }}
            personalized
            preview
          />
          <div>
            <FeedbackSummaryCard
              skill="writing"
              preview
              summary={{
                available: true,
                status: "done",
                lastPracticeAt: null,
                href: null,
              }}
            />
            <h3 className="mt-5 font-bold">{copy.feedback}</h3>
            <ol className="mt-3">
              <FixItem
                index={0}
                alreadyFlagged={false}
                quoteLabel={t.writing.feedback.youWrote}
                fix={{
                  quote: "J’ai appris le français depuis deux mois.",
                  correction: "J’apprends le français depuis deux mois.",
                  explanation: copy.explanation,
                  category: "verb",
                }}
              />
            </ol>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {copy.feedbackBody}
            </p>
          </div>
        </div>
        {isBetaMode() && (
          <p className="mt-5 text-sm text-muted-foreground">
            {t.ux.betaAccess}
          </p>
        )}
      </div>
    </section>
  );
}
