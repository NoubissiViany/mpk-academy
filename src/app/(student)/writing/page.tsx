import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { EmptyState, PageHeader } from "@/components/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { hasPlanFeature } from "@/config/product";
import { getLocale, getMessages } from "@/i18n/server";
import { getWritingTaskTitles } from "@/lib/server/content";
import { getLearnerAccess } from "@/lib/supabase/learner";
import { listWritingSubmissions } from "@/lib/supabase/writing";

export default async function WritingHistoryPage() {
  const { planAccess } = await getLearnerAccess();
  // AppShell renders the locked state for learners without this feature.
  if (!hasPlanFeature(planAccess, "aiWritingFeedback")) return null;
  const [t, locale, submissions] = await Promise.all([
    getMessages(),
    getLocale(),
    listWritingSubmissions(),
  ]);
  const copy = t.writing.history;
  const titles = getWritingTaskTitles();
  const date = new Intl.DateTimeFormat(locale === "fr" ? "fr-CA" : "en-CA", {
    dateStyle: "medium",
    timeStyle: "short",
  });
  return (
    <>
      <PageHeader title={copy.title} description={copy.description} />
      <Button asChild variant="secondary" className="mb-6">
        <Link href="/diagnostic/results">
          {t.diagnostic.writing.resultTitle}
        </Link>
      </Button>
      {submissions.length === 0 ? (
        <>
          <EmptyState title={copy.title} description={copy.empty} />
          <Button asChild className="mt-6">
            <Link href="/practice/session?skill=writing">{copy.start}</Link>
          </Button>
        </>
      ) : (
        <Card>
          <CardContent className="divide-y pt-2">
            {submissions.map((item) => (
              <Link
                key={item.id}
                href={`/writing/${item.id}`}
                className="flex min-h-16 items-center justify-between gap-4 py-3 hover:text-primary"
              >
                <span className="min-w-0">
                  <span lang="fr" className="block font-semibold">
                    {titles[item.taskId] ?? item.taskId}
                    {item.parentId && (
                      <span className="ml-2 text-xs font-normal text-muted-foreground">
                        · {copy.rewrite}
                      </span>
                    )}
                  </span>
                  <span className="block text-sm text-muted-foreground">
                    {date.format(new Date(item.createdAt))} ·{" "}
                    {t.writing.feedback.words(item.wordCount)}
                  </span>
                </span>
                <span className="inline-flex shrink-0 items-center gap-2">
                  <Badge>{copy.status[item.status]}</Badge>
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
