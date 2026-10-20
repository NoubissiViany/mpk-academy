const en = {
  yourAnswer: "Your answer",
  answerPlaceholder: "Votre réponse",
  options: "Answer options",
  audioPending: "Audio pending · Transcript-based exercise",
  audioPendingNote: "This exercise does not measure listening performance.",
  correct: "Correct",
  notQuite: "Not quite",
  correctAnswer: (answer: string) => `Correct answer: ${answer}`,
  competency: (label: string) => `Competency · ${label}`,
  checking: "Checking…",
};

const fr: typeof en = {
  yourAnswer: "Votre réponse",
  answerPlaceholder: "Votre réponse",
  options: "Choix de réponses",
  audioPending: "Audio en préparation · exercice sur transcription",
  audioPendingNote: "Cet exercice ne mesure pas la compréhension orale.",
  correct: "Bonne réponse",
  notQuite: "Pas tout à fait",
  correctAnswer: (answer: string) => `Bonne réponse : ${answer}`,
  competency: (label: string) => `Compétence · ${label}`,
  checking: "Vérification…",
};

export const assessment = { en, fr };
