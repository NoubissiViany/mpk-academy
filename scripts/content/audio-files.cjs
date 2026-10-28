/* eslint-disable @typescript-eslint/no-require-imports -- Shared by the Node content tools. */
const fs = require("node:fs");
const path = require("node:path");

// Only generated, unreferenced files belong to this cleanup. Legacy folders,
// documentation and symlinks may also live in public/audio.
function pruneAudioFiles(directory, kept) {
  if (!fs.existsSync(directory)) return;
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (
      entry.isFile() &&
      /^[a-f0-9]{16}\.mp3$/.test(entry.name) &&
      !kept.has(entry.name)
    )
      fs.rmSync(path.join(directory, entry.name));
  }
}

module.exports = { pruneAudioFiles };
