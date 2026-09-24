import { describe, expect, it } from "vitest";
import {
  calculatePlanAccessUntil,
  formatPlanPrice,
  formatPrice,
  getPaidPlan,
  isPaidPlanId,
  hasPlanFeature,
  productPlans,
  recommendedPaidPlanId,
} from "@/config/product";

describe("product plans", () => {
  it("formats arbitrary CAD prices and exact plan prices", () => {
    expect(formatPrice(119)).toBe("$119");
    expect(formatPlanPrice(getPaidPlan("essential")!)).toBe("$119");
  });

  it("validates paid plan identifiers", () => {
    expect(isPaidPlanId("essential")).toBe(true);
    expect(isPaidPlanId("free")).toBe(false);
    expect(isPaidPlanId("unknown")).toBe(false);
  });

  it("selects only valid requested paid plans without a fallback", () => {
    expect(getPaidPlan("intensive")?.id).toBe("intensive");
    expect(getPaidPlan(["essential", "complete"])?.id).toBe("essential");
    expect(getPaidPlan("unknown")).toBeUndefined();
    expect(getPaidPlan()).toBeUndefined();
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

  it("enforces the paid-plan feature matrix", () => {
    const essential = {
      planId: "essential" as const,
      purchasedAt: null,
      accessUntil: null,
    };
    const complete = { ...essential, planId: "complete" as const };
    const intensive = { ...essential, planId: "intensive" as const };
    expect(hasPlanFeature(null, "assessment")).toBe(true);
    expect(hasPlanFeature(null, "learning")).toBe(false);
    expect(hasPlanFeature(essential, "practice")).toBe(true);
    expect(hasPlanFeature(essential, "mockExams")).toBe(false);
    expect(hasPlanFeature(complete, "mockExams")).toBe(true);
    expect(hasPlanFeature(intensive, "detailedReadiness")).toBe(true);
  });

  it("calculates calendar-month access without overflowing short months", () => {
    expect(
      calculatePlanAccessUntil(
        "essential",
        new Date("2026-01-31T12:00:00.000Z"),
      ).toISOString(),
    ).toBe("2026-04-30T12:00:00.000Z");
    expect(
      calculatePlanAccessUntil(
        "complete",
        new Date("2026-09-15T12:00:00.000Z"),
      ).toISOString(),
    ).toBe("2027-03-15T12:00:00.000Z");
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
