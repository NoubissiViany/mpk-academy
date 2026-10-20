import { ResultsView } from "@/features/diagnostic/results-view";
import { getMessages } from "@/i18n/server";

export async function generateMetadata() {
  return { title: (await getMessages()).metadata.results };
}

export default function DiagnosticResultsPage() {
  return (
    <div className="container-page py-10 sm:py-14">
      <ResultsView />
    </div>
  );
}
