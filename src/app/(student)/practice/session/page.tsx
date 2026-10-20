import { hasPlanFeature } from "@/config/product";
import { ExamPracticeSession } from "@/features/practice/exam-practice-session";
import { ProductiveSession } from "@/features/practice/productive-session";
import {
  getPracticePool,
  getPublicProductiveTasks,
} from "@/lib/server/content";
import { getLearnerAccess } from "@/lib/supabase/learner";
import type { CompetencyId, ExamSkill } from "@/types/domain";

const first = (value?: string | string[]) =>
  Array.isArray(value) ? value[0] : value;

export default async function PracticeSessionPage({
  searchParams,
}: {
  searchParams: Promise<{
    skill?: string | string[];
    focus?: string | string[];
    count?: string | string[];
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
      />
    );

  const focus = (first(params.focus) ?? null) as CompetencyId | null;
  const count = first(params.count) === "10" ? 10 : 5;
  return (
    <ExamPracticeSession
      exam={exam}
      skill={skill}
      focus={focus}
      pool={getPracticePool(exam, skill, focus, count)}
    />
  );
}
