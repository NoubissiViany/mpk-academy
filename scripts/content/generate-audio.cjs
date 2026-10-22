/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS bootstrap loads typed content without another runtime dependency. */
// Makes the listening clips with Azure AI Speech (free F0 tier) and records
// them in src/content/audio-manifest.json, which turns their questions from
// "transcript exercise" into real listening.
//
//   node scripts/content/generate-audio.cjs --dry-run   list what would be made
//   node scripts/content/generate-audio.cjs             make new or changed clips
//
// Options: --only <id prefix>, --limit <n>, --refetch (also remake clips whose
// local file is missing). Needs AZURE_SPEECH_KEY and AZURE_SPEECH_REGION, read
// from .env.local. Practice, diagnostic and sample clips go to public/audio;
// mock clips go to .audio-cache/ for scripts/content/upload-mock-audio.cjs.
require("./register.cjs");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const {
  diagnosticItems,
  practiceItems,
} = require("../../src/content/catalog.ts");
const { mockItems } = require("../../src/content/mock-catalog.ts");
const { sampleItems } = require("../../src/content/sample.ts");
const {
  speakerIds,
  textFingerprint,
  transcriptTurns,
} = require("../../src/content/shared/audio.ts");
const {
  modelAnswerClipId,
  objectionClipId,
} = require("../../src/content/clips.ts");
const speakerGenders = require("../../src/content/audio-speakers.json");

const root = path.resolve(__dirname, "../..");
const manifestPath = path.join(root, "src/content/audio-manifest.json");
const publicDir = path.join(root, "public/audio");
const cacheDir = path.join(root, ".audio-cache/mock-audio");
const FORMAT = "audio-16khz-32kbitrate-mono-mp3";
const BITS_PER_SECOND = 32_000;
// F0 allows 20 requests a minute; one at a time keeps well inside it.
const REQUEST_GAP_MS = 3_200;

const VOICES = {
  "fr-CA": {
    female: ["fr-CA-SylvieNeural"],
    male: ["fr-CA-JeanNeural", "fr-CA-AntoineNeural", "fr-CA-ThierryNeural"],
  },
  "fr-FR": {
    female: [
      "fr-FR-DeniseNeural",
      "fr-FR-BrigitteNeural",
      "fr-FR-CelesteNeural",
      "fr-FR-CoralieNeural",
      "fr-FR-JacquelineNeural",
      "fr-FR-JosephineNeural",
      "fr-FR-YvetteNeural",
    ],
    male: [
      "fr-FR-HenriNeural",
      "fr-FR-AlainNeural",
      "fr-FR-ClaudeNeural",
      "fr-FR-JeromeNeural",
      "fr-FR-MauriceNeural",
      "fr-FR-YvesNeural",
    ],
  },
};
// Slower speech for lower levels, as in the exams' easier recordings.
const RATES = { A2: "-12%", B1: "-6%", B2: "0%", C1: "0%" };

const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const option = (name) => {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
};
const dryRun = flag("--dry-run");
const refetch = flag("--refetch");
const only = option("--only");
const limit = Number(option("--limit") ?? Infinity);

const seed = (value) =>
  parseInt(
    crypto.createHash("sha256").update(value).digest("hex").slice(0, 8),
    16,
  );
const sha = (value) =>
  crypto.createHash("sha256").update(value).digest("hex").slice(0, 16);
const escapeXml = (text) =>
  text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");

/**
 * Voices rotate between Canadian and France French by question. Speakers
 * keep a gender set in audio-speakers.json; others alternate, so that two
 * people in a dialogue never share a voice.
 */
