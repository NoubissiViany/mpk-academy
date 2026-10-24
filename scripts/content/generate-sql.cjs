/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS bootstrap loads typed content without another runtime dependency. */
// Keeps the database copy of the content (answer keys, audio status, lesson
// list, mock manifests) in step with src/content.
//
// supabase/content-lock.json records a hash of every row the migrations have
// loaded so far. When content changes, `npm run content:sql` writes a new
// migration that upserts only the changed rows and archives removed ones, then
// updates the lock. `--check` fails while the lock and the content disagree, so
// a content change cannot reach main without its migration.
require("./register.cjs");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const {
  diagnosticItems,
  practiceItems,
  lessons,
} = require("../../src/content/catalog.ts");
const { mockItems, manifests } = require("../../src/content/mock-catalog.ts");
const { validateContent } = require("../../src/content/validate.ts");

const check = process.argv.includes("--check");
const root = path.resolve(__dirname, "../..");
const migrations = path.join(root, "supabase/migrations");
const lockPath = path.join(root, "supabase/content-lock.json");
const items = [...diagnosticItems, ...practiceItems, ...mockItems];
validateContent(
  items,
  lessons,
  manifests,
  practiceItems.map((i) => i.id),
);

const q = (v) =>
  v === null || v === undefined
    ? "null"
    : "'" + String(v).replaceAll("'", "''") + "'";
const arr = (v) => `array[${v.map(q).join(",")}]::text[]`;

const tables = {
  question_bank: {
    columns: [
      "id",
      "correct_answer",
      "diagnostic_skill",
      "competencies",
      "explanation",
      "mistake_category",
      "is_diagnostic",
      "exam",
      "skill",
      "kind",
      "purpose",
      "option_ids",
      "audio_status",
      "content_version",
      "duration_seconds",
      "preparation_seconds",
      "audio_duration",
    ],
    rows: items.map((i) => [
      i.id,
      [
        q(i.id),
        q(i.kind === "mcq" ? i.correction.answer : null),
        q(i.skill),
        arr(i.competencies),
        q(i.kind === "mcq" ? i.correction.explanation : i.correction.guidance),
        q(
          i.skill === "grammar"
            ? "Grammar rule"
            : i.skill === "vocabulary"
              ? "Vocabulary confusion"
              : "Missed detail",
        ),
        diagnosticItems.includes(i) ? "true" : "false",
        q(i.exam),
        q(i.skill),
        q(i.kind),
        q(
          diagnosticItems.includes(i)
            ? "diagnostic"
            : practiceItems.includes(i)
              ? "practice"
              : "mock",
        ),
        arr(i.kind === "mcq" ? i.options.map((o) => o.id) : []),
        q(i.audio?.status),
        q("mpk-content-v2"),
        i.durationSeconds ?? "null",
        i.preparationSeconds ?? 0,
        i.audio?.intendedDuration ?? "null",
      ].join(","),
    ]),
    // Answers and mistakes keep pointing at old rows, so nothing is deleted.
    retire: (ids) =>
      `update private.question_bank set purpose='archived', is_diagnostic=false where id in (${ids.map(q).join(",")});\n`,
  },
  lesson_catalog: {
    columns: ["id", "module_id", "is_free", "exam", "active"],
    rows: lessons.map((l) => [
      l.id,
      `${q(l.id)},${q(l.moduleId)},${l.isFree},${q(l.exam)},true`,
    ]),
    retire: (ids) =>
      `update private.lesson_catalog set active=false where id in (${ids.map(q).join(",")});\n`,
  },
  content_manifests: {
    columns: ["id", "exam", "version", "manifest"],
    rows: manifests.map((m) => [
      m.id,
      `${q(m.id)},${q(m.exam)},${q(m.version)},${q(JSON.stringify(m))}::jsonb`,
    ]),
    retire: (ids) => {
      // Mock sessions reference manifests; a mock is replaced, never removed.
      throw Error(`Removing a mock manifest is not supported: ${ids}`);
    },
  },
};

const hash = (value) =>
  crypto.createHash("sha256").update(value).digest("hex").slice(0, 16);
const current = {};
for (const [table, { rows }] of Object.entries(tables))
  for (const [id, values] of rows) current[`${table}:${id}`] = hash(values);
const locked = fs.existsSync(lockPath)
  ? JSON.parse(fs.readFileSync(lockPath, "utf8")).rows
  : {};
const changed = Object.keys(current).filter((k) => locked[k] !== current[k]);
const removed = Object.keys(locked).filter((k) => !(k in current));

