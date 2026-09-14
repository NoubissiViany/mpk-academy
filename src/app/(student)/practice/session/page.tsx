import { Suspense } from "react";
import { ExamPracticeSession } from "@/features/practice/exam-practice-session";

export default function PracticeSessionPage() {
  return (
    <Suspense>
      <ExamPracticeSession />
    </Suspense>
  );
}
