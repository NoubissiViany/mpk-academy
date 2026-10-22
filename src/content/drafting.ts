// Drafting new and rewritten reading and listening questions with a language
// model, for human review. Used only by the scripts in scripts/content
// (draft.cjs, review-sheet.cjs, accept-drafts.cjs), never by the app.
import {
  correctIsLongest,
  documentText,
  minimumWords,
  nearDuplicates,
  wordCount,
} from "./quality";
import { speakerIds, textFingerprint } from "./shared/audio";
import type { QuestionSeed } from "./shared/builders";
import { competencyIds, type ContentCompetency } from "./shared/competencies";
import { levels, type ContentLevel } from "./shared/levels";
import type { MCQ } from "./shared/types";

export const DRAFT_PROMPT_VERSION = "2026-10-22";

export type DraftSkill = "reading" | "listening";
export type DraftExam = "TEF" | "TCF";

export interface DraftItem {
  id: string;
  /** "shared" for diagnostic questions, which serve both exams. */
  exam: DraftExam | "shared";
  skill: DraftSkill;
  level: ContentLevel;
  competency: ContentCompetency;
  topic: string;
  documentType: string;
  document: string;
  prompt: string;
  correct: string;
  wrong: [string, string, string];
  explanation: string;
  explanationFr: string;
  /** One F or M per speaker, in order of first appearance (listening only). */
  speakers?: string;
  /** The draft rewrites the published question with the same id. */
  replaces?: boolean;
  /** Where a new question goes: practice (default) or the diagnostic. */
  target?: "diagnostic";
  /** pending → accepted or rejected by a reviewer → merged by accept-drafts. */
  review: "pending" | "accepted" | "rejected" | "merged";
  /** The teacher's decision, for drafts that need one (see needsTeacher). */
  teacher?: "approved" | "rejected";
  /** Problems found by the automatic checks; a reviewer decides. */
  problems: string[];
  notes?: string;
}

export interface DraftFile {
  createdAt: string;
  provider: string;
  model: string;
  promptVersion: string;
  request: Record<string, unknown>;
  items: DraftItem[];
}

/**
 * A teacher checks every mock-exam and diagnostic question, and a fixed one
 * in five of the others, before they reach learners.
 */
export const needsTeacher = (id: string, mock: boolean) =>
  mock ||
  id.startsWith("diagnostic-") ||
  parseInt(textFingerprint(id), 16) % 5 === 0;

/** Longest document a draft may use: twice the minimum, and short enough for a mock clip. */
export const maximumWords: Record<DraftSkill, Record<ContentLevel, number>> = {
  reading: { A2: 60, B1: 120, B2: 200, C1: 280 },
  listening: { A2: 45, B1: 70, B2: 95, C1: 100 },
};

const documentTypes: Record<DraftSkill, Record<ContentLevel, string>> = {
  reading: {
    A2: "notice, sign, short ad, text message, simple email, timetable",
    B1: "email, announcement, practical guide, short news article, letter",
    B2: "press article, opinion column, report extract, formal letter, review",
    C1: "editorial, essay extract, analysis, debate column, critical review",
  },
  listening: {
    A2: "public announcement, voicemail, short everyday dialogue",
    B1: "phone call, radio announcement, workplace or service dialogue",
    B2: "radio interview, discussion between colleagues, news report",
    C1: "radio column, expert interview, debate, lecture extract",
  },
};

const levelGuide: Record<ContentLevel, string> = {
  A2: "frequent everyday vocabulary, short sentences, concrete information",
  B1: "familiar topics, clear standard language, some opinions and reasons",
  B2: "abstract and concrete topics, argument, implicit attitude, varied structures",
  C1: "complex argument, nuance, implicit meaning, idiomatic and precise language",
};

const examGuide: Record<DraftExam, string> = {
  TEF: "TEF Canada (France Éducation international / CCI Paris Île-de-France style): documents from daily, professional and civic life in Canada and France; one question per document.",
  TCF: "TCF Canada (France Éducation international): items rise in difficulty from A1 to C2; one question per document; the question is read after the document.",
};

const outputShape = (rewrite: boolean) => ({
  type: "object",
  properties: {
    items: {
      type: "array",
      items: {
        type: "object",
        properties: {
          ...(rewrite ? { id: { type: "string" } } : {}),
          competency: { type: "string" },
          topic: { type: "string" },
          documentType: { type: "string" },
          document: { type: "string" },
          speakers: { type: "string" },
          prompt: { type: "string" },
          correct: { type: "string" },
          wrong: { type: "array", items: { type: "string" } },
          explanation: { type: "string" },
          explanationFr: { type: "string" },
        },
        required: [
          ...(rewrite ? ["id"] : []),
          "competency",
          "topic",
          "documentType",
          "document",
          "speakers",
          "prompt",
          "correct",
          "wrong",
          "explanation",
          "explanationFr",
        ],
        additionalProperties: false,
      },
    },
  },
  required: ["items"],
  additionalProperties: false,
});

