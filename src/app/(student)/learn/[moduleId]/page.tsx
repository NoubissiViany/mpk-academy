import Link from "next/link";
import { ChevronRight, Clock3 } from "lucide-react";
import { PageHeader } from "@/components/shared";
import { Card, CardContent } from "@/components/ui/card";
import { getCourseModules } from "@/data/course";
import { getLocale, getMessages } from "@/i18n/server";
import { lessonTitle, moduleTitle } from "@/i18n/format";
import { getLearnerAccess } from "@/lib/supabase/learner";

export default async function ModulePage({
  params,
}: {
  params: Promise<{ moduleId: string }>;
}) {
  const { moduleId } = await params;
  const [{ exam }, t, locale] = await Promise.all([
    getLearnerAccess(),
    getMessages(),
    getLocale(),
  ]);
  const examCode = exam === "TCF Canada" ? "TCF" : "TEF";
  const courseModule = getCourseModules(examCode).find(
    (item) => item.id === moduleId,
  );
  if (!courseModule) return <p>{t.learn.module.notFound}</p>;
  const title =
    courseModule.id === "exam-strategies"
      ? t.learn.strategiesTitle(examCode)
      : moduleTitle(t, courseModule.id);
  return (
    <>
      <PageHeader
        eyebrow={t.learn.page.eyebrow}
        title={title}
        description={
          courseModule.id === "exam-strategies"
            ? t.learn.strategiesDescription(examCode)
            : t.learn.moduleDescription
        }
      />
      <div className="space-y-3">
        {courseModule.lessons.map((lesson) => (
          <Card key={lesson.id}>
            <CardContent className="flex items-center gap-4 pt-5 sm:pt-6">
              <span className="grid size-9 place-items-center rounded-full bg-learn/10 text-sm font-bold text-learn">
                {lesson.sequence}
              </span>
              <div className="flex-1">
                <h2 className="font-bold">{lessonTitle(locale, lesson)}</h2>
                <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock3 className="size-3" aria-hidden="true" />
                  {t.common.minutes(lesson.duration)}
                </p>
              </div>
              <Link
                href={`/learn/${courseModule.id}/${lesson.id}`}
                aria-label={t.learn.module.open(lessonTitle(locale, lesson))}
                className="rounded-lg p-2 text-primary hover:bg-muted"
              >
                <ChevronRight aria-hidden="true" />
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
