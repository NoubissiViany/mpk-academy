import "server-only";

import { toQuestion } from "@/content/adapters";
import {
  diagnosticItems,
  findPractice,
  lessons,
  practiceItems,
} from "@/content/catalog";
import { mockItems } from "@/content/mock-catalog";
import { sampleItems } from "@/content/sample";
import type {
  LearningLesson,
  MCQ,
  ProductiveTask,
  PublicLessonContent,
  PublicProductiveTask,
} from "@/content/shared/types";
import { scoreDiagnostic } from "@/lib/domain/diagnostic";
import type {
  AnswerFeedback,
  ExamId,
  Locale,
  PublicQuestion,
  Question,
} from "@/types/domain";

// The only module that hands answer keys to application code. Everything it
// returns to the browser is either redacted or a verdict on a submitted answer.

const examCode = (exam: ExamId) => (exam === "TCF Canada" ? "TCF" : "TEF");
const isMcq = (item: { kind: string }): item is MCQ => item.kind === "mcq";
const isProductive = (item: { kind: string }): item is ProductiveTask =>
  item.kind === "writing" || item.kind === "speaking";

export function toPublicQuestion(question: Question): PublicQuestion {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- removing the answer key is the point
  const { correctAnswer, explanation, explanationFr, ...rest } = question;
  const audio = rest.metadata?.audio;
  // With real audio, the transcript would turn listening into reading.
  if (audio?.status === "ready")
    return {
      ...rest,
      metadata: { ...rest.metadata, audio: { ...audio, transcript: "" } },
    };
  return rest;
}

function feedbackFor(
  question: Question,
  answer: string,
  locale: Locale,
): AnswerFeedback {
  return {
    correct:
      answer.trim().toLowerCase() ===
      question.correctAnswer.trim().toLowerCase(),
    correctAnswer: question.correctAnswer,
    explanation:
      (locale === "fr" && question.explanationFr) || question.explanation,
  };
}

const diagnosticQuestions = diagnosticItems.map(toQuestion);

export const getPublicDiagnosticQuestions = () =>
  diagnosticQuestions.map(toPublicQuestion);

export const scoreGuestDiagnostic = (answers: Record<string, string>) =>
  scoreDiagnostic(diagnosticQuestions, answers);

export function getPracticePool(
  exam: ExamId,
  skill: "reading" | "listening",
  focus: string | null,
  count: number,
): PublicQuestion[] {
  const all = findPractice(examCode(exam), skill).filter(isMcq);
  const focused = focus
    ? findPractice(examCode(exam), skill, focus).filter(isMcq)
    : [];
  return (focused.length ? focused : all)
    .slice(0, count)
    .map((item) => toPublicQuestion(toQuestion(item)));
}

export function checkPracticeAnswer(
  exam: ExamId,
  questionId: string,
  answer: string,
  locale: Locale,
): AnswerFeedback | null {
  const item = practiceItems.find(
    (candidate) =>
      candidate.id === questionId && candidate.exam === examCode(exam),
  );
  return item && isMcq(item)
    ? feedbackFor(toQuestion(item), answer, locale)
    : null;
}

export const getLessonContent = (
  lessonId: string,
): LearningLesson | undefined =>
  lessons.find((lesson) => lesson.id === lessonId);

export function toPublicLesson(lesson: LearningLesson): PublicLessonContent {
  const { checkpoint, ...rest } = lesson;
  return {
    ...rest,
    checkpoint: { prompt: checkpoint.prompt, options: checkpoint.options },
  };
}

export function checkLessonCheckpoint(
  lessonId: string,
  answerIndex: number,
): AnswerFeedback | null {
  const lesson = getLessonContent(lessonId);
  if (!lesson) return null;
  return {
    correct: answerIndex === lesson.checkpoint.answer,
    correctAnswer: lesson.checkpoint.options[lesson.checkpoint.answer],
    explanation: lesson.checkpoint.explanation,
  };
}

export function getPublicProductiveTasks(
  exam: ExamId,
  skill: "writing" | "speaking",
): PublicProductiveTask[] {
  return findPractice(examCode(exam), skill)
    .filter(isProductive)
    .map(({ correction, ...task }) => ({
      ...task,
      correction: {
        guidance: correction.guidance,
        rubric: correction.rubric,
        hasModelResponse: Boolean(correction.modelResponse),
      },
    }));
}

export function getModelResponse(exam: ExamId, taskId: string) {
  const item = practiceItems.find(
    (candidate) => candidate.id === taskId && candidate.exam === examCode(exam),
  );
  return item && isProductive(item)
    ? (item.correction.modelResponse ?? null)
    : null;
}

const optionLabelsById = new Map(
  [...diagnosticItems, ...practiceItems, ...mockItems]
    .filter(isMcq)
    .map((item) => [
      item.id,
      Object.fromEntries(
        item.options.map((option) => [option.id, option.label]),
      ),
    ]),
);

/** Option text for questions a learner already answered, keyed by option id. */
export function getOptionLabels(questionIds: string[]) {
  return Object.fromEntries(
    questionIds.flatMap((id) => {
      const labels = optionLabelsById.get(id);
      return labels ? [[id, labels]] : [];
    }),
  ) as Record<string, Record<string, string>>;
}

const sampleQuestions = sampleItems.map(toQuestion);

export const getPublicSampleQuestions = () =>
  sampleQuestions.map(toPublicQuestion);

export function checkSampleAnswer(
  questionId: string,
  answer: string,
  locale: Locale,
): AnswerFeedback | null {
  const question = sampleQuestions.find((item) => item.id === questionId);
  return question ? feedbackFor(question, answer, locale) : null;
}
