import { describe, expect, it } from "vitest";
import { practiceItems } from "./catalog";
import {
  draftProblems,
  needsTeacher,
  newItemsMessages,
  parseDraftItems,
  rewriteMessages,
  toSeed,
  type DraftItem,
} from "./drafting";
import { questions } from "./shared/builders";
import type { MCQ } from "./shared/types";

const words = (n: number) =>
  Array.from({ length: n }, (_, i) => `mot${i}`).join(" ");
const draft = (overrides: Partial<DraftItem> = {}): DraftItem => ({
  id: "tef-reading-b1-099",
  exam: "TEF",
  skill: "reading",
  level: "B1",
  competency: "specific_detail",
  topic: "Logement",
  documentType: "courriel",
  document: words(80),
  prompt: "Que demande la propriétaire ?",
  correct: "De laisser entrer le plombier.",
  wrong: [
    "De payer le loyer en avance cette fois.",
    "De changer la serrure de la porte.",
    "De rappeler le gardien demain matin.",
  ],
  explanation: "The landlord asks the tenant to let the plumber in.",
  explanationFr: "La propriétaire demande de laisser entrer le plombier.",
  review: "pending",
  problems: [],
  ...overrides,
});

describe("drafting questions", () => {
  it("asks for original documents in the level's word range", () => {
    const [system, user] = newItemsMessages({
      exam: "TCF",
      skill: "listening",
      level: "B2",
      count: 3,
      avoidTopics: ["Piscine"],
    });
    expect(system.content).toContain("TCF Canada");
    expect(user.content).toContain("55 to 95 words");
    expect(user.content).toContain("must NOT be the longest");
    expect(user.content).toContain("Piscine");
  });

  it("sends the question being rewritten with its own word range", () => {
    const original = practiceItems.find(
      (i) => i.id === "tef-reading-b2-001",
    ) as MCQ;
    const [, user] = rewriteMessages([original]);
    expect(user.content).toContain('"id":"tef-reading-b2-001"');
    expect(user.content).toContain('"words":"100–200"');
  });

  it("keeps usable answers and numbers new questions", () => {
    let n = 98;
    const items = parseDraftItems(
      {
        items: [
          {
            competency: "inference",
            topic: "Travail",
            documentType: "note",
            document: "  Un   texte‑court. ",
            speakers: "",
            prompt: "Q ?",
            correct: "C",
            wrong: ["A", "B", "D"],
            explanation: "E",
            explanationFr: "F",
          },
          { competency: "inference", wrong: ["only one"] },
        ],
      },
      { exam: "TEF", skill: "reading", level: "B1" },
      () => `tef-reading-b1-0${(n += 1)}`,
    );
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      id: "tef-reading-b1-099",
      document: "Un texte-court.",
      review: "pending",
    });
    expect(items[0]).not.toHaveProperty("replaces");
  });

  it("marks rewrites and ignores ids it was not asked about", () => {
    const original = practiceItems.find(
      (i) => i.id === "tef-reading-b2-001",
    ) as MCQ;
    const answer = (id: string) => ({
      id,
      competency: "inference",
      topic: "T",
      documentType: "article",
      document: "D",
      speakers: "",
      prompt: "P",
      correct: "C",
      wrong: ["A", "B", "D"],
      explanation: "E",
      explanationFr: "F",
    });
    const items = parseDraftItems(
      { items: [answer("tef-reading-b2-001"), answer("invented")] },
      { exam: "TEF", skill: "reading" },
      () => "unused",
      [original],
    );
    expect(items.map((i) => [i.id, i.level, i.replaces])).toEqual([
      ["tef-reading-b2-001", "B2", true],
    ]);
  });

  it("reports length, answer-length cue, voices and duplicates", () => {
    expect(draftProblems(draft(), [])).toEqual([]);
    expect(draftProblems(draft({ document: words(30) }), [])).toContain(
      "document has 30 words; B1 needs 60–120",
    );
    expect(
      draftProblems(
        draft({
          correct: "De laisser entrer le plombier mardi matin, à neuf heures.",
        }),
        [],
      ),
    ).toContain("the correct option is the longest");
    expect(
      draftProblems(
        draft({
          skill: "listening",
          document: `A : ${words(20)} B : ${words(20)}`,
          speakers: "F",
        }),
        [],
      ),
    ).toContain("speakers should give F or M for each of 2 speaker(s)");
    const text = `${words(80)} Que demande la propriétaire ?`;
    expect(draftProblems(draft(), [{ id: "other", text }])).toContain(
      "near-duplicate of other",
    );
  });

  it("writes the tuple the content files use", () => {
    const [item] = questions("TEF", "reading", [toSeed(draft())]);
    expect(item.correction.explanationFr).toBe(draft().explanationFr);
    expect(item.options.map((o) => o.label)).toContain(draft().correct);
  });

  it("sends every mock question to the teacher", () => {
    expect(needsTeacher("tef-mock-reading-b2-001", true)).toBe(true);
    const sample = practiceItems.filter((i) => needsTeacher(i.id, false));
    expect(sample.length).toBeGreaterThan(5);
    expect(sample.length).toBeLessThan(20);
  });
});
