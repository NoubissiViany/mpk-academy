import { ResultsView } from "@/features/diagnostic/results-view";
export const metadata = { title: "French assessment results" };
export default function DiagnosticResultsPage() {
  return (
    <div className="container-page py-10 sm:py-14">
      <ResultsView />
    </div>
  );
}
