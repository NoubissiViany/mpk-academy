import { competencyIds } from "./shared/competencies";
import { levels } from "./shared/levels";
import type { ContentItem, LearningLesson, MockManifest } from "./shared/types";
export function wordCount(value: string) {
  return value.trim().split(/\s+/u).filter(Boolean).length;
}
export function validateContent(
  items: ContentItem[],
  lessons: LearningLesson[],
  manifests: MockManifest[],
  practiceIds: string[],
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
        !item.checkpoint.options[item.checkpoint.answer] ||
        !item.checkpoint.explanation
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
