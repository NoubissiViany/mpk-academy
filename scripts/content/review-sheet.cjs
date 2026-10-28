/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS bootstrap loads typed content without another runtime dependency. */
// Reviewing drafts in content/drafts/*.json.
//
//   node scripts/content/review-sheet.cjs                     review page at http://localhost:4400
//   node scripts/content/review-sheet.cjs --print             printable sheet of the drafts waiting for you
//   node scripts/content/review-sheet.cjs --print --teacher   printable sheet for the teacher
//
// The review page runs on this computer only. "Your review" lists drafts
// waiting for a first decision; "Teacher" lists accepted drafts the teacher
// must check (every mock and diagnostic question, one in five of the rest),
// to record what the teacher decided. Buttons and edits are saved straight
// into the draft files. A rewrite is shown next to the question it replaces.
require("./register.cjs");
const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const {
  diagnosticItems,
  practiceItems,
} = require("../../src/content/catalog.ts");
const { mockItems } = require("../../src/content/mock-catalog.ts");
const { documentText, wordCount } = require("../../src/content/quality.ts");
const { transcriptTurns } = require("../../src/content/shared/audio.ts");
const {
  draftProblems,
  needsTeacher,
} = require("../../src/content/drafting.ts");

const root = path.resolve(__dirname, "../..");
const draftsDir = path.join(root, "content/drafts");
const published = new Map(
  [...diagnosticItems, ...practiceItems, ...mockItems].map((item) => [
    item.id,
    item,
  ]),
);
const mockIds = new Set(mockItems.map((item) => item.id));

const draftFiles = () =>
  fs.existsSync(draftsDir)
    ? fs.readdirSync(draftsDir).filter((name) => name.endsWith(".json"))
    : [];
const readFile = (name) =>
  JSON.parse(fs.readFileSync(path.join(draftsDir, name), "utf8"));
const writeFile = (name, data) =>
  fs.writeFileSync(
    path.join(draftsDir, name),
    JSON.stringify(data, null, 2) + "\n",
  );
const allDrafts = () =>
  draftFiles().flatMap((name) =>
    readFile(name).items.map((item) => ({ ...item, file: name })),
  );
const forYou = (d) => d.review === "pending";
const forTeacher = (d) =>
  d.review === "accepted" &&
  !d.teacher &&
  needsTeacher(d.id, mockIds.has(d.id));

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
const optionList = (labels, correct) =>
  `<ol type="a">${labels
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
    ${optionList(
      item.options.map((o) => o.label),
      correct?.label,
    )}</div>`;
}

const fields = [
  ["document", "Document"],
  ["prompt", "Question"],
  ["correct", "Correct answer"],
  ["wrong0", "Wrong answer 1"],
  ["wrong1", "Wrong answer 2"],
  ["wrong2", "Wrong answer 3"],
  ["explanation", "Explanation (English)"],
  ["explanationFr", "Explanation (French)"],
];
const fieldValue = (d, key) =>
  key.startsWith("wrong") ? d.wrong[Number(key.slice(5))] : d[key];

function card(d, view, print) {
  const original = d.replaces ? published.get(d.id) : null;
  const draft = `<div class="col"><h3>${d.replaces ? "Rewrite" : "New"} · ${wordCount(d.document)} words${d.speakers ? ` · voices ${esc(d.speakers)}` : ""}</h3>
      <div class="doc">${documentHtml(d.document)}</div>
      <p class="q">${esc(d.prompt)}</p>
      ${optionList(ordered(d.id, d.correct, d.wrong), d.correct)}
      <p class="ex"><b>EN</b> ${esc(d.explanation)}</p>
      <p class="ex" lang="fr"><b>FR</b> ${esc(d.explanationFr)}</p></div>`;
  const actions = print
    ? `<footer>☐ Accept &nbsp; ☐ Fix &nbsp; ☐ Reject &nbsp; Notes: ______________________________________________</footer>`
    : `<footer class="actions">
          <label>Note <input name="notes" value="${esc(d.notes)}" placeholder="optional"></label>
          ${
            view === "teacher"
              ? `<button data-set="teacher:approved" class="yes">Teacher approved</button>
                 <button data-set="teacher:rejected" class="no">Teacher rejected</button>`
              : `<button data-set="review:accepted" class="yes">Accept</button>
                 <button data-set="review:rejected" class="no">Reject</button>`
          }
          <button data-edit>Edit text</button>
          <span class="state"></span>
        </footer>
        <form class="editor" hidden>
          ${fields
            .map(
              ([key, label]) =>
                `<label>${label}<textarea name="${key}" rows="${key === "document" ? 6 : 2}">${esc(fieldValue(d, key))}</textarea></label>`,
            )
            .join("")}
          <div><button type="submit" class="yes">Save changes</button><button type="button" data-cancel>Cancel</button></div>
        </form>`;
  return `<section class="card" data-id="${esc(d.id)}" data-file="${esc(d.file)}">
      <header><b>${esc(d.id)}</b> <span>${esc(d.exam)} · ${esc(d.skill)} · ${esc(d.level)} · ${esc(d.competency)} · ${esc(d.topic)}${mockIds.has(d.id) ? " · <em>mock exam</em>" : ""}</span><small>${esc(d.file)}</small></header>
      ${d.problems?.length ? `<ul class="problems">${d.problems.map((p) => `<li>${esc(p)}</li>`).join("")}</ul>` : ""}
      <div class="cols">${original ? originalHtml(original) : ""}${draft}</div>
      ${actions}
    </section>`;
}

