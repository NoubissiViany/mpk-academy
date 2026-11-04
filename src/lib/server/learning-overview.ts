import "server-only";
import { hasPlanFeature } from "@/config/product";
import { getLearnerAccess, requireUserId } from "@/lib/supabase/learner";
import {
  isAiSpeakingConfigured,
  isAiWritingConfigured,
} from "@/lib/server/ai/groq";
import { logServerError } from "@/lib/server/diagnostics";
import {
  emptyLearningOverview,
  type FeedbackSummary,
  type LearningOverview,
} from "@/lib/domain/learning-overview";
import { diagnosticWritingVersion } from "@/lib/domain/diagnostic-writing";

export async function getLearningOverview(): Promise<LearningOverview> {
  const { exam, planAccess } = await getLearnerAccess();
  if (!exam || !planAccess) return structuredClone(emptyLearningOverview);
  const { supabase } = await requireUserId();
  const summary = async (
    skill: "writing" | "speaking",
  ): Promise<FeedbackSummary> => {
    const entitled = hasPlanFeature(
      planAccess,
      skill === "writing" ? "aiWritingFeedback" : "aiSpeakingFeedback",
    );
    const available =
      entitled &&
      (skill === "writing"
        ? isAiWritingConfigured()
        : isAiSpeakingConfigured());
    try {
      const practice = await supabase
        .from("practice_sessions")
        .select("completed_at")
        .eq("exam", exam)
        .eq("skill", skill)
        .eq("status", "completed")
        .order("completed_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (practice.error) throw practice.error;
      const base = {
        available,
        lastPracticeAt: practice.data?.completed_at ?? null,
        href: null,
      };
      if (!entitled) return { ...base, status: "self" };
      let query = supabase
        .from(
          skill === "writing" ? "writing_submissions" : "speaking_submissions",
        )
        .select("id, status")
        .eq("exam", exam)
        .order("created_at", { ascending: false })
        .limit(1);
      if (skill === "writing")
        query = query.neq("task_id", diagnosticWritingVersion);
      const feedback = await query.maybeSingle();
      if (feedback.error) throw feedback.error;
      const status = feedback.data?.status;
      return {
        ...base,
        status:
          status === "queued" ||
          status === "processing" ||
          status === "done" ||
          status === "failed"
            ? status
            : available
              ? "empty"
              : "unavailable",
        href: feedback.data ? `/${skill}/${feedback.data.id}` : null,
      };
    } catch (error) {
      logServerError("Learning overview unavailable", error, { skill, exam });
      return {
        available,
        status: "unavailable",
        lastPracticeAt: null,
        href: null,
      };
    }
  };
  const [writing, speaking] = await Promise.all([
    summary("writing"),
    summary("speaking"),
  ]);
  return { writing, speaking };
}
