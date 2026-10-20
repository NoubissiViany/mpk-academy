type ModuleId =
  | "grammar"
  | "vocabulary"
  | "pronunciation"
  | "reading-strategies"
  | "listening-strategies"
  | "writing-techniques"
  | "speaking-techniques"
  | "exam-strategies";

const en = {
  categories: {
    foundations: "Foundations",
    examSkills: "Exam Skills",
    examStrategy: "Exam Strategy",
  },
  modules: {
    grammar: "Grammar",
    vocabulary: "Vocabulary",
    pronunciation: "Pronunciation",
    "reading-strategies": "Reading strategies",
    "listening-strategies": "Listening strategies",
    "writing-techniques": "Writing techniques",
    "speaking-techniques": "Speaking techniques",
    "exam-strategies": "Exam strategies",
  } satisfies Record<ModuleId, string>,
  moduleDescription:
    "Understand the explanation, study French examples, and check your understanding.",
  strategiesTitle: (exam: string) => `${exam} format and strategies`,
  strategiesDescription: (exam: string) =>
    `Formats, timing, and examples designed for ${exam} Canada.`,
  page: {
    eyebrow: "Explore lessons",
    title: "Learn",
    description:
      "Build your French foundations, strengthen each exam skill, and study strategies for your active exam.",
    completion: "Overall course completion",
    completionLabel: "Course completion",
    completed: (count: number) =>
      `${count} current ${count === 1 ? "lesson" : "lessons"} completed`,
    recommendedTitle: "Recommended lessons",
    recommended: "Recommended",
    startLesson: "Start lesson",
    lessonsNext: (count: number, next: string) =>
      `${count} lessons · Next: ${next}`,
    explore: "Explore category",
    exploreLabel: (title: string) => `Explore ${title}`,
  },
  reasons: {
    diagnostic: (skill: string) =>
      `Recommended from your ${skill.toLowerCase()} assessment priority.`,
    supports: (area: string) => `Supports ${area}.`,
    next: "A useful next lesson for your preparation.",
  },
  module: {
    notFound: "Module not found.",
    open: (title: string) => `Open ${title}`,
  },
  lesson: {
    duration: (minutes: number, scope: string) => `${minutes} min · ${scope}`,
    shared: "Shared French foundations",
    englishOnly: "",
    understand: "Understand",
    examples: "French examples",
    tryIt: "Try it",
    commonErrors: "Common errors",
    checkpoint: "Checkpoint",
    checkpointProgress: (number: number, total: number) =>
      `Question ${number} of ${total}`,
    answerAll: "Answer every checkpoint question to complete the lesson.",
    chooseAnswer: "Choose an answer",
    check: "Check understanding",
    correct: "Correct.",
    review: "Review this point.",
    complete: "Complete lesson",
    completed: "Lesson completed",
    saved: "Lesson progress saved",
    next: "Next lesson",
    archivedTitle: (title: string) => `${title} — Archived lesson`,
    archivedBody:
      "Your historical completion is preserved. Study the updated lessons in Learn.",
    notFound: "Lesson not found",
    back: "Return to Learn",
    wrongExam: (exam: string) =>
      `This lesson belongs to ${exam}. Switch your active exam in Settings to study it.`,
    lockedTitle: "Unlock this lesson",
  },
};

const fr: typeof en = {
  categories: {
    foundations: "Fondations",
    examSkills: "Compétences d’examen",
    examStrategy: "Stratégie d’examen",
  },
  modules: {
    grammar: "Grammaire",
    vocabulary: "Vocabulaire",
    pronunciation: "Prononciation",
    "reading-strategies": "Stratégies de compréhension écrite",
    "listening-strategies": "Stratégies de compréhension orale",
    "writing-techniques": "Techniques d’expression écrite",
    "speaking-techniques": "Techniques d’expression orale",
    "exam-strategies": "Stratégies d’examen",
  },
  moduleDescription:
    "Comprenez l’explication, étudiez des exemples en français et vérifiez votre compréhension.",
  strategiesTitle: (exam: string) => `Format et stratégies du ${exam}`,
  strategiesDescription: (exam: string) =>
    `Formats, gestion du temps et exemples conçus pour le ${exam} Canada.`,
  page: {
    eyebrow: "Explorer les leçons",
    title: "Apprendre",
    description:
      "Consolidez vos bases en français, renforcez chaque compétence d’examen et étudiez les stratégies propres à votre examen.",
    completion: "Progression globale du cours",
    completionLabel: "Progression du cours",
    completed: (count: number) =>
      `${count} ${count === 1 ? "leçon actuelle terminée" : "leçons actuelles terminées"}`,
    recommendedTitle: "Leçons recommandées",
    recommended: "Recommandée",
    startLesson: "Commencer la leçon",
    lessonsNext: (count: number, next: string) =>
      `${count} leçons · Suivante : ${next}`,
    explore: "Explorer la catégorie",
    exploreLabel: (title: string) => `Explorer ${title}`,
  },
  reasons: {
    diagnostic: (skill: string) =>
      `Recommandée d’après votre priorité à l’évaluation : ${skill.toLowerCase()}.`,
    supports: (area: string) => `Pour travailler : ${area.toLowerCase()}.`,
    next: "Une prochaine leçon utile pour votre préparation.",
  },
  module: {
    notFound: "Module introuvable.",
    open: (title: string) => `Ouvrir ${title}`,
  },
  lesson: {
    duration: (minutes: number, scope: string) => `${minutes} min · ${scope}`,
    shared: "Bases communes en français",
    englishOnly:
      "Les explications de cette leçon sont pour l’instant en anglais. La version française arrive avec le prochain lot de contenu.",
    understand: "Comprendre",
    examples: "Exemples en français",
    tryIt: "À vous de jouer",
    commonErrors: "Erreurs fréquentes",
    checkpoint: "Point de contrôle",
    checkpointProgress: (number: number, total: number) =>
      `Question ${number} sur ${total}`,
    answerAll:
      "Répondez à chaque question du point de contrôle pour terminer la leçon.",
    chooseAnswer: "Choisissez une réponse",
    check: "Vérifier ma compréhension",
    correct: "Bonne réponse.",
    review: "Revoyez ce point.",
    complete: "Terminer la leçon",
    completed: "Leçon terminée",
    saved: "Progression enregistrée",
    next: "Leçon suivante",
    archivedTitle: (title: string) => `${title} — Leçon archivée`,
    archivedBody:
      "Votre progression passée est conservée. Étudiez les leçons mises à jour dans Apprendre.",
    notFound: "Leçon introuvable",
    back: "Retour à Apprendre",
    wrongExam: (exam: string) =>
      `Cette leçon appartient au ${exam}. Changez d’examen dans les Paramètres pour l’étudier.`,
    lockedTitle: "Débloquer cette leçon",
  },
};

export const learn = { en, fr };