if (check) {
  if (changed.length || removed.length)
    throw Error(
      `Content changed since the last sync migration (${changed.length} changed, ${removed.length} removed): run npm run content:sql`,
    );
  console.log("Database content matches the typed source.");
} else if (!changed.length && !removed.length) {
  console.log("Database content is already up to date.");
} else {
  let sql =
    "-- Generated from src/content by npm run content:sql. Do not edit by hand.\n";
  for (const [table, { columns, rows, retire }] of Object.entries(tables)) {
    const upserts = rows.filter(([id]) => changed.includes(`${table}:${id}`));
    if (upserts.length)
      sql +=
        `insert into private.${table} (${columns.join(",")}) values\n` +
        upserts.map(([, values]) => `(${values})`).join(",\n") +
        `\non conflict (id) do update set ${columns
          .slice(1)
          .map((c) => `${c}=excluded.${c}`)
          .join(",")};\n`;
    const gone = removed
      .filter((k) => k.startsWith(`${table}:`))
      .map((k) => k.slice(table.length + 1));
    if (gone.length) sql += retire(gone);
  }
  // Timestamps follow the existing ones, so the migration always runs last.
  const latest = Math.max(
    ...fs
      .readdirSync(migrations)
      .map((name) => Number(name.slice(0, 14)))
      .filter(Number.isFinite),
  );
  const today = Number(
    new Date().toISOString().slice(0, 10).replaceAll("-", "") + "000100",
  );
  const file = path.join(
    migrations,
    `${Math.max(today, latest + 100)}_content_sync.sql`,
  );
  fs.writeFileSync(file, sql);
  fs.writeFileSync(
    lockPath,
    JSON.stringify(
      {
        note: "Generated by npm run content:sql: the content rows loaded by the migrations. Do not edit by hand.",
        rows: Object.fromEntries(Object.entries(current).sort()),
      },
      null,
      2,
    ) + "\n",
  );
  console.log(
    `Wrote ${path.relative(root, file)}: ${changed.length} rows upserted, ${removed.length} retired.`,
  );
}

const summaries = manifests.map((m) => ({
  id: m.id,
  exam: m.exam,
  ready: m.sections
    .flatMap((s) => s.itemIds)
    .every((id) => {
      const i = mockItems.find((x) => x.id === id);
      return (
        i.kind !== "mcq" ||
        i.skill !== "listening" ||
        i.audio?.status === "ready"
      );
    }),
  sections: m.sections.map((s) => ({
    skill: s.skill,
    count: s.itemIds.length,
    durationSeconds: s.durationSeconds,
  })),
}));
const summaryPath = "src/content/mock-summaries.ts";
const summaryText =
  "// Generated public metadata only. No mock questions or corrections.\nexport const mockSummaries = " +
  JSON.stringify(summaries, null, 2) +
  " as const;\n";
if (check) {
  if (fs.readFileSync(summaryPath, "utf8") !== summaryText)
    throw Error("Mock summary drift");
} else fs.writeFileSync(summaryPath, summaryText);

// Browser-safe content metadata: lesson and practice listings without bodies,
// answer keys, explanations, or model responses.
const pick = (item, keys) => Object.fromEntries(keys.map((k) => [k, item[k]]));
const contentSummaryPath = "src/content/summaries.ts";
const contentSummaryText =
  "// Generated by npm run content:sql. Public metadata only: no lesson bodies,\n" +
  "// answer keys, explanations, or model responses. Do not edit by hand.\n" +
  'import type { LessonSummary, PracticeSummary } from "./shared/types";\n\n' +
  "export const lessonSummaries: LessonSummary[] = " +
  JSON.stringify(
    lessons.map((l) =>
      pick(l, [
        "id",
        "exam",
        "skill",
        "moduleId",
        "title",
        "titleFr",
        "level",
        "estimatedTime",
        "isFree",
        "competencies",
        "objectives",
      ]),
    ),
    null,
    2,
  ) +
  ";\n\nexport const practiceSummaries: PracticeSummary[] = " +
  JSON.stringify(
    practiceItems.map((i) =>
      pick(i, ["id", "exam", "skill", "kind", "level", "competencies"]),
    ),
    null,
    2,
  ) +
  ";\n";
if (check) {
  if (
    !fs.existsSync(contentSummaryPath) ||
    fs.readFileSync(contentSummaryPath, "utf8") !== contentSummaryText
  )
    throw Error("Content summary drift: run npm run content:sql");
} else fs.writeFileSync(contentSummaryPath, contentSummaryText);
