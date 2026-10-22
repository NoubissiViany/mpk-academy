// Rule-based checks that need no AI: they run on every essay, cost nothing,
// and give the learner something useful even when the AI budget is spent.

export interface WritingChecks {
  words: number;
  range: { min: number; max: number | null } | null;
  length: "under" | "within" | "over" | "unknown";
  paragraphs: number;
  /** Forms of address used: informal (tu), formal (vous), or both. */
  address: "tu" | "vous" | "mixed" | "none";
  connectors: string[];
  variety: "low" | "ok";
}

export const countWords = (text: string) =>
  text.trim() ? text.trim().split(/\s+/).length : 0;

// Connecting words examiners look for, longest first so "par conséquent"
// is not also counted as a shorter match.
const connectorList = [
  "en ce qui concerne",
  "d’une part",
  "d’autre part",
  "par conséquent",
  "en conclusion",
  "en revanche",
  "en outre",
  "en effet",
  "par ailleurs",
  "cependant",
  "pourtant",
  "toutefois",
  "néanmoins",
  "de plus",
  "d’abord",
  "ensuite",
  "enfin",
  "finalement",
  "puisque",
  "bien que",
  "alors que",
  "tandis que",
  "c’est pourquoi",
  "ainsi",
  "donc",
  "car",
  "mais",
  "or",
];

const normalize = (text: string) =>
  text
    .normalize("NFC")
    .toLowerCase()
    .replace(/['‘ʼ]/g, "’")
    .replace(/[  ]/g, " ");

const escape = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Word boundaries that understand accented letters.
const wordPattern = (phrase: string) =>
  new RegExp(`(?<![\\p{L}’])${escape(phrase)}(?![\\p{L}])`, "u");

export function checkWriting(
  text: string,
  range?: { min: number; max?: number } | null,
): WritingChecks {
  const words = countWords(text);
  const lower = normalize(text);
  const paragraphs = text
    .split(/\n+/)
    .filter((paragraph) => paragraph.trim()).length;

  const informal = /(?<![\p{L}’])(tu|te|toi|ton|ta|tes|t’)(?![\p{L}])/u.test(
    lower,
  );
  const formal = /(?<![\p{L}’])(vous|votre|vos)(?![\p{L}])/u.test(lower);

  let remaining = lower;
  const connectors: string[] = [];
  for (const connector of connectorList) {
    const pattern = wordPattern(connector);
    if (pattern.test(remaining)) {
      connectors.push(connector);
      remaining = remaining.replace(new RegExp(pattern, "gu"), " ");
    }
  }

  return {
    words,
    range: range ? { min: range.min, max: range.max ?? null } : null,
    length: !range
      ? "unknown"
      : words < range.min
        ? "under"
        : range.max && words > range.max
          ? "over"
          : "within",
    paragraphs,
    address:
      informal && formal ? "mixed" : informal ? "tu" : formal ? "vous" : "none",
    connectors,
    variety: connectors.length >= 3 ? "ok" : "low",
  };
}