function chooseVoices(item) {
  const speakers = item.audio.speakers;
  const genders = speakers.map(
    (speaker, index) =>
      speaker.gender ??
      ((seed(`${item.id}:gender`) + index) % 2 ? "female" : "male"),
  );
  let locale = seed(`${item.id}:locale`) % 2 ? "fr-CA" : "fr-FR";
  const needed = (gender) => genders.filter((g) => g === gender).length;
  if (["female", "male"].some((g) => needed(g) > VOICES[locale][g].length))
    locale = "fr-FR";
  const used = new Set();
  return genders.map((gender, index) => {
    const pool = VOICES[locale][gender];
    let pick = seed(`${item.id}:voice:${index}`) % pool.length;
    while (used.has(pool[pick])) pick = (pick + 1) % pool.length;
    used.add(pool[pick]);
    return pool[pick];
  });
}

function buildSsml(item, voices) {
  const turns = transcriptTurns(item.audio.transcript);
  const order = item.audio.speakers.map((speaker) => speaker.id);
  const rate = RATES[item.level] ?? "0%";
  const body = turns
    .map((turn, index) => {
      const voice = voices[Math.max(0, order.indexOf(turn.speaker))];
      const pause = index < turns.length - 1 ? '<break time="500ms"/>' : "";
      return `<voice name="${voice}"><prosody rate="${rate}">${escapeXml(turn.text)}</prosody>${pause}</voice>`;
    })
    .join("");
  return `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="${voices[0].slice(0, 5)}">${body}</speak>`;
}

// Speaking practice tasks: the model answer read aloud (a dialogue for
// role-plays), and TEF section B objections in the other person's voice.
// They take the shape of a listening question so voices and SSML are shared.
const spoken = (id, item, transcript, genders) => ({
  id: item.id,
  exam: item.exam,
  level: item.level,
  audio: {
    id,
    transcript,
    speakers: speakerIds(transcript).map((speaker, index) => ({
      id: speaker,
      ...(genders?.[index]
        ? { gender: genders[index] === "F" ? "female" : "male" }
        : {}),
    })),
  },
});
const taskClips = practiceItems
  .filter((item) => item.kind === "speaking")
  .flatMap((task) => [
    ...(task.correction.modelResponse
      ? [
          spoken(
            modelAnswerClipId(task.id),
            task,
            task.correction.modelResponse,
            speakerGenders[task.id],
          ),
        ]
      : []),
    ...(task.objections?.lines ?? []).map((line, index) =>
      spoken(
        objectionClipId(task.id, index),
        { ...task, id: `${task.id}-objections` },
        line,
        task.objections.voice === "female" ? "F" : "M",
      ),
    ),
  ]);

const mockIds = new Set(mockItems.map((item) => item.id));
const clips = [
  ...[
    ...diagnosticItems,
    ...practiceItems,
    ...mockItems,
    ...sampleItems,
  ].filter((item) => item.kind === "mcq" && item.audio),
  ...taskClips,
].map((item) => {
  const voices = chooseVoices(item);
  const ssml = buildSsml(item, voices);
  const source = sha(`${FORMAT}\n${ssml}`);
  const mock = mockIds.has(item.id);
  const exam = item.exam.toLowerCase();
  return {
    id: item.audio.id,
    item,
    voices,
    ssml,
    source,
    path: mock ? `${exam}/${source}.mp3` : `/audio/${source}.mp3`,
    file: mock
      ? path.join(cacheDir, exam, `${source}.mp3`)
      : path.join(publicDir, `${source}.mp3`),
  };
});

const manifest = fs.existsSync(manifestPath)
  ? JSON.parse(fs.readFileSync(manifestPath, "utf8"))
  : {};
const saveManifest = () =>
  fs.writeFileSync(
    manifestPath,
    JSON.stringify(
      Object.fromEntries(Object.entries(manifest).sort()),
      null,
      2,
    ) + "\n",
  );

const todo = clips
  .filter((clip) => !only || clip.item.id.startsWith(only))
  .filter(
    (clip) =>
      manifest[clip.id]?.source !== clip.source ||
      (refetch && !fs.existsSync(clip.file)),
  )
  .slice(0, limit);
const characters = todo.reduce(
  (sum, clip) => sum + clip.item.audio.transcript.length,
  0,
);
console.log(
  `${clips.length} clips in the content; ${todo.length} to make (${characters} characters of text; F0 includes 500,000 a month).`,
);

