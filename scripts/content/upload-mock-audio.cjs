/* eslint-disable @typescript-eslint/no-require-imports -- Plain Node script, like the other content tools. */
// Uploads mock-exam clips made by generate-audio.cjs to the private
// "mock-audio" bucket of one Supabase project, then checks that every mock
// clip in src/content/audio-manifest.json is there. Run it once per project
// (staging and production) before pushing the migration that marks the
// clips ready, or that project's mock exam would point at missing files.
//
//   node scripts/content/upload-mock-audio.cjs                  # uses .env.local
//   node scripts/content/upload-mock-audio.cjs --env <file>
//   node scripts/content/upload-mock-audio.cjs --check         # read-only inventory
//
// Needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY for the target.
const fs = require("node:fs");
const path = require("node:path");
const { createClient } = require("@supabase/supabase-js");

const root = path.resolve(__dirname, "../..");
const BUCKET = "mock-audio";
const check = process.argv.includes("--check");
// Not --env-file: Node reads that flag itself, even after the script name.
const envIndex = process.argv.indexOf("--env");
const envFile = path.resolve(
  root,
  envIndex >= 0 ? process.argv[envIndex + 1] : ".env.local",
);

async function main() {
  if (!fs.existsSync(envFile))
    throw Error(
      `${path.relative(root, envFile)} does not exist. Create it with two lines for the target project:\n` +
        "  NEXT_PUBLIC_SUPABASE_URL=https://<project ref>.supabase.co\n" +
        "  SUPABASE_SERVICE_ROLE_KEY=<that project's service role key>\n" +
        "(Supabase dashboard of the project, Project Settings > API, or the project's Vercel environment variables.)",
    );
  process.loadEnvFile(envFile);
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key)
    throw Error(
      `${path.relative(root, envFile)} needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.`,
    );
  console.log(`Project: ${new URL(url).hostname.split(".")[0]}`);
  const storage = createClient(url, key, {
    auth: { persistSession: false },
  }).storage.from(BUCKET);

  const manifest = JSON.parse(
    fs.readFileSync(path.join(root, "src/content/audio-manifest.json"), "utf8"),
  );
  const keys = Object.values(manifest)
    .map((clip) => clip.path)
    .filter((key) => !key.startsWith("/"));
  const present = new Set();
  for (const folder of new Set(keys.map((key) => key.split("/")[0]))) {
    const { data, error } = await storage.list(folder, { limit: 1000 });
    if (error) throw Error(`Listing ${BUCKET}/${folder}: ${error.message}`);
    for (const file of data) present.add(`${folder}/${file.name}`);
  }

  const absent = keys.filter((key) => !present.has(key));
  if (check) {
    console.log(
      `${keys.length - absent.length}/${keys.length} mock clips present; no files uploaded.`,
    );
    if (absent.length)
      throw Error(
        `${absent.length} mock clips missing. Run content:upload-mock-audio for this project before applying audio-ready migrations.`,
      );
    return;
  }

  const missing = [];
  let uploaded = 0;
  for (const key of absent) {
    const file = path.join(root, ".audio-cache", BUCKET, key);
    if (!fs.existsSync(file)) {
      missing.push(key);
      continue;
    }
    const { error } = await storage.upload(key, fs.readFileSync(file), {
      contentType: "audio/mpeg",
      cacheControl: "31536000",
      upsert: false,
    });
    if (error) throw Error(`Uploading ${key}: ${error.message}`);
    uploaded += 1;
  }
  console.log(
    `${keys.length} mock clips: ${keys.length - missing.length - uploaded} already there, ${uploaded} uploaded.`,
  );
  if (missing.length)
    throw Error(
      `${missing.length} clips are neither in the bucket nor in .audio-cache. Remake them with: node scripts/content/generate-audio.cjs --refetch`,
    );
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
