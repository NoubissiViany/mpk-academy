// Listening audio helpers shared by the content builder and
// scripts/content/generate-audio.cjs. Pure functions: no I/O.

/** A generated clip, as recorded in src/content/audio-manifest.json. */
export interface AudioClip {
  /** Fingerprint of the transcript the clip was made from. */
  text: string;
  /** Hash of everything sent to the speech service (text, voices, format). */
  source: string;
  /** `/audio/…` for files served from public/, or a key in the private mock bucket. */
  path: string;
  seconds: number;
  voices: string[];
}
export type AudioManifest = Record<string, AudioClip>;

/** Private Supabase Storage bucket holding mock-exam clips. */
export const MOCK_AUDIO_BUCKET = "mock-audio";

/**
 * FNV-1a, 32 bits. Detects that a transcript changed after its clip was
 * made; it is not a security measure.
 */
export function textFingerprint(text: string) {
  let hash = 0x811c9dc5;
  for (const char of text.normalize("NFC")) {
    hash ^= char.codePointAt(0)!;
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}

const TURN = /(?:^|\s)([A-D]) : /g;

/** Dialogue transcripts mark each turn "A : …", "B : …". */
export function transcriptTurns(transcript: string) {
  const marks = [...transcript.matchAll(TURN)];
  if (!marks.length) return [{ speaker: "A", text: transcript.trim() }];
  return marks.map((mark, index) => ({
    speaker: mark[1],
    text: transcript
      .slice(mark.index + mark[0].length, marks[index + 1]?.index)
      .trim(),
  }));
}

export const speakerIds = (transcript: string) => [
  ...new Set(transcriptTurns(transcript).map((turn) => turn.speaker)),
];