export const draftSchema = (rewrite: boolean) => ({
  name: "mpk_questions",
  strict: true,
  schema: outputShape(rewrite),
});

/** Item-writing rules; without a level, each item carries its own word range. */
const rules = (skill: DraftSkill, level?: ContentLevel) =>
  [
    level
      ? `- The document is ${minimumWords[skill][level]} to ${maximumWords[skill][level]} words of natural, original French at ${level} (${levelGuide[level]}). Suitable types: ${documentTypes[skill][level]}. Never copy or adapt real exam material.`
      : "- Each document is natural, original French at the item's level, within the word range given with the item. Never copy or adapt real exam material.",
    skill === "listening"
      ? '- The document is a recording transcript of spoken French. A dialogue marks every turn "A : …", "B : …" on one line; a monologue has no marks. "speakers" gives one letter per speaker in order, F or M (for example "FM"), matching how they refer to themselves and how the question and explanations refer to them.'
      : '- "speakers" is an empty string.',
    "- One question per document, answerable only from the document. Exactly one option is correct; the three wrong options are plausible to someone who misreads, each tied to something in the document.",
    "- All four options have the same grammatical form and similar length. The correct option must NOT be the longest one; make at least one wrong option longer. At B2 and C1 the correct option paraphrases the document instead of repeating its words.",
    "- No 'all of the above', 'none of the above', or options that differ only by one word.",
    "- French typography: a space before ? ! : ; and inside « », times as 8 h 30, apostrophes ’.",
    "- explanation: one or two English sentences citing the evidence in the document. explanationFr: the same in natural French (not word for word). Quote French words in « » in the French explanation.",
    `- competency is one of: main_idea, specific_detail, inference, speaker_intention, vocabulary_in_context, argumentation, register.`,
    "- Prefer Canadian settings (Montréal, Québec, Ottawa, Moncton, Winnipeg, Vancouver…) and situations a newcomer meets: work, housing, health, school, services, community life, culture, environment, transport.",
  ].join("\n");

export function newItemsMessages(request: {
  exam: DraftExam;
  skill: DraftSkill;
  level: ContentLevel;
  count: number;
  topic?: string;
  avoidTopics: string[];
}) {
  return [
    {
      role: "system" as const,
      content: `You write original ${request.skill} comprehension questions for ${examGuide[request.exam]} The questions train adult learners; a French teacher reviews every draft. Return JSON only, following the schema.`,
    },
    {
      role: "user" as const,
      content: [
        `Write ${request.count} new ${request.level} ${request.skill} questions for ${request.exam} Canada.`,
        request.topic
          ? `Theme: ${request.topic}.`
          : "Use a different everyday or societal theme for each question.",
        `Vary the competency across questions.`,
        "Rules:",
        rules(request.skill, request.level),
        request.avoidTopics.length
          ? `Topics already covered, to avoid: ${request.avoidTopics.join("; ")}.`
          : "",
      ]
        .filter(Boolean)
        .join("\n"),
    },
  ];
}

export function rewriteMessages(items: MCQ[]) {
  const [first] = items;
  const skill = first.skill as DraftSkill;
  return [
    {
      role: "system" as const,
      content: `You revise ${skill} comprehension questions for ${examGuide[first.exam as DraftExam]} Their documents are too short for their level, and the correct option is often the longest. A French teacher reviews every draft. Return JSON only, following the schema.`,
    },
    {
      role: "user" as const,
      content: [
        "Rewrite each question below. Keep its id, level, competency and the idea it tests, and keep the same correct answer where possible. Lengthen the document to the range for its level by adding realistic context, details and distractor information (not padding), then adjust the options and explanations to the new document.",
        "Rules:",
        rules(skill),
        "",
        "Questions to rewrite:",
        ...items.map((item) =>
          JSON.stringify({
            id: item.id,
            level: item.level,
            words: `${minimumWords[skill][item.level]}–${maximumWords[skill][item.level]}`,
            competency: item.competencies[0],
            topic: item.topic,
            documentType: item.questionType,
            document: documentText(item),
            prompt: item.prompt,
            correct: item.options.find((o) => o.id === item.correction.answer)
              ?.label,
            wrong: item.options
              .filter((o) => o.id !== item.correction.answer)
              .map((o) => o.label),
            explanation: item.correction.explanation,
          }),
        ),
      ].join("\n"),
    },
  ];
}

type Raw = Record<string, unknown>;
// Models sometimes emit non-breaking hyphens; content uses the plain one.
const text = (value: unknown) =>
  typeof value === "string"
    ? value
        .replace(/[\u2010\u2011]/g, "-")
        .replace(/\s+/g, " ")
        .trim()
    : "";

