import "server-only";

import { toQuestion } from "@/content/adapters";
import {
  diagnosticItems,
  findPractice,
  lessons,
  practiceItems,
} from "@/content/catalog";
import { modelAnswerClipId, objectionClipId, readyClip } from "@/content/clips";
import { mockItems } from "@/content/mock-catalog";
import { OBJECTION_TIMES } from "@/config/speaking";
import { sampleItems } from "@/content/sample";
import type {
  LearningLesson,
  LessonCheckpoint,
  MCQ,
  ProductiveTask,
  PublicLessonContent,
  PublicProductiveTask,
} from "@/content/shared/types";
import { scoreDiagnostic } from "@/lib/domain/diagnostic";
import {
  selectPracticeItems,
  type PracticeAnswerRecord,
} from "@/lib/domain/practice-selection";
import { shuffle } from "@/lib/utils";
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
  const audio = question.metadata?.audio;
  return {
    correct:
      answer.trim().toLowerCase() ===
      question.correctAnswer.trim().toLowerCase(),
    correctAnswer: question.correctAnswer,
    explanation:
      (locale === "fr" && question.explanationFr) || question.explanation,
    // The transcript is withheld while listening, and shown after answering.
    ...(audio?.status === "ready" ? { transcript: audio.transcript } : {}),
  };
}

const diagnosticQuestions = diagnosticItems.map(toQuestion);

export const getPublicDiagnosticQuestions = () =>
  diagnosticQuestions.map(toPublicQuestion);

export const scoreGuestDiagnostic = (answers: Record<string, string>) =>
  scoreDiagnostic(diagnosticQuestions, answers);

const practiceMcqs = (exam: ExamId, skill: "reading" | "listening") =>
  findPractice(examCode(exam), skill).filter(isMcq);

/** Ids the selection draws from, used to load only the relevant history. */
export const getPracticeItemIds = (
  exam: ExamId,
  skill: "reading" | "listening",
) => practiceMcqs(exam, skill).map((item) => item.id);

export function getPracticePool(
  exam: ExamId,
  skill: "reading" | "listening",
  options: {
    count: number;
    focus?: string | null;
    answers?: PracticeAnswerRecord[];
    dueIds?: string[];
    reviewOnly?: boolean;
    random?: () => number;
  },
): { questions: PublicQuestion[]; reviewIds: string[] } {
  const selection = selectPracticeItems({
    ...options,
    items: practiceMcqs(exam, skill),
  });
  return {
    questions: selection.items.map((item) =>
      toPublicQuestion(toQuestion(item)),
    ),
    reviewIds: selection.reviewIds,
  };
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

const lessonCheckpoints = (lesson: LearningLesson) => [
  lesson.checkpoint,
  ...(lesson.extraCheckpoints ?? []),
];

/** A checkpoint's prompt and options in the learner's language. */
const localCheckpoint = (checkpoint: LessonCheckpoint, locale: Locale) =>
  locale === "fr"
    ? {
        prompt: checkpoint.promptFr ?? checkpoint.prompt,
        options: checkpoint.optionsFr ?? checkpoint.options,
      }
    : checkpoint;

export function toPublicLesson(
  lesson: LearningLesson,
  locale: Locale = "en",
  random: () => number = Math.random,
): PublicLessonContent {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- answers stay on the server
  const { checkpoint, extraCheckpoints, ...rest } = lesson;
  return {
    ...rest,
    checkpoints: lessonCheckpoints(lesson).map((item) => {
      const { prompt, options } = localCheckpoint(item, locale);
      return {
        prompt,
        options: shuffle(
          options.map((label, index) => ({ index, label })),
          random,
        ),
      };
    }),
  };
}

export function checkLessonCheckpoint(
  lessonId: string,
  checkpointIndex: number,
  answerIndex: number,
  locale: Locale,
): AnswerFeedback | null {
  const lesson = getLessonContent(lessonId);
  const checkpoint = lesson ? lessonCheckpoints(lesson)[checkpointIndex] : null;
  if (!checkpoint || answerIndex >= checkpoint.options.length) return null;
  return {
    correct: answerIndex === checkpoint.answer,
    correctAnswer: localCheckpoint(checkpoint, locale).options[
      checkpoint.answer
    ],
    explanation:
      (locale === "fr" && checkpoint.explanationFr) || checkpoint.explanation,
  };
}

export function getPublicProductiveTasks(
  exam: ExamId,
  skill: "writing" | "speaking",
): PublicProductiveTask[] {
  return findPractice(examCode(exam), skill)
    .filter(isProductive)
    .map(({ correction, objections, ...task }) => ({
      ...task,
      // Objections are part of the task, not an answer: they are sent ahead
      // and revealed at their time while the learner answers.
      ...(objections
        ? {
            objections: objections.lines.map((text, index) => {
              const clip = readyClip(objectionClipId(task.id, index), text);
              return {
                at: OBJECTION_TIMES[index],
                text,
                ...(clip ? { audio: clip.path, seconds: clip.seconds } : {}),
              };
            }),
          }
        : {}),
      correction: {
        guidance: correction.guidance,
        guidanceFr: correction.guidanceFr,
        rubric: correction.rubric,
        hasModelResponse: Boolean(correction.modelResponse),
      },
    }));
}

/** A writing task for the learner's exam, as public task text. */
export function getPublicWritingTask(exam: ExamId, taskId: string) {
  return (
    getPublicProductiveTasks(exam, "writing").find(
      (task) => task.id === taskId,
    ) ?? null
  );
}

/** A speaking task for the learner's exam, as public task text. */
export function getPublicSpeakingTask(exam: ExamId, taskId: string) {
  return (
    getPublicProductiveTasks(exam, "speaking").find(
      (task) => task.id === taskId,
    ) ?? null
  );
}

const productiveTitles = (kind: "writing" | "speaking") =>
  Object.fromEntries(
    practiceItems
      .filter(isProductive)
      .filter((item) => item.kind === kind)
      .map((item) => [item.id, item.title]),
  ) as Record<string, string>;

/** Titles of every writing task, for lists of past submissions. */
export const getWritingTaskTitles = () => productiveTitles("writing");

/** Titles of every speaking task, for lists of past recordings. */
export const getSpeakingTaskTitles = () => productiveTitles("speaking");

/** A task's model answer, with its recording for speaking tasks once made. */
export function getModelResponse(exam: ExamId, taskId: string) {
  const item = practiceItems.find(
    (candidate) => candidate.id === taskId && candidate.exam === examCode(exam),
  );
  const text =
    item && isProductive(item) ? item.correction.modelResponse : undefined;
  if (!text) return null;
  const clip = readyClip(modelAnswerClipId(taskId), text);
  return { text, ...(clip ? { audio: clip.path } : {}) };
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

const explanationsById = new Map(
  [...diagnosticItems, ...practiceItems, ...mockItems]
    .filter(isMcq)
    .map((item) => [item.id, item.correction] as const),
);

/**
 * Explanations in the learner's language for questions they answered. Saved
 * mistakes keep a copy of the English explanation from the answer bank.
 */
export function getExplanations(questionIds: string[], locale: Locale) {
  return Object.fromEntries(
    questionIds.flatMap((id) => {
      const correction = explanationsById.get(id);
      return correction
        ? [
            [
              id,
              (locale === "fr" && correction.explanationFr) ||
                correction.explanation,
            ],
          ]
        : [];
    }),
  ) as Record<string, string>;
}

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
