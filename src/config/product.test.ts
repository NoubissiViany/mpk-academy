import { describe, expect, it } from "vitest";
import {
  formatPlanPrice,
  formatPrice,
  getPaidPlan,
  isPaidPlanId,
  productPlans,
  recommendedPaidPlanId,
} from "@/config/product";

describe("product plans", () => {
  it("formats arbitrary CAD prices and approximate plan prices", () => {
    expect(formatPrice(119)).toBe("$119");
    expect(formatPlanPrice(getPaidPlan("essential"))).toBe("~$119");
  });

  it("validates paid plan identifiers", () => {
    expect(isPaidPlanId("essential")).toBe(true);
    expect(isPaidPlanId("free")).toBe(false);
    expect(isPaidPlanId("unknown")).toBe(false);
  });

  it("selects a requested paid plan and defaults to Complete", () => {
    expect(getPaidPlan("intensive").id).toBe("intensive");
    expect(getPaidPlan(["essential", "complete"]).id).toBe("essential");
    expect(getPaidPlan("unknown").id).toBe("complete");
    expect(getPaidPlan().id).toBe("complete");
  });

  it("defines concise positioning and three highlights for every plan", () => {
    expect(productPlans.map((plan) => plan.bestFor)).toEqual([
      "Discover your current level and weaknesses.",
      "Build your French foundations across all four skills.",
      "Full personalized preparation from lessons to mock exams.",
      "Candidates near exam day or preparing for a retake.",
    ]);
    for (const plan of productPlans) {
      expect(plan.bestFor.length).toBeLessThan(70);
      expect(plan.highlights).toHaveLength(3);
    }
  });

  it("keeps Free focused on assessment and basic results", () => {
    const free = productPlans.find((plan) => plan.id === "free");
    expect(free?.highlights).toEqual([
      "Assessment and results",
      "Basic weakness profile",
      "No payment required",
    ]);
  });

  it.each([
    ["NCLC 5", "essential"],
    ["NCLC 7", "complete"],
    ["NCLC 9+", "intensive"],
    ["I'm not sure", "complete"],
    [undefined, "complete"],
  ] as const)("maps target %s to %s", (target, expected) => {
    expect(recommendedPaidPlanId(target)).toBe(expected);
  });
});
