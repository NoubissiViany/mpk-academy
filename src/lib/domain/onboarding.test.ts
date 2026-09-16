import { describe, expect, it } from "vitest";
import { paidDemoUser } from "@/test/fixtures";
import { diagnosticQuestions } from "@/data/questions";
import { scoreDiagnostic } from "@/lib/domain/diagnostic";
import {
  applyDiagnosticResult,
  createRegisteredLearnerState,
} from "@/lib/domain/onboarding";
import type { GuestAssessmentSession } from "@/types/domain";

const answers = Object.fromEntries(
  diagnosticQuestions.map((question) => [question.id, question.correctAnswer]),
);
const result = scoreDiagnostic(diagnosticQuestions, answers);
const session: GuestAssessmentSession = {
  id: "guest-1",
  createdAt: "2026-09-15T12:00:00.000Z",
  expiresAt: "2026-09-22T12:00:00.000Z",
  intake: {
    goal: "TEF Canada",
    target: "NCLC 7",
    frenchExperience: "I know some French",
  },
  answers,
  result,
  activity: {
    id: "assessment",
    label: "Assessment completed",
    detail: `${result.level} estimated level`,
    timestamp: "2026-09-15T12:00:00.000Z",
  },
  recommendedPlanId: "complete",
  status: "claimed",
  claimedByUserId: "new-user",
};

describe("new learner onboarding", () => {
  it("starts clean and carries only truthful diagnostic evidence", () => {
    const state = createRegisteredLearnerState(
      {
        ...paidDemoUser,
        id: "new-user",
        email: "new@example.com",
        tier: "free_student",
      },
      session,
    );

    expect(state.schemaVersion).toBe(5);
    expect(state.progress.completedLessonIds).toEqual([]);
    expect(state.progress.simulationsCompleted).toBe(0);
    expect(state.mistakes).toEqual([]);
    expect(state.activities).toEqual([session.activity]);
    expect(state.examProfiles["TEF Canada"]?.skills.reading.current).toBe(
      result.skillScores.reading,
    );
    expect(state.examProfiles["TEF Canada"]?.skills.listening.current).toBe(
      result.skillScores.listening,
    );
    expect(state.examProfiles["TEF Canada"]?.skills.writing.current).toBeNull();
    expect(
      state.examProfiles["TEF Canada"]?.skills.speaking.current,
    ).toBeNull();
    expect(state.examProfiles["TEF Canada"]?.readiness).toBe(result.score);
    expect(state.examProfiles["TEF Canada"]?.readinessSource).toBe(
      "diagnostic",
    );
  });

  it("refreshes diagnostic readiness without inventing productive scores", () => {
    const initial = createRegisteredLearnerState(
      {
        ...paidDemoUser,
        id: "new-user",
        email: "new@example.com",
        tier: "free_student",
      },
      session,
    );
    const nextResult = scoreDiagnostic(diagnosticQuestions, {});
    const updated = applyDiagnosticResult(initial, session.intake, nextResult, {
      ...session.activity,
      id: "retake",
    });

    expect(updated.examProfiles["TEF Canada"]?.readiness).toBe(
      nextResult.score,
    );
    expect(updated.diagnosticResult?.priority).toBe(nextResult.priority);
    expect(
      updated.examProfiles["TEF Canada"]?.skills.writing.current,
    ).toBeNull();
    expect(
      updated.examProfiles["TEF Canada"]?.skills.speaking.current,
    ).toBeNull();
  });
});
