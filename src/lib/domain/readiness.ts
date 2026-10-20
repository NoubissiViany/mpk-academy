import { getWeakestExamSkill } from "@/lib/domain/exam-progress";
import type { ExamPreparationProfile, NclcTarget } from "@/types/domain";

// Readiness compares MPK practice accuracy with the accuracy we aim for at the
// learner's target. It is a planning aid, never a conversion to an NCLC level:
// the bands are deliberately coarse and every screen labels them as estimates.

export const objectiveSkills = ["reading", "listening"] as const;
export type ObjectiveSkill = (typeof objectiveSkills)[number];

/** MPK accuracy to aim for at each target. */
export const targetAccuracy: Record<NclcTarget, number> = {
  "NCLC 5": 60,
  "NCLC 7": 70,
  "NCLC 9+": 85,
  "I'm not sure": 70,
};

export type TargetBand = "at" | "near" | "below";

/** Within 10 points of the goal counts as near. */
export function targetBand(score: number, target: NclcTarget): TargetBand {
  const goal = targetAccuracy[target];
  if (score >= goal) return "at";
  return score >= goal - 10 ? "near" : "below";
}

export type Evidence = "limited" | "growing" | "solid";

/** Confidence from scored practice sessions or mock exams for a skill. */
export const sessionEvidence = (sessions: number): Evidence =>
  sessions >= 8 ? "solid" : sessions >= 3 ? "growing" : "limited";

/** Confidence from the number of scored questions in one assessment. */
export const itemEvidence = (items: number): Evidence =>
  items >= 40 ? "solid" : items >= 20 ? "growing" : "limited";

export interface SkillReadiness {
  skill: ObjectiveSkill;
  score: number | null;
  band: TargetBand | null;
  evidence: Evidence;
  /** Points gained or lost since the first score. */
  change: number | null;
}

export function getReadiness(
  profile: ExamPreparationProfile,
  target: NclcTarget,
) {
  const skills: SkillReadiness[] = objectiveSkills.map((skill) => {
    const { current, baseline30Days, attempts } = profile.skills[skill];
    return {
      skill,
      score: current,
      band: current === null ? null : targetBand(current, target),
      evidence: sessionEvidence(attempts),
      change:
        current === null || baseline30Days === null
          ? null
          : current - baseline30Days,
    };
  });
  const scored = skills.filter((skill) => skill.score !== null);
  const overall = scored.length
    ? Math.round(
        scored.reduce((sum, skill) => sum + skill.score!, 0) / scored.length,
      )
    : null;
  const attempts = objectiveSkills.reduce(
    (sum, skill) => sum + profile.skills[skill].attempts,
    0,
  );
  return {
    overall,
    goal: targetAccuracy[target],
    band: overall === null ? null : targetBand(overall, target),
    evidence: sessionEvidence(attempts),
    skills,
    weakest: getWeakestExamSkill(profile),
  };
}
