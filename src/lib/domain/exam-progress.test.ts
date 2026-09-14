import { describe, expect, it } from "vitest";
import { examConfigurations, productiveTasks } from "@/config/exams";
import { defaultState } from "@/data/mock-state";
import {
  activateExamProfile,
  createEmptyExamProfile,
  aggregateMistakePatterns,
  currentWeeklyStats,
  getSkillStatus,
  getWeakestExamSkill,
  updateExamSkill,
  updateMockReadiness,
} from "./exam-progress";

describe("exam preparation profiles", () => {
  it("keeps new productive skills unassessed", () => {
    const profile = createEmptyExamProfile(
      "TCF Canada",
      new Date("2026-09-14"),
    );
    expect(profile.skills.writing.current).toBeNull();
    expect(profile.skills.speaking.current).toBeNull();
  });

  it("switches exams without erasing the inactive profile", () => {
    const tcf = activateExamProfile(defaultState, "TCF Canada");
    expect(tcf.user?.goal.exam).toBe("TCF Canada");
    expect(tcf.examProfiles["TEF Canada"]?.readiness).toBe(68);
    expect(tcf.examProfiles["TCF Canada"]?.readiness).toBeNull();
    const tefAgain = activateExamProfile(tcf, "TEF Canada");
    expect(tefAgain.examProfiles["TEF Canada"]?.readiness).toBe(68);
    expect(tefAgain.examProfiles["TCF Canada"]).toBeDefined();
  });

  it("uses first evidence, then a 75/25 recency weighting", () => {
    const empty = createEmptyExamProfile("TEF Canada", new Date("2026-09-14"));
    const first = updateExamSkill(empty, "reading", 80, {
      now: new Date("2026-09-14"),
    });
    const second = updateExamSkill(first, "reading", 40, {
      now: new Date("2026-09-14"),
    });
    expect(first.skills.reading.current).toBe(80);
    expect(second.skills.reading.current).toBe(70);
  });

  it("updates readiness by one quarter of the skill change", () => {
    const profile = createEmptyExamProfile(
      "TEF Canada",
      new Date("2026-09-14"),
    );
    profile.readiness = 60;
    profile.skills.reading.current = 60;
    profile.skills.listening.current = 60;
    profile.skills.writing.current = 60;
    profile.skills.speaking.current = 60;
    const updated = updateExamSkill(profile, "speaking", 100, {
      now: new Date("2026-09-14"),
    });
    expect(updated.skills.speaking.current).toBe(70);
    expect(updated.readiness).toBe(63);
  });

  it("blends mock readiness at 70/30", () => {
    const profile = createEmptyExamProfile(
      "TCF Canada",
      new Date("2026-09-14"),
    );
    profile.readiness = 60;
    expect(
      updateMockReadiness(profile, 80, 45, new Date("2026-09-14")).readiness,
    ).toBe(66);
  });

  it("resets weekly counters in a new ISO week", () => {
    const profile = createEmptyExamProfile(
      "TEF Canada",
      new Date("2026-09-07"),
    );
    profile.weekly.practiceSessions = 4;
    expect(
      currentWeeklyStats(profile.weekly, new Date("2026-09-14"))
        .practiceSessions,
    ).toBe(0);
  });

  it("applies status thresholds and deterministic priority", () => {
    expect([70, 55, 50, 49].map(getSkillStatus)).toEqual([
      "On track",
      "Improving",
      "Needs attention",
      "Priority",
    ]);
    const profile = createEmptyExamProfile("TEF Canada");
    profile.skills.reading.current = 40;
    profile.skills.listening.current = 40;
    expect(getWeakestExamSkill(profile)).toBe("reading");
  });

  it("aggregates repeated mistake patterns by exam and skill", () => {
    const base = {
      id: "one",
      questionId: "q1",
      competencyId: "listening-detail" as const,
      mistakeCategory: "Missed detail" as const,
      learnerAnswer: "a",
      correctAnswer: "b",
      explanation: "Review the detail.",
      timestamp: "2026-09-14T12:00:00Z",
      reviewStatus: "new" as const,
      exam: "TEF Canada" as const,
      examSkill: "listening" as const,
      pattern: "Numbers and dates",
      count: 2,
    };
    const result = aggregateMistakePatterns([
      base,
      { ...base, id: "two", count: 3 },
    ]);
    expect(result).toHaveLength(1);
    expect(result[0].count).toBe(5);
  });
});

describe("distinct exam configuration fixtures", () => {
  it("keeps TEF and TCF task structures independent", () => {
    expect(examConfigurations["TEF Canada"].scaledMock).toMatchObject({
      writingTasks: 2,
      speakingTasks: 2,
      durationMinutes: 40,
    });
    expect(examConfigurations["TCF Canada"].scaledMock).toMatchObject({
      writingTasks: 3,
      speakingTasks: 3,
      durationMinutes: 45,
    });
    expect(
      productiveTasks["TEF Canada"].filter((task) => task.skill === "writing"),
    ).toHaveLength(2);
    expect(
      productiveTasks["TCF Canada"].filter((task) => task.skill === "writing"),
    ).toHaveLength(3);
    expect(examConfigurations["TEF Canada"].officialFormat.listening).toContain(
      "one-way",
    );
    expect(
      examConfigurations["TEF Canada"].navigationRules.listeningOneWay,
    ).toBe(true);
    expect(
      examConfigurations["TCF Canada"].navigationRules.listeningOneWay,
    ).toBe(false);
  });
});
