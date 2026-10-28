// @vitest-environment node
import {
  mkdtempSync,
  mkdirSync,
  readdirSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, expect, it } from "vitest";

const { pruneAudioFiles } = createRequire(import.meta.url)(
  "../../scripts/content/audio-files.cjs",
);
const directories: string[] = [];
afterEach(() => {
  for (const directory of directories.splice(0))
    rmSync(directory, { recursive: true });
});

it("removes only obsolete generated clips and can be safely repeated", () => {
  const directory = mkdtempSync(join(tmpdir(), "mpk-audio-test-"));
  directories.push(directory);
  const current = "1111111111111111.mp3";
  const stale = "2222222222222222.mp3";
  for (const name of [current, stale, "README.md", "recording.mp3"])
    writeFileSync(join(directory, name), "fixture");
  mkdirSync(join(directory, "diagnostic"));
  mkdirSync(join(directory, "3333333333333333.mp3"));
  symlinkSync(current, join(directory, "4444444444444444.mp3"));

  pruneAudioFiles(directory, new Set([current]));
  pruneAudioFiles(directory, new Set([current]));

  expect(readdirSync(directory).sort()).toEqual(
    [
      current,
      "3333333333333333.mp3",
      "4444444444444444.mp3",
      "README.md",
      "diagnostic",
      "recording.mp3",
    ].sort(),
  );
  expect(() =>
    pruneAudioFiles(join(directory, "absent"), new Set()),
  ).not.toThrow();
});
