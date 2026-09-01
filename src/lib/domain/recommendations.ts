import type { Mistake, Progress, Recommendation } from "@/types/domain";

export function generateRecommendations(progress: Progress, mistakes: Mistake[]): Recommendation[] {
  if (progress.diagnosticScore === null) {
    return [{ id: "diagnose", title: "Complete your diagnostic", reason: "A baseline helps MPK prioritize the right skills.", type: "diagnostic", href: "/diagnostic", priority: 1 }];
  }
  const weakest = Object.entries(progress.competencyScores).sort((a, b) => (a[1] ?? 100) - (b[1] ?? 100))[0];
  const items: Recommendation[] = [];
  if (weakest) {
    items.push({ id: "weakest", title: "Practice listening for details", reason: `This is your lowest evidenced competency at ${weakest[1]}% across recent attempts.`, type: "practice", href: "/practice/session", priority: 1, competencyId: weakest[0] as Recommendation["competencyId"] });
  }
  if (mistakes.length >= 3) {
    items.push({ id: "review", title: "Review recent mistakes", reason: `${mistakes.length} answers are ready for a focused review.`, type: "review", href: "/weaknesses", priority: 2 });
  }
  items.push({ id: "lesson", title: "Continue: Understanding connectors", reason: "This lesson supports two skills that appear in your recent practice.", type: "lesson", href: "/learn/core-grammar/connectors", priority: 3 });
  if (progress.practiceAnswered >= 10) {
    items.push({ id: "exam", title: "Run a full simulation", reason: "You now have enough practice evidence to measure independent performance.", type: "exam", href: "/exam/setup", priority: 4 });
  }
  return items.sort((a, b) => a.priority - b.priority);
}
