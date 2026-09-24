import type { AppState } from "@/types/domain";

export const emptyProgress: AppState["progress"] = {
  completedLessonIds: [],
  quizAverage: 0,
  practiceAnswered: 0,
  practiceAccuracy: 0,
  simulationsCompleted: 0,
  simulationAverage: 0,
  diagnosticScore: null,
  courseCompletion: 0,
  competencyScores: {},
};

export const defaultState: AppState = {
  schemaVersion: 5,
  user: null,
  planAccess: null,
  checkoutIntentPlanId: null,
  postCheckoutWelcomePending: false,
  examProfiles: {},
  diagnosticIntake: null,
  diagnosticAnswers: {},
  diagnosticResult: null,
  progress: structuredClone(emptyProgress),
  mistakes: [],
  activities: [],
};
