import speakerGenders from "./audio-speakers.json";
import debtFile from "./debt.json";
import {
  allowedLongestCorrect,
  correctIsLongest,
  documentText,
  isShortDocument,
  MIN_POOL_FOR_SHARES,
  minimumWords,
  nearDuplicates,
  unbalancedPositions,
  wordCount,
} from "./quality";
import { competencyIds } from "./shared/competencies";
import { levels } from "./shared/levels";
import type {
  ContentItem,
  LearningLesson,
  MCQ,
  MockManifest,
  ProductiveTask,
} from "./shared/types";

/**
 * Known problems in published content, being fixed. Validation fails on any
 * new case, and when a listed problem is fixed it asks for the list to
 * shrink, so the debt can only go down.
 */
export interface ContentDebt {
  /** Items whose document is shorter than their level needs. */
  shortDocuments: string[];
  /** Pools where the correct answer is too often the longest option: the current count. */
  longestCorrect: Record<string, number>;
}
export const contentDebt: ContentDebt = debtFile;

/** Time a listener needs after a mock clip ends to choose an answer. */
export const LISTENING_ANSWER_SECONDS = 10;

export function validateContent(
  items: ContentItem[],
  lessons: LearningLesson[],
  manifests: MockManifest[],
  practiceIds: string[],
  debt: ContentDebt = contentDebt,
) {
  const errors: string[] = [];
  const seen = new Set<string>();
  const fail = (id: string, reason: string) => errors.push(`${id}: ${reason}`);
  for (const item of [...items, ...lessons]) {
    if (!item.id || seen.has(item.id)) fail(item.id, "missing or duplicate ID");
    seen.add(item.id);
    if (!["TEF", "TCF", "shared"].includes(item.exam))
      fail(item.id, "invalid exam");
    if (
      ![
        "reading",
        "listening",
        "writing",
        "speaking",
        "grammar",
        "vocabulary",
        "pronunciation",
        "strategy",
      ].includes(item.skill)
    )
      fail(item.id, "invalid skill");
    if (
      !levels.includes(item.level) ||
      item.difficulty < 1 ||
      item.difficulty > 4
    )
      fail(item.id, "invalid level/difficulty");
    if (
      !item.topic ||
      item.estimatedTime <= 0 ||
      !["published", "archived"].includes(item.status)
    )
      fail(item.id, "missing metadata");
    if (
      !item.competencies.length ||
      item.competencies.some((c) => !competencyIds.includes(c))
    )
      fail(item.id, "invalid competencies");
    if (item.kind === "mcq") {
      if (!item.prompt || !item.correction.explanation || !item.questionType)
        fail(item.id, "missing MCQ fields");
      if (
        item.options.length !== 4 ||
        new Set(item.options.map((o) => o.id)).size !== 4 ||
        new Set(item.options.map((o) => o.label.trim().toLowerCase())).size !==
          4 ||
        item.options.some((o) => !o.label.trim())
      )
        fail(item.id, "four distinct options required");
      if (
        item.options.filter((o) => o.id === item.correction.answer).length !== 1
      )
        fail(item.id, "exactly one answer required");
      if (item.skill === "listening") {
        if (
          !item.audio?.transcript ||
          !item.audio.speakers.length ||
          item.audio.intendedDuration <= 0
        )
          fail(item.id, "missing audio metadata");
        if (item.audio?.status === "pending" && item.audio.path)
          fail(item.id, "pending audio must not have a path");
        if (item.audio?.status === "ready" && !item.audio.path)
          fail(item.id, "ready audio requires path");
      } else if (!item.passage) fail(item.id, "missing document");
    } else if (item.kind === "lesson") {
      if (
        !item.objectives.length ||
        !item.explanation ||
        !item.examples.length ||
        !item.guidedApplication ||
        !item.commonErrors.length ||
        [item.checkpoint, ...(item.extraCheckpoints ?? [])].some(
          (checkpoint) =>
            !checkpoint.options[checkpoint.answer] || !checkpoint.explanation,
        )
      )
        fail(item.id, "incomplete teaching content");
    } else {
      if (
        !item.scenario ||
        !item.instructions ||
        !item.candidateRole ||
        !item.interlocutorRole ||
        !item.objectives.length ||
        !item.correction.rubric.length ||
        !item.correction.guidance
      )
        fail(item.id, "missing task fields");
      const index = item.taskType.endsWith("a")
        ? 0
        : item.taskType.endsWith("b")
          ? 1
          : Number(item.taskType.slice(-1)) - 1;
      if (item.kind === "writing") {
        const min =
          item.exam === "TEF" ? [80, 200][index] : [60, 120, 120][index];
        const max = item.exam === "TEF" ? undefined : [120, 150, 180][index];
        if (item.wordCount?.min !== min || item.wordCount?.max !== max)
          fail(item.id, "invalid word range");
        const count = wordCount(item.correction.modelResponse ?? "");
        if (count < min || (max !== undefined && count > max))
          fail(
            item.id,
            `model response length ${count} outside range ${min}–${max ?? "unbounded"}`,
          );
      } else {
        const expected =
          item.exam === "TEF" ? [300, 600][index] : [120, 330, 270][index];
        if (
          item.durationSeconds !== expected ||
          item.preparationSeconds !==
            (item.exam === "TCF" && index === 1 ? 120 : 0)
        )
          fail(item.id, "invalid speaking timing");
      }
    }
  }
  for (const manifest of manifests) {
    if (seen.has(manifest.id)) fail(manifest.id, "duplicate manifest ID");
    seen.add(manifest.id);
    const ids = manifest.sections.flatMap((s) => s.itemIds);
    if (
      new Set(ids).size !== ids.length ||
      ids.some((id) => practiceIds.includes(id))
    )
      fail(manifest.id, "reused mock items");
    const counts = manifest.exam === "TEF" ? [40, 40, 2, 2] : [39, 39, 3, 3];
    const seconds =
      manifest.exam === "TEF"
        ? [3600, 2400, 3600, 900]
        : [3600, 2100, 3600, 720];
    for (const [i, section] of manifest.sections.entries()) {
      if (
        section.itemIds.length !== counts[i] ||
        section.durationSeconds !== seconds[i] ||
        section.skill !== ["reading", "listening", "writing", "speaking"][i]
      )
        fail(manifest.id, "invalid section structure");
      for (const id of section.itemIds) {
        const item = items.find((x) => x.id === id);
        if (
          !item ||
          item.exam !== manifest.exam ||
          item.skill !== section.skill
        )
          fail(id, "invalid mock reference");
      }
    }
  }
  errors.push(...qualityErrors(items, lessons, manifests, practiceIds, debt));
  if (errors.length) throw new Error(errors.join("\n"));
  return {
    items: items.length,
    lessons: lessons.length,
    mocks: manifests.length,
    pendingAudio: items
      .filter((i) => i.kind === "mcq" && i.audio?.status === "pending")
      .map((i) => i.id),
  };
}

