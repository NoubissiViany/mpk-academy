import { describe, expect, it } from "vitest";
import {
  competencyWeakness,
  selectPracticeItems,
  summarizeHistory,
  type PracticeAnswerRecord,
} from "./practice-selection";

/** Small deterministic generator so runs are repeatable. */
function seeded(seed: number) {
  let value = seed;
  return () => {
    value = (value * 1_103_515_245 + 12_345) % 2_147_483_648;
    return value / 2_147_483_648;
  };
}

const item = (id: string, ...competencies: string[]) => ({ id, competencies });
const answer = (
  questionId: string,
  correct: boolean,
  answeredAt = "2026-10-01T10:00:00Z",
): PracticeAnswerRecord => ({ questionId, correct, answeredAt });

const items = ["a", "b", "c", "d", "e", "f"].map((id) => item(id, "main_idea"));
const ids = (selection: { items: { id: string }[] }) =>
  selection.items.map((entry) => entry.id).sort();

describe("selectPracticeItems", () => {
  it("shows unseen items before anything already answered", () => {
    const selection = selectPracticeItems({
      items,
      count: 3,
      answers: [answer("a", true), answer("b", true), answer("c", false)],
      random: seeded(1),
    });
    expect(ids(selection)).toEqual(["d", "e", "f"]);
  });

  it("repeats correct answers seen longest ago before recent misses", () => {
    const selection = selectPracticeItems({
      items: items.slice(0, 3),
      count: 2,
      answers: [
        answer("a", false, "2026-09-01T10:00:00Z"),
        answer("b", true, "2026-10-05T10:00:00Z"),
        answer("c", true, "2026-09-20T10:00:00Z"),
      ],
      random: seeded(2),
    });
    expect(ids(selection)).toEqual(["b", "c"]);
  });

  it("gives due reviews up to 40% of the session and flags them", () => {
    const selection = selectPracticeItems({
      items,
      count: 5,
      answers: [answer("a", false), answer("b", false), answer("c", false)],
      dueIds: ["c", "a", "b"],
      random: seeded(3),
    });
    expect(selection.reviewIds).toEqual(["c", "a"]);
    expect(selection.items).toHaveLength(5);
    expect(new Set(ids(selection)).size).toBe(5);
  });

  it("serves only due items in review mode", () => {
    const selection = selectPracticeItems({
      items,
      count: 10,
      dueIds: ["e", "b"],
      reviewOnly: true,
      random: seeded(4),
    });
    expect(ids(selection)).toEqual(["b", "e"]);
    expect(selection.reviewIds.sort()).toEqual(["b", "e"]);
  });

  it("narrows every tier to the focus competency when it has items", () => {
    const pool = [...items, item("x", "inference"), item("y", "inference")];
    const selection = selectPracticeItems({
      items: pool,
      count: 5,
      dueIds: ["a", "x"],
      focus: "inference",
      random: seeded(5),
    });
    expect(ids(selection)).toEqual(["x", "y"]);
    expect(selection.reviewIds).toEqual(["x"]);
  });

  it("ignores an unknown focus", () => {
    expect(
      selectPracticeItems({
        items,
        count: 4,
        focus: "register",
        random: seeded(6),
      }).items,
    ).toHaveLength(4);
  });

  it("favours unseen items in weak competencies", () => {
    const pool = [
      item("w1", "inference"),
      item("w2", "inference"),
      item("w3", "inference"),
      item("s1", "main_idea"),
      item("s2", "main_idea"),
      item("s3", "main_idea"),
      item("seen-weak", "inference"),
      item("seen-strong", "main_idea"),
    ];
    const answers = [
      ...Array.from({ length: 6 }, () => answer("seen-weak", false)),
      ...Array.from({ length: 6 }, () => answer("seen-strong", true)),
    ];
    const random = seeded(7);
    let weak = 0;
    let strong = 0;
    for (let trial = 0; trial < 400; trial += 1)
      for (const chosen of selectPracticeItems({
        items: pool,
        count: 2,
        answers,
        random,
      }).items)
        if (chosen.id.startsWith("w")) weak += 1;
        else strong += 1;
    expect(weak).toBeGreaterThan(strong * 1.5);
  });
});

describe("history helpers", () => {
  it("keeps the latest outcome per item", () => {
    const history = summarizeHistory([
      answer("a", false, "2026-10-01T10:00:00Z"),
      answer("a", true, "2026-10-03T10:00:00Z"),
      answer("a", false, "2026-10-02T10:00:00Z"),
    ]);
    expect(history.get("a")).toEqual({
      timesSeen: 3,
      lastSeenAt: "2026-10-03T10:00:00Z",
      lastCorrect: true,
    });
  });

  it("smooths competency weakness toward one half", () => {
    const weakness = competencyWeakness(
      [item("a", "inference"), item("b", "main_idea")],
      [answer("a", false), answer("b", true), answer("b", true)],
    );
    expect(weakness.get("inference")).toBeCloseTo(2 / 3);
    expect(weakness.get("main_idea")).toBeCloseTo(1 / 4);
  });
});