const style = `body{font:15px/1.5 system-ui,sans-serif;margin:24px auto;max-width:1100px;padding:0 16px;color:#1a1a1a;background:#fff}
h1{font-size:22px}.intro{color:#555}nav a{margin-right:16px;font-weight:600}nav a.on{color:#1a1a1a;text-decoration:none}
.card{border:1px solid #ccc;border-radius:10px;padding:14px 16px;margin:18px 0;break-inside:avoid}
.card.done{opacity:.45}
header{display:flex;flex-wrap:wrap;gap:8px;align-items:baseline}header span{color:#555}header small{margin-left:auto;color:#888}
.cols{display:grid;gap:16px;grid-template-columns:repeat(auto-fit,minmax(320px,1fr))}
.col h3{font-size:13px;text-transform:uppercase;letter-spacing:.06em;color:#666;margin:10px 0 6px}
.old{opacity:.75}.doc{background:#f5f5f2;border-left:3px solid #2d6a4f;padding:6px 12px}.doc p{margin:6px 0}
.q{font-weight:600}.correct{font-weight:700;color:#1b5e20}.ex{font-size:14px;color:#333}
.problems{background:#fff3f0;border:1px solid #f0b8a8;border-radius:6px;color:#8a2a0f;padding:6px 6px 6px 26px}
footer{margin-top:12px;color:#444;font-size:14px;display:flex;flex-wrap:wrap;gap:8px;align-items:center}
footer input{width:260px;padding:6px}
button{font:inherit;padding:7px 14px;border-radius:8px;border:1px solid #999;background:#f4f4f4;cursor:pointer}
button.yes{background:#1b5e20;color:#fff;border-color:#1b5e20}button.no{background:#8a2a0f;color:#fff;border-color:#8a2a0f}
.state{font-weight:700}
.editor{display:grid;gap:8px;margin-top:12px}.editor[hidden]{display:none}
.editor label{display:grid;gap:4px;font-size:13px;font-weight:600}
.editor textarea{font:inherit;font-weight:400;padding:6px}.editor div{display:flex;gap:8px}
@media print{body{margin:0}.card{border-color:#999}}`;

const script = `
const post = (url, body) => fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }).then((r) => r.json());
for (const card of document.querySelectorAll(".card[data-id]")) {
  const base = { id: card.dataset.id, file: card.dataset.file };
  const state = card.querySelector(".state");
  const editor = card.querySelector(".editor");
  card.querySelectorAll("[data-set]").forEach((button) => button.addEventListener("click", async () => {
    const [field, value] = button.dataset.set.split(":");
    const result = await post("/api/decide", { ...base, field, value, notes: card.querySelector("[name=notes]").value });
    if (!result.ok) return alert(result.error);
    state.textContent = "Saved: " + button.textContent + " ";
    card.classList.add("done");
    const undo = document.createElement("button");
    undo.textContent = "Undo";
    undo.onclick = async () => { await post("/api/decide", { ...base, field, value: null }); state.textContent = ""; card.classList.remove("done"); undo.remove(); };
    state.after(undo);
    document.querySelector("#left").textContent = String(Number(document.querySelector("#left").textContent) - 1);
  }));
  card.querySelector("[data-edit]")?.addEventListener("click", () => { editor.hidden = false; });
  card.querySelector("[data-cancel]")?.addEventListener("click", () => { editor.hidden = true; });
  editor?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(editor));
    const result = await post("/api/edit", { ...base, values });
    if (!result.ok) return alert(result.error);
    location.reload();
  });
}`;