const isMcq = (item: ContentItem): item is MCQ => item.kind === "mcq";
const isTask = (item: ContentItem): item is ProductiveTask =>
  item.kind !== "mcq";

/**
 * Questions a learner meets together (a mock section, a practice skill, the
 * diagnostic), named as in messages and the debt file.
 */
function questionPools(
  mcqs: MCQ[],
  manifests: MockManifest[],
  practiceIds: string[],
) {
  const mockOf = new Map(
    manifests.flatMap((m) =>
      m.sections.flatMap((s) => s.itemIds.map((id) => [id, m.id] as const)),
    ),
  );
  const practice = new Set(practiceIds);
  const pools = new Map<string, MCQ[]>();
  for (const item of mcqs) {
    const mock = mockOf.get(item.id);
    const name = mock
      ? `${mock} ${item.skill}`
      : practice.has(item.id)
        ? `practice ${item.exam} ${item.skill}`
        : `diagnostic ${item.skill}`;
    pools.set(name, [...(pools.get(name) ?? []), item]);
  }
  return pools;
}

/**
 * The debt list after content changes: fixed problems leave it, and nothing
 * is ever added (a new problem must fail validation instead).
 */
export function shrinkDebt(
  debt: ContentDebt,
  items: ContentItem[],
  manifests: MockManifest[],
  practiceIds: string[],
): ContentDebt {
  const mcqs = items.filter(isMcq);
  const short = new Set(mcqs.filter(isShortDocument).map((item) => item.id));
  const pools = questionPools(mcqs, manifests, practiceIds);
  const longestCorrect: Record<string, number> = {};
  for (const [name, known] of Object.entries(debt.longestCorrect)) {
    const pool = pools.get(name) ?? [];
    const count = pool.filter(correctIsLongest).length;
    if (count > allowedLongestCorrect(pool.length))
      longestCorrect[name] = Math.min(known, count);
  }
  return {
    shortDocuments: debt.shortDocuments.filter((id) => short.has(id)),
    longestCorrect,
  };
}

