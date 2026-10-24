import { notFound } from "next/navigation";
import { hasPlanFeature } from "@/config/product";
import { SpeakingFeedbackView } from "@/features/speaking/speaking-feedback-view";
import { getModelResponse, getSpeakingTaskTitles } from "@/lib/server/content";
import { getLearnerAccess } from "@/lib/supabase/learner";
import { getSpeakingSubmission } from "@/lib/supabase/speaking";

// Status checks may work the queue after responding (see speaking actions).
export const maxDuration = 60;

export default async function SpeakingFeedbackPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { planAccess, exam } = await getLearnerAccess();
  if (!hasPlanFeature(planAccess, "aiSpeakingFeedback")) return null;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const submission = await getSpeakingSubmission(id);
  if (!submission) notFound();
  return (
    <SpeakingFeedbackView
      submission={submission}
      taskTitle={
        getSpeakingTaskTitles()[submission.taskId] ?? submission.taskId
      }
      hasModelResponse={Boolean(
        exam && getModelResponse(exam, submission.taskId),
      )}
    />
  );
}
