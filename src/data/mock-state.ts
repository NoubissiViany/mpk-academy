import type { AppState, Competency, User } from "@/types/domain";

export const competencies: Competency[] = [
  { id: "listening-detail", label: "Listening for detail", labelFr: "Écoute des détails", score: 54, attempts: 12 },
  { id: "reading-main-idea", label: "Reading comprehension", labelFr: "Compréhension écrite", score: 81, attempts: 16 },
  { id: "vocabulary-context", label: "Vocabulary", labelFr: "Vocabulaire", score: 68, attempts: 14 },
  { id: "grammar-tense", label: "Grammar", labelFr: "Grammaire", score: 77, attempts: 18 },
  { id: "reading-inference", label: "Inference", labelFr: "Inférence", score: 65, attempts: 9 },
];

export const paidDemoUser: User = {
  id: "user-alex",
  firstName: "Alex",
  lastName: "Morgan",
  email: "alex@demo.mpk",
  tier: "paid_student",
  locale: "en",
  assistance: "full",
  goal: { exam: "TEF Canada", target: "B2", targetDate: "2026-11-15" },
};

export const freeDemoUser: User = { ...paidDemoUser, id: "user-camille", firstName: "Camille", email: "camille@demo.mpk", tier: "free_student" };

export const defaultProgress: AppState["progress"] = {
  completedLessonIds: ["getting-started-1", "getting-started-2", "getting-started-3", "core-grammar-1"],
  quizAverage: 76,
  practiceAnswered: 28,
  practiceAccuracy: 69,
  simulationsCompleted: 2,
  simulationAverage: 68,
  diagnosticScore: 66,
  courseCompletion: 42,
  competencyScores: { "listening-detail": 54, "reading-main-idea": 81, "vocabulary-context": 68, "grammar-tense": 77, "reading-inference": 65, connectors: 74 },
};

export const defaultState: AppState = {
  schemaVersion: 1,
  user: paidDemoUser,
  diagnosticAnswers: {},
  diagnosticResult: null,
  progress: defaultProgress,
  mistakes: [
    { id: "m1", questionId: "d4", competencyId: "listening-detail", mistakeCategory: "Missed detail", learnerAnswer: "Elle travaille.", correctAnswer: "Son train est annulé.", explanation: "The cancellation is the reason; work is mentioned only as context.", timestamp: "2026-08-28T14:30:00Z", reviewStatus: "new" },
    { id: "m2", questionId: "d1", competencyId: "time-expressions", mistakeCategory: "Time expression", learnerAnswer: "pendant", correctAnswer: "depuis", explanation: "Depuis is used because the situation continues today.", timestamp: "2026-08-27T15:00:00Z", reviewStatus: "reviewing" },
    { id: "m3", questionId: "d6", competencyId: "reading-inference", mistakeCategory: "Incorrect inference", learnerAnswer: "furieux", correctAnswer: "réservé", explanation: "The qualifying language suggests caution, not anger.", timestamp: "2026-08-25T12:00:00Z", reviewStatus: "new" },
  ],
  activities: [
    { id: "a1", label: "Completed “Understanding connectors”", detail: "Lesson checkpoint · 84%", timestamp: "2026-08-29T13:00:00Z" },
    { id: "a2", label: "Practice session", detail: "8 of 10 correct", timestamp: "2026-08-28T13:00:00Z" },
    { id: "a3", label: "Exam simulation", detail: "68% overall", timestamp: "2026-08-24T13:00:00Z" },
  ],
};
