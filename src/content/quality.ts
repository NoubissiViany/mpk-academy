// Item-writing checks shared by content validation and the drafting scripts.
// Pure functions over plain content objects: no I/O, no framework imports.
import type { ContentLevel } from "./shared/levels";
import type { MCQ } from "./shared/types";

export function wordCount(value: string) {
  return value.trim().split(/\s+/u).filter(Boolean).length;
}

/**
 * Shortest document a question at each level may rest on, in words. Real
 * TEF and TCF documents grow from short notices (A2) to full articles and
 * minute-long recordings (C1); shorter ones make an item easier than its
 * label. Listening stays shorter so a clip and its answer fit the mock's
 * per-question time.
 */
export const minimumWords: Record<
  "reading" | "listening",
  Record<ContentLevel, number>
> = {
  reading: { A2: 30, B1: 60, B2: 100, C1: 140 },
  listening: { A2: 20, B1: 35, B2: 55, C1: 75 },
};

/** The text a reading or listening question is answered from. */
export const documentText = (item: MCQ) =>
  item.passage ?? item.audio?.transcript ?? "";

export function isShortDocument(item: MCQ) {
  if (item.skill !== "reading" && item.skill !== "listening") return false;
  return wordCount(documentText(item)) < minimumWords[item.skill][item.level];
}

/** The correct option is longer than every distractor. */
export function correctIsLongest(item: MCQ) {
  const correct = item.options.find((o) => o.id === item.correction.answer);
  if (!correct) return false;
  return item.options.every(
    (o) => o === correct || o.label.trim().length < correct.label.trim().length,
  );
}

// Pools smaller than this are too small for a share to mean anything.
export const MIN_POOL_FOR_SHARES = 20;

/**
 * How many "longest option is correct" items a pool of n may hold: what
 * chance gives (one in four) plus one standard deviation of slack.
 */
export const allowedLongestCorrect = (n: number) =>
  Math.round(n / 4 + Math.sqrt((3 * n) / 16));

/** Each answer position should hold about a quarter of a pool. */
export function unbalancedPositions(items: MCQ[]) {
  const n = items.length;
  const slack = 2 * Math.sqrt((3 * n) / 16);
  const counts = { a: 0, b: 0, c: 0, d: 0 } as Record<string, number>;
  for (const item of items) counts[item.correction.answer] += 1;
  return Object.entries(counts)
    .filter(([, count]) => Math.abs(count - n / 4) > slack)
    .map(([position, count]) => `${position}: ${count}/${n}`);
}

const normalise = (text: string) =>
  text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .split(" ")
    .filter(Boolean);

/** Overlapping three-word sequences, the unit of near-duplicate detection. */
export function shingles(text: string) {
  const words = normalise(text);
  const result = new Set<string>();
  for (let i = 0; i + 3 <= words.length; i += 1)
    result.add(words.slice(i, i + 3).join(" "));
  return result;
}

export const NEAR_DUPLICATE = 0.5;

/**
 * Pairs whose texts share at least half of their three-word sequences
 * (Jaccard similarity). An inverted index keeps this fast for thousands of
 * items: only texts sharing a sequence are compared.
 */
export function nearDuplicates(
  texts: { id: string; text: string }[],
  threshold = NEAR_DUPLICATE,
) {
  const sets = texts.map((t) => shingles(t.text));
  const index = new Map<string, number[]>();
  sets.forEach((set, i) => {
    for (const s of set) {
      const holders = index.get(s);
      if (holders) holders.push(i);
      else index.set(s, [i]);
    }
  });
  const pairs: { a: string; b: string; similarity: number }[] = [];
  sets.forEach((set, i) => {
    const shared = new Map<number, number>();
    for (const s of set)
      for (const j of index.get(s) ?? [])
        if (j > i) shared.set(j, (shared.get(j) ?? 0) + 1);
    for (const [j, common] of shared) {
      const similarity = common / (set.size + sets[j].size - common);
      if (similarity >= threshold)
        pairs.push({
          a: texts[i].id,
          b: texts[j].id,
          similarity: Math.round(similarity * 100) / 100,
        });
    }
  });
  return pairs;
}
