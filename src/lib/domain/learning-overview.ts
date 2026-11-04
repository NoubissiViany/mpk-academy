export type FeedbackSummary = {
  available: boolean;
  status:
    | "self"
    | "empty"
    | "queued"
    | "processing"
    | "done"
    | "failed"
    | "unavailable";
  lastPracticeAt: string | null;
  href: string | null;
};
export type LearningOverview = Record<"writing" | "speaking", FeedbackSummary>;
export const emptyLearningOverview: LearningOverview = {
  writing: {
    available: false,
    status: "self",
    lastPracticeAt: null,
    href: null,
  },
  speaking: {
    available: false,
    status: "self",
    lastPracticeAt: null,
    href: null,
  },
};
