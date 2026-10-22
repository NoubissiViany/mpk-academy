import { describe, expect, it } from "vitest";
import { diagnosticItems, lessons, practiceItems } from "./catalog";
import { manifests, mockItems } from "./mock-catalog";
import {
  allowedLongestCorrect,
  correctIsLongest,
  isShortDocument,
  nearDuplicates,
  unbalancedPositions,
} from "./quality";
import type { MCQ } from "./shared/types";
import { contentDebt, validateContent, type ContentDebt } from "./validate";

const items = [...diagnosticItems, ...practiceItems, ...mockItems];
const practiceIds = practiceItems.map((item) => item.id);
const mcq = (id: string) =>
  structuredClone(items.find((item) => item.id === id)) as MCQ;
const validate = (
  overrides: { items?: typeof items; debt?: ContentDebt } = {},
) =>
  validateContent(
    overrides.items ?? items,
    lessons,
    manifests,
    practiceIds,
    overrides.debt ?? contentDebt,
  );
const words = (n: number) =>
  Array.from({ length: n }, (_, i) => `mot${i}`).join(" ");

describe("item-writing checks", () => {
  it("measures documents against the level's minimum", () => {
    const item = mcq("tef-reading-b2-001");
    item.passage = words(99);
    expect(isShortDocument(item)).toBe(true);
    item.passage = words(100);
    expect(isShortDocument(item)).toBe(false);
    expect(isShortDocument(mcq("diagnostic-grammar-a2-001"))).toBe(false);
  });

  it("spots a correct answer that is longer than every distractor", () => {
    const item = mcq("tef-reading-a2-001");
    const correct = item.options.find((o) => o.id === item.correction.answer)!;
    correct.label = "À dix-sept heures quinze, au plus tard.";
    expect(correctIsLongest(item)).toBe(true);
    correct.label = "17 h 15";
    expect(correctIsLongest(item)).toBe(false);
  });

  it("allows chance plus one standard deviation", () => {
    expect(allowedLongestCorrect(40)).toBe(13);
    expect(allowedLongestCorrect(60)).toBe(18);
  });

  it("flags an answer position used far more than a quarter of the time", () => {
    const pool = Array.from({ length: 40 }, (_, i) => {
      const item = mcq("tef-reading-a2-001");
      item.correction.answer = i < 25 ? "a" : "bcd"[i % 3];
      return item;
    });
    expect(unbalancedPositions(pool)).toContain("a: 25/40");
  });

  it("finds near-duplicates and ignores different texts", () => {
    const base =
      "La piscine municipale ferme à dix-huit heures et la dernière entrée est possible à dix-sept heures quinze pour tous les usagers.";
    const pairs = nearDuplicates([
      { id: "one", text: base },
      { id: "two", text: base.replace("dix-huit", "dix-neuf") },
      { id: "three", text: "Le marché de quartier ouvre le samedi matin." },
    ]);
    expect(pairs).toHaveLength(1);
    expect(pairs[0]).toMatchObject({ a: "one", b: "two" });
  });
});

describe("content validation", () => {
  it("accepts the published content with its recorded debt", () => {
    expect(() => validate()).not.toThrow();
  });

  it("rejects a new short document but accepts a listed one", () => {
    const item = mcq("tef-reading-b2-001");
    const others = items.filter((i) => i.id !== item.id);
    expect(contentDebt.shortDocuments).toContain(item.id);
    const debt = {
      ...contentDebt,
      shortDocuments: contentDebt.shortDocuments.filter((id) => id !== item.id),
    };
    expect(() => validate({ items: [...others, item], debt })).toThrow(
      /tef-reading-b2-001: \d+-word document; B2 reading needs at least 100/,
    );
  });

  it("asks for the debt list to shrink once an item is fixed", () => {
    const item = mcq("tef-reading-b2-001");
    item.passage = words(120);
    expect(() =>
      validate({
        items: items.map((i) => (i.id === item.id ? item : i)),
      }),
    ).toThrow("tef-reading-b2-001: no longer a short document");
  });

  it("rejects a mock section where the longest option is too often right", () => {
    const debt = { ...contentDebt, longestCorrect: {} };
    expect(() => validate({ debt })).toThrow(
      "tef-mock-01 reading: the correct answer is the longest option in 18 of 40 questions; chance allows 13",
    );
  });

  it("rejects a near-duplicate question", () => {
    const copy = mcq("tef-reading-a2-001");
    copy.id = "tef-reading-a2-099";
    expect(() => validate({ items: [...items, copy] })).toThrow(
      "tef-reading-a2-099: near-duplicate of tef-reading-a2-001",
    );
  });

  it("rejects a mock clip that leaves no time to answer", () => {
    const clip = mcq("tef-mock-listening-a2-001");
    clip.audio!.intendedDuration = 55;
    expect(() =>
      validate({ items: items.map((i) => (i.id === clip.id ? clip : i)) }),
    ).toThrow("tef-mock-listening-a2-001: a 55s clip leaves under 10s");
  });

  it("requires French teaching text", () => {
    const item = mcq("tef-reading-a2-001");
    delete item.correction.explanationFr;
    expect(() =>
      validate({ items: items.map((i) => (i.id === item.id ? item : i)) }),
    ).toThrow("tef-reading-a2-001: missing French explanation");
  });
});
