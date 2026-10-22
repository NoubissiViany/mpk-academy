import { describe, it, expect } from "vitest";
import { diagnosticItems, practiceItems, lessons } from "./catalog";
import { mockItems, manifests, mockReady } from "./mock-catalog";
import { validateContent } from "./validate";
import { candidateItem } from "./shared/types";
import { toQuestion } from "./adapters";
import { scoreDiagnostic } from "@/lib/domain/diagnostic";
const items = [...diagnosticItems, ...practiceItems, ...mockItems];
// Counts grow as reviewed content is merged, so these tests check structure,
// not totals.
const pendingListening = (list: typeof items) =>
  list.filter(
    (i) =>
      i.kind === "mcq" &&
      i.skill === "listening" &&
      i.audio?.status !== "ready",
  );

describe("MPK content", () => {
  it("validates, with a diagnostic covering every level and skill, and complete manifests", () => {
    const report = validateContent(
      items,
      lessons,
      manifests,
      practiceItems.map((i) => i.id),
    );
    expect(report).toMatchObject({
      items: items.length,
      lessons: lessons.length,
      mocks: 2,
    });
    expect(report.pendingAudio).toEqual(
      pendingListening(items).map((i) => i.id),
    );
    for (const level of ["A2", "B1", "B2", "C1"])
      expect(diagnosticItems.some((i) => i.level === level)).toBe(true);
    for (const skill of ["reading", "listening", "grammar", "vocabulary"])
      expect(
        diagnosticItems.filter((i) => i.skill === skill).length,
      ).toBeGreaterThanOrEqual(4);
    // A full mock opens only once every listening clip in it is ready.
    for (const m of manifests) {
      const ids = new Set(m.sections.flatMap((section) => section.itemIds));
      expect(mockReady(m.id)).toBe(
        pendingListening(mockItems).every((i) => !ids.has(i.id)),
      );
    }
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
    // Pending audio is a fixture here, whatever clips exist.
    const qs = diagnosticItems.map(toQuestion).map((q) =>
      q.metadata?.audio
        ? {
            ...q,
            metadata: {
              ...q.metadata,
              audio: {
                ...q.metadata.audio,
                status: "pending" as const,
                path: undefined,
              },
            },
          }
        : q,
    );
    const answers = Object.fromEntries(qs.map((q) => [q.id, q.correctAnswer]));
    const perfect = scoreDiagnostic(qs, answers);
    expect(perfect).toMatchObject({
      score: 100,
      assessedItemCount: qs.filter((q) => q.diagnosticSkill !== "listening")
        .length,
      languageFoundation: 100,
      skillScores: { listening: null },
      algorithmVersion: "mpk-diagnostic-v2",
    });
    for (const q of qs.filter((q) => q.diagnosticSkill === "listening"))
      answers[q.id] = "wrong";
    expect(scoreDiagnostic(qs, answers)).toEqual(perfect);
  });
  it("counts listening only when ready audio is supplied", () => {
    const qs = diagnosticItems.map(toQuestion).map((q) =>
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
    expect(result.assessedItemCount).toBe(qs.length);
    expect(result.skillScores.listening).toBe(100);
  });
});
