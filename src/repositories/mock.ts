import { mockCourse } from "@/data/course";
import { defaultState } from "@/data/mock-state";
import {
  diagnosticQuestions,
  examQuestions,
  practiceQuestions,
} from "@/data/questions";
import { scoreDiagnostic } from "@/lib/domain/diagnostic";
import { generateRecommendations } from "@/lib/domain/recommendations";
import type { AppState } from "@/types/domain";
import type {
  AssessmentRepository,
  CourseRepository,
  ProgressRepository,
  QuestionRepository,
  RecommendationRepository,
  UserRepository,
} from "./contracts";

let memoryState: AppState = structuredClone(defaultState);

export const mockUserRepository: UserRepository = {
  async getCurrent() {
    return memoryState.user;
  },
  async update(user) {
    memoryState = { ...memoryState, user };
    return user;
  },
};
export const mockCourseRepository: CourseRepository = {
  async getCourse() {
    return mockCourse;
  },
};
export const mockQuestionRepository: QuestionRepository = {
  async getDiagnosticQuestions() {
    return diagnosticQuestions;
  },
  async getPracticeQuestions() {
    return practiceQuestions;
  },
  async getExamQuestions() {
    return examQuestions;
  },
};
export const mockProgressRepository: ProgressRepository = {
  async getState() {
    return memoryState;
  },
  async saveState(state) {
    memoryState = state;
  },
};
export const mockAssessmentRepository: AssessmentRepository = {
  async scoreDiagnostic(answers) {
    return scoreDiagnostic(diagnosticQuestions, answers);
  },
};
export const mockRecommendationRepository: RecommendationRepository = {
  async getRecommendations(state) {
    return generateRecommendations(state.progress, state.mistakes);
  },
};
