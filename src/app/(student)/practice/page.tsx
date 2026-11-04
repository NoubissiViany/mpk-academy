import { PracticeSelect } from "@/features/practice/practice-select";
import { getLearningOverview } from "@/lib/server/learning-overview";
export default async function PracticePage() {
  return <PracticeSelect overview={await getLearningOverview()} />;
}
