import { describe, expect, it } from "vitest";
import {
  cleanTranscript,
  measureSpeech,
  paceFor,
  withoutSpans,
  type TimedWord,
} from "./speaking-metrics";

const words = (...timings: Array<[string, number, number]>): TimedWord[] =>
  timings.map(([word, start, end]) => ({ word, start, end }));

describe("speaking metrics", () => {
  it("measures pace, long pauses, and the delay before speaking", () => {
    const metrics = measureSpeech(
      words(
        ["Alors", 1.5, 1.9],
        ["je", 2.0, 2.1],
        ["pense", 2.2, 2.6],
        ["que", 5.0, 5.2],
        ["oui", 5.3, 5.6],
        ["vraiment", 9.0, 9.6],
        ["voilà", 9.7, 10.0],
      ),
      12.4,
    );
    expect(metrics).toEqual({
      audioSeconds: 12,
      words: 7,
      speechSeconds: 8.5,
      wordsPerMinute: 49,
      longPauses: 2,
      longestPause: 3.4,
      startDelay: 1.5,
    });
    expect(paceFor(49)).toBe("slow");
    expect(paceFor(100)).toBe("steady");
    expect(paceFor(150)).toBe("quick");
  });

  it("does not report a pace for a few seconds of speech", () => {
    expect(
      measureSpeech(words(["Bonjour", 0.2, 0.8], ["merci", 1.0, 1.4]), 3)
        .wordsPerMinute,
    ).toBeNull();
    expect(measureSpeech([], 4)).toMatchObject({
      words: 0,
      wordsPerMinute: null,
      longPauses: 0,
    });
  });

  it("drops what the transcriber wrote over silence or repeated itself", () => {
    const cleaned = cleanTranscript(
      [
        {
          start: 0,
          end: 4,
          text: " Je parle de mon quartier.",
          noSpeechProb: 0.01,
          avgLogprob: -0.2,
        },
        {
          start: 4,
          end: 9,
          text: " Merci d'avoir regardé.",
          noSpeechProb: 0.9,
          avgLogprob: -1.4,
        },
        {
          start: 9,
          end: 15,
          text: " oui oui oui oui oui oui",
          compressionRatio: 3.1,
        },
        {
          start: 15,
          end: 18,
          text: " C'est tout.",
          noSpeechProb: 0.2,
          avgLogprob: -0.3,
        },
      ],
      words(
        ["Je", 0.1, 0.3],
        ["parle", 0.4, 0.8],
        ["Merci", 5, 5.5],
        ["oui", 9.5, 9.8],
        ["C'est", 15.2, 15.5],
        ["tout", 15.6, 16],
      ),
    );
    expect(cleaned.text).toBe("Je parle de mon quartier. C'est tout.");
    expect(cleaned.words.map((word) => word.word)).toEqual([
      "Je",
      "parle",
      "C'est",
      "tout",
    ]);
  });
});

describe("objections heard in the recording", () => {
  it("drops what was said while an objection played", () => {
    const timed = words(
      ["Tu", 1, 1.2],
      ["devrais", 1.2, 1.6],
      ["venir.", 1.6, 2],
      ["Mais", 10.2, 10.4],
      ["je", 10.4, 10.5],
      ["suis", 10.5, 10.7],
      ["occupé.", 10.7, 11.2],
      ["Justement,", 14, 14.6],
      ["écoute.", 14.6, 15],
    );
    const segments = [
      { start: 0, end: 9, text: "Tu devrais venir." },
      { start: 9, end: 16, text: "Mais je suis occupé. Justement, écoute." },
    ];
    const result = withoutSpans(segments, timed, [{ start: 9.5, end: 12.5 }]);
    expect(result.words.map((w) => w.word)).toEqual([
      "Tu",
      "devrais",
      "venir.",
      "Justement,",
      "écoute.",
    ]);
    expect(result.segments.map((segment) => segment.text)).toEqual([
      "Tu devrais venir.",
      "Justement, écoute.",
    ]);
    expect(withoutSpans(segments, timed, [])).toEqual({
      segments,
      words: timed,
    });
  });
});