/** Turns the model's answer into draft items, keeping anything usable. */
export function parseDraftItems(
  raw: unknown,
  base: { exam: DraftExam; skill: DraftSkill; level?: ContentLevel },
  ids: () => string,
  originals: MCQ[] = [],
): DraftItem[] {
  const list = (raw as { items?: unknown })?.items;
  if (!Array.isArray(list)) return [];
  return list.flatMap((entry: Raw) => {
    const original = originals.find((o) => o.id === entry.id);
    if (originals.length && !original) return [];
    const wrong = Array.isArray(entry.wrong)
      ? entry.wrong.map(text).filter(Boolean)
      : [];
    if (wrong.length !== 3) return [];
    const competency = text(entry.competency) as ContentCompetency;
    return [
      {
        id: original?.id ?? ids(),
        exam: base.exam,
        skill: base.skill,
        level: original?.level ?? base.level ?? "B1",
        competency: competencyIds.includes(competency)
          ? competency
          : (original?.competencies[0] ?? "main_idea"),
        topic: text(entry.topic) || original?.topic || "",
        documentType:
          text(entry.documentType) || original?.questionType || "document",
        document: text(entry.document),
        prompt: text(entry.prompt),
        correct: text(entry.correct),
        wrong: wrong as [string, string, string],
        explanation: text(entry.explanation),
        explanationFr: text(entry.explanationFr),
        ...(base.skill === "listening"
          ? { speakers: text(entry.speakers).toUpperCase() }
          : {}),
        ...(original ? { replaces: true } : {}),
        review: "pending" as const,
        problems: [],
      },
    ];
  });
}

/** The tuple the content files use, as written by accept-drafts. */
export const toSeed = (draft: DraftItem): QuestionSeed => [
  draft.id,
  draft.level,
  draft.competency,
  draft.topic,
  draft.documentType,
  draft.document,
  draft.prompt,
  draft.correct,
  ...draft.wrong,
  draft.explanation,
  draft.explanationFr,
];

/** A draft in the shape of a published question, for the shared checks. */
export function draftAsQuestion(draft: DraftItem): MCQ {
  const options = [draft.correct, ...draft.wrong].map((label, index) => ({
    id: "abcd"[index],
    label,
  }));
  return {
    id: draft.id,
    exam: draft.exam,
    skill: draft.skill,
    level: draft.level,
    difficulty: levels.indexOf(draft.level) + 1,
    competencies: [draft.competency],
    topic: draft.topic,
    estimatedTime: 45,
    status: "published",
    kind: "mcq",
    questionType: draft.documentType,
    prompt: draft.prompt,
    ...(draft.skill === "listening"
      ? {
          audio: {
            id: `${draft.id}-audio`,
            status: "pending" as const,
            intendedDuration: 0,
            speakers: [],
            transcript: draft.document,
          },
        }
      : { passage: draft.document }),
    options,
    correction: {
      answer: "a",
      explanation: draft.explanation,
      explanationFr: draft.explanationFr,
    },
  };
}

/**
 * Automatic checks on a draft; the reviewer sees every problem. `others`
 * are published questions and other drafts it must not duplicate.
 */
export function draftProblems(
  draft: DraftItem,
  others: { id: string; text: string }[],
) {
  const problems: string[] = [];
  const words = wordCount(draft.document);
  const min = minimumWords[draft.skill][draft.level];
  const max = maximumWords[draft.skill][draft.level];
  if (words < min || words > max)
    problems.push(
      `document has ${words} words; ${draft.level} needs ${min}–${max}`,
    );
  for (const [field, value] of Object.entries({
    prompt: draft.prompt,
    correct: draft.correct,
    explanation: draft.explanation,
    explanationFr: draft.explanationFr,
    topic: draft.topic,
  }))
    if (!value) problems.push(`missing ${field}`);
  const labels = [draft.correct, ...draft.wrong].map((l) => l.toLowerCase());
  if (new Set(labels).size !== 4)
    problems.push("options are not all different");
  if (correctIsLongest(draftAsQuestion(draft)))
    problems.push("the correct option is the longest");
  if (draft.explanationFr === draft.explanation)
    problems.push("French explanation is a copy of the English one");
  if (
    ["B2", "C1"].includes(draft.level) &&
    wordCount(draft.correct) >= 4 &&
    draft.document
      .toLowerCase()
      .includes(draft.correct.toLowerCase().replace(/[.!?]$/, ""))
  )
    problems.push("the correct option repeats the document word for word");
  if (draft.skill === "listening") {
    const ids = speakerIds(draft.document);
    if (
      !draft.speakers ||
      draft.speakers.length !== ids.length ||
      !/^[FM]+$/.test(draft.speakers)
    )
      problems.push(
        `speakers should give F or M for each of ${ids.length} speaker(s)`,
      );
  }
  const text = `${draft.document} ${draft.prompt}`;
  for (const pair of nearDuplicates([
    { id: draft.id, text },
    ...others.filter((o) => o.id !== draft.id),
  ]))
    if (pair.a === draft.id || pair.b === draft.id)
      problems.push(
        `near-duplicate of ${pair.a === draft.id ? pair.b : pair.a}`,
      );
  return problems;
}
