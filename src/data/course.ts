import type { Course, CourseModule, Lesson } from "@/types/domain";

const lesson = (
  moduleId: string,
  sequence: number,
  id: string,
  title: string,
  titleFr: string,
  description: string,
  isFree = false,
): Lesson => ({
  id,
  moduleId,
  sequence,
  title,
  titleFr,
  description,
  duration: 12 + sequence * 3,
  isFree,
  status: sequence === 1 ? "in_progress" : "available",
  competencies: moduleId.startsWith("listening")
    ? ["listening-detail"]
    : moduleId.startsWith("reading")
      ? ["reading-detail"]
      : ["grammar-tense", "connectors"],
  example:
    sequence === 1
      ? "Je travaille au Canada depuis deux ans."
      : "Bien qu’il soit tard, elle poursuit son travail.",
  explanation:
    sequence === 1
      ? "Depuis describes an action that began in the past and is still continuing."
      : "This connector introduces a concession and requires the subjunctive.",
  explanationFr:
    sequence === 1
      ? "Depuis exprime une action commencée dans le passé et qui continue."
      : "Ce connecteur introduit une concession et exige le subjonctif.",
  vocabulary: [
    { french: "pourtant", english: "however / yet" },
    { french: "dès que", english: "as soon as" },
    { french: "en revanche", english: "on the other hand" },
  ],
});

const moduleData: Array<[string, string, string, string[]]> = [
  [
    "grammar",
    "Grammar",
    "Grammaire",
    ["Time expressions", "Understanding connectors", "Tenses under pressure"],
  ],
  [
    "vocabulary",
    "Vocabulary",
    "Vocabulaire",
    ["Context clues", "Public services", "Work and study"],
  ],
  [
    "pronunciation",
    "Pronunciation",
    "Prononciation",
    ["French sound patterns", "Rhythm and linking", "Clear spontaneous speech"],
  ],
  [
    "reading-strategies",
    "Reading strategies",
    "Stratégies de lecture",
    [
      "Find the main idea",
      "Identify specific details",
      "Make careful inferences",
    ],
  ],
  [
    "listening-strategies",
    "Listening strategies",
    "Stratégies d’écoute",
    [
      "Hear the main idea",
      "Listening for specific information",
      "Recognize speaker intent",
    ],
  ],
  [
    "writing-techniques",
    "Writing techniques",
    "Techniques d’écriture",
    [
      "Structure a response",
      "Develop an argument",
      "Check register and accuracy",
    ],
  ],
  [
    "speaking-techniques",
    "Speaking techniques",
    "Techniques d’expression orale",
    ["Organize an answer", "Sustain an interaction", "Argue and respond"],
  ],
  [
    "exam-strategies",
    "Exam strategies",
    "Stratégies d’examen",
    ["Know the active exam", "Manage each section", "Review efficiently"],
  ],
];

export const courseModules: CourseModule[] = moduleData.map(
  ([id, title, titleFr, lessons], moduleIndex) => ({
    id,
    sequence: moduleIndex + 1,
    title,
    titleFr,
    description: `A focused module with practical ${title.toLowerCase()} lessons and checkpoints.`,
    lessons: lessons.map((title, index) =>
      lesson(
        id,
        index + 1,
        index === 1 && id === "grammar" ? "connectors" : `${id}-${index + 1}`,
        title,
        title,
        `Build reliable exam performance through ${title.toLowerCase()}.`,
        moduleIndex === 0 || (moduleIndex === 1 && index === 0),
      ),
    ),
  }),
);

export const mockCourse: Course = {
  id: "french-canadian-immigration",
  title: "French for Canadian Immigration — TEF/TCF Preparation",
  modules: courseModules,
};

export const allLessons = courseModules.flatMap((module) => module.lessons);

export const learningCategories = [
  {
    id: "foundations",
    title: "Foundations",
    moduleIds: ["grammar", "vocabulary", "pronunciation"],
  },
  {
    id: "exam-skills",
    title: "Exam Skills",
    moduleIds: [
      "reading-strategies",
      "listening-strategies",
      "writing-techniques",
      "speaking-techniques",
    ],
  },
  {
    id: "exam-strategy",
    title: "Exam Strategy",
    moduleIds: ["exam-strategies"],
  },
] as const;
