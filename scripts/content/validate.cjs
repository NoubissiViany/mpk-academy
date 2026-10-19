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
