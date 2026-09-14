import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { productConfig } from "@/config/product";
import { diagnosticQuestions } from "@/data/questions";
import { scoreDiagnostic } from "@/lib/domain/diagnostic";
import { guestAssessmentRepository } from "@/repositories/guest-assessment";
import type { GuestAssessmentSessionInput } from "@/repositories/contracts";

const answers = Object.fromEntries(
  diagnosticQuestions.map((question) => [question.id, question.correctAnswer]),
);
const result = scoreDiagnostic(diagnosticQuestions, answers);
const input: GuestAssessmentSessionInput = {
  intake: {
    goal: "TEF Canada",
    target: "NCLC 7",
    frenchExperience: "I know some French",
  },
  answers,
  result,
  activity: {
    id: "assessment-activity",
    label: "Assessment completed",
    detail: `${result.level} estimated level`,
    timestamp: "2026-09-14T12:00:00.000Z",
  },
  recommendedPlanId: "complete",
};

describe("guest assessment repository", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-14T12:00:00.000Z"));
  });

  afterEach(() => vi.useRealTimers());

  it("stores and retrieves the complete guest assessment", async () => {
    const created = await guestAssessmentRepository.create(input);
    const stored = await guestAssessmentRepository.getActive();

    expect(stored).toEqual(created);
    expect(stored?.intake).toEqual(input.intake);
    expect(stored?.answers).toEqual(answers);
    expect(stored?.result).toEqual(result);
    expect(stored?.activity).toEqual(input.activity);
    expect(stored?.recommendedPlanId).toBe("complete");
    expect(stored?.status).toBe("active");
  });

  it("expires and clears an abandoned session after seven days", async () => {
    await guestAssessmentRepository.create(input);
    vi.advanceTimersByTime(productConfig.guestAssessmentTtlMs + 1);

    expect(await guestAssessmentRepository.getActive()).toBeNull();
    expect(
      localStorage.getItem(productConfig.guestAssessmentStorageKey),
    ).toBeNull();
  });

  it("claims idempotently for one user and clears after persistence", async () => {
    const created = await guestAssessmentRepository.create(input);
    const firstClaim = await guestAssessmentRepository.claim(
      created.id,
      "user-1",
    );
    const repeatedClaim = await guestAssessmentRepository.claim(
      created.id,
      "user-1",
    );

    expect(firstClaim?.status).toBe("claimed");
    expect(firstClaim?.claimedByUserId).toBe("user-1");
    expect(repeatedClaim).toEqual(firstClaim);
    expect(
      await guestAssessmentRepository.claim(created.id, "user-2"),
    ).toBeNull();
    expect(
      localStorage.getItem(productConfig.guestAssessmentStorageKey),
    ).not.toBeNull();

    await guestAssessmentRepository.clear(created.id);
    expect(
      localStorage.getItem(productConfig.guestAssessmentStorageKey),
    ).toBeNull();
  });
});
