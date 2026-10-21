import { unstable_rethrow } from "next/navigation";
import { hasPlanFeature } from "@/config/product";
import { ExamPracticeSession } from "@/features/practice/exam-practice-session";
import { ProductiveSession } from "@/features/practice/productive-session";
import { isAiWritingConfigured } from "@/lib/server/ai/groq";
import { logServerError } from "@/lib/server/diagnostics";
import {
  getPracticeItemIds,
  getPracticePool,
  getPublicProductiveTasks,
} from "@/lib/server/content";
import { getLearnerAccess, getPracticeHistory } from "@/lib/supabase/learner";
import type { CompetencyId, ExamId, ExamSkill } from "@/types/domain";

// Requesting AI feedback may work the queue after the action responds.
export const maxDuration = 60;

const first = (value?: string | string[]) =>
  Array.isArray(value) ? value[0] : value;

async function loadHistory(exam: ExamId, skill: "reading" | "listening") {
  try {
    return await getPracticeHistory(
      exam,
      skill,
      getPracticeItemIds(exam, skill),
    );
  } catch (error) {
    unstable_rethrow(error);
    // Practice still works without history; it just cannot personalize.
    logServerError("Practice history unavailable", error, { exam, skill });
    return { answers: [], dueIds: [] };
  }
}

export default async function PracticeSessionPage({
  searchParams,
}: {
  searchParams: Promise<{
    skill?: string | string[];
    focus?: string | string[];
    count?: string | string[];
    review?: string | string[];
  }>;
}) {
  const params = await searchParams;
  const { planAccess, exam: goalExam } = await getLearnerAccess();
  // AppShell renders the locked state; never send content without access.
  if (!hasPlanFeature(planAccess, "practice")) return null;

  const exam = goalExam ?? "TEF Canada";
  const requested = first(params.skill);
  const skill: ExamSkill =
    requested === "listening" ||
    requested === "writing" ||
    requested === "speaking"
      ? requested
      : "reading";
  if (skill === "writing" || skill === "speaking")
    return (
      <ProductiveSession
        exam={exam}
        skill={skill}
        tasks={getPublicProductiveTasks(exam, skill)}
        aiFeedback={
          skill === "writing" &&
          hasPlanFeature(planAccess, "aiWritingFeedback") &&
          isAiWritingConfigured()
        }
      />
    );

  const reviewsAllowed = hasPlanFeature(planAccess, "mistakeReview");
  const reviewOnly = reviewsAllowed && first(params.review) === "1";
  const focus = reviewOnly
    ? null
    : ((first(params.focus) ?? null) as CompetencyId | null);
  const history = await loadHistory(exam, skill);
  const { questions, reviewIds } = getPracticePool(exam, skill, {
    count: reviewOnly || first(params.count) === "10" ? 10 : 5,
    focus,
    answers: history.answers,
    dueIds: reviewsAllowed ? history.dueIds : [],
    reviewOnly,
  });
  return (
    <ExamPracticeSession
      exam={exam}
      skill={skill}
      focus={focus}
      pool={questions}
      reviewIds={reviewIds}
      mode={reviewOnly ? "review" : "practice"}
    />
  );
}
