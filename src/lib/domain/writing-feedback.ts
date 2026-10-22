import { z } from "zod";
import type { NclcTarget } from "@/types/domain";

// The contract between the AI reviewer and the app. The provider is asked only
// for the shape (no enum lists, which make it reject whole answers); the model's
// answer is parsed leniently with `rawFeedbackSchema`, then `verifyFeedback`
// normalises ids, levels, and categories and keeps only what the essay
// supports: quotes must appear in it, corrections must be small edits.

export const criterionIds = [
  "task",
  "coherence",
  "vocabulary",
  "grammar",
] as const;
export type CriterionId = (typeof criterionIds)[number];
export const bands = ["A1", "A2", "B1", "B2", "C1"] as const;
export type Band = (typeof bands)[number];
export const fixCategories = [
  "grammar",
  "agreement",
  "verb",
  "spelling",
  "vocabulary",
  "register",
  "punctuation",
] as const;

export const rawFeedbackSchema = z.object({
  criteria: z.array(
    z.object({
      id: z.string(),
      band: z.string(),
      evidence: z.string(),
      comment: z.string(),
    }),
  ),
  fixes: z.array(
    z.object({
      quote: z.string(),
      correction: z.string(),
      explanation: z.string(),
      category: z.string(),
    }),
  ),
  rewrite: z.object({ original: z.string(), improved: z.string() }),
  summary: z.string(),
});
export type RawFeedback = z.infer<typeof rawFeedbackSchema>;

/** Strict JSON Schema for the provider; mirrors `rawFeedbackSchema`. */
export const feedbackJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["criteria", "fixes", "rewrite", "summary"],
  properties: {
    criteria: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "band", "evidence", "comment"],
        properties: {
          id: { type: "string" },
          band: { type: "string" },
          evidence: { type: "string" },
          comment: { type: "string" },
        },
      },
    },
    fixes: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["quote", "correction", "explanation", "category"],
        properties: {
          quote: { type: "string" },
          correction: { type: "string" },
          explanation: { type: "string" },
          category: { type: "string" },
        },
      },
    },
    rewrite: {
      type: "object",
      additionalProperties: false,
      required: ["original", "improved"],
      properties: {
        original: { type: "string" },
        improved: { type: "string" },
      },
    },
    summary: { type: "string" },
  },
} as const;

export interface WritingFeedback {
  version: 1;
  criteria: Array<{
    id: CriterionId;
    band: Band;
    evidence: string | null;
    comment: string;
  }>;
  fixes: Array<{
    quote: string;
    correction: string;
    explanation: string;
    category: (typeof fixCategories)[number];
  }>;
  rewrite: { original: string; improved: string } | null;
  summary: string;
  /** Model suggestions removed because the essay did not support them. */
  dropped: number;
}

export const storedFeedbackSchema = z.object({
  version: z.literal(1),
  criteria: z.array(
    z.object({
      id: z.enum(criterionIds),
      band: z.enum(bands),
      evidence: z.string().nullable(),
      comment: z.string(),
    }),
  ),
  fixes: z.array(
    z.object({
      quote: z.string(),
      correction: z.string(),
      explanation: z.string(),
      category: z.enum(fixCategories),
    }),
  ),
  rewrite: z.object({ original: z.string(), improved: z.string() }).nullable(),
  summary: z.string(),
  dropped: z.number(),
});

/** Approximate CEFR level for each NCLC target, used as the bar for each band. */
export const targetBandFor: Record<NclcTarget, Band> = {
  "NCLC 5": "B1",
  "NCLC 7": "B2",
  "NCLC 9+": "C1",
  "I'm not sure": "B2",
};

export const compareBand = (band: Band, target: Band) =>
  bands.indexOf(band) - bands.indexOf(target);

