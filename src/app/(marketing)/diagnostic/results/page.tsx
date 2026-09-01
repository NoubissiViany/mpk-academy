import { ResultsView } from "@/features/diagnostic/results-view";
export const metadata = { title: "Diagnostic results" };
export default function DiagnosticResultsPage() { return <div className="container-page py-14"><div className="mb-8"><p className="eyebrow">Your diagnostic</p><h1 className="mt-3 text-4xl font-bold tracking-tight">Your French preparation profile</h1><p className="mt-4 max-w-2xl text-muted-foreground">A starting point for learning—not an official TEF/TCF assessment.</p></div><ResultsView /></div>; }
