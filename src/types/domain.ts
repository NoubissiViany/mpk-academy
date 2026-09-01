export type Locale = "en" | "fr";
export type UserTier = "visitor" | "free_student" | "paid_student";
export type ExamType = "TEF Canada" | "TCF Canada" | "Not sure yet";
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
  target: "B1" | "B2" | "C1";
  targetDate?: string;
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
}

export interface DiagnosticResult {
  score: number;
  level: "A2" | "B1" | "B2" | "C1";
  competencyScores: Partial<Record<CompetencyId, number>>;
  strengths: CompetencyId[];
  weaknesses: CompetencyId[];
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
}

export interface Activity {
  id: string;
  label: string;
  detail: string;
  timestamp: string;
}

export interface AppState {
  schemaVersion: 1;
  user: User | null;
  diagnosticAnswers: Record<string, string>;
  diagnosticResult: DiagnosticResult | null;
  progress: Progress;
  mistakes: Mistake[];
  activities: Activity[];
  lastPracticeScore?: number;
  lastExamScore?: number;
}
