/* eslint-disable @typescript-eslint/no-require-imports -- Plain Node script, like the other content tools. */
// Records review decisions in content/drafts/*.json without editing them by hand.
//
//   node scripts/content/mark-drafts.cjs accepted <target>... [--except id,id]
//   node scripts/content/mark-drafts.cjs rejected <target>...
//   node scripts/content/mark-drafts.cjs teacher-approved <target>... [--except id,id]
//   node scripts/content/mark-drafts.cjs teacher-rejected <target>...
//
// A target is a draft file name (with or without .json), a question id, or
// the start of ids (for example tef-mock-reading-b2). Only drafts still under
// review change: "accepted"/"rejected" apply to pending drafts, the teacher's
// decisions to accepted ones. Text corrections are still made in the files.
const fs = require("node:fs");
const path = require("node:path");

const draftsDir = path.resolve(__dirname, "../../content/drafts");
const [decision, ...rest] = process.argv.slice(2);
const exceptIndex = rest.indexOf("--except");
const except = new Set(
  exceptIndex >= 0
    ? (rest[exceptIndex + 1] ?? "").split(",").filter(Boolean)
    : [],
);
const targets = rest.filter(
  (arg, index) =>
    exceptIndex < 0 || (index !== exceptIndex && index !== exceptIndex + 1),
);

const apply = {
  accepted: (item) => item.review === "pending" && (item.review = "accepted"),
  rejected: (item) => item.review === "pending" && (item.review = "rejected"),
  "teacher-approved": (item) =>
    item.review === "accepted" && !item.teacher && (item.teacher = "approved"),
  "teacher-rejected": (item) =>
    item.review === "accepted" && !item.teacher && (item.teacher = "rejected"),
}[decision];
if (!apply || !targets.length) {
  console.error(
    "Usage: mark-drafts.cjs accepted|rejected|teacher-approved|teacher-rejected <file, id or id prefix>... [--except id,id]",
  );
  process.exit(1);
}

let changed = 0;
const matched = new Set();
for (const name of fs
  .readdirSync(draftsDir)
  .filter((n) => n.endsWith(".json"))) {
  const file = path.join(draftsDir, name);
  const drafts = JSON.parse(fs.readFileSync(file, "utf8"));
  let touched = false;
  for (const item of drafts.items) {
    const target = targets.find(
      (t) => name === t || name === `${t}.json` || item.id.startsWith(t),
    );
    if (!target || except.has(item.id)) continue;
    matched.add(target);
    if (apply(item)) {
      changed += 1;
      touched = true;
    }
  }
  if (touched) fs.writeFileSync(file, JSON.stringify(drafts, null, 2) + "\n");
}
for (const target of targets)
  if (!matched.has(target)) console.log(`No draft matches "${target}".`);
console.log(`${changed} drafts marked ${decision}.`);
