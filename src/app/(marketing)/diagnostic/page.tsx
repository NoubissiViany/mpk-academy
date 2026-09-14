import { DiagnosticFlow } from "@/features/diagnostic/diagnostic-flow";
export const metadata = {
  title: "Free French assessment",
  description:
    "Identify your current French skills and recommended starting point.",
};
export default function DiagnosticPage() {
  return (
    <div className="focus-shell min-h-[calc(100vh-4rem)] py-8 sm:py-12">
      <div className="container-page">
        <DiagnosticFlow />
      </div>
    </div>
  );
}
