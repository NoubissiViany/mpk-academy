/* eslint-disable @typescript-eslint/no-require-imports -- Plain Node content command. */
require("./register.cjs");
const fs = require("node:fs");
const path = require("node:path");
const {
  practiceItems,
  diagnosticItems,
  lessons,
} = require("../../src/content/catalog.ts");
const { mockItems, manifests } = require("../../src/content/mock-catalog.ts");
const {
  validateContent,
  contentDebt,
} = require("../../src/content/validate.ts");

const result = validateContent(
  [...practiceItems, ...diagnosticItems, ...mockItems],
  lessons,
  manifests,
  practiceItems.map((i) => i.id),
);
const targets = {
  reading: 60,
  listening: 60,
  writing: 10,
  speaking: 10,
  lessons: 25,
};
let remaining = 0;
const rows = {};
for (const exam of ["TEF", "TCF"]) {
  for (const [kind, target] of Object.entries(targets)) {
    const have =
      kind === "lessons"
        ? lessons.filter((l) => l.exam === exam || l.exam === "shared").length
        : practiceItems.filter((i) => i.exam === exam && i.skill === kind)
            .length;
    const gap = Math.max(0, target - have);
    rows[`${exam} ${kind}`] = { have, target, remaining: gap };
    remaining += gap;
  }
}
const shortLessons = lessons.filter(
  (l) => 1 + (l.extraCheckpoints?.length ?? 0) < 3,
);
const extraCheckpointsNeeded = shortLessons.reduce(
  (n, l) => n + 2 - (l.extraCheckpoints?.length ?? 0),
  0,
);
const draftDir = path.resolve(__dirname, "../../content/drafts");
const drafts = fs
  .readdirSync(draftDir)
  .filter((name) => name.endsWith(".json"))
  .flatMap(
    (name) =>
      JSON.parse(fs.readFileSync(path.join(draftDir, name), "utf8")).items,
  );
const waiting = drafts.filter(
  (d) => !["merged", "rejected"].includes(d.review),
);
console.log(
  "Phase 4 local content readiness — hosted deployment and AI calibration require separate verification.",
);
console.table(rows);
console.log(
  `${shortLessons.length} existing lessons need more checkpoints (${extraCheckpointsNeeded} additional checkpoints to reach three each). New lessons also need 3–5 checkpoints.`,
);
console.log(
  `${waiting.length} unresolved/unmerged drafts; ${result.pendingAudio.length} pending clips; ${contentDebt.shortDocuments.length} short-document exceptions; ${Object.keys(contentDebt.longestCorrect).length} answer-length bias exceptions.`,
);
console.log(
  "Shared lessons can fill both exam gaps; do not sum the lesson deficits as distinct lessons.",
);
const ready =
  remaining === 0 &&
  shortLessons.length === 0 &&
  waiting.length === 0 &&
  result.pendingAudio.length === 0 &&
  contentDebt.shortDocuments.length === 0 &&
  Object.keys(contentDebt.longestCorrect).length === 0;
console.log(
  ready
    ? "Local content targets are satisfied. Verify the diagnostic writing flow, hosted release, and the separate calibration requirements before declaring completion."
    : "Phase 4 content targets are not complete. See docs/PHASE4_COMPLETION.md for the remaining work.",
);
process.exitCode = ready ? 0 : 1;
