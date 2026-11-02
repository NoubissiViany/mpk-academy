import { shuffle } from "@/lib/utils";
import type { PublicQuestion } from "@/types/domain";

/** IDs and answer associations survive presentation changes. */
export function shuffleQuestions(
  questions: readonly PublicQuestion[],
  withinDifficulty = false,
  random: () => number = Math.random,
): PublicQuestion[] {
  const ordered = withinDifficulty
    ? ["A2", "B1", "B2", "C1"].flatMap((level) =>
        shuffle(
          questions.filter((q) => q.difficulty === level),
          random,
        ),
      )
    : shuffle(questions, random);
  return ordered.map((question) =>
    question.options
      ? { ...question, options: shuffle(question.options, random) }
      : question,
  );
}
