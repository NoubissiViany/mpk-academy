/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS bootstrap loads typed content without another runtime dependency. */
// Drafts reading and listening questions with a language model for human
// review. Nothing reaches learners until a reviewer accepts a draft and
// accept-drafts.cjs merges it (see docs/CONTENT_PIPELINE.md).
//
//   node scripts/content/draft.cjs new --exam TEF --skill reading --level B1 --count 10 [--topic "logement"]
//   node scripts/content/draft.cjs rewrite --prefix tef-mock-reading-b2 [--count 10]
//   node scripts/content/draft.cjs check    re-run the checks after editing drafts by hand
//
// "rewrite" lengthens published questions listed as short in
// src/content/debt.json, or fixes a correct option that is the longest.
// Options: --provider gemini (default; GEMINI_API_KEY) or groq (GROQ_API_KEY,
// shares the app's Groq account), --model <name>. Drafts are written to
// content/drafts/.
require("./register.cjs");
const fs = require("node:fs");
const path = require("node:path");
const {
  diagnosticItems,
  practiceItems,
} = require("../../src/content/catalog.ts");
const { mockItems } = require("../../src/content/mock-catalog.ts");
const { contentDebt } = require("../../src/content/validate.ts");
const {
  correctIsLongest,
  documentText,
} = require("../../src/content/quality.ts");
const drafting = require("../../src/content/drafting.ts");

const root = path.resolve(__dirname, "../..");
const draftsDir = path.join(root, "content/drafts");
const PER_REQUEST = 5;
const REQUEST_GAP_MS = 6_000;

const [mode, ...rest] = process.argv.slice(2);
const option = (name, fallback) => {
  const index = rest.indexOf(`--${name}`);
  return index >= 0 ? rest[index + 1] : fallback;
};
const providers = {
  gemini: {
    url: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
    key: "GEMINI_API_KEY",
    model: () => process.env.GEMINI_MODEL || "gemini-3.8-flash",
    extra: {},
  },
  groq: {
    url: "https://api.groq.com/openai/v1/chat/completions",
    key: "GROQ_API_KEY",
    // Not used by the app, so drafting never eats into feedback limits.
    model: () => "openai/gpt-oss-20b",
    // Structured output fails here when reasoning is hidden or runs long.
    extra: { reasoning_effort: "low", max_completion_tokens: 8000 },
  },
};

const published = [...diagnosticItems, ...practiceItems, ...mockItems].filter(
  (item) => item.kind === "mcq",
);
const readDrafts = () =>
  fs.existsSync(draftsDir)
    ? fs
        .readdirSync(draftsDir)
        .filter((name) => name.endsWith(".json"))
        .flatMap(
          (name) =>
            JSON.parse(fs.readFileSync(path.join(draftsDir, name), "utf8"))
              .items,
        )
    : [];

async function chat(provider, model, key, messages, rewrite) {
  let format = {
    type: "json_schema",
    json_schema: drafting.draftSchema(rewrite),
  };
  let schemaFailures = 0;
  let transientFailures = 0;
  for (;;) {
    let response;
    try {
      response = await fetch(provider.url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        signal: AbortSignal.timeout(90_000),
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.8,
          response_format: format,
          ...provider.extra,
        }),
      });
    } catch (error) {
      if (++transientFailures >= 5) throw error;
      const wait = 20 * transientFailures;
      console.log(`  network/timeout error; retrying in ${wait}s`);
      await new Promise((resolve) => setTimeout(resolve, wait * 1000));
      continue;
    }
    if (response.ok) {
      const body = await response.json();
      return JSON.parse(body.choices[0].message.content);
    }
    const detail = (await response.text()).slice(0, 400);
    // An answer that broke the schema: ask again.
    if (detail.includes("json_validate_failed") && ++schemaFailures < 5) {
      console.log("  the answer did not match the schema; asking again");
      continue;
    }
    if (
      response.status === 400 &&
      format.type === "json_schema" &&
      /response_format|json_schema/i.test(detail)
    ) {
      // Some models take only plain JSON mode; the prompt describes the shape.
      format = { type: "json_object" };
      continue;
    }
    if (
      (response.status === 429 || response.status >= 500) &&
      ++transientFailures < 5
    ) {
      const wait =
        Number(response.headers.get("retry-after")) || 20 * transientFailures;
      console.log(`  ${response.status}; retrying in ${wait}s`);
      await new Promise((resolve) => setTimeout(resolve, wait * 1000));
      continue;
    }
    throw Error(`${model} answered ${response.status}: ${detail}`);
  }
}

