import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { EmptyState, PageHeader } from "@/components/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { hasPlanFeature } from "@/config/product";
import { getLocale, getMessages } from "@/i18n/server";
import { getSpeakingTaskTitles } from "@/lib/server/content";
import { getLearnerAccess } from "@/lib/supabase/learner";
import { listSpeakingSubmissions } from "@/lib/supabase/speaking";

export default async function SpeakingHistoryPage() {
  const { planAccess } = await getLearnerAccess();
  // AppShell renders the locked state for learners without this feature.
  if (!hasPlanFeature(planAccess, "aiSpeakingFeedback")) return null;
  const [t, locale, submissions] = await Promise.all([
    getMessages(),
    getLocale(),
    listSpeakingSubmissions(),
  ]);
  const copy = t.speaking.history;
  const titles = getSpeakingTaskTitles();
  const date = new Intl.DateTimeFormat(locale === "fr" ? "fr-CA" : "en-CA", {
    dateStyle: "medium",
    timeStyle: "short",
  });
  return (
    <>
      <PageHeader title={copy.title} description={copy.description} />
      {submissions.length === 0 ? (
        <>
          <EmptyState title={copy.title} description={copy.empty} />
          <Button asChild className="mt-6">
            <Link href="/practice/session?skill=speaking">{copy.start}</Link>
          </Button>
        </>
      ) : (
        <Card>
          <CardContent className="divide-y pt-2">
            {submissions.map((item) => (
              <Link
                key={item.id}
                href={`/speaking/${item.id}`}
                className="flex min-h-16 items-center justify-between gap-4 py-3 hover:text-primary"
              >
                <span className="min-w-0">
                  <span lang="fr" className="block font-semibold">
                    {titles[item.taskId] ?? item.taskId}
                  </span>
                  <span className="block text-sm text-muted-foreground">
                    {date.format(new Date(item.createdAt))} ·{" "}
                    {copy.length(
                      Math.floor(item.audioSeconds / 60),
                      item.audioSeconds % 60,
                    )}
                  </span>
                </span>
                <span className="inline-flex shrink-0 items-center gap-2">
                  <Badge>{t.writing.history.status[item.status]}</Badge>
                  <ArrowRight className="size-4" aria-hidden="true" />
                </span>
              </Link>
            ))}
          </CardContent>
        </Card>
      )}
    </>
  );
}
