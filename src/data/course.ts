import type { Course, CourseModule, Lesson } from "@/types/domain";

const lesson = (moduleId: string, sequence: number, id: string, title: string, titleFr: string, description: string, isFree = false): Lesson => ({
  id,
  moduleId,
  sequence,
  title,
  titleFr,
  description,
  duration: 12 + sequence * 3,
  isFree,
  status: sequence === 1 ? "in_progress" : "available",
  competencies: moduleId === "listening" ? ["listening-detail"] : moduleId === "reading" ? ["reading-detail"] : ["grammar-tense", "connectors"],
  example: sequence === 1 ? "Je travaille au Canada depuis deux ans." : "Bien qu’il soit tard, elle poursuit son travail.",
  explanation: sequence === 1 ? "Depuis describes an action that began in the past and is still continuing." : "This connector introduces a concession and requires the subjunctive.",
  explanationFr: sequence === 1 ? "Depuis exprime une action commencée dans le passé et qui continue." : "Ce connecteur introduit une concession et exige le subjonctif.",
  vocabulary: [
    { french: "pourtant", english: "however / yet" },
    { french: "dès que", english: "as soon as" },
    { french: "en revanche", english: "on the other hand" },
  ],
});

const moduleData: Array<[string, string, string, string[]]> = [
  ["getting-started", "Getting Started with TEF/TCF", "Bien démarrer avec le TEF/TCF", ["Know the exam", "Set your preparation goal", "Build a weekly plan"]],
  ["core-grammar", "Core Grammar for the Exam", "Grammaire essentielle", ["Time expressions", "Understanding connectors", "Tenses under pressure"]],
  ["vocabulary", "Building Exam Vocabulary", "Vocabulaire de l’examen", ["Context clues", "Public services", "Work and study"]],
  ["reading", "Reading Comprehension", "Compréhension écrite", ["Find the main idea", "Identify specific details", "Make careful inferences"]],
  ["listening", "Listening Comprehension", "Compréhension orale", ["Hear the main idea", "Capture key details", "Recognize speaker intent"]],
  ["exam-strategies", "TEF/TCF Question Strategies", "Stratégies TEF/TCF", ["Read the task", "Eliminate distractors", "Manage uncertainty"]],
  ["timed-practice", "Timed Practice", "Entraînement chronométré", ["Build pace", "Section practice", "Review efficiently"]],
  ["exam-preparation", "Exam Preparation", "Préparation à l’examen", ["Simulation readiness", "Exam-day routine", "Final review"]],
];

export const courseModules: CourseModule[] = moduleData.map(([id, title, titleFr, lessons], moduleIndex) => ({
  id,
  sequence: moduleIndex + 1,
  title,
  titleFr,
  description: `A focused module with practical ${title.toLowerCase()} lessons and checkpoints.`,
  lessons: lessons.map((title, index) =>
    lesson(id, index + 1, index === 1 && id === "core-grammar" ? "connectors" : `${id}-${index + 1}`, title, title, `Build reliable exam performance through ${title.toLowerCase()}.`, moduleIndex === 0 || (moduleIndex === 1 && index === 0)),
  ),
}));

export const mockCourse: Course = {
  id: "french-canadian-immigration",
  title: "French for Canadian Immigration — TEF/TCF Preparation",
  modules: courseModules,
};

export const allLessons = courseModules.flatMap((module) => module.lessons);
