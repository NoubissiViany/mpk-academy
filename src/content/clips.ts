// Looks up generated audio in src/content/audio-manifest.json. A clip counts
// only while the text it was made from is unchanged.
import audioManifest from "./audio-manifest.json";
import { textFingerprint, type AudioManifest } from "./shared/audio";

const manifest = audioManifest as AudioManifest;

export function readyClip(id: string, text: string) {
  const clip = manifest[id];
  return clip?.text === textFingerprint(text) ? clip : null;
}

/** A speaking task's model answer, read aloud. */
export const modelAnswerClipId = (taskId: string) => `${taskId}-model`;

/** One of a TEF section B task's objections, read by the other person. */
export const objectionClipId = (taskId: string, index: number) =>
  `${taskId}-objection-${index + 1}`;
