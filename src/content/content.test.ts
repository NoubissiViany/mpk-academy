import { describe, it, expect } from "vitest";
import { diagnosticItems, practiceItems, lessons } from "./catalog";
import { mockItems, manifests, mockReady } from "./mock-catalog";
import { validateContent } from "./validate";
import { candidateItem } from "./shared/types";
import { toQuestion } from "./adapters";
import { scoreDiagnostic } from "@/lib/domain/diagnostic";
const items = [...diagnosticItems, ...practiceItems, ...mockItems];
describe("original MPK seed", () => {
  it("has the exact approved distribution and complete valid manifests", () => {
    const report = validateContent(
      items,
      lessons,
      manifests,
      practiceItems.map((i) => i.id),
    );
    expect(report).toMatchObject({ items: 248, lessons: 24, mocks: 2 });
    expect(report.pendingAudio).toHaveLength(103);
    expect(
      Object.fromEntries(
        ["A2", "B1", "B2", "C1"].map((l) => [
          l,
          diagnosticItems.filter((i) => i.level === l).length,
        ]),
      ),
    ).toEqual({ A2: 4, B1: 6, B2: 6, C1: 4 });
    expect(
      Object.fromEntries(
        ["reading", "listening", "grammar", "vocabulary"].map((s) => [
          s,
          diagnosticItems.filter((i) => i.skill === s).length,
        ]),
      ),
    ).toEqual({ reading: 6, listening: 4, grammar: 6, vocabulary: 4 });
    for (const m of manifests) expect(mockReady(m.id)).toBe(false);
  });
  it("rejects malformed options, IDs, word limits and speaking timers", () => {
    const bad = structuredClone(items);
    const q = bad.find((i) => i.kind === "mcq")!;
    if (q.kind === "mcq") q.options.pop();
    expect(() => validateContent(bad, lessons, manifests, [])).toThrow(
      "four distinct options",
    );
    expect(() =>
      validateContent([...items, items[0]], lessons, manifests, []),
    ).toThrow("duplicate ID");
    const task = structuredClone(items.find((i) => i.kind === "writing")!);
    if (task.kind === "writing") task.wordCount = { min: 1 };
    expect(() => validateContent([task], [], [], [])).toThrow("word range");
    const speaking = structuredClone(items.find((i) => i.kind === "speaking")!);
    if (speaking.kind === "speaking") speaking.durationSeconds = 1;
    expect(() => validateContent([speaking], [], [], [])).toThrow(
      "speaking timing",
    );
  });
  it("never includes correction material in candidate projections", () => {
    for (const item of items) {
      const value = candidateItem(item);
      expect(value).not.toHaveProperty("correction");
      expect(value).not.toHaveProperty("transcript");
      if (value.audio) expect(value.audio).not.toHaveProperty("transcript");
    }
  });
  it("excludes transcript answers from scores and competency evidence", () => {
    const qs = diagnosticItems.map(toQuestion);
    const answers = Object.fromEntries(qs.map((q) => [q.id, q.correctAnswer]));
    const perfect = scoreDiagnostic(qs, answers);
    expect(perfect).toMatchObject({
      score: 100,
      assessedItemCount: 16,
      languageFoundation: 100,
      skillScores: { listening: null },
      algorithmVersion: "mpk-diagnostic-v2",
    });
    for (const q of qs.filter((q) => q.diagnosticSkill === "listening"))
      answers[q.id] = "wrong";
    expect(scoreDiagnostic(qs, answers)).toEqual(perfect);
  });
  it("counts listening only when ready audio is supplied", () => {
    const qs = diagnosticItems
      .map(toQuestion)
      .map((q) =>
        q.metadata?.audio
          ? {
              ...q,
              metadata: {
                ...q.metadata,
                audio: {
                  ...q.metadata.audio,
                  status: "ready" as const,
                  path: "/test-only/audio.wav",
                },
              },
            }
          : q,
      );
    const result = scoreDiagnostic(
      qs,
      Object.fromEntries(qs.map((q) => [q.id, q.correctAnswer])),
    );
    expect(result.assessedItemCount).toBe(20);
    expect(result.skillScores.listening).toBe(100);
  });
});
