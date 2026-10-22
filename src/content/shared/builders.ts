import audioManifest from "../audio-manifest.json";
import speakerGenders from "../audio-speakers.json";
import type { AudioAsset, MCQ, ContentExam } from "./types";
import { difficultyByLevel, type ContentLevel } from "./levels";
import type { ContentCompetency } from "./competencies";
import { speakerIds, textFingerprint, type AudioManifest } from "./audio";
// Authoring helper only: every row supplies its own original document and distractors.
export type QuestionSeed = [
  id: string,
  level: ContentLevel,
  competency: ContentCompetency,
  topic: string,
  documentType: string,
  document: string,
  prompt: string,
  correct: string,
  wrong1: string,
  wrong2: string,
  wrong3: string,
  explanation: string,
  explanationFr?: string,
];
export function questions(
  exam: ContentExam,
  skill: MCQ["skill"],
  rows: QuestionSeed[],
): MCQ[] {
  return rows.map(
    ([
      id,
      level,
      competency,
      topic,
      questionType,
      document,
      prompt,
      correct,
      ...rest
    ]) => {
      const [wrong1, wrong2, wrong3, explanation, explanationFr] = rest;
      // Stable ID-based placement avoids authoring-position identifiers and answer-position bias.
      const position = [...id].reduce((sum, c) => sum + c.charCodeAt(0), 0) % 4;
      const labels = [wrong1, wrong2, wrong3];
      labels.splice(position, 0, correct);
      return {
        id,
        exam,
        skill,
        level,
        difficulty: difficultyByLevel[level],
        competencies: [competency],
        topic,
        estimatedTime: skill === "listening" ? 55 : 45,
        status: "published",
        kind: "mcq",
        questionType,
        prompt,
        ...(skill === "listening"
          ? { audio: listeningAudio(id, document) }
          : { passage: document }),
        options: labels.map((label, i) => ({ id: "abcd"[i], label })),
        correction: {
          answer: "abcd"[position],
          explanation,
          ...(explanationFr ? { explanationFr } : {}),
        },
      };
    },
  );
}

const roles = ["Premier", "Deuxième", "Troisième", "Quatrième"];

/**
 * A clip is ready once scripts/content/generate-audio.cjs has made it from
 * this exact transcript; editing the transcript sends it back to pending.
 */
function listeningAudio(id: string, transcript: string): AudioAsset {
  const audioId = `${id}-audio`;
  const ids = speakerIds(transcript);
  const genders = (speakerGenders as Record<string, string>)[id] ?? "";
  const speakers = ids.map((speaker, index) => ({
    id: speaker,
    role: ids.length > 1 ? `${roles[index]} interlocuteur` : "Locuteur",
    ...(genders[index]
      ? {
          gender:
            genders[index] === "F" ? ("female" as const) : ("male" as const),
        }
      : {}),
  }));
  const clip = (audioManifest as AudioManifest)[audioId];
  const base = {
    id: audioId,
    speakers,
    transcript,
    intendedDuration: Math.max(
      12,
      Math.ceil(transcript.split(/\s+/).length / 2.3),
    ),
  };
  return clip?.text === textFingerprint(transcript)
    ? {
        ...base,
        status: "ready",
        path: clip.path,
        intendedDuration: Math.ceil(clip.seconds),
      }
    : { ...base, status: "pending" };
}
