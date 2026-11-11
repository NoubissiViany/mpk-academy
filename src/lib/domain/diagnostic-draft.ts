import { z } from "zod";
import { diagnosticWritingVersion } from "@/lib/domain/diagnostic-writing";
import { shuffleQuestions } from "@/lib/domain/question-order";
import type { DiagnosticIntake, PublicQuestion } from "@/types/domain";

export const diagnosticDraftTtl = 7 * 24 * 60 * 60 * 1000;
const ids = z.array(z.string().min(1).max(120)).max(100);
export const diagnosticDraftSchema = z
  .object({
    schemaVersion: z.literal(1),
    id: z.uuid(),
    contentVersion: z.string().min(1).max(100),
    revision: z.number().int().min(0),
    stage: z.enum(["intro", "questions", "writing"]),
    index: z.number().int().min(0).max(99),
    questionOrder: ids.min(1),
    optionOrder: z.record(z.string().max(120), ids),
    answers: z.record(z.string().max(120), z.string().max(4000)),
    checkedAnswers: z
      .record(z.string().max(120), z.string().min(1).max(4000))
      .optional(),
    intake: z.object({
      feedbackMode: z.literal("guided").optional(),
      goal: z.enum(["TEF Canada", "TCF Canada", "Not sure yet"]).optional(),
      target: z
        .enum(["NCLC 5", "NCLC 7", "NCLC 9+", "I'm not sure"])
        .optional(),
      frenchExperience: z
        .enum([
          "I'm just starting",
          "I know some French",
          "I can communicate in French",
          "I'm already comfortable in French",
          "I'm not sure",
        ])
        .optional(),
      writingSample: z
        .object({
          version: z.literal(diagnosticWritingVersion),
          text: z.string().max(4000),
        })
        .optional(),
    }),
    updatedAt: z.iso.datetime({ offset: true }),
    expiresAt: z.iso.datetime({ offset: true }),
  })
  .superRefine((draft, context) => {
    if (
      Object.keys(draft.checkedAnswers ?? {}).length > 0 &&
      draft.intake.feedbackMode !== "guided"
    )
      context.addIssue({
        code: "custom",
        path: ["intake", "feedbackMode"],
        message: "Checked assessments must be labelled guided",
      });
    for (const [id, answer] of Object.entries(draft.checkedAnswers ?? {})) {
      if (!draft.questionOrder.includes(id) || draft.answers[id] !== answer)
        context.addIssue({
          code: "custom",
          path: ["checkedAnswers", id],
          message: "Checked answers must match an answer in this assessment",
        });
    }
  });

export type DiagnosticDraft = z.infer<typeof diagnosticDraftSchema>;

/** Fingerprint public content, including option labels, without answer keys. */
export function diagnosticContentVersion(questions: readonly PublicQuestion[]) {
  let hash = 2166136261;
  const text = JSON.stringify(questions);
  for (let i = 0; i < text.length; i++)
    hash = Math.imul(hash ^ text.charCodeAt(i), 16777619);
  return `diagnostic-draft-v1-${(hash >>> 0).toString(16)}`;
}

export function createDiagnosticDraft(
  source: PublicQuestion[],
  intake: Partial<DiagnosticIntake> = {},
  answers: Record<string, string> = {},
  now = new Date(),
): DiagnosticDraft {
  const questions = shuffleQuestions(source, true);
  const validAnswers = Object.fromEntries(
    Object.entries(answers).filter(([id]) => source.some((q) => q.id === id)),
  );
  const firstUnanswered = questions.findIndex((q) => !validAnswers[q.id]);
  return {
    schemaVersion: 1,
    id: crypto.randomUUID(),
    revision: 0,
    contentVersion: diagnosticContentVersion(source),
    intake,
    answers: validAnswers,
    checkedAnswers: {},
    stage: Object.keys(validAnswers).length
      ? firstUnanswered < 0
        ? "writing"
        : "questions"
      : "intro",
    index: firstUnanswered < 0 ? questions.length - 1 : firstUnanswered,
    questionOrder: questions.map((q) => q.id),
    optionOrder: Object.fromEntries(
      questions.map((q) => [q.id, q.options?.map((o) => o.id) ?? []]),
    ),
    updatedAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + diagnosticDraftTtl).toISOString(),
  };
}

/** Checked answers and their presented content are immutable for this attempt. */
export function preservesCheckedAnswers(
  existing: DiagnosticDraft,
  next: DiagnosticDraft,
) {
  const checked = Object.entries(existing.checkedAnswers ?? {});
  return (
    checked.every(
      ([id, answer]) =>
        next.checkedAnswers?.[id] === answer && next.answers[id] === answer,
    ) &&
    (checked.length === 0 ||
      (existing.contentVersion === next.contentVersion &&
        JSON.stringify(existing.questionOrder) ===
          JSON.stringify(next.questionOrder) &&
        Object.keys(existing.optionOrder).length ===
          Object.keys(next.optionOrder).length &&
        existing.questionOrder.every(
          (id) =>
            JSON.stringify(existing.optionOrder[id]) ===
            JSON.stringify(next.optionOrder[id]),
        ))) &&
    (existing.intake.feedbackMode !== "guided" ||
      next.intake.feedbackMode === "guided")
  );
}

export function isCompatibleDraft(
  draft: DiagnosticDraft,
  questions: PublicQuestion[],
) {
  const sameIds = (a: string[], b: string[]) =>
    a.length === b.length &&
    new Set(a).size === a.length &&
    a.every((id) => b.includes(id));
  return (
    draft.contentVersion === diagnosticContentVersion(questions) &&
    sameIds(
      draft.questionOrder,
      questions.map((q) => q.id),
    ) &&
    draft.index < questions.length &&
    Object.keys(draft.answers).every((id) =>
      draft.questionOrder.includes(id),
    ) &&
    questions.every((q) =>
      sameIds(draft.optionOrder[q.id] ?? [], q.options?.map((o) => o.id) ?? []),
    )
  );
}

export function restoreDraftQuestions(
  draft: DiagnosticDraft,
  questions: PublicQuestion[],
) {
  return draft.questionOrder.map((id) => {
    const question = questions.find((q) => q.id === id)!;
    return question.type === "fill_blank"
      ? question
      : {
          ...question,
          options: draft.optionOrder[id].map((optionId) =>
            question.options.find((o) => o.id === optionId)!,
          ),
        };
  });
}
