const en = {
  title: "My Mistakes",
  description: "Patterns from your assessed Reading and Listening practice.",
  filter: "Filter mistakes",
  all: "All",
  transcript: "Transcript exercise",
  count: (count: number) => `${count} ${count === 1 ? "mistake" : "mistakes"}`,
  emptyTitle: "No mistake patterns here",
  emptyBody:
    "Complete exam-specific practice and any recurring patterns will appear here.",
  anotherSkill: "Choose another skill",
  detail: {
    notFoundTitle: "Mistake pattern not found",
    notFoundBody:
      "This pattern may no longer be part of your current exam profile.",
    back: "Back to mistakes",
    returnTo: "Return to mistakes",
    eyebrow: "Weakness review",
    struggled: (count: number) =>
      `You've struggled with this pattern ${count} ${count === 1 ? "time" : "times"}.`,
    examples: "Most recent examples",
    yourAnswer: "Your answer",
    correctAnswer: "Correct answer",
    noAnswer: "No answer",
    lessonEyebrow: "Recommended lesson",
    lessonFallback: "Review the related lesson",
    reviewLesson: "Review lesson",
    practiceEyebrow: "Recommended practice",
    practiceTitle: "10 targeted questions",
    practiceCta: "Practice weakness",
  },
};

const fr: typeof en = {
  title: "Mes erreurs",
  description:
    "Les erreurs récurrentes de vos entraînements évalués en compréhension écrite et orale.",
  filter: "Filtrer les erreurs",
  all: "Toutes",
  transcript: "Exercice sur transcription",
  count: (count: number) => `${count} ${count === 1 ? "erreur" : "erreurs"}`,
  emptyTitle: "Aucune erreur récurrente ici",
  emptyBody:
    "Faites des entraînements propres à votre examen ; vos erreurs récurrentes apparaîtront ici.",
  anotherSkill: "Choisir une autre compétence",
  detail: {
    notFoundTitle: "Erreur introuvable",
    notFoundBody:
      "Cette erreur ne fait peut-être plus partie de votre profil d’examen actuel.",
    back: "Retour aux erreurs",
    returnTo: "Revenir aux erreurs",
    eyebrow: "Révision d’une faiblesse",
    struggled: (count: number) => `Vous avez buté sur ce point ${count} fois.`,
    examples: "Exemples les plus récents",
    yourAnswer: "Votre réponse",
    correctAnswer: "Bonne réponse",
    noAnswer: "Aucune réponse",
    lessonEyebrow: "Leçon recommandée",
    lessonFallback: "Revoir la leçon associée",
    reviewLesson: "Revoir la leçon",
    practiceEyebrow: "Entraînement recommandé",
    practiceTitle: "10 questions ciblées",
    practiceCta: "Travailler cette faiblesse",
  },
};

export const mistakes = { en, fr };
