export type Locale = "en" | "fr";
export type UserTier = "visitor" | "free_student" | "paid_student";
export type PaidPlanId = "essential" | "complete" | "intensive";
export type ExamId = "TEF Canada" | "TCF Canada";
export type ExamType = ExamId | "Not sure yet";
export type NclcTarget = "NCLC 5" | "NCLC 7" | "NCLC 9+" | "I'm not sure";
export type DiagnosticTarget = NclcTarget;
export type ExamSkill = "reading" | "listening" | "writing" | "speaking";
export type FrenchExperience =
  | "I'm just starting"
  | "I know some French"
  | "I can communicate in French"
  | "I'm already comfortable in French"
  | "I'm not sure";
export type DiagnosticSkill =
  | "grammar"
  | "vocabulary"
  | "reading"
  | "listening"
  | "sentence-structure"
  | "exam-strategy";
export type AssistanceLevel = "full" | "on_request" | "minimal";
export type LessonStatus = "locked" | "available" | "in_progress" | "completed";
export type CompetencyId =
  | "reading-main-idea"
  | "reading-detail"
  | "reading-inference"
  | "listening-main-idea"
  | "listening-detail"
  | "grammar-tense"
  | "grammar-prepositions"
  | "vocabulary-context"
  | "connectors"
  | "time-expressions";

export interface Goal {
  exam: ExamType;
  target: NclcTarget;
  targetDate?: string;
}

export interface ExamSkillProgress {
  baseline30Days: number | null;
  current: number | null;
  attempts: number;
  lastPracticedAt?: string;
}

export interface WeeklyExamStats {
  weekStartedAt: string;
  practiceSessions: number;
  minutesStudied: number;
  questionsReviewed: number;
  readinessChange: number;
}

export interface ExamPreparationProfile {
  exam: ExamId;
  readinessSource: "diagnostic" | null;
  readinessBaseline30Days: number | null;
  readiness: number | null;
  skills: Record<ExamSkill, ExamSkillProgress>;
  weekly: WeeklyExamStats;
  mockAverage: number | null;
  mockAttempts: number;
}

export interface ProductivePracticeTask {
  id: string;
  exam: ExamId;
  skill: "writing" | "speaking";
  title: string;
  prompt: string;
  guidance: string;
  durationMinutes: number;
  minimumWords?: number;
  rubric: string[];
}

export interface ExamConfiguration {
  id: ExamId;
  shortName: "TEF" | "TCF";
  officialUrl: string;
  navigationRules: { listeningOneWay: boolean };
  officialFormat: {
    reading: string;
    listening: string;
    writing: string;
    speaking: string;
  };
  scaledMock: {
    readingQuestions: number;
    listeningQuestions: number;
    writingTasks: number;
    speakingTasks: number;
    durationMinutes: number;
  };
}

export interface DiagnosticIntake {
  goal: ExamType;
  target: DiagnosticTarget;
  frenchExperience: FrenchExperience;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  tier: UserTier;
  locale: Locale;
  assistance: AssistanceLevel;
  goal: Goal;
}

export interface PlanAccess {
  planId: PaidPlanId;
  purchasedAt: string | null;
  accessUntil: string | null;
}

export interface Competency {
  id: CompetencyId;
  label: string;
  labelFr: string;
  score: number;
  attempts: number;
}

export interface Lesson {
  id: string;
  moduleId: string;
  sequence: number;
  title: string;
  titleFr: string;
  description: string;
  duration: number;
  isFree: boolean;
  status: LessonStatus;
  competencies: CompetencyId[];
  example?: string;
  explanation?: string;
  explanationFr?: string;
  vocabulary?: Array<{ french: string; english: string }>;
}

export interface CourseModule {
  id: string;
  sequence: number;
  title: string;
  titleFr: string;
  description: string;
  lessons: Lesson[];
}

export interface Course {
  id: string;
  title: string;
  modules: CourseModule[];
}