function qualityErrors(
  items: ContentItem[],
  lessons: LearningLesson[],
  manifests: MockManifest[],
  practiceIds: string[],
  debt: ContentDebt,
) {
  const errors: string[] = [];
  const mcqs = items.filter(isMcq);

  // Documents long enough for their level.
  const short = new Set(mcqs.filter(isShortDocument).map((item) => item.id));
  for (const item of mcqs)
    if (short.has(item.id) && !debt.shortDocuments.includes(item.id))
      errors.push(
        `${item.id}: ${wordCount(documentText(item))}-word document; ${item.level} ${item.skill} needs at least ${minimumWords[item.skill as "reading" | "listening"][item.level]}`,
      );
  for (const id of debt.shortDocuments)
    if (!short.has(id))
      errors.push(
        `${id}: no longer a short document; remove it from src/content/debt.json`,
      );

  // No answer-length cue, and answers spread evenly over a, b, c and d.
  const pools = questionPools(mcqs, manifests, practiceIds);
  for (const [name, pool] of pools) {
    const longest = pool.filter(correctIsLongest).length;
    const allowed = allowedLongestCorrect(pool.length);
    const known = debt.longestCorrect[name];
    if (
      pool.length >= MIN_POOL_FOR_SHARES &&
      longest > Math.max(allowed, known ?? 0)
    )
      errors.push(
        `${name}: the correct answer is the longest option in ${longest} of ${pool.length} questions; chance allows ${allowed}`,
      );
    if (known !== undefined && longest < known)
      errors.push(
        `${name}: ${longest} questions now have the longest option correct; ${longest > allowed ? `lower its count in src/content/debt.json to ${longest}` : "remove it from src/content/debt.json"}`,
      );
    if (pool.length >= MIN_POOL_FOR_SHARES) {
      const skewed = unbalancedPositions(pool);
      if (skewed.length)
        errors.push(
          `${name}: answer positions unbalanced (${skewed.join(", ")})`,
        );
    }
  }
  for (const name of Object.keys(debt.longestCorrect))
    if (!pools.has(name))
      errors.push(`${name}: unknown pool in src/content/debt.json`);

  // No question or task that repeats another with a few words changed.
  const texts = [
    ...mcqs.map((item) => ({
      id: item.id,
      text: `${documentText(item)} ${item.prompt}`,
    })),
    ...items
      .filter(isTask)
      .map((task) => ({ id: task.id, text: task.scenario })),
  ];
  for (const pair of nearDuplicates(texts))
    errors.push(
      `${pair.b}: near-duplicate of ${pair.a} (${Math.round(pair.similarity * 100)}% of its wording)`,
    );

  // Each mock clip leaves time to answer within its share of the section.
  for (const manifest of manifests)
    for (const section of manifest.sections.filter(
      (s) => s.skill === "listening",
    )) {
      const slot = section.durationSeconds / section.itemIds.length;
      for (const item of mcqs.filter((i) => section.itemIds.includes(i.id)))
        if (
          item.audio &&
          item.audio.intendedDuration > slot - LISTENING_ANSWER_SECONDS
        )
          errors.push(
            `${item.id}: a ${item.audio.intendedDuration}s clip leaves under ${LISTENING_ANSWER_SECONDS}s to answer in its ${Math.floor(slot)}s`,
          );
    }

  // Speaker voices chosen in src/content/audio-speakers.json fit the clip.
  for (const [id, genders] of Object.entries(
    speakerGenders as Record<string, string>,
  )) {
    const item = mcqs.find((i) => i.id === id);
    if (!item?.audio)
      errors.push(`${id}: listed in audio-speakers.json but has no audio`);
    else if (
      !/^[FM]+$/.test(genders) ||
      genders.length !== item.audio.speakers.length
    )
      errors.push(
        `${id}: audio-speakers.json needs one F or M per speaker (${item.audio.speakers.length})`,
      );
  }

  // Teaching text in French as well as English.
  for (const item of mcqs) {
    const fr = item.correction.explanationFr?.trim();
    if (!fr || fr === item.correction.explanation.trim())
      errors.push(`${item.id}: missing French explanation`);
  }
  for (const task of items.filter(isTask))
    if (!task.correction.guidanceFr?.trim())
      errors.push(`${task.id}: missing French guidance`);
  for (const lesson of lessons) {
    const missing = [
      lesson.titleFr && lesson.titleFr !== lesson.title ? "" : "title",
      lesson.explanationFr ? "" : "explanation",
      lesson.guidedApplicationFr ? "" : "guided application",
      lesson.commonErrorsFr?.length === lesson.commonErrors.length
        ? ""
        : "common errors",
      [lesson.checkpoint, ...(lesson.extraCheckpoints ?? [])].every(
        (checkpoint) => checkpoint.explanationFr,
      )
        ? ""
        : "checkpoint explanations",
    ].filter(Boolean);
    if (missing.length)
      errors.push(`${lesson.id}: missing French ${missing.join(", ")}`);
  }
  return errors;
}