async function synthesize(ssml, key, region) {
  for (let attempt = 1; ; attempt += 1) {
    const response = await fetch(
      `https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`,
      {
        method: "POST",
        headers: {
          "Ocp-Apim-Subscription-Key": key,
          "Content-Type": "application/ssml+xml",
          "X-Microsoft-OutputFormat": FORMAT,
          "User-Agent": "mpk-academy-content",
        },
        body: ssml,
      },
    );
    if (response.ok) return Buffer.from(await response.arrayBuffer());
    if ((response.status === 429 || response.status >= 500) && attempt < 6) {
      const wait = Number(response.headers.get("retry-after")) || 10 * attempt;
      console.log(`  ${response.status}; retrying in ${wait}s`);
      await new Promise((resolve) => setTimeout(resolve, wait * 1000));
      continue;
    }
    throw Error(
      `Azure Speech answered ${response.status}: ${(await response.text()).slice(0, 300)}`,
    );
  }
}

async function main() {
  if (dryRun) {
    for (const clip of todo)
      console.log(`${clip.id}  ${clip.voices.join(" + ")}  → ${clip.path}`);
    return;
  }
  if (!todo.length) return;
  try {
    process.loadEnvFile(path.join(root, ".env.local"));
  } catch {
    // Variables may come from the environment instead.
  }
  const key = process.env.AZURE_SPEECH_KEY;
  const region = process.env.AZURE_SPEECH_REGION;
  if (!key || !region)
    throw Error(
      "Set AZURE_SPEECH_KEY and AZURE_SPEECH_REGION in .env.local (see docs/CONTENT_PIPELINE.md).",
    );
  // Fail before spending quota if a voice is not offered in this region.
  const listed = await fetch(
    `https://${region}.tts.speech.microsoft.com/cognitiveservices/voices/list`,
    { headers: { "Ocp-Apim-Subscription-Key": key } },
  );
  if (!listed.ok)
    throw Error(`Azure Speech voices list answered ${listed.status}`);
  const available = new Set((await listed.json()).map((v) => v.ShortName));
  const missing = [...new Set(todo.flatMap((clip) => clip.voices))].filter(
    (voice) => !available.has(voice),
  );
  if (missing.length)
    throw Error(`Voices not available in ${region}: ${missing.join(", ")}`);

  let last = 0;
  for (const [index, clip] of todo.entries()) {
    await new Promise((resolve) =>
      setTimeout(resolve, Math.max(0, last + REQUEST_GAP_MS - Date.now())),
    );
    last = Date.now();
    const audio = await synthesize(clip.ssml, key, region);
    fs.mkdirSync(path.dirname(clip.file), { recursive: true });
    fs.writeFileSync(clip.file, audio);
    manifest[clip.id] = {
      text: textFingerprint(clip.item.audio.transcript),
      source: clip.source,
      path: clip.path,
      seconds: Math.round((audio.length * 80) / BITS_PER_SECOND) / 10,
      voices: clip.voices,
    };
    saveManifest();
    console.log(
      `${index + 1}/${todo.length} ${clip.id}  ${manifest[clip.id].seconds}s`,
    );
  }

  // Forget clips whose questions are gone, and their files.
  if (!only && limit === Infinity) {
    const ids = new Set(clips.map((clip) => clip.id));
    for (const id of Object.keys(manifest))
      if (!ids.has(id)) delete manifest[id];
    saveManifest();
    const kept = new Set(
      Object.values(manifest).map((entry) => path.basename(entry.path)),
    );
    for (const name of fs.existsSync(publicDir)
      ? fs.readdirSync(publicDir)
      : [])
      if (!kept.has(name)) fs.rmSync(path.join(publicDir, name));
  }
  console.log(
    "Next: upload mock clips to each Supabase project (npm run content:upload-mock-audio), then npm run content:sql to mark the clips ready.",
  );
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