interface QuestionBase {
  id: string;
  source: "mpk_mock";
  examType: "TEF" | "TCF" | "general";
  prompt: string;
  explanation: string;
  explanationFr: string;
  competencies: CompetencyId[];
  diagnosticSkill: DiagnosticSkill;
  difficulty: "A2" | "B1" | "B2" | "C1";
  metadata?: { passage?: string; audioLabel?: string };
}

export interface MultipleChoiceQuestion extends QuestionBase {
  type: "multiple_choice";
  options: Array<{ id: string; label: string }>;
  correctAnswer: string;
}

export interface FillBlankQuestion extends QuestionBase {
  type: "fill_blank";
  options?: never;
  correctAnswer: string;
}

export type Question = MultipleChoiceQuestion | FillBlankQuestion;

export interface Attempt {
  questionId: string;
  answer: string;
  correct: boolean;
  completedAt: string;
}

export type MistakeCategory =
  | "Vocabulary confusion"
  | "Grammar rule"
  | "Negation"
  | "Verb tense"
  | "Preposition"
  | "Time expression"
  | "Missed detail"
  | "Incorrect inference"
  | "Question misunderstanding";

export interface Mistake {
  id: string;
  questionId: string;
  competencyId: CompetencyId;
  mistakeCategory: MistakeCategory;
  learnerAnswer: string;
  correctAnswer: string;
  explanation: string;
  timestamp: string;
  reviewStatus: "new" | "reviewing" | "resolved";
  exam?: ExamId;
  examSkill?: ExamSkill;
  pattern?: string;
  count?: number;
}

export interface DiagnosticResult {
  score: number;
  level: "A2" | "B1" | "B2" | "C1";
  competencyScores: Partial<Record<CompetencyId, number>>;
  skillScores: Record<DiagnosticSkill, number>;
  strength: DiagnosticSkill;
  priority: DiagnosticSkill;
  recommendedModuleId: string;
}

export interface Progress {
  completedLessonIds: string[];
  quizAverage: number;
  practiceAnswered: number;
  practiceAccuracy: number;
  simulationsCompleted: number;
  simulationAverage: number;
  diagnosticScore: number | null;
  courseCompletion: number;
  competencyScores: Partial<Record<CompetencyId, number>>;
}

export interface Readiness {
  overall: number | null;
  evidence: "insufficient" | "sufficient";
  competencies: Partial<Record<CompetencyId, number>>;
  trend: number;
  algorithmVersion: string;
}

export interface Recommendation {
  id: string;
  title: string;
  reason: string;
  type: "diagnostic" | "lesson" | "practice" | "review" | "exam";
  href: string;
  priority: number;
  competencyId?: CompetencyId;
  examSkill?: ExamSkill;
}

export interface Activity {
  id: string;
  label: string;
  detail: string;
  timestamp: string;
}

export interface GuestAssessmentSession {
  id: string;
  createdAt: string;
  expiresAt: string;
  intake: DiagnosticIntake;
  answers: Record<string, string>;
  result: DiagnosticResult;
  activity: Activity;
  recommendedPlanId: PaidPlanId;
  status: "active" | "claimed";
  claimedByUserId?: string;
  claimedAt?: string;
}

export interface AppState {
  schemaVersion: 5;
  user: User | null;
  planAccess: PlanAccess | null;
  postCheckoutWelcomePending: boolean;
  examProfiles: Partial<Record<ExamId, ExamPreparationProfile>>;
  diagnosticIntake: DiagnosticIntake | null;
  diagnosticAnswers: Record<string, string>;
  diagnosticResult: DiagnosticResult | null;
  progress: Progress;
  mistakes: Mistake[];
  activities: Activity[];
  lastPracticeScore?: number;
  lastExamScore?: number;
}

export interface LocalAccount {
  user: User;
  normalizedEmail: string;
  passwordHash: string;
  passwordSalt: string;
  passwordIterations: number;
  createdAt: string;
}

export interface LocalSession {
  userId: string;
  createdAt: string;
}