/** Typography-insensitive form used to match quotes against the essay. */
export const normalizeForMatch = (text: string) =>
  text
    .normalize("NFC")
    .replace(/['‘’ʼ]/g, "'")
    .replace(/[“”«»]/g, '"')
    // Hyphen and dash variants, soft hyphens, and zero-width characters look
    // alike to a learner, so a "correction" that only swaps them is no change.
    .replace(/[\u2010-\u2013\u2212]/g, "-")
    .replace(/[\u00ad\u200b-\u200d\u2060\ufeff]/g, "")
    .replace(/[  \s]+/g, " ")
    .trim();

function editDistance(left: string, right: string) {
  const previous = Array.from({ length: right.length + 1 }, (_, i) => i);
  for (let i = 1; i <= left.length; i += 1) {
    let diagonal = previous[0];
    previous[0] = i;
    for (let j = 1; j <= right.length; j += 1) {
      const above = previous[j];
      previous[j] = Math.min(
        previous[j] + 1,
        previous[j - 1] + 1,
        diagonal + (left[i - 1] === right[j - 1] ? 0 : 1),
      );
      diagonal = above;
    }
  }
  return previous[right.length];
}

const clip = (text: string, length: number) => text.trim().slice(0, length);

/** "B1+", "b1", "C2", and similar become a supported level; nonsense is null. */
export function normalizeBand(value: string): Band | null {
  const match = value.toUpperCase().match(/\b([ABC])\s*([12])/);
  if (!match) return null;
  const level = `${match[1]}${match[2]}`;
  return level === "C2"
    ? "C1"
    : (bands as readonly string[]).includes(level)
      ? (level as Band)
      : null;
}

const categoryFor = (value: string): (typeof fixCategories)[number] => {
  const key = value.trim().toLowerCase();
  return (fixCategories as readonly string[]).includes(key)
    ? (key as (typeof fixCategories)[number])
    : "grammar";
};

export interface VerifyOptions {
  /** Fix categories that do not apply (for example spelling in a transcript). */
  ignoreCategories?: ReadonlyArray<(typeof fixCategories)[number]>;
  /**
   * Match quotes without case or punctuation, for automatic transcripts whose
   * punctuation is the transcriber's, not the learner's.
   */
  looseMatch?: boolean;
}

export function verifyFeedback(
  essay: string,
  raw: RawFeedback,
  options: VerifyOptions = {},
): WritingFeedback | null {
  const normalizeText = (text: string) =>
    options.looseMatch
      ? normalizeForMatch(text)
          .toLowerCase()
          .replace(/[.,;:!?…"()]/g, " ")
          .replace(/\s+/g, " ")
          .trim()
      : normalizeForMatch(text);
  const source = normalizeText(essay);
  const appears = (quote: string) => {
    const needle = normalizeText(quote);
    return needle.length > 0 && source.includes(needle);
  };
  let dropped = 0;

  const criteria = criterionIds.flatMap((id) => {
    const criterion = raw.criteria.find(
      (item) => item.id.trim().toLowerCase() === id,
    );
    const band = criterion ? normalizeBand(criterion.band) : null;
    if (!criterion || !band) return [];
    const evidence = appears(criterion.evidence)
      ? clip(criterion.evidence, 300)
      : null;
    if (!evidence && criterion.evidence.trim()) dropped += 1;
    return [
      {
        id,
        band,
        evidence,
        comment: clip(criterion.comment, 400),
      },
    ];
  });
  // Every criterion needs a band, or the feedback is not usable.
  if (criteria.length !== criterionIds.length) return null;

  const seen = new Set<string>();
  const fixes = raw.fixes.filter((fix) => {
    const quote = normalizeText(fix.quote);
    const correction = normalizeText(fix.correction);
    const valid =
      !options.ignoreCategories?.includes(categoryFor(fix.category)) &&
      quote.length > 0 &&
      quote.length <= 160 &&
      correction.length > 0 &&
      correction !== quote &&
      !seen.has(quote) &&
      appears(fix.quote) &&
      correction.length <= quote.length * 2 + 10 &&
      editDistance(quote, correction) <=
        Math.max(4, Math.round(quote.length * 0.5));
    if (valid) seen.add(quote);
    else dropped += 1;
    return valid;
  });

  const original = normalizeText(raw.rewrite.original);
  const improved = raw.rewrite.improved.trim();
  const rewrite =
    original.length >= 30 &&
    appears(raw.rewrite.original) &&
    improved.length > 0 &&
    normalizeText(improved) !== original &&
    improved.length <= original.length * 1.8 + 40
      ? { original: raw.rewrite.original.trim(), improved }
      : null;
  if (!rewrite && raw.rewrite.original.trim()) dropped += 1;

  return {
    version: 1,
    criteria,
    fixes: fixes.slice(0, 8).map((fix) => ({
      quote: fix.quote.trim(),
      correction: fix.correction.trim(),
      explanation: clip(fix.explanation, 300),
      category: categoryFor(fix.category),
    })),
    rewrite,
    summary: clip(raw.summary, 600),
    dropped,
  };
}
