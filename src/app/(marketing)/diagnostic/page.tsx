import { DiagnosticFlow } from "@/features/diagnostic/diagnostic-flow";
import { getMessages } from "@/i18n/server";
import { getPublicDiagnosticQuestions } from "@/lib/server/content";

export async function generateMetadata() {
  const t = (await getMessages()).metadata;
  return { title: t.diagnostic, description: t.diagnosticDescription };
}

export default function DiagnosticPage() {
  return (
    <div className="focus-shell min-h-[calc(100vh-4rem)] py-8 sm:py-12">
      <div className="container-page">
        <DiagnosticFlow questions={getPublicDiagnosticQuestions()} />
      </div>
    </div>
  );
}