function plan() {
  if (mode === "new") {
    const exam = option("exam");
    const skill = option("skill");
    const level = option("level");
    const count = Number(option("count", "5"));
    if (
      !["TEF", "TCF"].includes(exam) ||
      !["reading", "listening"].includes(skill) ||
      !["A2", "B1", "B2", "C1"].includes(level) ||
      !(count > 0)
    )
      throw Error(
        "Usage: draft.cjs new --exam TEF|TCF --skill reading|listening --level A2|B1|B2|C1 --count <n> [--topic <theme>]",
      );
    const avoidTopics = [
      ...new Set(
        [...published, ...readDrafts()]
          .filter((item) => item.exam === exam && item.skill === skill)
          .map((item) => item.topic),
      ),
    ];
    const batches = [];
    for (let done = 0; done < count; done += PER_REQUEST)
      batches.push({
        originals: [],
        messages: drafting.newItemsMessages({
          exam,
          skill,
          level,
          count: Math.min(PER_REQUEST, count - done),
          topic: option("topic"),
          avoidTopics,
        }),
      });
    return {
      label: `${exam}-${skill}-${level}`.toLowerCase(),
      request: { mode, exam, skill, level, count, topic: option("topic") },
      base: { exam, skill, level },
      batches,
    };
  }
  if (mode === "rewrite") {
    const prefix = option("prefix");
    const count = Number(option("count", "10"));
    if (!prefix) throw Error("Usage: draft.cjs rewrite --prefix <id prefix>");
    const drafted = new Set(readDrafts().map((item) => item.id));
    const targets = published
      .filter((item) => item.id.startsWith(prefix) && !drafted.has(item.id))
      .filter(
        (item) =>
          contentDebt.shortDocuments.includes(item.id) ||
          correctIsLongest(item),
      )
      .filter((item) => item.skill === "reading" || item.skill === "listening")
      .slice(0, count);
    if (!targets.length)
      throw Error(`Nothing to rewrite under "${prefix}" (or already drafted).`);
    const kinds = new Set(targets.map((t) => `${t.exam} ${t.skill}`));
    if (kinds.size > 1)
      throw Error(`Use a prefix within one exam and skill: ${[...kinds]}`);
    const batches = [];
    for (let i = 0; i < targets.length; i += PER_REQUEST) {
      const originals = targets.slice(i, i + PER_REQUEST);
      batches.push({
        originals,
        messages: drafting.rewriteMessages(originals),
      });
    }
    return {
      label: `rewrite-${prefix}`,
      request: { mode, prefix, count: targets.length },
      base: {
        exam: targets[0].exam === "shared" ? "TEF" : targets[0].exam,
        skill: targets[0].skill,
      },
      batches,
    };
  }
  throw Error("First argument: new or rewrite. See the comment at the top.");
}

/** Re-checks every draft still under review, for example after hand edits. */
function checkAll() {
  const files = fs.existsSync(draftsDir)
    ? fs.readdirSync(draftsDir).filter((name) => name.endsWith(".json"))
    : [];
  const drafts = files.map((name) => ({
    name,
    data: JSON.parse(fs.readFileSync(path.join(draftsDir, name), "utf8")),
  }));
  const open = drafts.flatMap((file) =>
    file.data.items.filter((item) =>
      ["pending", "accepted"].includes(item.review),
    ),
  );
  const replaced = new Set(open.filter((i) => i.replaces).map((i) => i.id));
  const others = [
    ...published
      .filter((item) => !replaced.has(item.id))
      .map((item) => ({
        id: item.id,
        text: `${documentText(item)} ${item.prompt}`,
      })),
    ...open.map((item) => ({
      id: item.id,
      text: `${item.document} ${item.prompt}`,
    })),
  ];
  let flagged = 0;
  for (const item of open) {
    item.problems = drafting.draftProblems(item, others);
    if (item.problems.length) flagged += 1;
  }
  for (const file of drafts)
    fs.writeFileSync(
      path.join(draftsDir, file.name),
      JSON.stringify(file.data, null, 2) + "\n",
    );
  console.log(`${open.length} drafts checked; ${flagged} with problems.`);
}

