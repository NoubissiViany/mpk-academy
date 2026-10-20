import { describe, expect, it } from "vitest";
import { demoState } from "@/test/fixtures";
import { createEmptyExamProfile } from "./exam-progress";
import { getReadiness, itemEvidence, targetBand } from "./readiness";
import { daysUntil, getStudyPlan } from "./study-plan";
import { getTodayPlan } from "./today";
import type { AppState } from "@/types/domain";

// Wednesday 21 October 2026, 10:00 local time.
const now = new Date(2026, 9, 21, 10, 0);
const week = {
  weekStartedAt: "2026-10-19",
  practiceSessions: 1,
  minutesStudied: 12,
  questionsReviewed: 10,
  readinessChange: 0,
};

describe("readiness against the learner's target", () => {
  it("bands scores as at, near, or below the target accuracy", () => {
    expect(targetBand(70, "NCLC 7")).toBe("at");
    expect(targetBand(62, "NCLC 7")).toBe("near");
    expect(targetBand(59, "NCLC 7")).toBe("below");
    expect(targetBand(62, "NCLC 5")).toBe("at");
    expect(targetBand(80, "NCLC 9+")).toBe("near");
  });

  it("moves with practice scores and names the weakest skill", () => {
    const readiness = getReadiness(
      demoState.examProfiles["TEF Canada"]!,
      "NCLC 7",
    );
    expect(readiness.overall).toBe(63);
    expect(readiness.band).toBe("near");
    expect(readiness.weakest).toBe("listening");
    expect(readiness.evidence).toBe("solid");
    expect(readiness.skills[0]).toMatchObject({
      skill: "reading",
      score: 72,
      band: "at",
      change: 14,
    });
  });

  it("has no readiness before any scored practice", () => {
    const readiness = getReadiness(
      createEmptyExamProfile("TCF Canada"),
      "NCLC 9+",
    );
    expect(readiness).toMatchObject({
      overall: null,
      band: null,
      evidence: "limited",
      weakest: null,
    });
  });

  it("labels a short assessment as limited evidence", () => {
    expect(itemEvidence(16)).toBe("limited");
    expect(itemEvidence(30)).toBe("growing");
    expect(itemEvidence(40)).toBe("solid");
  });
});

describe("study plan from the exam date", () => {
  it("asks for a date when none is set", () => {
    expect(
      getStudyPlan({ target: "NCLC 7", readiness: 60, weekly: week, now }),
    ).toEqual({ status: "noDate" });
  });

  it("counts days in the learner's time zone", () => {
    expect(daysUntil("2026-10-21", now)).toBe(0);
    expect(daysUntil("2026-10-28", now)).toBe(7);
  });

  it("sets a weekly rhythm and compares it with this week", () => {
    const plan = getStudyPlan({
      targetDate: "2026-12-16",
      target: "NCLC 7",
      readiness: 66,
      weekly: week,
      now,
    });
    // Wednesday: 4 a week means 1 expected so far.
    expect(plan).toMatchObject({
      status: "onTrack",
      daysLeft: 56,
      weeksLeft: 8,
      sessionsPerWeek: 4,
      sessionsThisWeek: 1,
      expectedByToday: 1,
    });
    expect(
      getStudyPlan({
        targetDate: "2026-12-16",
        target: "NCLC 7",
        readiness: 66,
        weekly: { ...week, practiceSessions: 0 },
        now,
      }).status,
    ).toBe("behind");
  });

  it("asks for more sessions when the gap is large and the exam is close", () => {
    const plan = getStudyPlan({
      targetDate: "2026-11-11",
      target: "NCLC 7",
      readiness: 45,
      weekly: { ...week, practiceSessions: 3 },
      now,
    });
    expect(plan).toMatchObject({
      status: "onTrack",
      weeksLeft: 3,
      sessionsPerWeek: 6,
      expectedByToday: 2,
    });
  });

  it("ignores last week's sessions", () => {
    const plan = getStudyPlan({
      targetDate: "2026-12-16",
      target: "NCLC 5",
      readiness: null,
      weekly: { ...week, weekStartedAt: "2026-10-12", practiceSessions: 5 },
      now,
    });
    expect(plan).toMatchObject({ sessionsPerWeek: 3, sessionsThisWeek: 0 });
  });

  it("recognises an exam date that has passed", () => {
    expect(
      getStudyPlan({
        targetDate: "2026-10-01",
        target: "NCLC 7",
        readiness: 70,
        weekly: week,
        now,
      }),
    ).toEqual({ status: "past", daysLeft: -20 });
  });
});

describe("today's plan", () => {
  const all = { personalized: true, reviews: true };
  const state: AppState = {
    ...demoState,
    activities: [],
    reviews: [
      {
        questionId: "q1",
        exam: "TEF Canada",
        skill: "listening",
        step: 0,
        dueAt: "2026-10-20T09:00:00Z",
      },
      {
        questionId: "q2",
        exam: "TEF Canada",
        skill: "listening",
        step: 1,
        dueAt: "2026-10-20T09:00:00Z",
      },
      {
        questionId: "q3",
        exam: "TEF Canada",
        skill: "reading",
        step: 0,
        dueAt: "2026-10-30T09:00:00Z",
      },
      {
        questionId: "q4",
        exam: "TCF Canada",
        skill: "reading",
        step: 0,
        dueAt: "2026-10-20T09:00:00Z",
      },
    ],
  };

  it("starts with due reviews, then practice, then a lesson", () => {
    const plan = getTodayPlan(state, now, all);
    expect(plan.steps.map((step) => step.kind)).toEqual([
      "review",
      "practice",
      "lesson",
    ]);
    expect(plan.steps[0]).toMatchObject({
      skill: "listening",
      count: 2,
      minutes: 3,
      href: "/practice/session?skill=listening&review=1",
    });
    expect(plan.steps[1]).toMatchObject({ skill: "listening", minutes: 12 });
    expect(plan.minutes).toBeGreaterThanOrEqual(20);
    expect(plan.next?.kind).toBe("review");
  });

  it("marks practice and lessons done from today's activity", () => {
    const plan = getTodayPlan(
      {
        ...state,
        reviews: [],
        activities: [
          {
            id: "a1",
            label: "Practice",
            detail: "80%",
            timestamp: new Date(2026, 9, 21, 8, 0).toISOString(),
            kind: "practice",
          },
          {
            id: "a2",
            label: "Lesson",
            detail: "done",
            timestamp: new Date(2026, 9, 20, 22, 0).toISOString(),
            kind: "lesson",
          },
        ],
      },
      now,
      all,
    );
    expect(plan.steps.map((step) => [step.kind, step.done])).toEqual([
      ["practice", true],
      ["lesson", false],
    ]);
    expect(plan.next?.kind).toBe("lesson");
  });

  it("leaves reviews out when the plan does not include them", () => {
    const plan = getTodayPlan(state, now, {
      personalized: false,
      reviews: false,
    });
    expect(plan.steps[0]).toMatchObject({
      kind: "practice",
      href: "/practice/session?skill=reading&count=10",
    });
  });

  it("is empty until an exam is chosen", () => {
    const plan = getTodayPlan(
      {
        ...state,
        user: {
          ...state.user!,
          goal: { ...state.user!.goal, exam: "Not sure yet" },
        },
      },
      now,
      all,
    );
    expect(plan).toEqual({ steps: [], minutes: 0, next: null });
  });
});
