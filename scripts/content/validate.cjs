/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS bootstrap loads typed content without another runtime dependency. */
require("./register.cjs");
const {
  diagnosticItems,
  practiceItems,
  lessons,
} = require("../../src/content/catalog.ts");
const { mockItems, manifests } = require("../../src/content/mock-catalog.ts");
const {
  validateContent,
  contentDebt,
} = require("../../src/content/validate.ts");
const items = [...diagnosticItems, ...practiceItems, ...mockItems];
const result = validateContent(
  items,
  lessons,
  manifests,
  practiceItems.map((i) => i.id),
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

// Progress toward the beta plan's per-exam targets (cohort 1 / cohort 2).
const targets = {
  lessons: [25, 25],
  reading: [60, 120],
  listening: [60, 120],
  writing: [10, 20],
  speaking: [10, 20],
};
const rows = ["TEF", "TCF"].map((exam) => {
  const practice = practiceItems.filter((i) => i.exam === exam);
  const have = {
    lessons: lessons.filter((l) => l.exam === exam || l.exam === "shared")
      .length,
    ...Object.fromEntries(
      ["reading", "listening", "writing", "speaking"].map((skill) => [
        skill,
        practice.filter((i) => i.skill === skill).length,
      ]),
    ),
  };
  return [
    exam,
    Object.fromEntries(
      Object.entries(targets).map(([key, [first, second]]) => [
        key,
        `${have[key]} / ${first} (${second})`,
      ]),
    ),
  ];
});
console.log("Content is valid.");
console.log(
  `${result.items} questions and tasks, ${result.lessons} lessons, ${result.mocks} mock exams; ${diagnosticItems.length} diagnostic items.`,
);
console.log("Practice and lessons against targets, cohort 1 (cohort 2):");
console.table(Object.fromEntries(rows));
console.log(
  `Audio pending: ${result.pendingAudio.length} clips. Known content debt: ${contentDebt.shortDocuments.length} short documents; longest-option bias in ${Object.keys(contentDebt.longestCorrect).length} mock sections.`,
);
