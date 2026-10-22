import type { ContentCompetency } from "./competencies";
import type { ContentLevel } from "./levels";
export type ContentExam = "TEF" | "TCF" | "shared";
export type ContentSkill =
  | "reading"
  | "listening"
  | "writing"
  | "speaking"
  | "grammar"
  | "vocabulary"
  | "pronunciation"
  | "strategy";
export interface Metadata {
  id: string;
  exam: ContentExam;
  skill: ContentSkill;
  level: ContentLevel;
  difficulty: number;
  competencies: ContentCompetency[];
  topic: string;
  estimatedTime: number;
  status: "published" | "archived";
}
export type AudioAsset = {
  id: string;
  intendedDuration: number;
  speakers: { id: string; role: string }[];
  transcript: string;
} & ({ status: "pending"; path?: never } | { status: "ready"; path: string });
export interface MCQ extends Metadata {
  kind: "mcq";
  questionType: string;
  skill: "reading" | "listening" | "grammar" | "vocabulary";
  prompt: string;
  passage?: string;
  audio?: AudioAsset;
  options: { id: string; label: string }[];
  correction: { answer: string; explanation: string; explanationFr?: string };
}
export interface ProductiveTask extends Metadata {
  kind: "writing" | "speaking";
  skill: "writing" | "speaking";
  taskType: string;
  title: string;
  scenario: string;
  instructions: string;
  candidateRole: string;
  interlocutorRole: string;
  objectives: string[];
  durationSeconds: number;
  preparationSeconds: number;
  wordCount?: { min: number; max?: number };
  correction: {
    guidance: string;
    /** French version of the guidance, shown when the interface is in French. */
    guidanceFr?: string;
    rubric: string[];
    modelResponse?: string;
  };
}
export interface LearningLesson extends Metadata {
  kind: "lesson";
  moduleId: string;
  title: string;
  titleFr: string;
  isFree: boolean;
  objectives: string[];
  explanation: string;
  examples: string[];
  guidedApplication: string;
  commonErrors: string[];
  /** French versions, shown when the interface is in French. */
  explanationFr?: string;
  guidedApplicationFr?: string;
  commonErrorsFr?: string[];
  checkpoint: LessonCheckpoint;
  /** Further checkpoint questions; 3–5 per lesson in total is the target. */
  extraCheckpoints?: LessonCheckpoint[];
}
export interface LessonCheckpoint {
  prompt: string;
  /** French prompt, when `prompt` is in English. */
  promptFr?: string;
  options: string[];
  /** French options in the same order, when `options` are in English. */
  optionsFr?: string[];
  answer: number;
  explanation: string;
  explanationFr?: string;
}
export type ContentItem = MCQ | ProductiveTask;
export interface MockManifest {
  id: string;
  version: string;
  exam: "TEF" | "TCF";
  disclaimer: string;
  sections: {
    skill: "reading" | "listening" | "writing" | "speaking";
    durationSeconds: number;
    itemIds: string[];
    navigation: "free" | "forward";
    taskTimers: boolean;
  }[];
}
export type CandidateItem = Pick<ContentItem, "id" | "kind" | "skill"> & {
  prompt: string;
  passage?: string;
  options?: MCQ["options"];
  audio?: {
    id: string;
    status: "pending" | "ready";
    path?: string;
    intendedDuration: number;
  };
  durationSeconds?: number;
  preparationSeconds?: number;
  wordCount?: ProductiveTask["wordCount"];
};
export function candidateItem(item: ContentItem): CandidateItem {
  if (item.kind !== "mcq")
    return {
      id: item.id,
      kind: item.kind,
      skill: item.skill,
      prompt: `${item.scenario}\n${item.instructions}\nVotre rôle : ${item.candidateRole}\nInterlocuteur : ${item.interlocutorRole}`,
      durationSeconds: item.durationSeconds,
      preparationSeconds: item.preparationSeconds,
      wordCount: item.wordCount,
    };
  return {
    id: item.id,
    kind: item.kind,
    skill: item.skill,
    prompt: item.prompt,
    passage: item.passage,
    options: item.options,
    ...(item.audio
      ? {
          audio: {
            id: item.audio.id,
            status: item.audio.status,
            path: item.audio.path,
            intendedDuration: item.audio.intendedDuration,
          },
        }
      : {}),
  };
}

/** Browser-safe lesson metadata: no lesson body or checkpoint answer. */
export type LessonSummary = Pick<
  LearningLesson,
  | "id"
  | "exam"
  | "skill"
  | "moduleId"
  | "title"
  | "titleFr"
  | "level"
  | "estimatedTime"
  | "isFree"
  | "competencies"
  | "objectives"
>;

/** Browser-safe practice item metadata used for counts and focus areas. */
export type PracticeSummary = Pick<
  ContentItem,
  "id" | "exam" | "skill" | "kind" | "level" | "competencies"
>;

/**
 * A lesson as sent to an entitled learner. Checkpoint answers stay on the
 * server; options arrive shuffled, each keeping its original index.
 */
export type PublicLessonContent = Omit<
  LearningLesson,
  "checkpoint" | "extraCheckpoints"
> & {
  checkpoints: Array<{
    prompt: string;
    options: Array<{ index: number; label: string }>;
  }>;
};

/** A productive task as sent to the browser: the model response is fetched after review. */
export type PublicProductiveTask = Omit<ProductiveTask, "correction"> & {
  correction: Omit<ProductiveTask["correction"], "modelResponse"> & {
    hasModelResponse: boolean;
  };
};
