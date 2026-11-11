import { beforeEach, describe, expect, it, vi } from "vitest";
import { diagnosticQuestions } from "@/data/questions";
import { practiceItems } from "@/content/catalog";
import { mockItems } from "@/content/mock-catalog";
import { messagesFor } from "@/i18n/messages";

const mocks = vi.hoisted(() => ({ locale: vi.fn(), access: vi.fn() }));
vi.mock("@/i18n/server", () => ({
  getLocale: mocks.locale,
  getMessages: async () => messagesFor("en"),
}));
vi.mock("@/lib/supabase/learner", () => ({ getLearnerAccess: mocks.access }));
vi.mock("@/lib/server/diagnostics", () => ({
  logServerError: () => "test-reference",
}));

import { checkDiagnosticAnswersAction } from "./content";

describe("public diagnostic checking", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.locale.mockResolvedValue("en");
  });

  it.each(["en", "fr"] as const)(
    "checks only submitted diagnostic answers in %s",
    async (locale) => {
      mocks.locale.mockResolvedValue(locale);
      const [first, second] = diagnosticQuestions;
      const wrong = second.options!.find(
        (option) => option.id !== second.correctAnswer,
      )!;
      const result = await checkDiagnosticAnswersAction({
        [first.id]: first.correctAnswer,
        [second.id]: wrong.id,
      });
      expect(result).toEqual({
        ok: true,
        feedback: {
          [first.id]: {
            correct: true,
            correctAnswer: first.correctAnswer,
            explanation:
              locale === "fr" ? first.explanationFr : first.explanation,
          },
          [second.id]: {
            correct: false,
            correctAnswer: second.correctAnswer,
            explanation:
              locale === "fr" ? second.explanationFr : second.explanation,
          },
        },
      });
      expect(mocks.access).not.toHaveBeenCalled();
    },
  );

  it("rejects empty, unknown, malformed and non-diagnostic requests without leaking a key", async () => {
    for (const answers of [
      {},
      { [diagnosticQuestions[0].id]: "" },
      { [diagnosticQuestions[0].id]: "unknown-option" },
      { [practiceItems[0].id]: "a" },
      { [mockItems[0].id]: "a" },
      { unknown: "a" },
      { [diagnosticQuestions[0].id]: "a".repeat(501) },
      Object.fromEntries(Array.from({ length: 61 }, (_, i) => [`q${i}`, "a"])),
    ]) {
      const result = await checkDiagnosticAnswersAction(answers);
      expect(result).toMatchObject({ ok: false, reason: "invalid" });
      expect(result).not.toHaveProperty("feedback");
    }
  });

  it("returns a retryable localized failure if checking is unavailable", async () => {
    mocks.locale.mockRejectedValue(new Error("network"));
    expect(
      await checkDiagnosticAnswersAction({
        [diagnosticQuestions[0].id]: diagnosticQuestions[0].correctAnswer,
      }),
    ).toMatchObject({
      ok: false,
      reason: "unavailable",
      reference: "test-reference",
    });
  });
});
