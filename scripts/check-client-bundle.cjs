/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS script loads typed content. */
// Fails when any answer key, explanation, model response, mock item, or lesson
// body appears in the browser bundle. Run after `next build`.
require("./content/register.cjs");
const fs = require("node:fs");
const path = require("node:path");

const {
  diagnosticItems,
  practiceItems,
  lessons,
} = require("../src/content/catalog.ts");
const { mockItems } = require("../src/content/mock-catalog.ts");

const staticDir = path.join(__dirname, "..", ".next", "static");
if (!fs.existsSync(staticDir)) {
  console.error("No .next/static directory: run `npm run build` first.");
  process.exit(1);
}

// Minifiers escape non-ASCII characters and quotes, so probe with the longest
// plain run of each secret instead of the full string.
function probe(text) {
  const runs = String(text ?? "").split(/[^A-Za-z0-9 ,.;:()-]+/);
  const longest = runs.reduce(
    (a, b) => (b.trim().length > a.length ? b.trim() : a),
    "",
  );
  return longest.length >= 24 ? longest : null;
}

const secrets = [];
const add = (id, kind, text) => {
  const value = probe(text);
  if (value) secrets.push({ id, kind, value });
};

for (const item of [...diagnosticItems, ...practiceItems, ...mockItems]) {
  if (item.kind === "mcq") {
    add(item.id, "explanation", item.correction.explanation);
    add(item.id, "explanationFr", item.correction.explanationFr);
  } else {
    add(item.id, "modelResponse", item.correction.modelResponse);
  }
}
// Mock items must not reach the browser at all before a session serves them.
for (const item of mockItems) {
  add(
    item.id,
    "mock passage",
    item.passage ?? item.audio?.transcript ?? item.scenario,
  );
}
for (const lesson of lessons) {
  add(lesson.id, "lesson explanation", lesson.explanation);
  add(lesson.id, "checkpoint explanation", lesson.checkpoint.explanation);
  add(lesson.id, "guided application", lesson.guidedApplication);
}

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory()
      ? walk(full)
      : full.endsWith(".js")
        ? [full]
        : [];
  });
}

const files = walk(staticDir).map((file) => ({
  file: path.relative(process.cwd(), file),
  text: fs.readFileSync(file, "utf8"),
}));

const leaks = [];
for (const secret of secrets)
  for (const { file, text } of files)
    if (text.includes(secret.value)) leaks.push({ ...secret, file });

if (leaks.length) {
  const shown = leaks.slice(0, 20);
  for (const leak of shown)
    console.error(`LEAK ${leak.kind} of ${leak.id} in ${leak.file}`);
  if (leaks.length > shown.length)
    console.error(`…and ${leaks.length - shown.length} more.`);
  console.error(
    `\n${leaks.length} protected strings found in the client bundle.`,
  );
  process.exit(1);
}
console.log(
  `Client bundle clean: ${secrets.length} protected strings checked across ${files.length} files.`,
);