async function main() {
  if (mode === "check") return checkAll();
  const work = plan();
  const providerName = option("provider", "gemini");
  const provider = providers[providerName];
  if (!provider) throw Error(`Unknown provider ${providerName}`);
  try {
    process.loadEnvFile(path.join(root, ".env.local"));
  } catch {
    // Variables may come from the environment instead.
  }
  const key = process.env[provider.key];
  if (!key) throw Error(`Set ${provider.key} in .env.local.`);
  const model = option("model", provider.model());

  // New ids continue each exam/skill/level numbering, past published and drafted ones.
  const taken = new Set([
    ...published.map((item) => item.id),
    ...readDrafts().map((item) => item.id),
  ]);
  const nextId = () => {
    const prefix =
      `${work.base.exam}-${work.base.skill}-${work.base.level}-`.toLowerCase();
    for (let n = 1; ; n += 1) {
      const id = `${prefix}${String(n).padStart(3, "0")}`;
      if (!taken.has(id)) {
        taken.add(id);
        return id;
      }
    }
  };

  const items = [];
  fs.mkdirSync(draftsDir, { recursive: true });
  const createdAt = new Date().toISOString();
  const stamp = createdAt.slice(0, 16).replace(/[:T]/g, "-");
  let file = path.join(draftsDir, `${stamp}-${work.label}.json`);
  for (let suffix = 2; fs.existsSync(file); suffix += 1)
    file = path.join(draftsDir, `${stamp}-${work.label}-${suffix}.json`);
  const saveProgress = () => {
    const replaced = new Set(items.filter((i) => i.replaces).map((i) => i.id));
    const others = [
      ...published
        .filter((item) => !replaced.has(item.id))
        .map((item) => ({
          id: item.id,
          text: `${documentText(item)} ${item.prompt}`,
        })),
      ...readDrafts()
        .filter((item) => item.review !== "rejected")
        .map((item) => ({
          id: item.id,
          text: `${item.document} ${item.prompt}`,
        })),
      ...items.map((item) => ({
        id: item.id,
        text: `${item.document} ${item.prompt}`,
      })),
    ];
    for (const item of items)
      item.problems = drafting.draftProblems(item, others);
    const temporaryFile = `${file}.tmp`;
    fs.writeFileSync(
      temporaryFile,
      JSON.stringify(
        {
          createdAt,
          provider: providerName,
          model,
          promptVersion: drafting.DRAFT_PROMPT_VERSION,
          request: {
            ...work.request,
            generatedCount: items.length,
            generationComplete: items.length === work.request.count,
          },
          items,
        },
        null,
        2,
      ) + "\n",
    );
    fs.renameSync(temporaryFile, file);
  };
  let last = 0;
  for (const [index, batch] of work.batches.entries()) {
    await new Promise((resolve) =>
      setTimeout(resolve, Math.max(0, last + REQUEST_GAP_MS - Date.now())),
    );
    last = Date.now();
    const messages = [
      ...batch.messages,
      ...(!batch.originals.length && items.length
        ? [
            {
              role: "user",
              content:
                "Earlier questions in this run are below. Use different situations and test different information; do not paraphrase these documents or repeat their questions under new place names.\n" +
                JSON.stringify(
                  items.map(({ topic, document, prompt }) => ({
                    topic,
                    document: document.slice(0, 240),
                    prompt,
                  })),
                ),
            },
          ]
        : []),
    ];
    const raw = await chat(
      provider,
      model,
      key,
      messages,
      batch.originals.length > 0,
    );
    const parsed = drafting.parseDraftItems(
      raw,
      work.base,
      nextId,
      batch.originals,
    );
    items.push(...parsed);
    // A later provider failure must not discard already generated questions.
    if (parsed.length) saveProgress();
    console.log(
      `request ${index + 1}/${work.batches.length}: ${parsed.length} drafts; ${items.length} saved in ${path.relative(root, file)}`,
    );
  }
  if (!items.length)
    throw Error("The provider returned no usable drafts; no file was written.");
  const flagged = items.filter((item) => item.problems.length).length;
  console.log(
    `Wrote ${path.relative(root, file)}: ${items.length} drafts, ${flagged} with problems to look at.`,
  );
  console.log(
    'Next: npm run content:review, mark each draft "accepted" or "rejected" in the file, then npm run content:accept.',
  );
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
