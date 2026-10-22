/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS bootstrap loads typed content without another runtime dependency. */
// Merges drafts marked "accepted" in content/drafts/*.json into the content
// files, once the teacher has approved those that need it (every mock and
// diagnostic question, and one in five others). A rewrite replaces the
// question with the same id; a new question is added to its exam's practice
// file, or to the diagnostic. It records
// listening voices, shrinks src/content/debt.json, and keeps nothing unless
// validation passes.
//
//   node scripts/content/accept-drafts.cjs
//
// Afterwards: npm run content:audio (listening), then npm run content:sql.
require("./register.cjs");
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const { needsTeacher, toSeed } = require("../../src/content/drafting.ts");
const { mockItems } = require("../../src/content/mock-catalog.ts");

const root = path.resolve(__dirname, "../..");
const draftsDir = path.join(root, "content/drafts");
const speakersPath = path.join(root, "src/content/audio-speakers.json");
const debtPath = path.join(root, "src/content/debt.json");
const readJson = (file) => JSON.parse(fs.readFileSync(file, "utf8"));
const writeJson = (file, value) =>
  fs.writeFileSync(file, JSON.stringify(value, null, 2) + "\n");

const draftFiles = fs.existsSync(draftsDir)
  ? fs
      .readdirSync(draftsDir)
      .filter((name) => name.endsWith(".json"))
      .map((name) => path.join(draftsDir, name))
  : [];
const mockIds = new Set(mockItems.map((item) => item.id));
const ready = (item) =>
  item.review === "accepted" &&
  (item.teacher === "approved" ||
    (!item.teacher && !needsTeacher(item.id, mockIds.has(item.id))));
const waiting = draftFiles.flatMap((file) =>
  readJson(file).items.filter(
    (item) => item.review === "accepted" && !item.teacher && !ready(item),
  ),
);
if (waiting.length)
  console.log(
    `${waiting.length} accepted drafts wait for the teacher (npm run content:review -- --teacher).`,
  );
const accepted = draftFiles.flatMap((file) =>
  readJson(file)
    .items.filter(ready)
    .map((item) => ({ item, file })),
);
if (!accepted.length) {
  console.log("Nothing ready to merge.");
  process.exit(0);
}

const contentFiles = execFileSync("git", ["ls-files", "src/content"], {
  cwd: root,
})
  .toString()
  .trim()
  .split("\n")
  .filter(
    (f) => f.endsWith(".ts") && !f.includes("legacy") && !f.includes(".test."),
  )
  .map((f) => path.join(root, f));

// Everything this run may change, restored if validation fails.
const backups = new Map(
  [...contentFiles, ...draftFiles, speakersPath, debtPath].map((file) => [
    file,
    fs.readFileSync(file, "utf8"),
  ]),
);
const restore = () => {
  for (const [file, text] of backups) fs.writeFileSync(file, text);
};

const parse = (file) =>
  ts.createSourceFile(
    file,
    fs.readFileSync(file, "utf8"),
    ts.ScriptTarget.Latest,
    true,
  );
const find = (node, test) => {
  if (test(node)) return node;
  let found;
  ts.forEachChild(node, (child) => {
    found ??= find(child, test);
  });
  return found;
};
const seedFor = (source, id) =>
  find(
    source,
    (node) =>
      ts.isArrayLiteralExpression(node) &&
      ts.isArrayLiteralExpression(node.parent) &&
      node.elements[0] &&
      ts.isStringLiteral(node.elements[0]) &&
      node.elements[0].text === id,
  );

const edits = new Map(); // file → [start, end, text][]
const edit = (file, start, end, text) =>
  edits.set(file, [...(edits.get(file) ?? []), [start, end, text]]);
const speakers = readJson(speakersPath);

for (const { item } of accepted) {
  const seed = JSON.stringify(toSeed(item));
  if (item.replaces) {
    const file = contentFiles.find((f) => seedFor(parse(f), item.id));
    if (!file) throw Error(`${item.id}: published question not found`);
    const node = seedFor(parse(file), item.id);
    edit(file, node.getStart(), node.end, seed);
  } else {
    const file = path.join(
      root,
      item.target === "diagnostic"
        ? `src/content/diagnostic/${item.skill}.ts`
        : `src/content/${item.exam.toLowerCase()}/practice/${item.skill}.ts`,
    );
    const call = find(
      parse(file),
      (node) =>
        ts.isCallExpression(node) &&
        node.expression.getText() === "questions" &&
        ts.isArrayLiteralExpression(node.arguments[2]),
    );
    if (!call) throw Error(`${file}: no questions(...) list found`);
    const rows = call.arguments[2].elements;
    edit(
      file,
      rows[rows.length - 1].end,
      rows[rows.length - 1].end,
      `,\n${seed}`,
    );
  }
  if (item.skill === "listening" && /^[FM]+$/.test(item.speakers ?? ""))
    speakers[item.id] = item.speakers;
}

try {
  for (const [file, list] of edits) {
    let text = fs.readFileSync(file, "utf8");
    for (const [start, end, value] of list.sort((a, b) => b[0] - a[0]))
      text = text.slice(0, start) + value + text.slice(end);
    fs.writeFileSync(file, text);
  }
  writeJson(speakersPath, Object.fromEntries(Object.entries(speakers).sort()));
  execFileSync("npx", ["prettier", "--write", ...edits.keys()], {
    cwd: root,
    stdio: "ignore",
  });

  // Fixed problems leave the debt list (in a fresh process, to load the new content).
  execFileSync(
    process.execPath,
    [
      "-e",
      `require("./scripts/content/register.cjs");
       const fs = require("node:fs");
       const { diagnosticItems, practiceItems } = require("./src/content/catalog.ts");
       const { mockItems, manifests } = require("./src/content/mock-catalog.ts");
       const { shrinkDebt, contentDebt } = require("./src/content/validate.ts");
       const debt = shrinkDebt(contentDebt, [...diagnosticItems, ...practiceItems, ...mockItems], manifests, practiceItems.map((i) => i.id));
       fs.writeFileSync("src/content/debt.json", JSON.stringify(debt, null, 2) + "\\n");`,
    ],
    { cwd: root },
  );
  execFileSync(process.execPath, ["scripts/content/validate.cjs"], {
    cwd: root,
    stdio: ["ignore", "ignore", "pipe"],
  });
} catch (error) {
  restore();
  console.error(
    "Nothing was merged: the content would not validate.\n" +
      (error.stderr
        ?.toString()
        .split("\n")
        .filter((l) => /: /.test(l))
        .slice(0, 20)
        .join("\n") || error.message),
  );
  process.exit(1);
}

for (const file of draftFiles) {
  const drafts = readJson(file);
  for (const item of drafts.items) if (ready(item)) item.review = "merged";
  writeJson(file, drafts);
}
const rewrites = accepted.filter(({ item }) => item.replaces).length;
console.log(
  `Merged ${accepted.length} drafts (${rewrites} rewrites, ${accepted.length - rewrites} new).`,
);
console.log(
  "Next: npm run content:audio for listening questions, then npm run content:sql.",
);