function page(view, print = false) {
  const drafts = allDrafts();
  const chosen = drafts.filter(view === "teacher" ? forTeacher : forYou);
  const title = view === "teacher" ? "MPK teacher review" : "MPK draft review";
  const intro = print
    ? view === "teacher"
      ? "Every mock-exam and diagnostic question, and a fixed one-in-five sample of the other accepted drafts. Please check the French, that exactly one answer is defensible, that the level is right, and that the explanations are accurate. Tick a box for each question and add a note where something should change."
      : "Drafts waiting for a first review."
    : view === "teacher"
      ? "Accepted drafts the teacher must check: every mock and diagnostic question, and one in five of the others. Record here what the teacher decided. To send the teacher these questions, run npm run content:review -- --print --teacher and send the file."
      : "Drafts waiting for your first review. Accept what is right, reject what is not, or fix the text first with Edit text. Accepted mock and diagnostic questions then appear in the Teacher tab.";
  const nav = print
    ? ""
    : `<nav><a href="/" class="${view === "you" ? "on" : ""}">Your review (${drafts.filter(forYou).length})</a><a href="/?view=teacher" class="${view === "teacher" ? "on" : ""}">Teacher (${drafts.filter(forTeacher).length})</a></nav>`;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><title>${title}</title><style>${style}</style></head><body>
${nav}
<h1>${title} · <span id="left">${chosen.length}</span> to go</h1>
<p class="intro">${intro}</p>
${chosen.map((d) => card(d, view, print)).join("\n") || "<p>Nothing to review here.</p>"}
${print ? "" : `<script>${script}</script>`}
</body></html>`;
}

function updateDraft(name, id, change) {
  if (!draftFiles().includes(name)) throw Error("Unknown draft file");
  const data = readFile(name);
  const item = data.items.find((i) => i.id === id);
  if (!item) throw Error("Unknown draft");
  change(item, data);
  writeFile(name, data);
  return item;
}

const handlers = {
  "/api/decide": ({ file, id, field, value, notes }) => {
    const allowed = {
      review: ["accepted", "rejected", null],
      teacher: ["approved", "rejected", null],
    };
    if (!allowed[field]?.includes(value)) throw Error("Unknown decision");
    updateDraft(file, id, (item) => {
      if (field === "review") item.review = value ?? "pending";
      else if (value) item.teacher = value;
      else delete item.teacher;
      if (typeof notes === "string")
        if (notes.trim()) item.notes = notes.trim();
        else delete item.notes;
    });
  },
  "/api/edit": ({ file, id, values }) => {
    const text = (key) =>
      String(values?.[key] ?? "")
        .replace(/\s+/g, " ")
        .trim();
    updateDraft(file, id, (item) => {
      for (const key of [
        "document",
        "prompt",
        "correct",
        "explanation",
        "explanationFr",
      ])
        item[key] = text(key);
      item.wrong = [text("wrong0"), text("wrong1"), text("wrong2")];
      // Re-run the automatic checks on the corrected text.
      const others = [...published.values()]
        .filter((p) => p.kind === "mcq" && p.id !== item.id)
        .map((p) => ({ id: p.id, text: `${documentText(p)} ${p.prompt}` }));
      item.problems = draftProblems(item, others);
    });
  },
};

if (process.argv.includes("--print")) {
  const teacher = process.argv.includes("--teacher");
  fs.mkdirSync(draftsDir, { recursive: true });
  const out = path.join(
    draftsDir,
    teacher ? "teacher-review.html" : "review.html",
  );
  fs.writeFileSync(out, page(teacher ? "teacher" : "you", true));
  console.log(
    `Wrote ${path.relative(root, out)}. Open it in a browser to print it or save it as a PDF.`,
  );
} else {
  const port = Number(process.env.PORT ?? 4400);
  http
    .createServer((request, response) => {
      const url = new URL(request.url, "http://localhost");
      if (request.method === "GET" && url.pathname === "/") {
        response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
        return response.end(
          page(url.searchParams.get("view") === "teacher" ? "teacher" : "you"),
        );
      }
      const handler = request.method === "POST" && handlers[url.pathname];
      if (!handler) {
        response.writeHead(404);
        return response.end();
      }
      let body = "";
      request.on("data", (chunk) => (body += chunk));
      request.on("end", () => {
        try {
          handler(JSON.parse(body));
          response.writeHead(200, { "content-type": "application/json" });
          response.end(JSON.stringify({ ok: true }));
        } catch (error) {
          response.writeHead(400, { "content-type": "application/json" });
          response.end(JSON.stringify({ ok: false, error: error.message }));
        }
      });
    })
    .listen(port, "127.0.0.1", () => {
      console.log(`Review page: http://localhost:${port}  (Ctrl+C to stop)`);
      console.log(
        "Decisions are saved in content/drafts/. When you are done: npm run content:accept",
      );
    });
}
