import { notFound } from "next/navigation";
import { hasPlanFeature } from "@/config/product";
import { RewriteEditor } from "@/features/writing/rewrite-editor";
import { getPublicWritingTask } from "@/lib/server/content";
import { getLearnerAccess } from "@/lib/supabase/learner";
import { getWritingSubmission } from "@/lib/supabase/writing";

// Sending the rewrite may work the queue after responding.
export const maxDuration = 60;

export default async function WritingRewritePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { planAccess } = await getLearnerAccess();
  if (!hasPlanFeature(planAccess, "aiWritingFeedback")) return null;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const submission = await getWritingSubmission(id);
  const task = submission
    ? getPublicWritingTask(submission.exam, submission.taskId)
    : null;
  if (!submission || !task) notFound();
  return (
    <RewriteEditor
      submissionId={submission.id}
      taskId={task.id}
      taskTitle={task.title}
      instructions={task.instructions}
      original={submission.body}
    />
  );
}
