import { mockCourse } from "@/data/course";
import { defaultState, freeDemoUser, paidDemoUser } from "@/data/mock-state";
import { diagnosticQuestions, examQuestions, practiceQuestions } from "@/data/questions";
import { scoreDiagnostic } from "@/lib/domain/diagnostic";
import { generateRecommendations } from "@/lib/domain/recommendations";
import type { AppState, User } from "@/types/domain";
import type { AssessmentRepository, AuthRepository, CourseRepository, PaymentRepository, ProgressRepository, QuestionRepository, RecommendationRepository, UserRepository } from "./contracts";

let memoryState: AppState = structuredClone(defaultState);

export const mockAuthRepository: AuthRepository = {
  async login(email) { const loggedInUser: User = { ...(email.toLowerCase().includes("free") ? freeDemoUser : paidDemoUser), email }; memoryState = { ...memoryState, user: loggedInUser }; return loggedInUser; },
  async register(input) { const user: User = { ...input, id: crypto.randomUUID(), tier: "free_student" }; memoryState = { ...memoryState, user }; return user; },
  async logout() { memoryState = { ...memoryState, user: null }; },
};
export const mockUserRepository: UserRepository = { async getCurrent() { return memoryState.user; }, async update(user) { memoryState = { ...memoryState, user }; return user; } };
export const mockCourseRepository: CourseRepository = { async getCourse() { return mockCourse; } };
export const mockQuestionRepository: QuestionRepository = { async getDiagnosticQuestions() { return diagnosticQuestions; }, async getPracticeQuestions() { return practiceQuestions; }, async getExamQuestions() { return examQuestions; } };
export const mockProgressRepository: ProgressRepository = { async getState() { return memoryState; }, async saveState(state) { memoryState = state; } };
export const mockAssessmentRepository: AssessmentRepository = { async scoreDiagnostic(answers) { return scoreDiagnostic(diagnosticQuestions, answers); } };
export const mockPaymentRepository: PaymentRepository = { async checkout() { await new Promise((resolve) => setTimeout(resolve, 600)); const value = process.env.NEXT_PUBLIC_MOCK_CHECKOUT_OUTCOME; return value === "failed" || value === "cancelled" ? value : "success"; } };
export const mockRecommendationRepository: RecommendationRepository = { async getRecommendations(state) { return generateRecommendations(state.progress, state.mistakes); } };
