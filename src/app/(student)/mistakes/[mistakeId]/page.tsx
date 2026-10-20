import { MistakeDetail } from "@/features/mistakes/mistake-detail";
import { getOptionLabels } from "@/lib/server/content";
import { getLearnerSnapshot } from "@/lib/supabase/learner";

export default async function MistakeDetailPage({
  params,
}: {
  params: Promise<{ mistakeId: string }>;
}) {
  const { mistakeId } = await params;
  // Mistakes store option ids; show the learner the option text instead.
  const snapshot = await getLearnerSnapshot();
  const optionLabels = getOptionLabels([
    ...new Set(snapshot.mistakes.map((mistake) => mistake.questionId)),
  ]);
  return <MistakeDetail mistakeId={mistakeId} optionLabels={optionLabels} />;
}
