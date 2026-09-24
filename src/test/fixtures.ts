import type { AppState, ExamPreparationProfile, User } from "@/types/domain";

export const paidDemoUser: User = {
  id: "user-alex",
  firstName: "Alex",
  lastName: "Morgan",
  email: "alex@demo.mpk",
  tier: "paid_student",
  locale: "en",
  assistance: "full",
  goal: {
    exam: "TEF Canada",
    target: "NCLC 7",
    targetDate: "2026-11-15",
  },
};

export const defaultProgress: AppState["progress"] = {
  completedLessonIds: [
    "getting-started-1",
    "getting-started-2",
    "getting-started-3",
    "core-grammar-1",
  ],
  quizAverage: 76,
  practiceAnswered: 28,
  practiceAccuracy: 69,
  simulationsCompleted: 2,
  simulationAverage: 68,
  diagnosticScore: 66,
  courseCompletion: 42,
  competencyScores: {
    "listening-detail": 54,
    "reading-main-idea": 81,
    "vocabulary-context": 68,
    "grammar-tense": 77,
    "reading-inference": 65,
    connectors: 74,
  },
};

const seededTefProfile: ExamPreparationProfile = {
  exam: "TEF Canada",
  readinessSource: "diagnostic",
  readinessBaseline30Days: 52,
  readiness: 68,
  skills: {
    reading: { baseline30Days: 58, current: 72, attempts: 16 },
    listening: { baseline30Days: 49, current: 54, attempts: 12 },
    writing: { baseline30Days: null, current: null, attempts: 0 },
    speaking: { baseline30Days: null, current: null, attempts: 0 },
  },
  weekly: {
    weekStartedAt: "2026-09-14",
    practiceSessions: 3,
    minutesStudied: 102,
    questionsReviewed: 12,
    readinessChange: 0,
  },
  mockAverage: 68,
  mockAttempts: 2,
};

export const demoState: AppState = {
  schemaVersion: 5,
  user: paidDemoUser,
  planAccess: {
    planId: "complete",
    purchasedAt: "2026-09-14T12:00:00.000Z",
    accessUntil: "2027-03-14T12:00:00.000Z",
  },
  checkoutIntentPlanId: null,
  postCheckoutWelcomePending: false,
  examProfiles: { "TEF Canada": seededTefProfile },
  diagnosticIntake: {
    goal: "TEF Canada",
    target: "NCLC 7",
    frenchExperience: "I know some French",
  },
  diagnosticAnswers: {},
  diagnosticResult: {
    score: 68,
    level: "B1",
    competencyScores: defaultProgress.competencyScores,
    skillScores: {
      grammar: 77,
      vocabulary: 68,
      reading: 72,
      listening: 54,
      "sentence-structure": 65,
      "exam-strategy": 74,
    },
    strength: "grammar",
    priority: "listening",
    recommendedModuleId: "listening-strategies",
  },
  progress: defaultProgress,
  mistakes: [
    {
      id: "m1",
      questionId: "tef-listening-detail",
      competencyId: "listening-detail",
      mistakeCategory: "Missed detail",
      learnerAnswer: "Elle travaille.",
      correctAnswer: "Son train est annulé.",
      explanation:
        "The cancellation is the reason; work is mentioned only as context.",
      timestamp: "2026-08-28T14:30:00Z",
      reviewStatus: "new",
      exam: "TEF Canada",
      examSkill: "listening",
      pattern: "Understanding specific details",
      count: 8,
    },
    {
      id: "m2",
      questionId: "tef-listening-numbers",
      competencyId: "listening-detail",
      mistakeCategory: "Missed detail",
      learnerAnswer: "Incorrect detail",
      correctAnswer: "Correct number or date",
      explanation: "Review number and date cues in spoken French.",
      timestamp: "2026-08-27T15:00:00Z",
      reviewStatus: "reviewing",
      exam: "TEF Canada",
      examSkill: "listening",
      pattern: "Numbers and dates",
      count: 5,
    },
  ],
  activities: [
    {
      id: "a1",
      label: "Completed “Understanding connectors”",
      detail: "Lesson checkpoint · 84%",
      timestamp: "2026-08-29T13:00:00Z",
    },
  ],
};
