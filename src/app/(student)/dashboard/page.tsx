import { DashboardView } from "@/features/dashboard/dashboard-view";
import { getLearningOverview } from "@/lib/server/learning-overview";
export default async function DashboardPage() {
  return <DashboardView overview={await getLearningOverview()} />;
}
