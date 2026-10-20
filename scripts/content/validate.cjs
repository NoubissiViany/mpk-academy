/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS bootstrap loads typed content without another runtime dependency. */
require("./register.cjs");
const {
  diagnosticItems,
  practiceItems,
  lessons,
} = require("../../src/content/catalog.ts");
const { mockItems, manifests } = require("../../src/content/mock-catalog.ts");
const { validateContent } = require("../../src/content/validate.ts");
const items = [...diagnosticItems, ...practiceItems, ...mockItems];
const result = validateContent(
  items,
  lessons,
  manifests,
  practiceItems.map((i) => i.id),
);
if (
  diagnosticItems.length !== 20 ||
  items.length !== 248 ||
  lessons.length !== 24
)
  throw Error("Seed count mismatch");
console.log(
  JSON.stringify(
    {
      ...result,
      counts: Object.fromEntries(
        ["TEF", "TCF", "shared"].map((exam) => [
          exam,
          Object.fromEntries(
            [
              "reading",
              "listening",
              "writing",
              "speaking",
              "grammar",
              "vocabulary",
            ].map((skill) => [
              skill,
              items.filter((i) => i.exam === exam && i.skill === skill).length,
            ]),
          ),
        ]),
      ),
    },
    null,
    2,
  ),
);

const legacyQuestions =
  require("../../src/content/legacy/questions.ts").diagnosticQuestions;
const legacyLessons = require("../../src/content/legacy/course.ts").allLessons;
const legacyTasks = Object.values(
  require("../../src/content/legacy/exams.ts").productiveTasks,
).flat();
const legacyIds = new Set(
  [...legacyQuestions, ...legacyLessons, ...legacyTasks]
    .map((i) => i.id)
    .concat(["tef-listening-1", "tef-listening-2"]),
);
if ([...items, ...lessons].some((i) => legacyIds.has(i.id)))
  throw Error("Published legacy ID reused by new content");

// French teaching text. Content is bilingual by requirement; until the Phase 4
// rewrite lands, gaps are reported and `--require-fr` turns them into failures.
const mcqs = items.filter((i) => i.kind === "mcq");
const missingFr = {
  lessonTitles: lessons.filter((l) => !l.titleFr || l.titleFr === l.title),
  answerExplanations: mcqs.filter((i) => !i.correction.explanationFr),
  lessonBodies: lessons.filter((l) => !l.explanationFr),
};
console.log(
  `French coverage: lesson titles ${lessons.length - missingFr.lessonTitles.length}/${lessons.length}, ` +
    `answer explanations ${mcqs.length - missingFr.answerExplanations.length}/${mcqs.length}, ` +
    `lesson bodies ${lessons.length - missingFr.lessonBodies.length}/${lessons.length}.`,
);
if (
  process.argv.includes("--require-fr") &&
  Object.values(missingFr).some((list) => list.length)
)
  throw Error("French teaching text missing: see coverage above");
