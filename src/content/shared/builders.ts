import type { MCQ, ContentExam } from "./types";
import { difficultyByLevel, type ContentLevel } from "./levels";
import type { ContentCompetency } from "./competencies";
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
          ? {
              audio: {
                id: `${id}-audio`,
                status: "pending" as const,
                intendedDuration: Math.max(
                  12,
                  Math.ceil(document.split(/\s+/).length / 2.3),
                ),
                speakers: document.includes("B :")
                  ? [
                      { id: "A", role: "Premier interlocuteur" },
                      { id: "B", role: "Deuxième interlocuteur" },
                    ]
                  : [{ id: "A", role: "Locuteur" }],
                transcript: document,
              },
            }
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
