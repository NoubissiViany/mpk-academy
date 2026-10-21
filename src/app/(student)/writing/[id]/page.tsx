import { notFound } from "next/navigation";
import { hasPlanFeature } from "@/config/product";
import { WritingFeedbackView } from "@/features/writing/feedback-view";
import { getWritingTaskTitles } from "@/lib/server/content";
import { getLearnerAccess } from "@/lib/supabase/learner";
import { getWritingSubmission } from "@/lib/supabase/writing";

// Status checks may work the queue after responding (see writing actions).
export const maxDuration = 60;

export default async function WritingFeedbackPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { planAccess } = await getLearnerAccess();
  if (!hasPlanFeature(planAccess, "aiWritingFeedback")) return null;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const submission = await getWritingSubmission(id);
  if (!submission) notFound();
  const parent = submission.parentId
    ? await getWritingSubmission(submission.parentId)
    : null;
  return (
    <WritingFeedbackView
      submission={submission}
      taskTitle={getWritingTaskTitles()[submission.taskId] ?? submission.taskId}
      parentBody={parent?.body ?? null}
    />
  );
}
