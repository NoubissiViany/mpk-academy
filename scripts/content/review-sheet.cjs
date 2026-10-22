/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS bootstrap loads typed content without another runtime dependency. */
// Builds a printable review sheet from content/drafts/*.json.
//
//   node scripts/content/review-sheet.cjs            drafts waiting for review
//   node scripts/content/review-sheet.cjs --teacher  the teacher's share of the
//                                                    accepted drafts: every mock
//                                                    question and one in five others
//
// Writes content/drafts/review.html (or teacher-review.html). A rewrite is
// shown next to the question it replaces. Decisions go back in the JSON files:
// "review": "accepted" or "rejected" after the first pass, then
// "teacher": "approved" or "rejected" where the teacher sheet asks for it.
// Text can be corrected in place at any point.
require("./register.cjs");
const fs = require("node:fs");
const path = require("node:path");
const {
  diagnosticItems,
  practiceItems,
} = require("../../src/content/catalog.ts");
const { mockItems } = require("../../src/content/mock-catalog.ts");
const { documentText, wordCount } = require("../../src/content/quality.ts");
const { transcriptTurns } = require("../../src/content/shared/audio.ts");
const { needsTeacher } = require("../../src/content/drafting.ts");

const root = path.resolve(__dirname, "../..");
const draftsDir = path.join(root, "content/drafts");
const teacher = process.argv.includes("--teacher");
const published = new Map(
  [...diagnosticItems, ...practiceItems, ...mockItems].map((item) => [
    item.id,
    item,
  ]),
);
const mockIds = new Set(mockItems.map((item) => item.id));

const files = fs.existsSync(draftsDir)
  ? fs.readdirSync(draftsDir).filter((name) => name.endsWith(".json"))
  : [];
const drafts = files.flatMap((name) =>
  JSON.parse(fs.readFileSync(path.join(draftsDir, name), "utf8")).items.map(
    (item) => ({ ...item, file: name }),
  ),
);
const chosen = teacher
  ? drafts.filter(
      (d) =>
        d.review === "accepted" &&
        !d.teacher &&
        needsTeacher(d.id, mockIds.has(d.id)),
    )
  : drafts.filter((d) => d.review === "pending");

const esc = (text) =>
  String(text ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
const documentHtml = (text) => {
  const turns = transcriptTurns(text);
  return turns
    .map(
      (turn) =>
        `<p>${turns.length > 1 ? `<b>${turn.speaker} :</b> ` : ""}${esc(turn.text)}</p>`,
    )
    .join("");
};
// Options in the order learners will see them (the builder's placement).
const ordered = (id, correct, wrong) => {
  const position = [...id].reduce((sum, c) => sum + c.charCodeAt(0), 0) % 4;
  const labels = [...wrong];
  labels.splice(position, 0, correct);
  return labels;
};
const options = (id, correct, wrong) =>
  `<ol type="a">${ordered(id, correct, wrong)
    .map(
      (label) =>
        `<li${label === correct ? ' class="correct"' : ""}>${esc(label)}${label === correct ? " ✓" : ""}</li>`,
    )
    .join("")}</ol>`;

function originalHtml(item) {
  const correct = item.options.find((o) => o.id === item.correction.answer);
  return `<div class="col old"><h3>Published now · ${wordCount(documentText(item))} words</h3>
    <div class="doc">${documentHtml(documentText(item))}</div>
    <p class="q">${esc(item.prompt)}</p>
    <ol type="a">${item.options
      .map(
        (o) =>
          `<li${o === correct ? ' class="correct"' : ""}>${esc(o.label)}${o === correct ? " ✓" : ""}</li>`,
      )
      .join("")}</ol></div>`;
}

const cards = chosen
  .map((d) => {
    const original = d.replaces ? published.get(d.id) : null;
    const draft = `<div class="col"><h3>${d.replaces ? "Rewrite" : "New"} · ${wordCount(d.document)} words${d.speakers ? ` · voices ${esc(d.speakers)}` : ""}</h3>
      <div class="doc">${documentHtml(d.document)}</div>
      <p class="q">${esc(d.prompt)}</p>
      ${options(d.id, d.correct, d.wrong)}
      <p class="ex"><b>EN</b> ${esc(d.explanation)}</p>
      <p class="ex" lang="fr"><b>FR</b> ${esc(d.explanationFr)}</p></div>`;
    return `<section class="card">
      <header><b>${esc(d.id)}</b> <span>${esc(d.exam)} · ${esc(d.skill)} · ${esc(d.level)} · ${esc(d.competency)} · ${esc(d.topic)}${mockIds.has(d.id) ? " · <em>mock exam</em>" : ""}</span><small>${esc(d.file)}</small></header>
      ${d.problems?.length ? `<ul class="problems">${d.problems.map((p) => `<li>${esc(p)}</li>`).join("")}</ul>` : ""}
      <div class="cols">${original ? originalHtml(original) : ""}${draft}</div>
      <footer>☐ Accept &nbsp; ☐ Fix &nbsp; ☐ Reject &nbsp; Notes: ______________________________________________</footer>
    </section>`;
  })
  .join("\n");

const title = teacher ? "MPK teacher review" : "MPK draft review";
const html = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><title>${title}</title>
<style>
body{font:15px/1.5 system-ui,sans-serif;margin:24px auto;max-width:1100px;padding:0 16px;color:#1a1a1a;background:#fff}
h1{font-size:22px}.intro{color:#555}
.card{border:1px solid #ccc;border-radius:10px;padding:14px 16px;margin:18px 0;break-inside:avoid}
header{display:flex;flex-wrap:wrap;gap:8px;align-items:baseline}header span{color:#555}header small{margin-left:auto;color:#888}
.cols{display:grid;gap:16px;grid-template-columns:repeat(auto-fit,minmax(320px,1fr))}
.col h3{font-size:13px;text-transform:uppercase;letter-spacing:.06em;color:#666;margin:10px 0 6px}
.old{opacity:.75}.doc{background:#f5f5f2;border-left:3px solid #2d6a4f;padding:6px 12px}.doc p{margin:6px 0}
.q{font-weight:600}.correct{font-weight:700;color:#1b5e20}.ex{font-size:14px;color:#333}
.problems{background:#fff3f0;border:1px solid #f0b8a8;border-radius:6px;color:#8a2a0f;padding:6px 6px 6px 26px}
footer{margin-top:10px;color:#444;font-size:14px}
@media print{body{margin:0}.card{border-color:#999}}
</style></head><body>
<h1>${title} · ${chosen.length} questions</h1>
<p class="intro">${
  teacher
    ? 'Every mock-exam question and a fixed one-in-five sample of the other accepted drafts. Check the French, that exactly one answer is defensible, that the level is right, and that the explanations are accurate. Decisions go in the draft files as "teacher": "approved" or "rejected".'
    : 'Drafts waiting for a first review. Record decisions in the draft files: set "review" to "accepted" or "rejected" and correct text in place.'
}</p>
${cards || "<p>Nothing to review.</p>"}
</body></html>`;
fs.mkdirSync(draftsDir, { recursive: true });
const out = path.join(
  draftsDir,
  teacher ? "teacher-review.html" : "review.html",
);
fs.writeFileSync(out, html);
console.log(
  `Wrote ${path.relative(root, out)} with ${chosen.length} questions.`,
);
