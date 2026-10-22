// Timing measures from a word-timestamped transcript. Pure, so they can be
// tested without audio; the server computes them once, right after
// transcription, and stores only the numbers.

export interface TimedWord {
  word: string;
  start: number;
  end: number;
}

export interface TranscriptSegment {
  start: number;
  end: number;
  text: string;
  noSpeechProb?: number;
  avgLogprob?: number;
  compressionRatio?: number;
}

export interface SpeakingMetrics {
  /** Length of the recording. */
  audioSeconds: number;
  words: number;
  /** From the first word to the last. */
  speechSeconds: number;
  wordsPerMinute: number | null;
  /** Silences of LONG_PAUSE_SECONDS or more between words. */
  longPauses: number;
  longestPause: number;
  /** Silence before the first word. */
  startDelay: number;
}

export const LONG_PAUSE_SECONDS = 2;

/**
 * Whisper sometimes writes text for silence or repeats itself. Segments it
 * marks as probably silent (as OpenAI's reference implementation does) or as
 * highly repetitive are dropped with their words.
 */
export function cleanTranscript(
  segments: TranscriptSegment[],
  words: TimedWord[],
) {
  const kept = segments.filter(
    (segment) =>
      !((segment.noSpeechProb ?? 0) > 0.6 && (segment.avgLogprob ?? 0) < -1) &&
      (segment.compressionRatio ?? 0) <= 2.4,
  );
  const inKept = (word: TimedWord) =>
    kept.some(
      (segment) =>
        word.start >= segment.start - 0.05 && word.end <= segment.end + 0.05,
    );
  const keptWords = segments.length ? words.filter(inKept) : words;
  const text = (kept.length ? kept.map((segment) => segment.text) : [])
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
  return { text, words: keptWords };
}

const round1 = (value: number) => Math.round(value * 10) / 10;

export function measureSpeech(
  words: TimedWord[],
  audioSeconds: number,
): SpeakingMetrics {
  const ordered = [...words].sort((a, b) => a.start - b.start);
  let longPauses = 0;
  let longestPause = 0;
  for (let index = 1; index < ordered.length; index += 1) {
    const gap = ordered[index].start - ordered[index - 1].end;
    if (gap >= LONG_PAUSE_SECONDS) longPauses += 1;
    longestPause = Math.max(longestPause, gap);
  }
  const speechSeconds = ordered.length
    ? Math.max(0, ordered.at(-1)!.end - ordered[0].start)
    : 0;
  return {
    audioSeconds: Math.round(audioSeconds),
    words: ordered.length,
    speechSeconds: round1(speechSeconds),
    wordsPerMinute:
      speechSeconds >= 5
        ? Math.round(ordered.length / (speechSeconds / 60))
        : null,
    longPauses,
    longestPause: round1(longestPause),
    startDelay: round1(ordered[0]?.start ?? 0),
  };
}

export type Pace = "slow" | "steady" | "quick";

/** Coarse pace bands for practice guidance, not an exam score. */
export const paceFor = (wordsPerMinute: number): Pace =>
  wordsPerMinute < 70 ? "slow" : wordsPerMinute <= 130 ? "steady" : "quick";
