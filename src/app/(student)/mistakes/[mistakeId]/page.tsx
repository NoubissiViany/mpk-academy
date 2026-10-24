import { MistakeDetail } from "@/features/mistakes/mistake-detail";
import { getLocale } from "@/i18n/server";
import { getExplanations, getOptionLabels } from "@/lib/server/content";
import { getLearnerSnapshot } from "@/lib/supabase/learner";

export default async function MistakeDetailPage({
  params,
}: {
  params: Promise<{ mistakeId: string }>;
}) {
  const { mistakeId } = await params;
  // Mistakes store option ids and the English explanation; show the option
  // text, and the explanation in the learner's language.
  const [snapshot, locale] = await Promise.all([
    getLearnerSnapshot(),
    getLocale(),
  ]);
  const questionIds = [
    ...new Set(snapshot.mistakes.map((mistake) => mistake.questionId)),
  ];
  return (
    <MistakeDetail
      mistakeId={mistakeId}
      optionLabels={getOptionLabels(questionIds)}
      explanations={getExplanations(questionIds, locale)}
    />
  );
}
