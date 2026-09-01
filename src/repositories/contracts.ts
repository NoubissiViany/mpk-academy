import type { AppState, Course, DiagnosticResult, Question, Recommendation, User } from "@/types/domain";

export interface AuthRepository {
  login(email: string, password: string): Promise<User>;
  register(input: Omit<User, "id" | "tier"> & { password: string }): Promise<User>;
  logout(): Promise<void>;
}
export interface UserRepository { getCurrent(): Promise<User | null>; update(user: User): Promise<User>; }
export interface CourseRepository { getCourse(): Promise<Course>; }
export interface QuestionRepository { getDiagnosticQuestions(): Promise<Question[]>; getPracticeQuestions(): Promise<Question[]>; getExamQuestions(): Promise<Question[]>; }
export interface ProgressRepository { getState(): Promise<AppState>; saveState(state: AppState): Promise<void>; }
export interface AssessmentRepository { scoreDiagnostic(answers: Record<string, string>): Promise<DiagnosticResult>; }
export interface PaymentRepository { checkout(): Promise<"success" | "failed" | "cancelled">; }
export interface RecommendationRepository { getRecommendations(state: AppState): Promise<Recommendation[]>; }
