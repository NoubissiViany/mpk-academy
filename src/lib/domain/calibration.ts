import { z } from "zod";

const bands = ["A2", "B1", "B2", "C1"] as const;
const criteria = ["task", "coherence", "vocabulary", "grammar"] as const;
const ratings = z
  .object({
    task: z.enum(bands).nullable(),
    coherence: z.enum(bands).nullable(),
    vocabulary: z.enum(bands).nullable(),
    grammar: z.enum(bands).nullable(),
  })
  .strict();

export const writingCalibrationSchema = z
  .object({
    model: z.string().min(1),
    promptRevision: z.string().min(1),
    samples: z.array(
      z
        .object({
          sampleId: z.string().regex(/^[a-z0-9][a-z0-9_-]{0,63}$/i),
          exam: z.enum(["TEF", "TCF"]),
          target: z.enum(["NCLC 5", "NCLC 7", "NCLC 9+"]),
          consentConfirmed: z.boolean(),
          independentTeacherReview: z.boolean(),
          teacher: ratings,
          ai: ratings,
        })
        .strict(),
    ),
  })
  .strict();

export type WritingCalibration = z.infer<typeof writingCalibrationSchema>;

/** Aggregate ratings only. This cannot authenticate consent or teacher identity. */
export function evaluateWritingCalibration(input: unknown) {
  const data = writingCalibrationSchema.parse(input);
  if (new Set(data.samples.map((s) => s.sampleId)).size !== data.samples.length)
    throw new Error("Each calibration sampleId must be unique.");

  const complete = data.samples.filter(
    (s) =>
      s.consentConfirmed &&
      s.independentTeacherReview &&
      criteria.every(
        (criterion) =>
          s.teacher[criterion] !== null && s.ai[criterion] !== null,
      ),
  );
  const count = complete.length;
  const issues: string[] = [];
  if (count < 40)
    issues.push(
      `Need at least 40 complete, consented, independently rated essays; have ${count}.`,
    );
  if (count !== data.samples.length)
    issues.push(
      `${data.samples.length - count} entries are incomplete or lack confirmed consent/independent review.`,
    );
  for (const exam of ["TEF", "TCF"] as const)
    if (!complete.some((s) => s.exam === exam))
      issues.push(`Missing ${exam} samples.`);
  for (const target of ["NCLC 5", "NCLC 7", "NCLC 9+"] as const)
    if (!complete.some((s) => s.target === target))
      issues.push(`Missing ${target} samples.`);

  const scores = criteria.map((criterion) => {
    const deltas = complete.map(
      (s) =>
        bands.indexOf(s.ai[criterion]!) - bands.indexOf(s.teacher[criterion]!),
    );
    const exact = deltas.filter((d) => d === 0).length;
    const withinOne = deltas.filter((d) => Math.abs(d) <= 1).length;
    // Compare integer counts so a rounded percentage cannot turn a failure into a pass.
    const passes =
      count > 0 && exact * 100 >= count * 60 && withinOne * 100 >= count * 90;
    if (!passes)
      issues.push(
        `${criterion} does not meet 60% exact and 90% within-one-level agreement.`,
      );
    return {
      criterion,
      count,
      exact,
      withinOne,
      exactPercent: count ? (exact / count) * 100 : null,
      withinOnePercent: count ? (withinOne / count) * 100 : null,
      aiHigher: deltas.filter((d) => d > 0).length,
      aiLower: deltas.filter((d) => d < 0).length,
      meanLevelDifference: count
        ? deltas.reduce((a, b) => a + b, 0) / count
        : null,
      passes,
    };
  });
  return {
    model: data.model,
    promptRevision: data.promptRevision,
    suppliedSamples: data.samples.length,
    completeSamples: count,
    byExam: Object.fromEntries(
      ["TEF", "TCF"].map((exam) => [
        exam,
        complete.filter((s) => s.exam === exam).length,
      ]),
    ),
    byTarget: Object.fromEntries(
      ["NCLC 5", "NCLC 7", "NCLC 9+"].map((target) => [
        target,
        complete.filter((s) => s.target === target).length,
      ]),
    ),
    criteria: scores,
    meetsTargets: issues.length === 0,
    issues,
  };
}
