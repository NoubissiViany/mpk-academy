import { describe, expect, it, vi } from "vitest";

const { transcript } = vi.hoisted(() => ({
  transcript:
    "Le train pour Laval partira voie quatre, et non voie deux. L'horaire reste inchangé. Merci de suivre les panneaux jaunes.",
}));

vi.mock("@/content/audio-manifest.json", async () => {
  const { textFingerprint } = await import("./audio");
  return {
    default: {
      "fixture-ready-audio": {
        text: textFingerprint(transcript),
        source: "0123456789abcdef",
        path: "/audio/0123456789abcdef.mp3",
        seconds: 9.4,
        voices: ["fr-CA-SylvieNeural"],
      },
      "fixture-stale-audio": {
        text: textFingerprint("An older transcript."),
        source: "fedcba9876543210",
        path: "/audio/fedcba9876543210.mp3",
        seconds: 5,
        voices: ["fr-FR-HenriNeural"],
      },
    },
  };
});

import { questions, type QuestionSeed } from "./builders";
import { speakerIds, textFingerprint, transcriptTurns } from "./audio";

const seed = (id: string, document: string): QuestionSeed => [
  id,
  "A2",
  "specific_detail",
  "Gare",
  "annonce",
  document,
  "Où faut-il se rendre ?",
  "À la voie quatre.",
  "À la voie deux.",
  "À l'accueil.",
  "À la sortie.",
  "The platform changes.",
];

describe("listening audio", () => {
  it("splits dialogues into turns and keeps monologues whole", () => {
    expect(
      transcriptTurns("A : Tu viens ? B : Oui, j'arrive. A : Parfait."),
    ).toEqual([
      { speaker: "A", text: "Tu viens ?" },
      { speaker: "B", text: "Oui, j'arrive." },
      { speaker: "A", text: "Parfait." },
    ]);
    expect(transcriptTurns(transcript)).toEqual([
      { speaker: "A", text: transcript },
    ]);
    expect(speakerIds("A : Bonjour. B : Bonjour. A : Merci.")).toEqual([
      "A",
      "B",
    ]);
  });

  it("fingerprints text stably and notices a change", () => {
    expect(textFingerprint(transcript)).toBe(textFingerprint(transcript));
    expect(textFingerprint(transcript)).not.toBe(
      textFingerprint(transcript.replace("quatre", "cinq")),
    );
  });

  it("is ready only for the transcript it was made from", () => {
    const [ready, stale, missing] = questions("TEF", "listening", [
      seed("fixture-ready", transcript),
      seed("fixture-stale", transcript),
      seed("fixture-missing", transcript),
    ]);
    expect(ready.audio).toMatchObject({
      status: "ready",
      path: "/audio/0123456789abcdef.mp3",
      intendedDuration: 10,
    });
    expect(stale.audio).toMatchObject({ status: "pending" });
    expect(stale.audio).not.toHaveProperty("path");
    expect(missing.audio?.status).toBe("pending");
  });
});
