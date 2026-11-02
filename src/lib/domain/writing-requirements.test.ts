import { describe, expect, it } from "vitest";
import {
  canSubmitWriting,
  countWords,
  validWritingRange,
} from "./writing-checks";
import { shuffleQuestions } from "./question-order";
import {
  getPublicDiagnosticQuestions,
  scoreGuestDiagnostic,
} from "@/lib/server/content";

const words = (count: number) => Array(count).fill("mot").join(" ");
describe("task-specific writing requirements", () => {
  it.each([60, 80, 120, 200])(
    "requires exactly the configured %i words",
    (min) => {
      expect(canSubmitWriting(words(min - 1), { min })).toBe(false);
      expect(canSubmitWriting(words(min), { min })).toBe(true);
      expect(canSubmitWriting(words(min + 1), { min })).toBe(true);
    },
  );
  it("preserves the diagnostic maximum without imposing one elsewhere", () => {
    expect(canSubmitWriting(words(121), { min: 80, max: 120 }, true)).toBe(
      false,
    );
    expect(canSubmitWriting(words(120), { min: 80, max: 120 }, true)).toBe(
      true,
    );
    expect(canSubmitWriting(words(151), { min: 120, max: 150 })).toBe(true);
  });
  it("rejects missing/invalid ranges and counts French and ordinary whitespace consistently", () => {
    for (const range of [
      undefined,
      { min: 0 },
      { min: NaN },
      { min: 1.5 },
      { min: 80, max: 60 },
    ]) {
      expect(validWritingRange(range)).toBe(false);
      expect(canSubmitWriting(words(200), range)).toBe(false);
    }
    expect(countWords(" \t\n\u00a0\u202f\ufeff")).toBe(0);
    expect(countWords(" \nmot\tdeux\u00a0trois\u202fquatre\ufeffcinq ")).toBe(
      5,
    );
  });
});
describe("diagnostic presentation", () => {
  it("preserves all 26 identities, difficulty coverage, choices and scoring without leaking keys", () => {
    const source = getPublicDiagnosticQuestions();
    const before = structuredClone(source);
    const shuffled = shuffleQuestions(source, true, () => 0);
    expect(shuffled).toHaveLength(26);
    expect(shuffled.map((q) => q.id).sort()).toEqual(
      source.map((q) => q.id).sort(),
    );
    expect(shuffled.map((q) => q.id)).not.toEqual(source.map((q) => q.id));
    expect(shuffled.map((q) => q.difficulty)).toEqual(
      [...shuffled.map((q) => q.difficulty)].sort(
        (a, b) =>
          ["A2", "B1", "B2", "C1"].indexOf(a) -
          ["A2", "B1", "B2", "C1"].indexOf(b),
      ),
    );
    for (const item of shuffled) {
      expect(item).not.toHaveProperty("correctAnswer");
      expect(
        [...item.options!].sort((a, b) => a.id.localeCompare(b.id)),
      ).toEqual(
        [...source.find((q) => q.id === item.id)!.options!].sort((a, b) =>
          a.id.localeCompare(b.id),
        ),
      );
    }
    const answers = Object.fromEntries(
      shuffled.map((q) => [q.id, q.options![0].id]),
    );
    expect(scoreGuestDiagnostic(answers)).toEqual(
      scoreGuestDiagnostic(
        Object.fromEntries(Object.entries(answers).reverse()),
      ),
    );
    expect(source).toEqual(before);
  });
});
